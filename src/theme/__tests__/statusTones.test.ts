/**
 * STATUS_TONES / FSM_TONES teljességi tesztek (F1-A / DESIGN_SYSTEM_SPEC_V1 1.4–1.5).
 *
 * Garancia: a 7 tónus mindegyike light+dark stílust ad, és a 7 platform-modul
 * MINDEN valós (a mock-rétegben definiált) FSM-státusza tónusra oldódik fel —
 * dev-warning nélkül.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { STATUS_TONES, LEGACY_STATUS_TONES, isTone, resolveLegacyTone, type Tone } from '../statusTones'
import { FSM_TONES, FSM_STATUS_ALIASES, FSM_EXTRA_TONES, resolveFsmTone, type FsmSet } from '../fsmTones'
import { LEAD_STATUS_LABELS, OPP_STATUS_LABELS } from '../../modules/crm/pages/labels'
import { ABSENCE_STATUS_LABELS } from '../../modules/hr/pages/labels'
import { TICKET_STATUS_META } from '../../mocks/maintenance'
import { NCR_STATUS_META } from '../../mocks/quality'
import { INCIDENT_STATUS_META } from '../../mocks/ehs'
import { DOC_STATUS_META } from '../../mocks/docs'
import { PROJECT_STATUS_LABELS } from '../../modules/controlling/pages/labels'

const ALL_TONES: Tone[] = ['neutral', 'info', 'progress', 'success', 'warn', 'danger', 'terminal']

let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  warnSpy.mockRestore()
})

describe('STATUS_TONES', () => {
  it('pontosan a 7 szemantikus tónust tartalmazza', () => {
    expect(Object.keys(STATUS_TONES).sort()).toEqual([...ALL_TONES].sort())
  })

  it.each(ALL_TONES)('a(z) %s tónus bg/fg/dot stílusa light ÉS dark variánst ad', (tone) => {
    const t = STATUS_TONES[tone]
    for (const cls of [t.bg, t.fg, t.dot]) {
      expect(cls).toBeTruthy()
      expect(cls).toContain('dark:')
    }
  })

  it('a terminal tónus dot-ja üreges (border-alapú forma-jelzés)', () => {
    expect(STATUS_TONES.terminal.dot).toContain('bg-transparent')
    expect(STATUS_TONES.terminal.dot).toContain('border')
  })

  it('a danger tónus rose (elválik az EHS red világ-akcenttől)', () => {
    expect(STATUS_TONES.danger.bg).toContain('rose')
  })
})

describe('FSM_TONES — készletek és értékek', () => {
  it('mind a 10 FSM státusz-készlet definiált (8 terv-készlet + 2 EHS backend-készlet)', () => {
    expect(Object.keys(FSM_TONES).sort()).toEqual([
      'crmLead', 'crmOpportunity', 'dmsDokumentum', 'ehsBaleset',
      'ehsBejaras', 'ehsPpeKiadas',
      'hrTavollet', 'kontrollingProjekt', 'maintenanceMunkalap', 'qaEllenorzes',
    ])
  })

  it('minden FSM-státusz érvényes tónusra mutat', () => {
    for (const [set, statuses] of Object.entries(FSM_TONES)) {
      for (const [status, tone] of Object.entries(statuses)) {
        expect(isTone(tone), `${set}.${status} -> ${tone}`).toBe(true)
      }
    }
  })

  it('minden alias létező kanonikus kulcsra, minden extra érvényes tónusra mutat', () => {
    for (const [set, aliases] of Object.entries(FSM_STATUS_ALIASES)) {
      for (const [alias, canonical] of Object.entries(aliases ?? {})) {
        expect(
          (FSM_TONES[set as FsmSet] as Record<string, Tone>)[canonical],
          `${set}: ${alias} -> ${canonical}`,
        ).toBeDefined()
      }
    }
    for (const extras of Object.values(FSM_EXTRA_TONES)) {
      for (const tone of Object.values(extras ?? {})) {
        expect(isTone(tone)).toBe(true)
      }
    }
  })
})

describe('FSM_TONES — a portál valós státusz-készleteinek teljes lefedése', () => {
  // (FSM-készlet, a portál mock-rétegében definiált státusz-kulcsok) párok
  const cases: Array<[FsmSet, string[]]> = [
    ['crmLead', Object.keys(LEAD_STATUS_LABELS)],
    ['crmOpportunity', Object.keys(OPP_STATUS_LABELS)],
    ['hrTavollet', Object.keys(ABSENCE_STATUS_LABELS)],
    ['maintenanceMunkalap', Object.keys(TICKET_STATUS_META)],
    ['qaEllenorzes', Object.keys(NCR_STATUS_META)],
    ['ehsBaleset', Object.keys(INCIDENT_STATUS_META)],
    ['dmsDokumentum', Object.keys(DOC_STATUS_META)],
    ['kontrollingProjekt', Object.keys(PROJECT_STATUS_LABELS)],
  ]

  it.each(cases)('%s: minden státusz tónusra oldódik, warning nélkül', (set, statuses) => {
    expect(statuses.length).toBeGreaterThan(0)
    for (const status of statuses) {
      const tone = resolveFsmTone(set, status)
      expect(isTone(tone), `${set}.${status}`).toBe(true)
    }
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('szúrópróbák a spec 1.5 szerint (alias-feloldással együtt)', () => {
    expect(resolveFsmTone('ehsBaleset', 'bejelentve')).toBe('danger')
    expect(resolveFsmTone('ehsBaleset', 'reported')).toBe('danger')      // alias
    expect(resolveFsmTone('maintenanceMunkalap', 'in_progress')).toBe('progress') // alias
    expect(resolveFsmTone('qaEllenorzes', 'rejected')).toBe('terminal')  // extra
    expect(resolveFsmTone('hrTavollet', 'kert')).toBe('warn')
    expect(resolveFsmTone('kontrollingProjekt', 'on_hold')).toBe('warn')
    expect(resolveFsmTone('dmsDokumentum', 'archivalt')).toBe('terminal')
  })

  it('ismeretlen státusz → neutral + dev-warning', () => {
    expect(resolveFsmTone('crmLead', 'nem-letezik')).toBe('neutral')
    expect(warnSpy).toHaveBeenCalledOnce()
  })
})

describe('legacy státusz-kulcsok (régi StatusPill API kompatibilitás)', () => {
  it('minden legacy kulcs érvényes tónusra mutat', () => {
    for (const [key, tone] of Object.entries(LEGACY_STATUS_TONES)) {
      expect(isTone(tone), `${key} -> ${tone}`).toBe(true)
    }
  })

  it('a régi kulcsok a várt tónusra oldódnak', () => {
    expect(resolveLegacyTone('running')).toBe('progress')
    expect(resolveLegacyTone('ok')).toBe('success')
    expect(resolveLegacyTone('critical')).toBe('danger')
    expect(resolveLegacyTone('draft')).toBe('neutral')
  })

  it('közvetlen tónus-név átmegy, ismeretlen kulcs → neutral + warning', () => {
    expect(resolveLegacyTone('success')).toBe('success')
    expect(warnSpy).not.toHaveBeenCalled()
    expect(resolveLegacyTone('whatever')).toBe('neutral')
    expect(warnSpy).toHaveBeenCalledOnce()
  })
})
