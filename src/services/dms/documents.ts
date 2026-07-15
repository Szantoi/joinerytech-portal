import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { useToast } from '../../components/ui'
import { DMS_API_BASE } from './config'
import { dmsKeys } from './keys'
import { DOCUMENT_FSM, type DocumentAction, type DocumentStatus } from './fsm'

/**
 * Dokumentumok (Document) — lista, részlet, FSM-átmenetek és verzió-feltöltés.
 * A kontraktus MSW-FIRST előkép (a backend Document-magnak nincs futtatható
 * endpoint-rétege): útvonalak az openapi.yaml sémájára rímelve
 * (`/api/dms/documents`, verziók: `POST /:id/versions`), az életciklus a
 * prototípus DOC_FLOW tükre (ld. ./fsm.ts fejkomment).
 *
 * Átmenet: optimista státusz-frissítés a detail cache-en, 409 (guard) esetén
 * rollback + hiba-toast, minden esetben invalidálás (a szerver az igazságforrás).
 * Verzió-feltöltés (rule-6): a mutáció a `documents` LISTA és a `document`
 * DETAIL prefixet is invalidálja — a verziószám/státusz mindkét nézetben
 * derivált adat.
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const documentStatusSchema = z.enum([
  'piszkozat', 'ellenorzes', 'kiadott', 'archivalt',
]) satisfies z.ZodType<DocumentStatus>

/** Dokumentum-típus — a prototípus DOC_TYPE_META kanonikus kulcsai. */
export const docTypeSchema = z.enum(['rajz', 'szerzodes', 'tanusitvany', 'utasitas', 'egyeb'])
export type DocType = z.infer<typeof docTypeSchema>

/** Kapcsolat-típus (mihez tartozik a dokumentum) — DOC_LINK_META tükör. */
export const docLinkTypeSchema = z.enum([
  'project', 'order', 'catalog', 'template', 'customer', 'none',
])
export type DocLinkType = z.infer<typeof docLinkTypeSchema>

/**
 * Verzió-bejegyzés — a backend DocumentVersion value object tükre
 * (VersionNumber/ChangeNotes/UploadedBy/UploadedAt; a fájlt a prototípus
 * mintájára a `fileLabel` jelképezi — nincs valódi blob, backend-gap).
 * A `status` a verzió életútjának pillanatképe: az aktuális verzióé az
 * átmenetekkel együtt frissül — ebből számítódik az érvényes kiadott verzió.
 */
export const versionEntrySchema = z.object({
  v: z.number(),
  fileLabel: z.string(),
  /** Változás-jegyzet (ChangeNotes) — kötelező az auditálhatósághoz. */
  note: z.string(),
  status: documentStatusSchema,
  uploadedBy: z.string(),
  uploadedAt: z.string(),
})
export type VersionEntry = z.infer<typeof versionEntrySchema>

export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: docTypeSchema,
  status: documentStatusSchema,
  /** Aktuális (legmagasabb) verziószám — a verzió-lánc hossza (AddVersion-tükör). */
  version: z.number(),
  linkType: docLinkTypeSchema,
  linkId: z.string().nullable(),
  linkLabel: z.string(),
  owner: z.string(),
  note: z.string().nullable(),
  /** Az utolsó átmenet megjegyzése (jóváhagyás-jegyzet / visszautasítás-indok). */
  reviewNote: z.string().nullable(),
  fileLabel: z.string(),
  /** Érvényesség vége (YYYY-MM-DD); null = nem jár le. */
  validUntil: z.string().nullable(),
  updatedAt: z.string(),
  /** Teljes verzió-lánc (a korábbi verziók megőrződnek — verziótörténet). */
  versions: z.array(versionEntrySchema),
  /** SZÁMÍTOTT (calc.releasedVersionInfo) — a szerver adja, a kliens nem számolja. */
  releasedVersion: z.number().nullable(),
  /** SZÁMÍTOTT (calc.expiryState a config-ablakkal) — lejárat-állapot. */
  expiry: z.enum(['lejart', 'lejaro']).nullable(),
})
export type DmsDocument = z.infer<typeof documentSchema>

/** Az egyes FSM-akciók request-payloadjai (MSW-first kontraktus). */
export interface DocumentTransitionPayloads {
  submit: Record<string, never>
  /** Jóváhagyás: opcionális megjegyzés (a reviewNote-ba kerül). */
  approve: { note?: string }
  /** Visszautasítás: KÖTELEZŐ indok (rejectReasonBlockReason — MSW 400 tükör). */
  reject: { reason: string }
  /** Felülvizsgálat indítása: opcionális indok. */
  recall: { reason?: string }
  archive: Record<string, never>
  reopen: Record<string, never>
}

/** Új verzió bemenete (AddVersion-tükör; mindkét mező kötelező — versionFieldsBlockReason). */
export interface VersionUploadInput {
  fileLabel: string
  note: string
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type DocumentFilters = {
  status?: DocumentStatus
  type?: DocType
  linkType?: DocLinkType
  /** Szabad-szavas keresés (név / azonosító / kapcsolat / fájl-címke). */
  q?: string
  /** true → csak a lejárt/hamarosan lejáró (nem archivált) dokumentumok. */
  expiring?: boolean
}

export function fetchDocuments(filters: DocumentFilters = {}): Promise<DmsDocument[]> {
  return apiFetch(`${DMS_API_BASE}/documents`, {
    query: filters,
    schema: z.array(documentSchema),
  })
}

export function fetchDocument(id: string): Promise<DmsDocument> {
  return apiFetch(`${DMS_API_BASE}/documents/${id}`, { schema: documentSchema })
}

/** FSM-akció = dedikált végpont (EHS README 2. szabály) — nincs generikus PATCH. */
export function transitionDocument<A extends DocumentAction>(
  id: string,
  action: A,
  payload: DocumentTransitionPayloads[A],
): Promise<DmsDocument> {
  return apiFetch(`${DMS_API_BASE}/documents/${id}/${action}`, {
    method: 'POST',
    body: payload,
    schema: documentSchema,
  })
}

/** Új verzió feltöltése — verziószám-léptetés, a korábbi verziók megőrzésével. */
export function uploadDocumentVersion(id: string, input: VersionUploadInput): Promise<DmsDocument> {
  return apiFetch(`${DMS_API_BASE}/documents/${id}/versions`, {
    method: 'POST',
    body: input,
    schema: documentSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: dmsKeys.documents(filters),
    queryFn: () => fetchDocuments(filters),
  })
}

export function useDocument(id: string | null) {
  return useQuery({
    queryKey: dmsKeys.document(id ?? ''),
    queryFn: () => fetchDocument(id!),
    enabled: id !== null,
  })
}

/**
 * Dokumentum-mutáció utáni invalidálás (EHS README 6. szabály):
 * 'documents' lista-prefix + 'document' DETAIL-prefix (külön él!).
 */
function useInvalidateDocuments() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...dmsKeys.all, 'documents'] })
    void queryClient.invalidateQueries({ queryKey: [...dmsKeys.all, 'document'] })
  }
}

export interface DocumentTransitionInput {
  id: string
  action: DocumentAction
  payload: DocumentTransitionPayloads[DocumentAction]
}

/**
 * Dokumentum FSM-átmenet mutáció, optimista frissítéssel:
 *  - onMutate: a detail cache státusza azonnal a célállapotra vált,
 *  - onError: rollback + hiba-toast (409-nél a szerver guard-üzenete),
 *  - onSettled: dokumentum-cache-ek invalidálása (a szerver az igazságforrás).
 */
export function useDocumentTransition() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateDocuments()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, action, payload }: DocumentTransitionInput) =>
      transitionDocument(id, action, payload),

    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: dmsKeys.document(id) })
      const previous = queryClient.getQueryData<DmsDocument>(dmsKeys.document(id))
      if (previous) {
        queryClient.setQueryData<DmsDocument>(dmsKeys.document(id), {
          ...previous,
          status: DOCUMENT_FSM[action].to,
        })
      }
      return { previous }
    },

    onError: (error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(dmsKeys.document(id), context.previous)
      }
      addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error')
    },

    onSuccess: (document) => {
      queryClient.setQueryData(dmsKeys.document(document.id), document)
    },

    onSettled: () => invalidate(),
  })
}

export interface VersionUploadMutationInput {
  id: string
  input: VersionUploadInput
}

/**
 * Új verzió feltöltése (rule-6): a verziószám és a státusz a lista ÉS a detail
 * nézetben is megjelenik → a mutáció mindkét prefixet invalidálja. Nem
 * optimista (a verziószámot a szerver lépteti); 409 (archivált) / 400 (hiányzó
 * mező) → hiba-toast.
 */
export function useUploadVersion() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateDocuments()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: VersionUploadMutationInput) => uploadDocumentVersion(id, input),

    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A verzió-feltöltés nem sikerült', 'error')
    },

    onSuccess: (document) => {
      queryClient.setQueryData(dmsKeys.document(document.id), document)
      addToast(`Új verzió rögzítve: v${document.version}`, 'success')
    },

    onSettled: () => invalidate(),
  })
}
