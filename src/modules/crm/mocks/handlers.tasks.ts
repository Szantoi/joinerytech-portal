import { http, HttpResponse } from 'msw'
import { CRM_API_BASE } from '../services/config'
import type { RecentActivity } from '../services/activities'
import { getCrmDb, notFound } from './db'

/** Feladat- és tevékenység-handlerek — lista, teljesítés, legutóbbi napló. */

export const taskHandlers = [
  http.get(`${CRM_API_BASE}/tasks`, ({ request }) => {
    const url = new URL(request.url)
    const done = url.searchParams.get('done')

    let rows = getCrmDb().tasks
    if (done !== null) rows = rows.filter((t) => t.done === (done === 'true'))
    // legkorábbi határidő elöl (SLA-sértés a lista tetején)
    const sorted = [...rows].sort((a, b) => a.due.localeCompare(b.due))
    return HttpResponse.json(sorted)
  }),

  http.post(`${CRM_API_BASE}/tasks/:id/complete`, ({ params }) => {
    const task = getCrmDb().tasks.find((t) => t.id === params.id)
    if (!task) return notFound('Feladat')
    task.done = true
    return HttpResponse.json(task)
  }),

  // Kereszt-entitás „legutóbbi tevékenységek" (áttekintés képernyő)
  http.get(`${CRM_API_BASE}/activities/recent`, ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit') ?? 8)
    const db = getCrmDb()

    const fromLeads: RecentActivity[] = db.leads.flatMap((l) =>
      l.activities.map((a) => ({ ...a, refType: 'lead' as const, refId: l.id, refTitle: l.title })),
    )
    const fromOpps: RecentActivity[] = db.opps.flatMap((o) =>
      o.activities.map((a) => ({ ...a, refType: 'opp' as const, refId: o.id, refTitle: o.title })),
    )
    const recent = [...fromLeads, ...fromOpps]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit)
    return HttpResponse.json(recent)
  }),
]
