import { useState } from 'react'
import { Button, Input, SlideOver, StatusPill } from '../../components/ui'
import {
  useHazardousMaterial, useRenewSds, useEhsLocations, locationNameMap,
} from '../../services/ehs'
import { MATERIAL_STATUS_LABELS, SDS_VALIDITY_META, formatDate } from './labels'

/**
 * Anyag-részletek SlideOver — GHS osztályok, SDS-dátumok + RenewSds akció
 * (új kiállítás/lejárat dátumpár, POST …/renew-sds; siker/hiba toast a hookban).
 */

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function inOneYear(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-[10.5px] text-ink-muted">{label}</div>
      <div className="text-[12px] text-ink">{children}</div>
    </div>
  )
}

export function SdsDetailSlideOver({ materialId, onClose }: { materialId: string | null; onClose: () => void }) {
  const { data: material, isPending, isError } = useHazardousMaterial(materialId)
  const locations = useEhsLocations()
  const renew = useRenewSds()
  const [renewOpen, setRenewOpen] = useState(false)
  const [issuedAt, setIssuedAt] = useState(today)
  const [expiresAt, setExpiresAt] = useState(inOneYear)

  if (materialId === null) return null
  const locNames = locationNameMap(locations.data)

  const submitRenew = (e: React.FormEvent) => {
    e.preventDefault()
    renew.mutate(
      {
        id: materialId,
        payload: {
          newIssuedAt: new Date(issuedAt).toISOString(),
          newExpiresAt: new Date(expiresAt).toISOString(),
        },
      },
      { onSuccess: () => setRenewOpen(false) },
    )
  }

  return (
    <SlideOver open onClose={onClose} title={material?.name ?? 'Veszélyes anyag'}
      subtitle={material ? `${material.supplier}${material.casNumber ? ` · CAS: ${material.casNumber}` : ''}` : undefined}
      width={480}>
      <div className="space-y-5 px-5 py-5">
        {isPending && <div aria-busy="true" className="h-32 animate-pulse rounded-xl bg-surface-2" />}
        {isError && <p role="alert" className="text-[12.5px] text-ink-muted">Az anyag betöltése nem sikerült.</p>}

        {material && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={SDS_VALIDITY_META[material.sdsValidity].tone}
                label={`SDS: ${SDS_VALIDITY_META[material.sdsValidity].label}`} />
              <StatusPill tone={material.status === 'Active' ? 'progress' : 'terminal'}
                label={MATERIAL_STATUS_LABELS[material.status]} />
            </div>

            {(material.ghsHazardClasses?.length ?? 0) > 0 && (
              <div>
                <div className="mb-1 text-[10.5px] text-ink-muted">GHS veszélyosztályok</div>
                <div className="flex flex-wrap gap-1.5">
                  {material.ghsHazardClasses!.map((ghs) => (
                    <span key={ghs} className="inline-flex h-6 items-center rounded-lg bg-surface-2 px-2 text-[11px] font-mono text-ink">
                      {ghs}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Meta label="Tárolási hely">{locNames.get(material.storageLocationId) ?? '—'}</Meta>
              <Meta label="Mennyiség a telephelyen">{material.quantityOnSite} {material.unit}</Meta>
              <Meta label="SDS kiállítva">
                <span className="font-mono">{formatDate(material.sdsIssuedAt)}</span>
              </Meta>
              <Meta label="SDS lejárat">
                <span className="font-mono">{formatDate(material.sdsExpiresAt)}</span>
              </Meta>
            </div>

            {!renewOpen ? (
              <Button
                size="sm"
                disabledReason={material.status === 'Archived' ? 'Archivált anyag SDS-e nem újítható meg.' : undefined}
                onClick={() => setRenewOpen(true)}
              >
                SDS megújítása
              </Button>
            ) : (
              <form onSubmit={submitRenew} className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-3">
                <Input label="Új kiállítás dátuma" type="date" required value={issuedAt}
                  onChange={(e) => setIssuedAt(e.target.value)} />
                <Input label="Új lejárati dátum" type="date" required value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)} />
                <div className="flex gap-2">
                  <Button type="submit" size="sm"
                    disabledReason={renew.isPending ? 'Folyamatban…' : undefined}>
                    Megújítás rögzítése
                  </Button>
                  <Button type="button" size="sm" variant="quiet" onClick={() => setRenewOpen(false)}>
                    Mégse
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </SlideOver>
  )
}
