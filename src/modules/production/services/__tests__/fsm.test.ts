import { describe, it, expect } from 'vitest'
import { canTransition, transitionBlockReason } from '../../../../services/fsmGuards'
import {
  CUTTING_PLAN_FSM, DOOR_ORDER_FSM, EXECUTION_FSM, QUOTE_FSM,
  completePanelsBlockReason, isDoorOrderStatusUnreachable, isExecutionOpen,
  isPlanActive, isQuotePending, publishSnapshotBlockReason, submitItemsBlockReason,
} from '../fsm'

/**
 * Production FSM-tükör unit tesztek — a KÖZÖS fsmGuards-on futó táblák
 * minden elérhető ÉS tiltott átmenetére (a UI disabledReason és az MSW
 * guard ugyanezt a táblát futtatja — itt a táblát magát bizonyítjuk).
 */

describe('CuttingPlan FSM (Draft→Published→Frozen→Closed)', () => {
  it('elérhető átmenetek', () => {
    expect(canTransition(CUTTING_PLAN_FSM, 'publish', 'Draft')).toBe(true)
    expect(canTransition(CUTTING_PLAN_FSM, 'freeze', 'Published')).toBe(true)
    expect(canTransition(CUTTING_PLAN_FSM, 'close', 'Frozen')).toBe(true)
  })

  it('tiltott átmenetek — nem a megfelelő forrásállapotból', () => {
    expect(canTransition(CUTTING_PLAN_FSM, 'publish', 'Frozen')).toBe(false)
    expect(canTransition(CUTTING_PLAN_FSM, 'freeze', 'Draft')).toBe(false)
    expect(canTransition(CUTTING_PLAN_FSM, 'close', 'Closed')).toBe(false)
  })

  it('transitionBlockReason szöveget ad tiltott átmenetre, undefined-et engedélyezettre', () => {
    const labels = { Draft: 'Vázlat', Published: 'Publikált', Frozen: 'Fagyasztott', Closed: 'Lezárt' } as const
    expect(transitionBlockReason(CUTTING_PLAN_FSM, 'publish', 'Draft', labels)).toBeUndefined()
    expect(transitionBlockReason(CUTTING_PLAN_FSM, 'publish', 'Closed', labels)).toContain('Vázlat')
  })

  it('publishSnapshotBlockReason: üres profileSnapshotId blokkol', () => {
    expect(publishSnapshotBlockReason('')).toBeDefined()
    expect(publishSnapshotBlockReason('   ')).toBeDefined()
    expect(publishSnapshotBlockReason('PROF-01')).toBeUndefined()
  })

  it('isPlanActive: Draft/Published/Frozen aktív, Closed nem', () => {
    expect(isPlanActive('Draft')).toBe(true)
    expect(isPlanActive('Published')).toBe(true)
    expect(isPlanActive('Frozen')).toBe(true)
    expect(isPlanActive('Closed')).toBe(false)
  })
})

describe('CuttingExecution FSM (6 állapot, Failed átmenet nélkül)', () => {
  it('elérhető átmenetek', () => {
    expect(canTransition(EXECUTION_FSM, 'start', 'Scheduled')).toBe(true)
    expect(canTransition(EXECUTION_FSM, 'progress', 'Started')).toBe(true)
    expect(canTransition(EXECUTION_FSM, 'progress', 'InProgress')).toBe(true)
    expect(canTransition(EXECUTION_FSM, 'complete', 'InProgress')).toBe(true)
    expect(canTransition(EXECUTION_FSM, 'cancel', 'Scheduled')).toBe(true)
    expect(canTransition(EXECUTION_FSM, 'cancel', 'Started')).toBe(true)
    expect(canTransition(EXECUTION_FSM, 'cancel', 'InProgress')).toBe(true)
  })

  it('tiltott átmenetek', () => {
    expect(canTransition(EXECUTION_FSM, 'start', 'InProgress')).toBe(false)
    expect(canTransition(EXECUTION_FSM, 'complete', 'Scheduled')).toBe(false)
    expect(canTransition(EXECUTION_FSM, 'cancel', 'Completed')).toBe(false)
    expect(canTransition(EXECUTION_FSM, 'cancel', 'Cancelled')).toBe(false)
  })

  it('Failed-hez NINCS deklarált akció a táblában (a backend sem enged átmenetet)', () => {
    const actions = Object.keys(EXECUTION_FSM)
    for (const action of actions) {
      expect(canTransition(EXECUTION_FSM, action, 'Failed')).toBe(false)
    }
  })

  it('completePanelsBlockReason: csak teljes panel-számnál undefined', () => {
    expect(completePanelsBlockReason(10, 10)).toBeUndefined()
    expect(completePanelsBlockReason(9, 10)).toBeDefined()
  })

  it('isExecutionOpen: Scheduled/Started/InProgress nyitott, a többi nem', () => {
    expect(isExecutionOpen('Scheduled')).toBe(true)
    expect(isExecutionOpen('Started')).toBe(true)
    expect(isExecutionOpen('InProgress')).toBe(true)
    expect(isExecutionOpen('Completed')).toBe(false)
    expect(isExecutionOpen('Cancelled')).toBe(false)
    expect(isExecutionOpen('Failed')).toBe(false)
  })
})

describe('DoorOrder FSM (portál: submit/revert; elérhetetlen mellékállapotok)', () => {
  it('submit: Draft→Submitted; revert: CalculationFailed|Calculated→Draft', () => {
    expect(canTransition(DOOR_ORDER_FSM, 'submit', 'Draft')).toBe(true)
    expect(canTransition(DOOR_ORDER_FSM, 'revert', 'CalculationFailed')).toBe(true)
    expect(canTransition(DOOR_ORDER_FSM, 'revert', 'Calculated')).toBe(true)
  })

  it('tiltott átmenetek', () => {
    expect(canTransition(DOOR_ORDER_FSM, 'submit', 'Submitted')).toBe(false)
    expect(canTransition(DOOR_ORDER_FSM, 'revert', 'Draft')).toBe(false)
    expect(canTransition(DOOR_ORDER_FSM, 'submit', 'InProduction')).toBe(false)
  })

  it('submitItemsBlockReason: üres tétellista blokkol', () => {
    expect(submitItemsBlockReason(0)).toBeDefined()
    expect(submitItemsBlockReason(3)).toBeUndefined()
  })

  it('isDoorOrderStatusUnreachable: InProduction/Completed/Cancelled elérhetetlen, a többi nem', () => {
    expect(isDoorOrderStatusUnreachable('InProduction')).toBe(true)
    expect(isDoorOrderStatusUnreachable('Completed')).toBe(true)
    expect(isDoorOrderStatusUnreachable('Cancelled')).toBe(true)
    expect(isDoorOrderStatusUnreachable('Draft')).toBe(false)
    expect(isDoorOrderStatusUnreachable('Calculated')).toBe(false)
  })

  it('a portálról NEM hívható átmenetek (markCalculating stb.) is a táblában vannak, tükörként', () => {
    expect(canTransition(DOOR_ORDER_FSM, 'markCalculating', 'Submitted')).toBe(true)
    expect(canTransition(DOOR_ORDER_FSM, 'markCalculated', 'Calculating')).toBe(true)
  })
})

describe('CuttingQuoteRequest FSM (mag-csoport)', () => {
  it('approve/reject PendingReview-ból', () => {
    expect(canTransition(QUOTE_FSM, 'approve', 'PendingReview')).toBe(true)
    expect(canTransition(QUOTE_FSM, 'reject', 'PendingReview')).toBe(true)
  })

  it('tiltott átmenetek (terminális/már döntött állapotból)', () => {
    expect(canTransition(QUOTE_FSM, 'approve', 'Quoted')).toBe(false)
    expect(canTransition(QUOTE_FSM, 'reject', 'Rejected')).toBe(false)
    expect(canTransition(QUOTE_FSM, 'approve', 'ConvertedToOrder')).toBe(false)
  })

  it('isQuotePending: csak PendingReview', () => {
    expect(isQuotePending('PendingReview')).toBe(true)
    expect(isQuotePending('Quoted')).toBe(false)
  })
})
