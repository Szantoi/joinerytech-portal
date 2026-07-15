import { describe, it, expect } from 'vitest'
import {
  TICKET_FSM, TICKET_MAIN_PATH_STATUSES, TICKET_OPEN_STATUSES, TICKET_PRIORITY_RANK,
  isTicketOpen, resolveActionsBlockReason,
  escalateStatusBlockReason, escalatePriorityBlockReason,
  canTransition, transitionBlockReason,
  type TicketPriority, type TicketStatus,
} from '../fsm'
import { TICKET_PRIORITY_META, TICKET_STATUS_LABELS } from '../../../pages/qa/labels'

/**
 * Hibajegy-FSM unit tesztek — a tábla a backend Ticket aggregátum +
 * TicketStatusTransitions tükre (Assign/Start/Resolve/Reject/Reopen; a
 * Resolved terminális); az eszkaláció-guardok az EscalatePriority() tükrei.
 */

const ALL_STATUSES: TicketStatus[] = [
  'bejelentve', 'kiosztva', 'folyamatban', 'megoldva', 'elutasitva',
]

const PRIORITY_LABELS = Object.fromEntries(
  (Object.keys(TICKET_PRIORITY_META) as TicketPriority[])
    .map((p) => [p, TICKET_PRIORITY_META[p].label]),
) as Record<TicketPriority, string>

describe('TICKET_FSM átmenet-tábla', () => {
  it('a fő út: bejelentve → kiosztva → folyamatban → megoldva', () => {
    expect(canTransition(TICKET_FSM, 'assign', 'bejelentve')).toBe(true)
    expect(TICKET_FSM.assign.to).toBe('kiosztva')
    expect(canTransition(TICKET_FSM, 'start', 'kiosztva')).toBe(true)
    expect(TICKET_FSM.start.to).toBe('folyamatban')
    expect(canTransition(TICKET_FSM, 'resolve', 'folyamatban')).toBe(true)
    expect(TICKET_FSM.resolve.to).toBe('megoldva')
    expect(TICKET_MAIN_PATH_STATUSES).toEqual(['bejelentve', 'kiosztva', 'folyamatban', 'megoldva'])
  })

  it('reject csak folyamatban-ból megy (a bejelentve/kiosztva NEM utasítható el — tábla-tükör)', () => {
    expect(canTransition(TICKET_FSM, 'reject', 'folyamatban')).toBe(true)
    expect(TICKET_FSM.reject.to).toBe('elutasitva')
    expect(canTransition(TICKET_FSM, 'reject', 'bejelentve')).toBe(false)
    expect(canTransition(TICKET_FSM, 'reject', 'kiosztva')).toBe(false)
  })

  it('reopen: csak elutasitva → bejelentve', () => {
    expect(canTransition(TICKET_FSM, 'reopen', 'elutasitva')).toBe(true)
    expect(TICKET_FSM.reopen.to).toBe('bejelentve')
    for (const s of ALL_STATUSES.filter((x) => x !== 'elutasitva')) {
      expect(canTransition(TICKET_FSM, 'reopen', s)).toBe(false)
    }
  })

  it('a megoldva terminális: semmilyen akció nem indítható belőle (IsTerminalState tükör)', () => {
    for (const action of Object.keys(TICKET_FSM)) {
      expect(canTransition(TICKET_FSM, action, 'megoldva')).toBe(false)
    }
  })

  it('nincs státusz-ugrás: bejelentve-ből nem indítható/oldható meg közvetlenül', () => {
    expect(canTransition(TICKET_FSM, 'start', 'bejelentve')).toBe(false)
    expect(canTransition(TICKET_FSM, 'resolve', 'bejelentve')).toBe(false)
    expect(canTransition(TICKET_FSM, 'resolve', 'kiosztva')).toBe(false)
  })

  it('transitionBlockReason: tiltottnál magyarázat a látható címkékkel', () => {
    expect(
      transitionBlockReason(TICKET_FSM, 'assign', 'bejelentve', TICKET_STATUS_LABELS),
    ).toBeUndefined()
    const reason = transitionBlockReason(TICKET_FSM, 'resolve', 'megoldva', TICKET_STATUS_LABELS)
    expect(reason).toContain('„Folyamatban"')
    expect(reason).toContain('„Megoldva"')
  })
})

describe('nevesített guardok', () => {
  it('isTicketOpen: bejelentve/kiosztva/folyamatban nyitott, megoldva/elutasitva nem', () => {
    expect(TICKET_OPEN_STATUSES).toEqual(['bejelentve', 'kiosztva', 'folyamatban'])
    expect(isTicketOpen('bejelentve')).toBe(true)
    expect(isTicketOpen('kiosztva')).toBe(true)
    expect(isTicketOpen('folyamatban')).toBe(true)
    expect(isTicketOpen('megoldva')).toBe(false)
    expect(isTicketOpen('elutasitva')).toBe(false)
  })

  it('resolveActionsBlockReason: 0 intézkedésnél indoklás, 1+-nál undefined (Resolve-guard)', () => {
    expect(resolveActionsBlockReason(0)).toContain('legalább egy intézkedés')
    expect(resolveActionsBlockReason(2)).toBeUndefined()
  })

  it('eszkaláció: terminálison tiltott; csak SZIGORÚAN magasabb rangra (EscalatePriority tükör)', () => {
    expect(TICKET_PRIORITY_RANK.alacsony).toBeLessThan(TICKET_PRIORITY_RANK.kritikus)

    expect(escalateStatusBlockReason('megoldva')).toContain('nem eszkalálható')
    expect(escalateStatusBlockReason('folyamatban')).toBeUndefined()
    expect(escalateStatusBlockReason('elutasitva')).toBeUndefined()

    expect(escalatePriorityBlockReason('kozepes', 'magas', PRIORITY_LABELS)).toBeUndefined()
    expect(escalatePriorityBlockReason('magas', 'magas', PRIORITY_LABELS)).toContain('magasabbnak')
    expect(escalatePriorityBlockReason('magas', 'alacsony', PRIORITY_LABELS)).toContain('magasabbnak')
  })
})
