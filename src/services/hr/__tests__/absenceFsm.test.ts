import { describe, it, expect } from 'vitest'
import {
  ABSENCE_FSM, ABSENCE_MAIN_PATH_STATUSES, ABSENCE_BLOCKING_STATUSES,
  isAbsenceBlocking, isAbsenceRequested,
  canTransition, transitionBlockReason,
  type AbsenceStatus,
} from '../fsm'
import { ABSENCE_STATUS_LABELS } from '../../../pages/hr/labels'

/**
 * Távollét-FSM unit tesztek — a tábla a backend AbsenceStatusTransitions
 * tükre; a guard-helperek a közös services/fsmGuards-ból jönnek.
 */

const ALL_STATUSES: AbsenceStatus[] = ['kert', 'jovahagyva', 'folyamatban', 'lezarva', 'elutasitva']

describe('ABSENCE_FSM átmenet-tábla', () => {
  it('a fő út: kert → jovahagyva → folyamatban → lezarva', () => {
    expect(canTransition(ABSENCE_FSM, 'approve', 'kert')).toBe(true)
    expect(ABSENCE_FSM.approve.to).toBe('jovahagyva')
    expect(canTransition(ABSENCE_FSM, 'start', 'jovahagyva')).toBe(true)
    expect(ABSENCE_FSM.start.to).toBe('folyamatban')
    expect(canTransition(ABSENCE_FSM, 'complete', 'folyamatban')).toBe(true)
    expect(ABSENCE_FSM.complete.to).toBe('lezarva')
    expect(ABSENCE_MAIN_PATH_STATUSES).toEqual(['kert', 'jovahagyva', 'folyamatban', 'lezarva'])
  })

  it('mellékág: kert → elutasitva, reopen: elutasitva → kert', () => {
    expect(canTransition(ABSENCE_FSM, 'reject', 'kert')).toBe(true)
    expect(ABSENCE_FSM.reject.to).toBe('elutasitva')
    expect(canTransition(ABSENCE_FSM, 'reopen', 'elutasitva')).toBe(true)
    expect(ABSENCE_FSM.reopen.to).toBe('kert')
  })

  it('a lezarva terminális: semmilyen akció nem indítható belőle', () => {
    for (const action of Object.keys(ABSENCE_FSM)) {
      expect(canTransition(ABSENCE_FSM, action, 'lezarva')).toBe(false)
    }
  })

  it('tiltott átmenetek: approve csak kert-ből, start csak jovahagyva-ból', () => {
    for (const s of ALL_STATUSES.filter((x) => x !== 'kert')) {
      expect(canTransition(ABSENCE_FSM, 'approve', s)).toBe(false)
      expect(canTransition(ABSENCE_FSM, 'reject', s)).toBe(false)
    }
    for (const s of ALL_STATUSES.filter((x) => x !== 'jovahagyva')) {
      expect(canTransition(ABSENCE_FSM, 'start', s)).toBe(false)
    }
  })

  it('transitionBlockReason: engedélyezettnél undefined, tiltottnál magyarázat a címkékkel', () => {
    expect(transitionBlockReason(ABSENCE_FSM, 'approve', 'kert', ABSENCE_STATUS_LABELS)).toBeUndefined()
    const reason = transitionBlockReason(ABSENCE_FSM, 'approve', 'lezarva', ABSENCE_STATUS_LABELS)
    expect(reason).toContain('„Kért"')
    expect(reason).toContain('„Lezárva"')
  })
})

describe('kapacitás-blokkoló guard (backend CapacityCalculationService tükör)', () => {
  it('jovahagyva/folyamatban/lezarva blokkol, kert/elutasitva nem', () => {
    expect(ABSENCE_BLOCKING_STATUSES).toEqual(['jovahagyva', 'folyamatban', 'lezarva'])
    expect(isAbsenceBlocking('jovahagyva')).toBe(true)
    expect(isAbsenceBlocking('folyamatban')).toBe(true)
    expect(isAbsenceBlocking('lezarva')).toBe(true)
    expect(isAbsenceBlocking('kert')).toBe(false)
    expect(isAbsenceBlocking('elutasitva')).toBe(false)
  })

  it('isAbsenceRequested: csak a kert számít nyitott kérelemnek', () => {
    expect(isAbsenceRequested('kert')).toBe(true)
    for (const s of ALL_STATUSES.filter((x) => x !== 'kert')) {
      expect(isAbsenceRequested(s)).toBe(false)
    }
  })
})
