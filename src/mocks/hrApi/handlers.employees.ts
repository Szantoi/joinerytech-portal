import { http, HttpResponse } from 'msw'
import { HR_API_BASE } from '../../services/hr/config'
import type { HrDept, SkillKey } from '../../services/hr/employees'
import { getHrDb, notFound } from './db'

/** Dolgozó handlerek — lista (részleg / kereső / készség szűrő) + részlet. */

const BASE = `${HR_API_BASE}/employees`

export const employeeHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const dept = url.searchParams.get('dept') as HrDept | null
    const q = url.searchParams.get('q')?.toLowerCase()
    const skill = url.searchParams.get('skill') as SkillKey | null

    let rows = getHrDb().employees
    if (dept) rows = rows.filter((e) => e.dept === dept)
    if (q) rows = rows.filter((e) => `${e.name} ${e.role}`.toLowerCase().includes(q))
    if (skill) rows = rows.filter((e) => e.skills.some((s) => s.key === skill))
    // névsor szerint
    const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name, 'hu'))
    return HttpResponse.json(sorted)
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const emp = getHrDb().employees.find((e) => e.id === params.id)
    return emp ? HttpResponse.json(emp) : notFound('Dolgozó')
  }),
]
