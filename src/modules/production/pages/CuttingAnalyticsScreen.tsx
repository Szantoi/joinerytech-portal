import { QueryGate, Icon } from '../../../components/ui'
import { useWasteReport } from '../services'
import { formatNumber } from './labels'

/**
 * Elemzések — a VALÓS `GET /api/cutting/waste` 3 mezős összesítője (config-
 * vezérelt ablak). ⚠ Gap-jelölés (kontraktus-doksi P3/P4, task-elv 8.): a
 * legacy képernyő napi hulladék-trendet, gépenkénti OEE-t és anyagfelhasználási
 * grafikont mutatott — ezek MOCK adatok voltak, valós végpont-tükrük nincs
 * (`/analytics/waste` nem létezik, `/analytics/oee` `tenantId` query-paramot
 * KÖVETEL, amit a portál nem küldhet hitelesítetlenül — 5. szekció auth-gap).
 * A WORLDS-CUTTING-AUTHFIX (follow-up, ld. task-doksi gap-lista) lezárása
 * előtt ezt a UI ŐSZINTÉN nem építi be — a hiányzó grafikonok helyén
 * gap-kártya jelzi a blokkolót, kitalált szám nélkül.
 */
export function CuttingAnalyticsScreen() {
  const waste = useWasteReport()

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Elemzések</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">Hulladék-összesítő a valós kontraktusból</p>
      </div>

      <QueryGate isPending={waste.isPending} isError={waste.isError} onRetry={() => void waste.refetch()} resource="hulladék-riport">
        {!waste.data ? (
          <p className="text-[12px] text-ink-muted">Nincs adat.</p>
        ) : (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface-1 p-4">
              <dt className="text-[10.5px] uppercase tracking-wide text-ink-muted">Összes hulladék</dt>
              <dd className="mt-1 text-[24px] font-semibold tabular-nums text-ink">
                {formatNumber(waste.data.totalWasteAreaCm2)} <span className="text-[14px] font-normal text-ink-muted">cm²</span>
              </dd>
            </div>
            <div className="rounded-xl border border-line bg-surface-1 p-4">
              <dt className="text-[10.5px] uppercase tracking-wide text-ink-muted">Átlag / végrehajtás</dt>
              <dd className="mt-1 text-[24px] font-semibold tabular-nums text-ink">
                {formatNumber(waste.data.averageWastePerExecution)} <span className="text-[14px] font-normal text-ink-muted">cm²</span>
              </dd>
            </div>
            <div className="rounded-xl border border-line bg-surface-1 p-4">
              <dt className="text-[10.5px] uppercase tracking-wide text-ink-muted">Végrehajtás-szám</dt>
              <dd className="mt-1 text-[24px] font-semibold tabular-nums text-ink">{waste.data.executionCount}</dd>
            </div>
          </dl>
        )}
      </QueryGate>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
        <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-400" />
        <div className="text-[12px] text-amber-900 dark:text-amber-200">
          <p className="font-medium">Napi hulladék-trend, gépenkénti OEE és anyagfelhasználás nincs bekötve.</p>
          <p className="mt-1 text-amber-800/90 dark:text-amber-300/90">
            A backend `/analytics/oee` és `/analytics/material-usage` végpontjai a `tenantId`-t
            hitelesítetlen query-paraméterként várják (kontraktus-doksi 5. szekció, ADR-061 T1
            sérül) — a portál ezt nem küldheti. Follow-up: <strong>WORLDS-CUTTING-AUTHFIX</strong>{' '}
            (cutting pricing-rules + analytics auth-fix) létrehozása és lezárása után köthető be.
          </p>
        </div>
      </div>
    </div>
  )
}
