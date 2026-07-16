import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { dmsApiHandlers, resetDmsDb, DMS_SEED_IDS } from '../../mocks'
import { ApiError } from '../../../../services/apiClient'
import {
  fetchDocument, fetchDocuments, transitionDocument, uploadDocumentVersion,
} from '../documents'

/**
 * DMS MSW kontraktus-tesztek — a mock a leendő backend előképe: szűrők,
 * SZÁMÍTOTT mezők (releasedVersion/expiry), FSM-átmenetek 409 guardokkal,
 * payload-guardok 400-jai, verzió-lánc (léptetés + megőrzés) és a rule-6
 * keresztkötés (a verzió-mutáció a lista-nézetben is megjelenik).
 */

const server = setupServer(...dmsApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetDmsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const IDS = DMS_SEED_IDS

/** A várt HTTP-hibát asserteli (ApiError status) és visszaadja az üzenethez. */
async function expectStatus(promise: Promise<unknown>, status: number): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(status)
    return error as ApiError
  }
  throw new Error(`nem dobott hibát (várt státusz: ${status})`)
}

describe('lista-szűrők', () => {
  it('alapértelmezett sorrend: legutóbb frissített elöl', async () => {
    const rows = await fetchDocuments()
    expect(rows).toHaveLength(8)
    expect(rows[0].id).toBe(IDS.docDraft) // ma frissült piszkozat
  })

  it('status/type/linkType szűrők szerver-oldalon', async () => {
    const inReview = await fetchDocuments({ status: 'ellenorzes' })
    expect(inReview.map((d) => d.id).sort()).toEqual([IDS.docInReview, IDS.docNeverReleased].sort())

    const certificates = await fetchDocuments({ type: 'tanusitvany' })
    expect(certificates.map((d) => d.id).sort()).toEqual([IDS.docArchived, IDS.docExpired].sort())

    const projectDocs = await fetchDocuments({ linkType: 'project' })
    expect(projectDocs.map((d) => d.id).sort()).toEqual([IDS.docReleased, IDS.docNeverReleased].sort())
  })

  it('q: szabad-szavas keresés névre/kapcsolatra', async () => {
    const rows = await fetchDocuments({ q: 'doorstar' })
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(IDS.docInReview)
  })

  it('expiring=true: lejárt + ablakon belül lejáró, archivált NÉLKÜL, legkorábbi érvényesség elöl', async () => {
    const rows = await fetchDocuments({ expiring: true })
    // docArchived lejárt, de archivált → kizárt; docLongValid az ablakon kívül
    expect(rows.map((d) => d.id)).toEqual([IDS.docExpired, IDS.docExpiring])
    expect(rows[0].expiry).toBe('lejart')
    expect(rows[1].expiry).toBe('lejaro')
  })

  it('ismeretlen id → 404', async () => {
    await expectStatus(fetchDocument('DOC-999'), 404)
  })
})

describe('számított mezők (calc-tükör a kiszolgáláskor)', () => {
  it('releasedVersion: ellenőrzés alatt lévő v2 mellett a kiadott v1 az érvényes', async () => {
    const doc = await fetchDocument(IDS.docInReview)
    expect(doc.version).toBe(2)
    expect(doc.releasedVersion).toBe(1)
  })

  it('releasedVersion: sosem kiadott dokumentumnál null (blocked)', async () => {
    const doc = await fetchDocument(IDS.docNeverReleased)
    expect(doc.releasedVersion).toBeNull()
  })

  it('expiry: múltbeli validUntil → lejart; ablakon belül → lejaro; ablakon kívül → null', async () => {
    expect((await fetchDocument(IDS.docExpired)).expiry).toBe('lejart')
    expect((await fetchDocument(IDS.docExpiring)).expiry).toBe('lejaro')
    expect((await fetchDocument(IDS.docLongValid)).expiry).toBeNull()
    expect((await fetchDocument(IDS.docReleased)).expiry).toBeNull()
  })
})

describe('dokumentum-FSM (jóváhagyás-folyam)', () => {
  it('submit: piszkozat → ellenorzes, a lánc aktuális bejegyzése is követi', async () => {
    const doc = await transitionDocument(IDS.docDraft, 'submit', {})
    expect(doc.status).toBe('ellenorzes')
    expect(doc.versions.find((v) => v.v === doc.version)?.status).toBe('ellenorzes')
  })

  it('approve: ellenorzes → kiadott, a megjegyzés a reviewNote-ba kerül, az érvényes verzió átáll', async () => {
    const doc = await transitionDocument(IDS.docInReview, 'approve', { note: 'Raszter rendben' })
    expect(doc.status).toBe('kiadott')
    expect(doc.reviewNote).toBe('Raszter rendben')
    expect(doc.releasedVersion).toBe(2) // a v2 kiadásával az lett az érvényes
  })

  it('reject indok nélkül → 400 (payload-guard tükör); indokkal → piszkozat + reviewNote', async () => {
    const err = await expectStatus(
      transitionDocument(IDS.docInReview, 'reject', { reason: '' }), 400)
    expect(err.message).toContain('kötelező az indok')

    const doc = await transitionDocument(IDS.docInReview, 'reject', { reason: 'Raszter hibás' })
    expect(doc.status).toBe('piszkozat')
    expect(doc.reviewNote).toBe('Raszter hibás')
    expect(doc.releasedVersion).toBe(1) // a kiadott v1 érvényes marad
  })

  it('recall: kiadott → ellenorzes — a műhely a KORÁBBI kiadott verzióra esik vissza', async () => {
    const doc = await transitionDocument(IDS.docReleased, 'recall', { reason: 'Méret-egyeztetés' })
    expect(doc.status).toBe('ellenorzes')
    // a v3 felülvizsgálat alatt → az érvényes a korábbi kiadott v2
    expect(doc.releasedVersion).toBe(2)
    expect(doc.reviewNote).toBe('Méret-egyeztetés')
  })

  it('archive + reopen: a verzió-lánc érintetlen (a kiadás ténye megőrzött)', async () => {
    const archived = await transitionDocument(IDS.docDraft, 'archive', {})
    expect(archived.status).toBe('archivalt')

    const reopened = await transitionDocument(IDS.docArchived, 'reopen', {})
    expect(reopened.status).toBe('piszkozat')
    expect(reopened.versions.find((v) => v.v === 1)?.status).toBe('kiadott') // lánc érintetlen
  })

  it('tiltott átmenetek → 409 a guard-üzenettel', async () => {
    const err = await expectStatus(
      transitionDocument(IDS.docDraft, 'approve', {}), 409)
    expect(err.message).toContain('Érvénytelen FSM-átmenet')

    await expectStatus(transitionDocument(IDS.docReleased, 'submit', {}), 409)
    await expectStatus(transitionDocument(IDS.docInReview, 'archive', {}), 409) // ellenőrzés alatt nem archiválható
    await expectStatus(transitionDocument(IDS.docReleased, 'reopen', {}), 409)
  })
})

describe('verzió-lánc (AddVersion-tükör + rule-6 a kontraktusban)', () => {
  it('új verzió: léptetés, a korábbi verziók megőrzése, piszkozat munkapéldány', async () => {
    const doc = await uploadDocumentVersion(IDS.docReleased, {
      fileLabel: 'petofi-konyha-kiviteli-v4.pdf',
      note: 'Fogantyú-kiosztás módosítva',
    })
    expect(doc.version).toBe(4)
    expect(doc.versions).toHaveLength(4) // v1–v3 megőrizve + v4
    expect(doc.status).toBe('piszkozat') // az új verzió újra jóváhagyandó
    expect(doc.fileLabel).toBe('petofi-konyha-kiviteli-v4.pdf')
    expect(doc.releasedVersion).toBe(3) // a műhely a kiadott v3-at használja tovább

    // rule-6 a kontraktusban: a lista-nézet is az új verziót adja vissza
    const rows = await fetchDocuments()
    const listed = rows.find((d) => d.id === IDS.docReleased)
    expect(listed?.version).toBe(4)
    expect(listed?.status).toBe('piszkozat')
  })

  it('archivált dokumentumra 409 (AddVersion/Deleted-tiltás tükre)', async () => {
    const err = await expectStatus(
      uploadDocumentVersion(IDS.docArchived, { fileLabel: 'ce-2026.pdf', note: 'Új CE' }), 409)
    expect(err.message).toContain('Archivált')
  })

  it('hiányzó fájl-címke/változás-jegyzet → 400 (közös payload-guard)', async () => {
    const errFile = await expectStatus(
      uploadDocumentVersion(IDS.docDraft, { fileLabel: '', note: 'x' }), 400)
    expect(errFile.message).toContain('fájl-címké')

    const errNote = await expectStatus(
      uploadDocumentVersion(IDS.docDraft, { fileLabel: 'a.pdf', note: '  ' }), 400)
    expect(errNote.message).toContain('változás-jegyzet')
  })
})
