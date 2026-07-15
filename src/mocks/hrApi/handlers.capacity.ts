import { http, HttpResponse } from 'msw'
import { HR_API_BASE } from '../../services/hr/config'
import { calcWeekCapacity, mondayOf, weekDays } from '../../services/hr/calc'
import { getHrDb, jsonError } from './db'

/**
 * Kapacitás + beosztás handlerek. A /capacity SZÁMÍTOTT erőforrás:
 * ugyanazt a tiszta calc-modult futtatja, mint amit a UI típusai tükröznek
 * (services/hr/calc.ts) — a kliens sosem számol saját rácsot.
 */

export const capacityHandlers = [
  http.get(`${HR_API_BASE}/capacity`, ({ request }) => {
    const url = new URL(request.url)
    const week = url.searchParams.get('week')

    if (!week || !/^\d{4}-\d{2}-\d{2}$/.test(week)) {
      return jsonError(400, 'BadRequest', 'A week paraméter (YYYY-MM-DD, hétfő) kötelező.')
    }
    if (mondayOf(week) !== week) {
      return jsonError(400, 'BadRequest', `A week paraméternek hétfőnek kell lennie (kapott: ${week}).`)
    }

    const db = getHrDb()
    return HttpResponse.json({
      week,
      days: weekDays(week),
      rows: calcWeekCapacity(db.employees, week, db.assignments, db.absences),
    })
  }),

  http.get(`${HR_API_BASE}/assignments`, ({ request }) => {
    const url = new URL(request.url)
    const empId = url.searchParams.get('empId')

    let rows = getHrDb().assignments
    if (empId) rows = rows.filter((a) => a.empId === empId)
    // kezdődátum szerint
    const sorted = [...rows].sort((a, b) => a.start.localeCompare(b.start))
    return HttpResponse.json(sorted)
  }),
]
