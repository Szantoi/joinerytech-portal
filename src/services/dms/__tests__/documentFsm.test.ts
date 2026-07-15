import { describe, it, expect } from 'vitest'
import {
  DOCUMENT_FSM, DOCUMENT_MAIN_PATH_STATUSES, DOCUMENT_WORKFLOW_OPEN_STATUSES,
  isDocumentInReview, isDocumentWorkflowOpen,
  rejectReasonBlockReason, uploadVersionBlockReason, versionFieldsBlockReason,
  canTransition, transitionBlockReason,
  type DocumentStatus,
} from '../fsm'
import { DOCUMENT_STATUS_LABELS } from '../../../pages/dms/labels'

/**
 * Dokumentum-FSM unit tesztek — a tábla a prototípus DOC_FLOW tükre
 * (piszkozat → ellenorzes → kiadott → archivalt + visszautasítás-ág);
 * a guard-helperek a közös services/fsmGuards-ból.
 */

const ALL_STATUSES: DocumentStatus[] = ['piszkozat', 'ellenorzes', 'kiadott', 'archivalt']

describe('DOCUMENT_FSM átmenet-tábla', () => {
  it('a jóváhagyási fő út: piszkozat → ellenorzes → kiadott', () => {
    expect(canTransition(DOCUMENT_FSM, 'submit', 'piszkozat')).toBe(true)
    expect(DOCUMENT_FSM.submit.to).toBe('ellenorzes')
    expect(canTransition(DOCUMENT_FSM, 'approve', 'ellenorzes')).toBe(true)
    expect(DOCUMENT_FSM.approve.to).toBe('kiadott')
    expect(DOCUMENT_MAIN_PATH_STATUSES).toEqual(['piszkozat', 'ellenorzes', 'kiadott'])
  })

  it('visszautasítás-ág: reject csak ellenorzes-ből, vissza piszkozatba', () => {
    expect(canTransition(DOCUMENT_FSM, 'reject', 'ellenorzes')).toBe(true)
    expect(DOCUMENT_FSM.reject.to).toBe('piszkozat')
    for (const s of ALL_STATUSES.filter((x) => x !== 'ellenorzes')) {
      expect(canTransition(DOCUMENT_FSM, 'reject', s)).toBe(false)
    }
  })

  it('felülvizsgálat (recall): csak kiadott-ból, vissza ellenőrzésre', () => {
    expect(canTransition(DOCUMENT_FSM, 'recall', 'kiadott')).toBe(true)
    expect(DOCUMENT_FSM.recall.to).toBe('ellenorzes')
    expect(canTransition(DOCUMENT_FSM, 'recall', 'piszkozat')).toBe(false)
  })

  it('archiválás: piszkozat és kiadott állapotból igen, ellenőrzés ALATT nem (előbb döntés kell)', () => {
    expect(canTransition(DOCUMENT_FSM, 'archive', 'piszkozat')).toBe(true)
    expect(canTransition(DOCUMENT_FSM, 'archive', 'kiadott')).toBe(true)
    expect(canTransition(DOCUMENT_FSM, 'archive', 'ellenorzes')).toBe(false)
    expect(canTransition(DOCUMENT_FSM, 'archive', 'archivalt')).toBe(false)
  })

  it('újranyitás: archivalt-ból CSAK a reopen indítható (munkapéldányként piszkozatba)', () => {
    expect(canTransition(DOCUMENT_FSM, 'reopen', 'archivalt')).toBe(true)
    expect(DOCUMENT_FSM.reopen.to).toBe('piszkozat')
    for (const action of Object.keys(DOCUMENT_FSM).filter((a) => a !== 'reopen')) {
      expect(canTransition(DOCUMENT_FSM, action, 'archivalt')).toBe(false)
    }
  })

  it('piszkozatból nem adható ki közvetlenül (előbb ellenőrzés kell — jóváhagyás-kapu)', () => {
    expect(canTransition(DOCUMENT_FSM, 'approve', 'piszkozat')).toBe(false)
  })

  it('transitionBlockReason: engedélyezettnél undefined, tiltottnál magyarázat a címkékkel', () => {
    expect(
      transitionBlockReason(DOCUMENT_FSM, 'submit', 'piszkozat', DOCUMENT_STATUS_LABELS),
    ).toBeUndefined()
    const reason = transitionBlockReason(DOCUMENT_FSM, 'approve', 'kiadott', DOCUMENT_STATUS_LABELS)
    expect(reason).toContain('„Ellenőrzés"')
    expect(reason).toContain('„Kiadott"')
  })
})

describe('nevesített guardok', () => {
  it('isDocumentWorkflowOpen: piszkozat/ellenorzes munkában, kiadott/archivalt nem', () => {
    expect(DOCUMENT_WORKFLOW_OPEN_STATUSES).toEqual(['piszkozat', 'ellenorzes'])
    for (const s of ALL_STATUSES) {
      expect(isDocumentWorkflowOpen(s)).toBe(s === 'piszkozat' || s === 'ellenorzes')
    }
  })

  it('isDocumentInReview: pontosan az ellenorzes státusz (dashboard KPI guardja)', () => {
    for (const s of ALL_STATUSES) {
      expect(isDocumentInReview(s)).toBe(s === 'ellenorzes')
    }
  })

  it('uploadVersionBlockReason: archiváltnál indoklás, egyébként undefined (AddVersion-tükör)', () => {
    expect(uploadVersionBlockReason('archivalt')).toContain('Archivált')
    expect(uploadVersionBlockReason('piszkozat')).toBeUndefined()
    expect(uploadVersionBlockReason('ellenorzes')).toBeUndefined()
    expect(uploadVersionBlockReason('kiadott')).toBeUndefined()
  })

  it('rejectReasonBlockReason: üres indoknál indoklás, kitöltöttnél undefined', () => {
    expect(rejectReasonBlockReason('')).toContain('kötelező az indok')
    expect(rejectReasonBlockReason('   ')).toContain('kötelező az indok')
    expect(rejectReasonBlockReason('Pánt-furat raszter hibás')).toBeUndefined()
  })

  it('versionFieldsBlockReason: fájl-címke, majd változás-jegyzet kötelező', () => {
    expect(versionFieldsBlockReason('', '')).toContain('fájl-címké')
    expect(versionFieldsBlockReason('rajz-v2.pdf', '')).toContain('változás-jegyzet')
    expect(versionFieldsBlockReason('rajz-v2.pdf', 'Raszter javítva')).toBeUndefined()
  })
})
