import { describe, it, expect } from 'vitest'
import {
  INSPECTION_FSM, INSPECTION_MAIN_PATH_STATUSES, INSPECTION_OPEN_STATUSES,
  INSPECTION_DONE_STATUSES,
  isInspectionOpen, isInspectionDone, failNotesBlockReason,
  canTransition, transitionBlockReason,
  type InspectionStatus,
} from '../fsm'
import { INSPECTION_STATUS_LABELS } from '../../pages/labels'

/**
 * Átvizsgálás-FSM unit tesztek — a tábla a backend Inspection aggregátum
 * tükre (Start/CompleteWithPass/CompleteWithFail; a Completed terminális,
 * immutable audit-trail); a guard-helperek a közös services/fsmGuards-ból.
 */

const ALL_STATUSES: InspectionStatus[] = ['nyitott', 'folyamatban', 'megfelelt', 'selejt']

describe('INSPECTION_FSM átmenet-tábla', () => {
  it('a fő út: nyitott → folyamatban → megfelelt', () => {
    expect(canTransition(INSPECTION_FSM, 'start', 'nyitott')).toBe(true)
    expect(INSPECTION_FSM.start.to).toBe('folyamatban')
    expect(canTransition(INSPECTION_FSM, 'pass', 'folyamatban')).toBe(true)
    expect(INSPECTION_FSM.pass.to).toBe('megfelelt')
    expect(INSPECTION_MAIN_PATH_STATUSES).toEqual(['nyitott', 'folyamatban', 'megfelelt'])
  })

  it('selejt-ág: fail csak folyamatban-ból indítható', () => {
    expect(canTransition(INSPECTION_FSM, 'fail', 'folyamatban')).toBe(true)
    expect(INSPECTION_FSM.fail.to).toBe('selejt')
    expect(canTransition(INSPECTION_FSM, 'fail', 'nyitott')).toBe(false)
  })

  it('a megfelelt ÉS a selejt terminális — nincs rework-átmenet (backend-tükör, a spec javitasra-ága dokumentált gap)', () => {
    for (const action of Object.keys(INSPECTION_FSM)) {
      expect(canTransition(INSPECTION_FSM, action, 'megfelelt')).toBe(false)
      expect(canTransition(INSPECTION_FSM, action, 'selejt')).toBe(false)
    }
  })

  it('nyitott-ból nem zárható le közvetlenül (előbb Start kell — aggregátum-tükör)', () => {
    expect(canTransition(INSPECTION_FSM, 'pass', 'nyitott')).toBe(false)
    expect(canTransition(INSPECTION_FSM, 'fail', 'nyitott')).toBe(false)
  })

  it('transitionBlockReason: engedélyezettnél undefined, tiltottnál magyarázat a címkékkel', () => {
    expect(
      transitionBlockReason(INSPECTION_FSM, 'start', 'nyitott', INSPECTION_STATUS_LABELS),
    ).toBeUndefined()
    const reason = transitionBlockReason(INSPECTION_FSM, 'pass', 'megfelelt', INSPECTION_STATUS_LABELS)
    expect(reason).toContain('„Folyamatban"')
    expect(reason).toContain('„Megfelelt"')
  })
})

describe('nevesített guardok', () => {
  it('isInspectionOpen: nyitott/folyamatban nyitott, megfelelt/selejt nem', () => {
    expect(INSPECTION_OPEN_STATUSES).toEqual(['nyitott', 'folyamatban'])
    expect(isInspectionOpen('nyitott')).toBe(true)
    expect(isInspectionOpen('folyamatban')).toBe(true)
    expect(isInspectionOpen('megfelelt')).toBe(false)
    expect(isInspectionOpen('selejt')).toBe(false)
  })

  it('isInspectionDone: pontosan a terminális állapotok (átvizsgálási arány guardja)', () => {
    expect(INSPECTION_DONE_STATUSES).toEqual(['megfelelt', 'selejt'])
    for (const s of ALL_STATUSES) {
      expect(isInspectionDone(s)).toBe(s === 'megfelelt' || s === 'selejt')
    }
  })

  it('failNotesBlockReason: 0 hibajegyzetnél indoklás, 1+-nál undefined (CompleteWithFail-guard)', () => {
    expect(failNotesBlockReason(0)).toContain('legalább egy hibajegyzet')
    expect(failNotesBlockReason(1)).toBeUndefined()
    expect(failNotesBlockReason(3)).toBeUndefined()
  })
})
