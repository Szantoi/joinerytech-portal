import { http, HttpResponse } from 'msw'
import { DMS_API_BASE } from '../services/config'
import {
  DOCUMENT_FSM, rejectReasonBlockReason, uploadVersionBlockReason,
  versionFieldsBlockReason,
  type DocLinkType, type DocType, type DocumentStatus,
} from '../services'
import type { VersionUploadInput } from '../services/documents'
import {
  getDmsDb, guardTransition, isoTimestamp, jsonError, notFound, serveDocument,
} from './db'
import { MOCK_UPLOADER, type DocumentSeed } from './seed'

/**
 * Dokumentum handlerek — lista, részlet, FSM-átmenetek és verzió-feltöltés
 * (MSW-first kontraktus az openapi.yaml útvonal-sémájára rímelve:
 * /api/dms/documents + POST /:id/versions). Tiltott átmenet → 409 (közös
 * guard-tábla: services/dms/fsm.ts); visszautasítás indok nélkül / hiányos
 * verzió-mezők → 400; archivált dokumentum verzió-feltöltése → 409
 * (AddVersion-tükör). A `releasedVersion`/`expiry` mezők kiszolgáláskor
 * számítottak (serveDocument — calc-tükör).
 */

const BASE = `${DMS_API_BASE}/documents`

function findDocument(id: string | readonly string[]): DocumentSeed | undefined {
  return getDmsDb().documents.find((doc) => doc.id === id)
}

/**
 * Közös átmenet-alkalmazás: státusz + updatedAt + reviewNote írása.
 * A review-életciklus akciói (submit/approve/reject/recall) az AKTUÁLIS verzió
 * lánc-bejegyzésének státuszát is frissítik — ebből számítódik az érvényes
 * kiadott verzió (pl. recall után a műhely a korábbi kiadottra esik vissza).
 * Az archive/reopen NEM nyúl a lánchoz: a kiadás ténye megőrzött történet.
 */
function applyTransition(
  doc: DocumentSeed,
  to: DocumentStatus,
  reviewNote: string | null,
  trackCurrentVersion: boolean,
): void {
  doc.status = to
  doc.reviewNote = reviewNote
  doc.updatedAt = isoTimestamp()
  if (trackCurrentVersion) {
    const current = doc.versions.find((entry) => entry.v === doc.version)
    if (current) current.status = to
  }
}

export const documentHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') as DocumentStatus | null
    const type = url.searchParams.get('type') as DocType | null
    const linkType = url.searchParams.get('linkType') as DocLinkType | null
    const expiring = url.searchParams.get('expiring')
    const q = url.searchParams.get('q')?.toLowerCase()

    let rows = getDmsDb().documents
    if (status) rows = rows.filter((doc) => doc.status === status)
    if (type) rows = rows.filter((doc) => doc.type === type)
    if (linkType) rows = rows.filter((doc) => doc.linkType === linkType)
    if (q) {
      rows = rows.filter((doc) =>
        [doc.name, doc.id, doc.linkLabel, doc.fileLabel]
          .some((field) => field.toLowerCase().includes(q)),
      )
    }

    if (expiring === 'true') {
      // lejárt/lejáró, de NEM archivált (archivált lejárata nem akció) —
      // legkorábbi érvényesség elöl (a felülvizsgálati sorrend)
      const served = rows.map(serveDocument)
        .filter((doc) => doc.expiry !== null && doc.status !== 'archivalt')
        .sort((a, b) => (a.validUntil ?? '').localeCompare(b.validUntil ?? ''))
      return HttpResponse.json(served)
    }

    // legutóbb frissített elöl
    const sorted = [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return HttpResponse.json(sorted.map(serveDocument))
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const doc = findDocument(params.id as string)
    return doc ? HttpResponse.json(serveDocument(doc)) : notFound('Dokumentum')
  }),

  // submit: piszkozat → ellenorzes (ellenőrzésre küldés)
  http.post(`${BASE}/:id/submit`, ({ params }) => {
    const doc = findDocument(params.id as string)
    if (!doc) return notFound('Dokumentum')
    const guard = guardTransition(DOCUMENT_FSM, 'submit', doc.status)
    if (guard) return guard

    applyTransition(doc, DOCUMENT_FSM.submit.to, null, true)
    return HttpResponse.json(serveDocument(doc))
  }),

  // approve: ellenorzes → kiadott (jóváhagyás — kiadás, opcionális megjegyzéssel)
  http.post(`${BASE}/:id/approve`, async ({ params, request }) => {
    const doc = findDocument(params.id as string)
    if (!doc) return notFound('Dokumentum')
    const guard = guardTransition(DOCUMENT_FSM, 'approve', doc.status)
    if (guard) return guard

    const body = (await request.json()) as { note?: string } | null
    applyTransition(doc, DOCUMENT_FSM.approve.to, body?.note?.trim() || null, true)
    return HttpResponse.json(serveDocument(doc))
  }),

  // reject: ellenorzes → piszkozat — INDOK NÉLKÜL 400 (payload-guard tükör)
  http.post(`${BASE}/:id/reject`, async ({ params, request }) => {
    const doc = findDocument(params.id as string)
    if (!doc) return notFound('Dokumentum')
    const guard = guardTransition(DOCUMENT_FSM, 'reject', doc.status)
    if (guard) return guard

    const body = (await request.json()) as { reason?: string } | null
    const reasonBlock = rejectReasonBlockReason(body?.reason ?? '')
    if (reasonBlock) return jsonError(400, 'BadRequest', reasonBlock)

    applyTransition(doc, DOCUMENT_FSM.reject.to, body!.reason!.trim(), true)
    return HttpResponse.json(serveDocument(doc))
  }),

  // recall: kiadott → ellenorzes (felülvizsgálat — a műhely a korábbi kiadottra esik vissza)
  http.post(`${BASE}/:id/recall`, async ({ params, request }) => {
    const doc = findDocument(params.id as string)
    if (!doc) return notFound('Dokumentum')
    const guard = guardTransition(DOCUMENT_FSM, 'recall', doc.status)
    if (guard) return guard

    const body = (await request.json()) as { reason?: string } | null
    applyTransition(doc, DOCUMENT_FSM.recall.to, body?.reason?.trim() || null, true)
    return HttpResponse.json(serveDocument(doc))
  }),

  // archive: piszkozat|kiadott → archivalt (a verzió-lánc érintetlen)
  http.post(`${BASE}/:id/archive`, ({ params }) => {
    const doc = findDocument(params.id as string)
    if (!doc) return notFound('Dokumentum')
    const guard = guardTransition(DOCUMENT_FSM, 'archive', doc.status)
    if (guard) return guard

    applyTransition(doc, DOCUMENT_FSM.archive.to, null, false)
    return HttpResponse.json(serveDocument(doc))
  }),

  // reopen: archivalt → piszkozat (újranyitás munkapéldányként; a lánc érintetlen)
  http.post(`${BASE}/:id/reopen`, ({ params }) => {
    const doc = findDocument(params.id as string)
    if (!doc) return notFound('Dokumentum')
    const guard = guardTransition(DOCUMENT_FSM, 'reopen', doc.status)
    if (guard) return guard

    applyTransition(doc, DOCUMENT_FSM.reopen.to, null, false)
    return HttpResponse.json(serveDocument(doc))
  }),

  // Új verzió: verziószám-léptetés, a korábbi verziók megőrzésével (AddVersion-tükör).
  // Archivált dokumentumon 409; hiányzó fájl-címke/változás-jegyzet → 400.
  http.post(`${BASE}/:id/versions`, async ({ params, request }) => {
    const doc = findDocument(params.id as string)
    if (!doc) return notFound('Dokumentum')

    const statusBlock = uploadVersionBlockReason(doc.status)
    if (statusBlock) return jsonError(409, 'Conflict', statusBlock)

    const body = (await request.json()) as Partial<VersionUploadInput> | null
    const fieldsBlock = versionFieldsBlockReason(body?.fileLabel ?? '', body?.note ?? '')
    if (fieldsBlock) return jsonError(400, 'BadRequest', fieldsBlock)

    const fileLabel = body!.fileLabel!.trim()
    doc.version += 1
    doc.versions.push({
      v: doc.version,
      fileLabel,
      note: body!.note!.trim(),
      // az új verzió piszkozat munkapéldányként indul — újra jóváhagyandó
      status: 'piszkozat',
      uploadedBy: MOCK_UPLOADER,
      uploadedAt: isoTimestamp(),
    })
    doc.status = 'piszkozat'
    doc.fileLabel = fileLabel
    doc.reviewNote = null
    doc.updatedAt = isoTimestamp()
    return HttpResponse.json(serveDocument(doc))
  }),
]
