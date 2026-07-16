import { http, HttpResponse } from 'msw'
import { HR_API_BASE } from '../services/config'
import { isTimeLogPushable } from '../services/timeLogs'
import { getHrDb, jsonError, logTimestamp } from './db'

/**
 * Munkaóra-napló handlerek — lista + Kontrolling-átadás STUB.
 * Az átadás csak megjelöli a tételeket (pushedAt); a valós integráció a
 * Kontrolling munka-kategória tényköltségét növelné (ld. services/hr/timeLogs.ts).
 */

const BASE = `${HR_API_BASE}/timelogs`

export const timeLogHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const empId = url.searchParams.get('empId')

    let rows = getHrDb().timeLogs
    if (empId) rows = rows.filter((t) => t.empId === empId)
    // legfrissebb nap elöl
    const sorted = [...rows].sort((a, b) => b.day.localeCompare(a.day))
    return HttpResponse.json(sorted)
  }),

  http.post(`${BASE}/push`, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { empId?: string } | null
    const empId = body?.empId

    const pushable = getHrDb().timeLogs.filter(
      (t) => isTimeLogPushable(t) && (!empId || t.empId === empId),
    )
    if (pushable.length === 0) {
      // üzleti guard (a UI gombja is ezt tükrözi disabledReason-nel)
      return jsonError(409, 'Conflict', 'Nincs átadható munkaóra-tétel.')
    }

    const at = logTimestamp()
    for (const log of pushable) log.pushedAt = at
    return HttpResponse.json({ pushed: pushable.length })
  }),
]
