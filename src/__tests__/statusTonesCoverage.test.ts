/**
 * STATUS_TONES / FSM_TONES teljességi tesztek — APP-oldali integrációs teszt (a portal-ui nem függhet modul-csomagoktól, ezért él itt) (F1-A / DESIGN_SYSTEM_SPEC_V1 1.4–1.5).
 *
 * Garancia: a 7 tónus mindegyike light+dark stílust ad, és a 7 platform-modul
 * MINDEN valós (a mock-rétegben definiált) FSM-státusza tónusra oldódik fel —
 * dev-warning nélkül.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  STATUS_TONES, isTone, resolveLegacyTone, type Tone,
  FSM_TONES, FSM_STATUS_ALIASES, resolveFsmTone, type FsmSet,
} from '@spaceos/portal-ui'
import { LEAD_STATUS_LABELS, OPP_STATUS_LABELS } from '@spaceos/module-crm'
import { ABSENCE_STATUS_LABELS } from '@spaceos/module-hr'
import { WO_STATUS_LABELS } from '@spaceos/module-maintenance'
import { INCIDENT_STATUS_LABELS, RISK_STATUS_LABELS } from '@spaceos/module-ehs'
import { DOCUMENT_STATUS_LABELS } from '@spaceos/module-dms'
import { PROJECT_STATUS_LABELS } from '@spaceos/module-controlling'
import { INSPECTION_STATUS_LABELS } from '@spaceos/module-qa'

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
      expect(cls).toContain('dark:')
    }
  })

  it('ismeretlen tónusra fallbackel és warningol', () => {
    expect(isTone('foo')).toBe(false)
    expect(resolveLegacyTone('foo')).toBe('neutral')
    expect(warnSpy).toHaveBeenCalled()
  })
})

describe('FSM_TONES', () => {
  it('mind a 7 FSM-készlet definiálva van', () => {
    const expectedSets: FsmSet[] = [
      'crmLead', 'crmOpportunity', 'kontrollingProjekt', 'hrTavollet',
      'maintenanceMunkalap', 'qaEllenorzes', 'ehsBaleset',
    ]
    for (const setKey of expectedSets) {
      expect(FSM_TONES[setKey]).toBeDefined()
    }
  })

  it('CRM statusok (lead + opp) mind tónusra képezhetők', () => {
    for (const status of Object.keys(LEAD_STATUS_LABELS)) {
      expect(isTone(resolveFsmTone('crmLead', status))).toBe(true)
    }
    for (const status of Object.keys(OPP_STATUS_LABELS)) {
      expect(isTone(resolveFsmTone('crmOpportunity', status))).toBe(true)
    }
  })

  it('HR hiányzások mind tónusra képezhetők', () => {
    for (const status of Object.keys(ABSENCE_STATUS_LABELS)) {
      expect(isTone(resolveFsmTone('hrTavollet', status))).toBe(true)
    }
  })

  it('Maintenance hibajegyek mind tónusra képezhetők', () => {
    for (const status of Object.keys(WO_STATUS_LABELS)) {
      expect(isTone(resolveFsmTone('maintenanceMunkalap', status))).toBe(true)
    }
  })

  it('QA NCR-ek mind tónusra képezhetők', () => {
    for (const status of Object.keys(INSPECTION_STATUS_LABELS)) {
      expect(isTone(resolveFsmTone('qaEllenorzes', status))).toBe(true)
    }
  })

  it('EHS incidensek ÉS kockázatok mind tónusra képezhetők', () => {
    for (const status of Object.keys(INCIDENT_STATUS_LABELS)) {
      expect(isTone(resolveFsmTone('ehsBaleset', status))).toBe(true)
    }
    for (const status of Object.keys(RISK_STATUS_LABELS)) {
      expect(isTone(resolveFsmTone('ehsBaleset', status))).toBe(true)
    }
  })

  it('DMS dokumentumok mind tónusra képezhetők (fsmAliases használatával)', () => {
    for (const status of Object.keys(DOCUMENT_STATUS_LABELS)) {
      const alias = (FSM_STATUS_ALIASES as Record<string, string>)[status] ?? status
      expect(isTone(resolveFsmTone('qaEllenorzes', alias))).toBe(true)
    }
  })

  it('Kontrolling projektek mind tónusra képezhetők', () => {
    for (const status of Object.keys(PROJECT_STATUS_LABELS)) {
      expect(isTone(resolveFsmTone('kontrollingProjekt', status))).toBe(true)
    }
  })

  it('FSM feloldás dev-warningot NEM dob érvényes státuszra', () => {
    resolveFsmTone('crmLead', 'uj')
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
