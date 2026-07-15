import { StatusPill } from '../../components/ui'
import { marginBand, marginPct } from '../../services/controlling'
import { MARGIN_BAND_META, formatPct, formatSignedHuf } from './labels'

/**
 * Fedezet-vizualizációk — közös apró komponensek a Kontrolling képernyőkhöz:
 * MarginBar (költség vs. fedezet sáv), MarginPill (% + sáv-címke),
 * VariancePill (előjeles terv-eltérés).
 */

/** Költség/fedezet sáv: a szürke rész a költség, a színes a fedezet. */
export function MarginBar({ revenue, cost }: { revenue: number; cost: number }) {
  const r = Math.max(1, revenue)
  const costPct = Math.max(0, Math.min(100, (cost / r) * 100))
  const meta = MARGIN_BAND_META[marginBand(marginPct(revenue, cost))]
  return (
    <div aria-hidden="true" className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div className="h-full bg-ink/20" style={{ width: costPct + '%' }} />
      <div className={`h-full ${meta.bar}`} style={{ width: 100 - costPct + '%' }} />
    </div>
  )
}

export function MarginPill({ pct }: { pct: number | null }) {
  const meta = MARGIN_BAND_META[marginBand(pct)]
  return <StatusPill size="sm" tone={meta.tone} label={`${formatPct(pct)} · ${meta.label}`} />
}

/** Terv-eltérés pill: terv felett danger, megtakarítás success. */
export function VariancePill({ value }: { value: number }) {
  if (Math.abs(value) < 1) return <StatusPill size="sm" tone="neutral" label="terv szerint" />
  return (
    <StatusPill
      size="sm"
      tone={value > 0 ? 'danger' : 'success'}
      label={formatSignedHuf(value)}
    />
  )
}
