import { describe, it, expect } from 'vitest'
import {
  WORK_ORDER_FSM, WORK_ORDER_MAIN_PATH_STATUSES, WORK_ORDER_OPEN_STATUSES,
  WORK_ORDER_ASSIGNABLE_STATUSES,
  isWorkOrderOpen, canAssignWorkOrder, assignBlockReason, startAssignmentBlockReason,
  canTransition, transitionBlockReason,
  type WorkOrderStatus,
} from '../fsm'
import { WO_STATUS_LABELS } from '../../pages/labels'

/**
 * Munkalap-FSM unit tesztek — a tábla a backend WorkOrder aggregátum tükre
 * (az aggregátum-guardok az irányadók, nem a megengedőbb
 * WorkOrderStatusTransitions tábla); a guard-helperek a közös
 * services/fsmGuards-ból jönnek.
 */

const ALL_STATUSES: WorkOrderStatus[] = [
  'bejelentve', 'utemezve', 'folyamatban', 'kesz', 'halasztva', 'elutasitva',
]

describe('WORK_ORDER_FSM átmenet-tábla', () => {
  it('a fő út: bejelentve → utemezve → folyamatban → kesz', () => {
    expect(canTransition(WORK_ORDER_FSM, 'schedule', 'bejelentve')).toBe(true)
    expect(WORK_ORDER_FSM.schedule.to).toBe('utemezve')
    expect(canTransition(WORK_ORDER_FSM, 'start', 'utemezve')).toBe(true)
    expect(WORK_ORDER_FSM.start.to).toBe('folyamatban')
    expect(canTransition(WORK_ORDER_FSM, 'complete', 'folyamatban')).toBe(true)
    expect(WORK_ORDER_FSM.complete.to).toBe('kesz')
    expect(WORK_ORDER_MAIN_PATH_STATUSES).toEqual(['bejelentve', 'utemezve', 'folyamatban', 'kesz'])
  })

  it('mellékágak: postpone (utemezve|folyamatban), reject (bejelentve|utemezve)', () => {
    expect(canTransition(WORK_ORDER_FSM, 'postpone', 'utemezve')).toBe(true)
    expect(canTransition(WORK_ORDER_FSM, 'postpone', 'folyamatban')).toBe(true)
    expect(canTransition(WORK_ORDER_FSM, 'postpone', 'bejelentve')).toBe(false)
    expect(WORK_ORDER_FSM.postpone.to).toBe('halasztva')

    expect(canTransition(WORK_ORDER_FSM, 'reject', 'bejelentve')).toBe(true)
    expect(canTransition(WORK_ORDER_FSM, 'reject', 'utemezve')).toBe(true)
    expect(canTransition(WORK_ORDER_FSM, 'reject', 'folyamatban')).toBe(false)
    expect(WORK_ORDER_FSM.reject.to).toBe('elutasitva')
  })

  it('reopen: halasztva|elutasitva → bejelentve', () => {
    expect(canTransition(WORK_ORDER_FSM, 'reopen', 'halasztva')).toBe(true)
    expect(canTransition(WORK_ORDER_FSM, 'reopen', 'elutasitva')).toBe(true)
    expect(WORK_ORDER_FSM.reopen.to).toBe('bejelentve')
    for (const s of ALL_STATUSES.filter((x) => x !== 'halasztva' && x !== 'elutasitva')) {
      expect(canTransition(WORK_ORDER_FSM, 'reopen', s)).toBe(false)
    }
  })

  it('a kesz terminális: semmilyen akció nem indítható belőle (backend IsTerminalState tükör)', () => {
    for (const action of Object.keys(WORK_ORDER_FSM)) {
      expect(canTransition(WORK_ORDER_FSM, action, 'kesz')).toBe(false)
    }
  })

  it('AGGREGÁTUM-tükör: a start bejelentve-ből TILTOTT (a StartWork() csak Scheduled-ből fut)', () => {
    // a backend WorkOrderStatusTransitions táblája engedné (Reported → InProgress),
    // de a WorkOrder.StartWork() aggregátum-metódus nem — az a szigorúbb, az az irányadó
    expect(canTransition(WORK_ORDER_FSM, 'start', 'bejelentve')).toBe(false)
  })

  it('transitionBlockReason: engedélyezettnél undefined, tiltottnál magyarázat a címkékkel', () => {
    expect(
      transitionBlockReason(WORK_ORDER_FSM, 'schedule', 'bejelentve', WO_STATUS_LABELS),
    ).toBeUndefined()
    const reason = transitionBlockReason(WORK_ORDER_FSM, 'complete', 'kesz', WO_STATUS_LABELS)
    expect(reason).toContain('„Folyamatban"')
    expect(reason).toContain('„Kész"')
  })
})

describe('nevesített guardok', () => {
  it('isWorkOrderOpen: bejelentve/utemezve/folyamatban nyitott, kesz/halasztva/elutasitva nem', () => {
    expect(WORK_ORDER_OPEN_STATUSES).toEqual(['bejelentve', 'utemezve', 'folyamatban'])
    expect(isWorkOrderOpen('bejelentve')).toBe(true)
    expect(isWorkOrderOpen('utemezve')).toBe(true)
    expect(isWorkOrderOpen('folyamatban')).toBe(true)
    expect(isWorkOrderOpen('kesz')).toBe(false)
    expect(isWorkOrderOpen('halasztva')).toBe(false)
    expect(isWorkOrderOpen('elutasitva')).toBe(false)
  })

  it('canAssignWorkOrder: csak bejelentve/utemezve (Assign* aggregátum-guard tükör)', () => {
    expect(WORK_ORDER_ASSIGNABLE_STATUSES).toEqual(['bejelentve', 'utemezve'])
    expect(canAssignWorkOrder('bejelentve')).toBe(true)
    expect(canAssignWorkOrder('utemezve')).toBe(true)
    for (const s of ALL_STATUSES.filter((x) => x !== 'bejelentve' && x !== 'utemezve')) {
      expect(canAssignWorkOrder(s)).toBe(false)
    }
    expect(assignBlockReason('bejelentve', WO_STATUS_LABELS)).toBeUndefined()
    expect(assignBlockReason('folyamatban', WO_STATUS_LABELS)).toContain('„Folyamatban"')
  })

  it('startAssignmentBlockReason: felelős nélkül indoklás, felelőssel undefined (StartWork-guard)', () => {
    expect(startAssignmentBlockReason(null)).toContain('felelőst kell hozzárendelni')
    expect(startAssignmentBlockReason('Horváth Péter')).toBeUndefined()
  })
})
