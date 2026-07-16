import { describe, it, expect } from 'vitest'
import {
  addDays, diffDays, scheduleWindow,
  calcAssetStatus, isPlanDue, planDueInfo,
  type AssetStatusWorkOrderInput, type PlanDueInput,
} from '../calc'
import { PLAN_DUE_SOON_DAYS, PLAN_DUE_SOON_HOURS, SCHEDULE_WINDOW_DAYS } from '../config'

/**
 * calc unit tesztek — a backend AssetStatusCalculationService és
 * PreventiveMaintenanceSchedulerService tükreinek fix-dátumos ellenőrzése.
 */

const TODAY = '2026-07-15'

// ── Dátum-helperek ──────────────────────────────────────────────────────────

describe('dátum-helperek', () => {
  it('addDays hónap-határon át is jó', () => {
    expect(addDays('2026-07-30', 3)).toBe('2026-08-02')
    expect(addDays('2026-07-01', -1)).toBe('2026-06-30')
  })

  it('diffDays előjeles (jövő pozitív)', () => {
    expect(diffDays('2026-07-15', '2026-07-20')).toBe(5)
    expect(diffDays('2026-07-15', '2026-07-10')).toBe(-5)
    expect(diffDays(TODAY, TODAY)).toBe(0)
  })

  it('scheduleWindow: a config-ablaknyi nap a kezdőnaptól', () => {
    const days = scheduleWindow(TODAY)
    expect(days).toHaveLength(SCHEDULE_WINDOW_DAYS)
    expect(days[0]).toBe(TODAY)
    expect(days[1]).toBe('2026-07-16')
  })
})

// ── Eszköz-státusz (AssetStatusCalculationService tükör) ────────────────────

const mkWo = (over: Partial<AssetStatusWorkOrderInput>): AssetStatusWorkOrderInput => ({
  assetId: 'ast-1', status: 'folyamatban', type: 'javitas', requiresDowntime: true, ...over,
})

describe('calcAssetStatus (SZÁMÍTOTT, sosem tárolt)', () => {
  const asset = { id: 'ast-1', retired: false }

  it('selejtezett eszköz mindig selejtezve — a munkalapoktól függetlenül', () => {
    expect(calcAssetStatus({ id: 'ast-1', retired: true }, [mkWo({})])).toBe('selejtezve')
  })

  it('folyamatban lévő, leállásos JAVÍTÁS → geptores', () => {
    expect(calcAssetStatus(asset, [mkWo({})])).toBe('geptores')
  })

  it('folyamatban lévő, leállásos megelőző/takarítás → karbantartas', () => {
    expect(calcAssetStatus(asset, [mkWo({ type: 'megelozo' })])).toBe('karbantartas')
    expect(calcAssetStatus(asset, [mkWo({ type: 'takaritas' })])).toBe('karbantartas')
  })

  it('vegyes leállásos munkák közül a javítás nyer (geptores)', () => {
    expect(calcAssetStatus(asset, [mkWo({ type: 'megelozo' }), mkWo({})])).toBe('geptores')
  })

  it('leállás nélküli vagy nem folyamatban lévő munka → uzemel', () => {
    expect(calcAssetStatus(asset, [])).toBe('uzemel')
    expect(calcAssetStatus(asset, [mkWo({ requiresDowntime: false })])).toBe('uzemel')
    expect(calcAssetStatus(asset, [mkWo({ status: 'utemezve' })])).toBe('uzemel')
    // másik eszköz leállásos munkája nem számít
    expect(calcAssetStatus(asset, [mkWo({ assetId: 'ast-2' })])).toBe('uzemel')
  })
})

// ── Terv-esedékesség (PreventiveMaintenanceSchedulerService tükör) ──────────

const intervalPlan = (over: Partial<PlanDueInput>): PlanDueInput => ({
  trigger: 'idokoz', intervalDays: 90, intervalHours: null,
  lastDone: null, lastDoneHours: null, ...over,
})

const hoursPlan = (over: Partial<PlanDueInput>): PlanDueInput => ({
  trigger: 'uzemora', intervalDays: null, intervalHours: 500,
  lastDone: null, lastDoneHours: null, ...over,
})

describe('isPlanDue / planDueInfo', () => {
  it('soha nem végzett terv azonnal esedékes (backend-tükör)', () => {
    expect(isPlanDue(intervalPlan({}), TODAY, 0)).toBe(true)
    expect(isPlanDue(hoursPlan({}), TODAY, 0)).toBe(true)
  })

  it('idokoz: lastDone + intervalDays <= ma → esedékes; utána lejárt napokkal', () => {
    // pontosan ma esedékes
    expect(isPlanDue(intervalPlan({ lastDone: addDays(TODAY, -90) }), TODAY, 0)).toBe(true)
    // tegnap járt le
    const overdue = planDueInfo(intervalPlan({ lastDone: addDays(TODAY, -91) }), TODAY, 0)
    expect(overdue.due).toBe(true)
    expect(overdue.daysLeft).toBe(-1)
    // még nem esedékes
    expect(isPlanDue(intervalPlan({ lastDone: addDays(TODAY, -89) }), TODAY, 0)).toBe(false)
  })

  it('idokoz dueSoon: a konfigurált küszöbön belül warn, azon túl nem', () => {
    const soon = planDueInfo(
      intervalPlan({ lastDone: addDays(TODAY, -(90 - PLAN_DUE_SOON_DAYS)) }), TODAY, 0,
    )
    expect(soon.due).toBe(false)
    expect(soon.dueSoon).toBe(true)
    expect(soon.daysLeft).toBe(PLAN_DUE_SOON_DAYS)

    const far = planDueInfo(
      intervalPlan({ lastDone: addDays(TODAY, -(90 - PLAN_DUE_SOON_DAYS - 1)) }), TODAY, 0,
    )
    expect(far.dueSoon).toBe(false)
  })

  it('uzemora: lastDoneHours + intervalHours <= üzemóra → esedékes', () => {
    expect(isPlanDue(hoursPlan({ lastDoneHours: 7800 }), TODAY, 8300)).toBe(true)
    expect(isPlanDue(hoursPlan({ lastDoneHours: 7800 }), TODAY, 8299)).toBe(false)

    const info = planDueInfo(hoursPlan({ lastDoneHours: 7800 }), TODAY, 8320)
    expect(info.unit).toBe('uzemora')
    expect(info.due).toBe(true)
    expect(info.hoursLeft).toBe(-20)
  })

  it('uzemora dueSoon: a konfigurált óra-küszöbön belül', () => {
    const info = planDueInfo(
      hoursPlan({ lastDoneHours: 8000 }), TODAY, 8500 - PLAN_DUE_SOON_HOURS,
    )
    expect(info.due).toBe(false)
    expect(info.dueSoon).toBe(true)
    expect(info.hoursLeft).toBe(PLAN_DUE_SOON_HOURS)
  })
})
