import { http, HttpResponse } from 'msw'
import { HR_API_BASE } from '../../services/hr/config'
import { ABSENCE_FSM, type AbsenceAction, type AbsenceStatus } from '../../services/hr/fsm'
import type { Absence } from '../../services/hr/absences'
import { getHrDb, guardTransition, jsonError, logTimestamp, MOCK_APPROVER, notFound } from './db'

/**
 * Távollét handlerek — lista, részlet, FSM-átmenetek (a backend Absence
 * aggregátum approve/reject/start/complete/reopen akcióinak tükre).
 * Tiltott átmenet → 409 (közös guard-tábla: services/hr/fsm.ts).
 */

const BASE = `${HR_API_BASE}/absences`

function findAbsence(id: string | readonly string[]): Absence | undefined {
  return getHrDb().absences.find((a) => a.id === id)
}

/** Egyszerű (payload nélküli) átmenet: guard → státusz + napló + mellékhatás. */
function makeTransitionHandler(
  action: Exclude<AbsenceAction, 'reject'>,
  logText: string,
  applySideEffects?: (absence: Absence) => void,
) {
  return http.put(`${BASE}/:id/${action}`, ({ params }) => {
    const absence = findAbsence(params.id as string)
    if (!absence) return notFound('Távollét')
    const guard = guardTransition(ABSENCE_FSM, action, absence.status)
    if (guard) return guard

    absence.status = ABSENCE_FSM[action].to
    applySideEffects?.(absence)
    absence.log.push({ at: logTimestamp(), text: logText })
    return HttpResponse.json(absence)
  })
}

export const absenceHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') as AbsenceStatus | null
    const empId = url.searchParams.get('empId')

    let rows = getHrDb().absences
    if (status) rows = rows.filter((a) => a.status === status)
    if (empId) rows = rows.filter((a) => a.empId === empId)
    // legfrissebb kérelem elöl
    const sorted = [...rows].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    return HttpResponse.json(sorted)
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const absence = findAbsence(params.id as string)
    return absence ? HttpResponse.json(absence) : notFound('Távollét')
  }),

  // kert → jovahagyva (hr.manage) — jóváhagyó + időbélyeg rögzül
  makeTransitionHandler('approve', `Jóváhagyva — ${MOCK_APPROVER}`, (a) => {
    a.approvedBy = MOCK_APPROVER
    a.approvedAt = logTimestamp().slice(0, 10)
  }),

  // kert → elutasitva (hr.manage) — az indok KÖTELEZŐ (backend-tükör)
  http.put(`${BASE}/:id/reject`, async ({ params, request }) => {
    const absence = findAbsence(params.id as string)
    if (!absence) return notFound('Távollét')
    const guard = guardTransition(ABSENCE_FSM, 'reject', absence.status)
    if (guard) return guard

    const body = (await request.json()) as { reason?: string } | null
    const reason = body?.reason?.trim()
    if (!reason) return jsonError(400, 'BadRequest', 'Az elutasítás indoka kötelező.')

    absence.status = ABSENCE_FSM.reject.to
    absence.rejectReason = reason
    absence.log.push({ at: logTimestamp(), text: `Elutasítva — ${MOCK_APPROVER}: ${reason}` })
    return HttpResponse.json(absence)
  }),

  // jovahagyva → folyamatban
  makeTransitionHandler('start', 'Távollét megkezdve'),

  // folyamatban → lezarva (terminális)
  makeTransitionHandler('complete', 'Lezárva'),

  // elutasitva → kert (backend Rejected → Pending reopen) — az indok törlődik
  makeTransitionHandler('reopen', 'Újranyitva — ismételt elbírálásra vár', (a) => {
    delete a.rejectReason
  }),
]
