import type { DmsDocument } from '../../services/dms/documents'
import { addDays, todayIso } from '../../services/dms/calc'

/**
 * DMS mock seed — a tartalmi törzs a prototípus DOCUMENTS_SEED faipari
 * dokumentum-anyagát (rajz/szerződés/tanúsítvány/SOP) hasznosítja újra a
 * KANONIKUS státusz-kulcsokkal. A DÁTUMOS adatok a „mához" képest relatív
 * nap-eltolással generáltak, így a lejárat-figyelés (EXPIRY_WARN_DAYS ablak)
 * és a dashboard KPI-k minden futásnál determinisztikus szerkezetűek.
 *
 * A seed NEM tartalmaz `releasedVersion`/`expiry` mezőt: az MSW a
 * kiszolgáláskor számítja (services/dms/calc — egy igazságforrás).
 */

/** A seed horgony-napja: ma (a lejárat-ablak ehhez igazodik). */
export function seedDay(n: number): string {
  return addDays(todayIso(), n)
}

/** Stabil azonosítók állapot szerint — a tesztek ezekre hivatkoznak. */
export const DMS_SEED_IDS = {
  docReleased: 'DOC-401',       // kiadott v3 — recall/archive indítható
  docInReview: 'DOC-402',       // ellenorzes v2, v1 kiadott → released=1, pending=2
  docDraft: 'DOC-403',          // piszkozat v1 — submit/archive indítható
  docArchived: 'DOC-404',       // archivalt (lejárt CE) — reopen; verzió-feltöltés 409
  docExpired: 'DOC-405',        // kiadott, validUntil a múltban → 'lejart'
  docExpiring: 'DOC-406',       // kiadott, validUntil az ablakon belül → 'lejaro'
  docLongValid: 'DOC-407',      // kiadott, validUntil az ablakon KÍVÜL → nincs riasztás
  docNeverReleased: 'DOC-408',  // ellenorzes v1, sosem volt kiadva → blocked (nincs kiadott)
} as const

/** Aki a mockban feltölt/jóváhagy — auth-bekötésig konstans. */
export const MOCK_UPLOADER = 'Kovács Péter'

/** Tárolt dokumentum — a számított mezők nélkül (azokat a serve adja). */
export type DocumentSeed = Omit<DmsDocument, 'releasedVersion' | 'expiry'>

// ── Dokumentumok — 8 sor: státuszonként legalább egy + lejárat-esetek ────────

export function seedDocuments(): DocumentSeed[] {
  const d = seedDay
  return [
    {
      // teljes kiadási lánc — minden verzió kiadásig jutott
      id: DMS_SEED_IDS.docReleased,
      name: 'Petőfi u. 12. — konyha kiviteli rajz', type: 'rajz',
      status: 'kiadott', version: 3,
      linkType: 'project', linkId: 'PRJ-2026-014', linkLabel: 'Petőfi u. 12. — Konyha + nappali',
      owner: 'Kovács Péter', note: 'Jóváhagyott kiviteli terv, gyártásra kiadva.',
      reviewNote: null, fileLabel: 'petofi-konyha-kiviteli-v3.pdf',
      validUntil: null, updatedAt: `${d(-6)}T10:20`,
      versions: [
        { v: 1, fileLabel: 'petofi-konyha-kiviteli-v1.pdf', note: 'Első koncepció', status: 'kiadott', uploadedBy: 'Kovács Péter', uploadedAt: `${d(-29)}T09:00` },
        { v: 2, fileLabel: 'petofi-konyha-kiviteli-v2.pdf', note: 'Ügyfél-módosítás: sziget', status: 'kiadott', uploadedBy: 'Kovács Péter', uploadedAt: `${d(-16)}T14:30` },
        { v: 3, fileLabel: 'petofi-konyha-kiviteli-v3.pdf', note: 'Végleges méretek', status: 'kiadott', uploadedBy: 'Kovács Péter', uploadedAt: `${d(-6)}T10:20` },
      ],
    },
    {
      // v2 ellenőrzés alatt — a műhely a kiadott v1-et használja (runtime-tükör)
      id: DMS_SEED_IDS.docInReview,
      name: 'Doorstar ajtó sorozat — gyártási rajz', type: 'rajz',
      status: 'ellenorzes', version: 2,
      linkType: 'order', linkId: 'JT-2426-0182', linkLabel: 'Doorstar Hungary Zrt. — ajtók',
      owner: 'Kovács Péter',
      note: 'v2 felülvizsgálat alatt — pánt-furat raszter módosítva. A CNC a kiadott v1-et futtatja kiadásig.',
      reviewNote: null, fileLabel: 'doorstar-ajto-gyartasi-v2.pdf',
      validUntil: null, updatedAt: `${d(-1)}T08:40`,
      versions: [
        { v: 1, fileLabel: 'doorstar-ajto-gyartasi-v1.pdf', note: 'Gyártásra kiadva', status: 'kiadott', uploadedBy: 'Kovács Péter', uploadedAt: `${d(-8)}T11:00` },
        { v: 2, fileLabel: 'doorstar-ajto-gyartasi-v2.pdf', note: 'Pánt-furat raszter 32→37mm — ellenőrzésre vár', status: 'ellenorzes', uploadedBy: 'Kovács Péter', uploadedAt: `${d(-1)}T08:40` },
      ],
    },
    {
      // piszkozat — a submit/archive akciók alanya
      id: DMS_SEED_IDS.docDraft,
      name: 'Várdai Konyhastúdió — ajánlat melléklet', type: 'egyeb',
      status: 'piszkozat', version: 1,
      linkType: 'customer', linkId: 'C-002', linkLabel: 'Várdai Konyhastúdió',
      owner: 'Szabó Anna', note: 'Anyagminta-lista az ajánlathoz, összeállítás alatt.',
      reviewNote: null, fileLabel: 'vardai-ajanlat-melleklet.pdf',
      validUntil: null, updatedAt: `${d(0)}T07:50`,
      versions: [
        { v: 1, fileLabel: 'vardai-ajanlat-melleklet.pdf', note: 'Piszkozat', status: 'piszkozat', uploadedBy: 'Szabó Anna', uploadedAt: `${d(0)}T07:50` },
      ],
    },
    {
      // archivált (tavalyi CE) — reopen indítható; új verzió feltöltése 409
      id: DMS_SEED_IDS.docArchived,
      name: 'CE megfelelőségi nyilatkozat — vasalat 2025', type: 'tanusitvany',
      status: 'archivalt', version: 1,
      linkType: 'catalog', linkId: 'wh-005', linkLabel: 'Blum CLIP top csukópánt',
      owner: 'Tóth Kinga', note: '2025-ös évre — az érvényes 2026-os verzió külön dokumentum.',
      reviewNote: null, fileLabel: 'ce-blum-clip-2025.pdf',
      validUntil: seedDay(-200), updatedAt: `${d(-140)}T09:00`,
      versions: [
        { v: 1, fileLabel: 'ce-blum-clip-2025.pdf', note: '2025-ös CE', status: 'kiadott', uploadedBy: 'Tóth Kinga', uploadedAt: `${d(-320)}T09:00` },
      ],
    },
    {
      // LEJÁRT tanúsítvány (kiadott!) — a lejáró-nézet kiemelt sora
      id: DMS_SEED_IDS.docExpired,
      name: 'FSC eredetigazolás — Falco bükk', type: 'tanusitvany',
      status: 'kiadott', version: 1,
      linkType: 'catalog', linkId: 'wh-001', linkLabel: 'Bükk 18mm bútorlap',
      owner: 'Tóth Kinga', note: 'FSC® lánc-tanúsítvány — megújítás szükséges a beszállítótól.',
      reviewNote: null, fileLabel: 'fsc-falco-buk.pdf',
      validUntil: seedDay(-10), updatedAt: `${d(-90)}T13:00`,
      versions: [
        { v: 1, fileLabel: 'fsc-falco-buk.pdf', note: 'Beszállítótól kapott tanúsítvány', status: 'kiadott', uploadedBy: 'Tóth Kinga', uploadedAt: `${d(-90)}T13:00` },
      ],
    },
    {
      // az ablakon BELÜL lejáró szerződés → 'lejaro' (felülvizsgálandó)
      id: DMS_SEED_IDS.docExpiring,
      name: 'Bognár Bútor Kft. — keretszerződés 2026', type: 'szerzodes',
      status: 'kiadott', version: 1,
      linkType: 'customer', linkId: 'C-001', linkLabel: 'Bognár Bútor Kft.',
      owner: 'Szabó Anna', note: 'Q2 sorozat-gyártás keretszerződés — hosszabbítás egyeztetés alatt.',
      reviewNote: null, fileLabel: 'bognar-keretszerzodes-2026.pdf',
      validUntil: seedDay(14), updatedAt: `${d(-60)}T10:00`,
      versions: [
        { v: 1, fileLabel: 'bognar-keretszerzodes-2026.pdf', note: 'Aláírt példány', status: 'kiadott', uploadedBy: 'Szabó Anna', uploadedAt: `${d(-60)}T10:00` },
      ],
    },
    {
      // érvényes, de az ablakon KÍVÜL — a küszöb-logika ellenpróbája
      id: DMS_SEED_IDS.docLongValid,
      name: 'Élzárás munkautasítás (ABS 2mm)', type: 'utasitas',
      status: 'kiadott', version: 2,
      linkType: 'none', linkId: null, linkLabel: 'Üzemi SOP',
      owner: 'Kiss András', note: 'Homag KAL 310 beállítások + hőfok-táblázat. Éves felülvizsgálat.',
      reviewNote: null, fileLabel: 'sop-elzaras-abs2mm-v2.pdf',
      validUntil: seedDay(120), updatedAt: `${d(-23)}T15:10`,
      versions: [
        { v: 1, fileLabel: 'sop-elzaras-abs2mm-v1.pdf', note: 'Első kiadás', status: 'kiadott', uploadedBy: 'Kiss András', uploadedAt: `${d(-86)}T08:00` },
        { v: 2, fileLabel: 'sop-elzaras-abs2mm-v2.pdf', note: 'PU ragasztó kiegészítés', status: 'kiadott', uploadedBy: 'Kiss András', uploadedAt: `${d(-23)}T15:10` },
      ],
    },
    {
      // ellenőrzés alatt, SOSEM volt kiadva → blocked (nincs futtatható verzió)
      id: DMS_SEED_IDS.docNeverReleased,
      name: 'Belváros Café — pultsor kiviteli rajz', type: 'rajz',
      status: 'ellenorzes', version: 1,
      linkType: 'project', linkId: 'PRJ-2026-013', linkLabel: 'Belváros Café — pultsor',
      owner: 'Németh Zsófia', note: 'Első kiviteli — jóváhagyásra vár, gyártás nem indulhat.',
      reviewNote: null, fileLabel: 'belvaros-pult-kiviteli-v1.pdf',
      validUntil: null, updatedAt: `${d(-2)}T16:00`,
      versions: [
        { v: 1, fileLabel: 'belvaros-pult-kiviteli-v1.pdf', note: 'Első kiviteli — ellenőrzésre küldve', status: 'ellenorzes', uploadedBy: 'Németh Zsófia', uploadedAt: `${d(-2)}T16:00` },
      ],
    },
  ]
}
