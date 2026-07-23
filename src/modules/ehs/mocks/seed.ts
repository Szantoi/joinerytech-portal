import type { EhsLocation } from '../services/locations'
import type { Incident } from '../services/incidents'
import type { Capa } from '../services/capa'
import type { PpeItem } from '../services/ppe'
import type { RiskAssessment, RiskLikelihood, RiskSeverity } from '../services/riskAssessments'
import type { RiskStatus } from '../services/fsm'
import { EHS_EMPLOYEE_DIRECTORY } from '../services/employees'
import type { MaterialRecord, PpeIssuanceRecord, WalkRecord } from './db'
import { calculateMockRisk } from './riskMatrix'

/**
 * EHS mock seed — determinisztikus fixture-ök, a dátumok a "most"-hoz képest
 * relatívak, így az SDS/EVE érvényesség-számítás (Valid/Expiring/Expired)
 * minden futásnál ugyanazt az állapotot adja.
 */

export const TENANT_ID = '11111111-1111-4111-8111-111111111111'

const emp = (i: number) => EHS_EMPLOYEE_DIRECTORY[i].id

/** Napokkal eltolt ISO időbélyeg (negatív = múlt). */
export function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

/** Stabil azonosítók — a tesztek is ezekre hivatkoznak. */
export const SEED_IDS = {
  locSite: '00000000-0000-4000-8000-0000000a0001',
  locHallA: '00000000-0000-4000-8000-0000000a0002',
  locHallB: '00000000-0000-4000-8000-0000000a0003',
  locHallC: '00000000-0000-4000-8000-0000000a0004',
  locWarehouse: '00000000-0000-4000-8000-0000000a0005',
  locYard: '00000000-0000-4000-8000-0000000a0006',
  locInactive: '00000000-0000-4000-8000-0000000a0007',

  incReported: '00000000-0000-4000-8000-0000000b0004',
  incInvestigated: '00000000-0000-4000-8000-0000000b0002',
  incActionPlanned: '00000000-0000-4000-8000-0000000b0001',
  incClosed: '00000000-0000-4000-8000-0000000b0003',

  matValid: '00000000-0000-4000-8000-0000000c0001',
  matExpiring: '00000000-0000-4000-8000-0000000c0002',
  matExpired: '00000000-0000-4000-8000-0000000c0003',
  matArchived: '00000000-0000-4000-8000-0000000c0004',

  ppeGlasses: '00000000-0000-4000-8000-0000000d0001',
  ppeEarmuff: '00000000-0000-4000-8000-0000000d0002',
  ppeGloves: '00000000-0000-4000-8000-0000000d0003',
  ppeMask: '00000000-0000-4000-8000-0000000d0004',

  issIssued: '00000000-0000-4000-8000-0000000e1001',
  issAcknowledged: '00000000-0000-4000-8000-0000000e1002',
  issExpiring: '00000000-0000-4000-8000-0000000e1003',
  issExpired: '00000000-0000-4000-8000-0000000e1004',
  issReturned: '00000000-0000-4000-8000-0000000e1005',

  walkScheduled: '00000000-0000-4000-8000-0000000f0001',
  walkInProgress: '00000000-0000-4000-8000-0000000f0002',
  walkActionRequired: '00000000-0000-4000-8000-0000000f0003',
  walkClosed: '00000000-0000-4000-8000-0000000f0004',
  findingOpen: '00000000-0000-4000-8000-000000fa0001',

  capaIncidentOpen: '00000000-0000-4000-8000-00000000ca01',
  capaWalkOpen: '00000000-0000-4000-8000-00000000ca02',
  capaWalkDone: '00000000-0000-4000-8000-00000000ca03',
  capaIncidentDone: '00000000-0000-4000-8000-00000000ca04',
  capaRiskOpen: '00000000-0000-4000-8000-00000000ca05',
  riskWithCapa: '00000000-0000-4000-8000-0000000a1001',
  riskDraftLow: '00000000-0000-4000-8000-0000000a1002',
  riskReviewMedium: '00000000-0000-4000-8000-0000000a1003',
  riskApprovedCritical: '00000000-0000-4000-8000-0000000a1004',
  riskArchived: '00000000-0000-4000-8000-0000000a1005',
  riskDraftLowSecond: '00000000-0000-4000-8000-0000000a1006',
  riskControlWithCapa: '00000000-0000-4000-8000-0000000a2001',
} as const

const loc = (
  id: string, code: string, name: string, kind: EhsLocation['kind'],
  parent: string | null = SEED_IDS.locSite, isActive = true,
): EhsLocation => ({
  locationId: id, tenantId: TENANT_ID, code, name, kind,
  parentLocationId: parent, isActive, createdAt: daysFromNow(-365),
})

export function seedLocations(): EhsLocation[] {
  return [
    loc(SEED_IDS.locSite, 'VAC', 'Vác — főüzem', 'Site', null),
    loc(SEED_IDS.locHallA, 'VAC-A', 'A csarnok — szabászat', 'Hall'),
    loc(SEED_IDS.locHallB, 'VAC-B', 'B csarnok — megmunkálás', 'Hall'),
    loc(SEED_IDS.locHallC, 'VAC-C', 'C csarnok — felületkezelés', 'Hall'),
    loc(SEED_IDS.locWarehouse, 'VAC-R', 'Raktár', 'Building'),
    loc(SEED_IDS.locYard, 'VAC-U', 'Udvar', 'Outdoor'),
    loc(SEED_IDS.locInactive, 'VAC-X', 'Régi festőműhely', 'Zone', SEED_IDS.locHallC, false),
  ]
}

/** Incidensek — a correctiveActions listát a szerializáló a CAPA store-ból tölti. */
export function seedIncidents(): Omit<Incident, 'correctiveActions'>[] {
  return [
    {
      incidentId: SEED_IDS.incActionPlanned, tenantId: TENANT_ID, incidentType: 'Accident',
      incidentDate: daysFromNow(-12), location: 'Vác — főüzem / A csarnok',
      description: 'Kézsérülés a szabászati gépnél — a kezelő kézfeje megérintette a forgó alkatrészt.',
      severity: 3, status: 'CorrectiveActionPlanned', reportedBy: emp(0), reportedAt: daysFromNow(-12),
      investigatedBy: emp(4), investigatedAt: daysFromNow(-10),
      investigation: { findings: 'A biztonsági burkolat nem volt megfelelően rögzítve.', rootCause: 'Hiányzó rögzítőelem, elmaradt ellenőrzés.' },
      witnesses: [{ employeeId: emp(1), statement: 'Láttam, hogy a burkolat félre volt csúszva.' }],
    },
    {
      incidentId: SEED_IDS.incInvestigated, tenantId: TENANT_ID, incidentType: 'NearMiss',
      incidentDate: daysFromNow(-7), location: 'Vác — főüzem / Raktár',
      description: 'Anyagleesés a polcrendszerről — 25 kg-os tábla csúszott le, személyi sérülés nem történt.',
      severity: 4, status: 'Investigated', reportedBy: emp(1), reportedAt: daysFromNow(-7),
      investigatedBy: emp(4), investigatedAt: daysFromNow(-5),
      investigation: { findings: 'A polc rögzítése nem felel meg az előírásoknak.', rootCause: 'Túlterhelt polcszint.' },
    },
    {
      incidentId: SEED_IDS.incClosed, tenantId: TENANT_ID, incidentType: 'HazardousCondition',
      incidentDate: daysFromNow(-40), location: 'Vác — főüzem / C csarnok',
      description: 'Oldószer-kiömlés a felületkezelőben (kb. 0,5 liter) — azonnali takarítás megtörtént.',
      severity: 2, status: 'Closed', reportedBy: emp(2), reportedAt: daysFromNow(-40),
      investigatedBy: emp(4), investigatedAt: daysFromNow(-38), closedAt: daysFromNow(-20),
      investigation: { findings: 'A tárolóedény sérült volt.', rootCause: 'Elöregedett edényzet.' },
    },
    {
      incidentId: SEED_IDS.incReported, tenantId: TENANT_ID, incidentType: 'NearMiss',
      incidentDate: daysFromNow(-1), location: 'Vác — főüzem / Udvar',
      description: 'Targonca majdnem elütött egy gyalogost — fékezéssel sikerült megállni.',
      severity: 3, status: 'Reported', reportedBy: emp(3), reportedAt: daysFromNow(-1),
    },
  ]
}

/** Anyagok — sdsValidity SZÁMÍTOTT, itt csak a nyers dátumok élnek. */
export function seedMaterials(): MaterialRecord[] {
  const base = { tenantId: TENANT_ID, registeredAt: daysFromNow(-300) }
  return [
    { ...base, materialId: SEED_IDS.matValid, name: 'Nitro hígító', supplier: 'ChemTrade Kft.',
      casNumber: '64742-49-0', ghsHazardClasses: ['GHS02', 'GHS07'], storageLocationId: SEED_IDS.locHallC,
      quantityOnSite: 120, unit: 'l', sdsDocumentId: null,
      sdsIssuedAt: daysFromNow(-245), sdsExpiresAt: daysFromNow(120), status: 'Active' },
    { ...base, materialId: SEED_IDS.matExpiring, name: 'PU lakk 2K', supplier: 'Milesi Hungária',
      casNumber: null, ghsHazardClasses: ['GHS02', 'GHS08'], storageLocationId: SEED_IDS.locHallC,
      quantityOnSite: 60, unit: 'l', sdsDocumentId: null,
      sdsIssuedAt: daysFromNow(-351), sdsExpiresAt: daysFromNow(14), status: 'Active' },
    { ...base, materialId: SEED_IDS.matExpired, name: 'Ragasztó D3', supplier: 'Kleiberit',
      casNumber: null, ghsHazardClasses: ['GHS07'], storageLocationId: SEED_IDS.locHallA,
      quantityOnSite: 45, unit: 'kg', sdsDocumentId: null,
      sdsIssuedAt: daysFromNow(-375), sdsExpiresAt: daysFromNow(-10), status: 'Active' },
    { ...base, materialId: SEED_IDS.matArchived, name: 'Oldószeres tisztító (kivezetett)', supplier: 'ChemTrade Kft.',
      casNumber: null, ghsHazardClasses: ['GHS02'], storageLocationId: SEED_IDS.locWarehouse,
      quantityOnSite: 0, unit: 'l', sdsDocumentId: null,
      sdsIssuedAt: daysFromNow(-100), sdsExpiresAt: daysFromNow(200), status: 'Archived' },
  ]
}

export function seedPpeItems(): PpeItem[] {
  const base = { tenantId: TENANT_ID, isActive: true, createdAt: daysFromNow(-365) }
  return [
    { ...base, ppeItemId: SEED_IDS.ppeGlasses, name: 'Védőszemüveg', category: 'Eye', standardRef: 'EN 166', defaultLifetimeMonths: 24 },
    { ...base, ppeItemId: SEED_IDS.ppeEarmuff, name: 'Hallásvédő fültok', category: 'Hearing', standardRef: 'EN 352-1', defaultLifetimeMonths: 36 },
    { ...base, ppeItemId: SEED_IDS.ppeGloves, name: 'Vágásbiztos kesztyű', category: 'Hand', standardRef: 'EN 388', defaultLifetimeMonths: 6 },
    { ...base, ppeItemId: SEED_IDS.ppeMask, name: 'FFP2 porálarc', category: 'Respiratory', standardRef: 'EN 149', defaultLifetimeMonths: 1 },
  ]
}

/** Kiadások — isExpired SZÁMÍTOTT. */
export function seedPpeIssuances(): PpeIssuanceRecord[] {
  const base = { tenantId: TENANT_ID, issuedBy: emp(4), quantity: 1 }
  return [
    { ...base, issuanceId: SEED_IDS.issIssued, employeeId: emp(0), ppeItemId: SEED_IDS.ppeGloves,
      issuedAt: daysFromNow(-2), expiresAt: daysFromNow(180), status: 'Issued' },
    { ...base, issuanceId: SEED_IDS.issAcknowledged, employeeId: emp(1), ppeItemId: SEED_IDS.ppeGlasses,
      issuedAt: daysFromNow(-30), acknowledgedAt: daysFromNow(-30), expiresAt: daysFromNow(400), status: 'Acknowledged' },
    { ...base, issuanceId: SEED_IDS.issExpiring, employeeId: emp(2), ppeItemId: SEED_IDS.ppeEarmuff,
      issuedAt: daysFromNow(-100), acknowledgedAt: daysFromNow(-99), expiresAt: daysFromNow(10), status: 'Acknowledged' },
    { ...base, issuanceId: SEED_IDS.issExpired, employeeId: emp(3), ppeItemId: SEED_IDS.ppeMask,
      issuedAt: daysFromNow(-40), acknowledgedAt: daysFromNow(-39), expiresAt: daysFromNow(-5), status: 'Acknowledged' },
    { ...base, issuanceId: SEED_IDS.issReturned, employeeId: emp(0), ppeItemId: SEED_IDS.ppeGlasses,
      issuedAt: daysFromNow(-200), acknowledgedAt: daysFromNow(-199), returnedAt: daysFromNow(-20),
      expiresAt: daysFromNow(530), status: 'Returned' },
  ]
}

/** Bejárások — findingCount a lista-szerializálóban számított. */
export function seedWalks(): WalkRecord[] {
  const base = { tenantId: TENANT_ID, conductedBy: emp(4), participants: [emp(0)] }
  return [
    { ...base, safetyWalkId: SEED_IDS.walkScheduled, locationId: SEED_IDS.locHallA,
      scheduledDate: daysFromNow(3), status: 'Scheduled', findings: [] },
    { ...base, safetyWalkId: SEED_IDS.walkInProgress, locationId: SEED_IDS.locWarehouse,
      scheduledDate: daysFromNow(-1), startedAt: daysFromNow(-1), status: 'InProgress',
      findings: [{
        findingId: '00000000-0000-4000-8000-000000fa0002',
        description: 'Menekülőútvonal részben eltorlaszolva raklapokkal.',
        severity: 'Moderate', requiresAction: false, recordedAt: daysFromNow(-1),
      }] },
    { ...base, safetyWalkId: SEED_IDS.walkActionRequired, locationId: SEED_IDS.locHallC,
      scheduledDate: daysFromNow(-5), startedAt: daysFromNow(-5), completedAt: daysFromNow(-4),
      status: 'ActionRequired',
      findings: [{
        findingId: SEED_IDS.findingOpen,
        description: 'Szellőzőrendszer szűrője telítődött a felületkezelőben.',
        severity: 'Major', requiresAction: true, correctiveActionId: SEED_IDS.capaWalkOpen,
        recordedAt: daysFromNow(-4),
      }] },
    { ...base, safetyWalkId: SEED_IDS.walkClosed, locationId: SEED_IDS.locYard,
      scheduledDate: daysFromNow(-30), startedAt: daysFromNow(-30), completedAt: daysFromNow(-29),
      closedAt: daysFromNow(-10), status: 'Closed',
      findings: [{
        findingId: '00000000-0000-4000-8000-000000fa0003',
        description: 'Targonca-útvonal jelölés kopott az udvaron.',
        severity: 'Minor', requiresAction: true, correctiveActionId: SEED_IDS.capaWalkDone,
        recordedAt: daysFromNow(-29),
      }] },
  ]
}

function risk(
  riskAssessmentId: string,
  hazardDescription: string,
  locationId: string | null,
  severity: RiskSeverity,
  likelihood: RiskLikelihood,
  status: RiskStatus,
  assessedBy: string,
  assessedDaysAgo: number,
  reviewDueInDays: number,
): RiskAssessment {
  const calculated = calculateMockRisk(severity, likelihood)
  const assessedAt = daysFromNow(-assessedDaysAgo)
  return {
    riskAssessmentId,
    tenantId: TENANT_ID,
    hazardDescription,
    locationId,
    severity,
    likelihood,
    ...calculated,
    status,
    assessedBy,
    assessedAt,
    reviewDueDate: daysFromNow(reviewDueInDays),
    submittedAt: status === 'ellenorzes' || status === 'jovahagyva' || status === 'archivalt'
      ? daysFromNow(-7)
      : null,
    approvedAt: status === 'jovahagyva' || status === 'archivalt' ? daysFromNow(-5) : null,
    archivedAt: status === 'archivalt' ? daysFromNow(-1) : null,
    controlMeasures: [],
  }
}

/** 5×5 risk fixture: minden FSM-státusz és minden kockázati sáv jelen van. */
export function seedRisks(): RiskAssessment[] {
  const rows = [
    risk(
      SEED_IDS.riskDraftLow,
      'Kézi anyagmozgatás közbeni kisebb zúzódás veszélye.',
      SEED_IDS.locWarehouse,
      'enyhe',
      'valoszinutlen',
      'piszkozat',
      emp(0),
      2,
      45,
    ),
    risk(
      SEED_IDS.riskReviewMedium,
      'Faipari por tartós belégzése elszívási hiba esetén.',
      SEED_IDS.locHallB,
      'kozepes',
      'lehetseges',
      'ellenorzes',
      emp(1),
      8,
      20,
    ),
    risk(
      SEED_IDS.riskDraftLowSecond,
      'Gyalogos elcsúszás nedves kültéri burkolaton.',
      SEED_IDS.locYard,
      'enyhe',
      'valoszinutlen',
      'piszkozat',
      emp(3),
      1,
      60,
    ),
    risk(
      SEED_IDS.riskWithCapa,
      'Forgó gépalkatrész elérése hiányos védőburkolat mellett.',
      SEED_IDS.locHallA,
      'sulyos',
      'valoszinu',
      'jovahagyva',
      emp(4),
      15,
      12,
    ),
    risk(
      SEED_IDS.riskApprovedCritical,
      'Robbanásveszélyes oldószergőz felhalmozódása a felületkezelőben.',
      SEED_IDS.locHallC,
      'katasztrofalis',
      'szinte_biztos',
      'jovahagyva',
      emp(2),
      4,
      7,
    ),
    risk(
      SEED_IDS.riskArchived,
      'Korábbi, kivezetett kézi felületkezelési technológia.',
      null,
      'sulyos',
      'lehetseges',
      'archivalt',
      emp(3),
      120,
      30,
    ),
  ]

  const linked = rows.find((row) => row.riskAssessmentId === SEED_IDS.riskWithCapa)!
  linked.controlMeasures.push({
    riskControlId: SEED_IDS.riskControlWithCapa,
    controlMeasure: 'A védőburkolatok műszakonkénti ellenőrzése.',
    responsiblePerson: 'Munkavédelmi vezető',
    implementedAt: daysFromNow(-6),
    verifiedAt: null,
    isVerified: false,
    correctiveActionId: SEED_IDS.capaRiskOpen,
  })

  return rows
}

export function seedCapas(): Capa[] {
  return [
    { correctiveActionId: SEED_IDS.capaIncidentOpen, tenantId: TENANT_ID, source: 'esemeny',
      sourceId: SEED_IDS.incActionPlanned, incidentId: SEED_IDS.incActionPlanned,
      description: 'Biztonsági burkolat javítása és rögzítés-ellenőrzés minden gépen.',
      assignedTo: emp(4), dueDate: daysFromNow(7), completedAt: null, isCompleted: false },
    { correctiveActionId: SEED_IDS.capaWalkOpen, tenantId: TENANT_ID, source: 'bejaras',
      sourceId: SEED_IDS.walkActionRequired, findingId: SEED_IDS.findingOpen,
      description: 'Szellőző-szűrő csere és karbantartási terv frissítése.',
      assignedTo: emp(0), dueDate: daysFromNow(5), completedAt: null, isCompleted: false },
    { correctiveActionId: SEED_IDS.capaWalkDone, tenantId: TENANT_ID, source: 'bejaras',
      sourceId: SEED_IDS.walkClosed, findingId: '00000000-0000-4000-8000-000000fa0003',
      description: 'Targonca-útvonal jelölések felújítása.',
      assignedTo: emp(0), dueDate: daysFromNow(-12), completedAt: daysFromNow(-11), isCompleted: true },
    { correctiveActionId: SEED_IDS.capaIncidentDone, tenantId: TENANT_ID, source: 'esemeny',
      sourceId: SEED_IDS.incClosed, incidentId: SEED_IDS.incClosed,
      description: 'Sérült tárolóedények cseréje a felületkezelőben.',
      assignedTo: emp(2), dueDate: daysFromNow(-25), completedAt: daysFromNow(-22), isCompleted: true },
    { correctiveActionId: SEED_IDS.capaRiskOpen, tenantId: TENANT_ID, source: 'kockazatertekeles',
      sourceId: SEED_IDS.riskWithCapa,
      description: 'Forgó alkatrészek védőburkolatának teljes körű felülvizsgálata.',
      assignedTo: emp(4), dueDate: daysFromNow(12), completedAt: null, isCompleted: false },
  ]
}
