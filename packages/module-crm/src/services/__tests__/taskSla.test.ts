import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { crmApiHandlers, resetCrmDb, CRM_SEED_IDS, dueInDays } from '../../mocks'
import { fetchTasks, completeTask } from '../tasks'
import { fetchRecentActivities } from '../activities'
import { computeTaskSla, daysUntilDue } from '../sla'

/** SZÁMÍTOTT feladat-SLA (tiszta függvények) + feladat/napló API. */

const server = setupServer(...crmApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetCrmDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('computeTaskSla (SZÁMÍTOTT mező — ok/soon/overdue)', () => {
  const now = new Date('2026-07-14T10:00:00')

  it('lejárt határidő → overdue', () => {
    expect(computeTaskSla('2026-07-13', now)).toBe('overdue')
    expect(computeTaskSla('2026-07-01', now)).toBe('overdue')
  })

  it('a határidő napja és a soon-ablak → soon', () => {
    expect(computeTaskSla('2026-07-14', now)).toBe('soon') // ma esedékes, még nem késés
    expect(computeTaskSla('2026-07-16', now)).toBe('soon') // TASK_SLA_SOON_DAYS=2 ablakon belül
  })

  it('az ablakon túli határidő → ok', () => {
    expect(computeTaskSla('2026-07-17', now)).toBe('ok')
    expect(computeTaskSla('2026-09-01', now)).toBe('ok')
  })

  it('daysUntilDue: nap végéig számol (a határidő napja 0, nem -1)', () => {
    expect(daysUntilDue('2026-07-14', now)).toBe(0)
    expect(daysUntilDue('2026-07-13', now)).toBe(-1)
  })
})

describe('feladat API', () => {
  it('a done=false szűrő csak nyitott feladatokat ad, határidő szerint rendezve', async () => {
    const open = await fetchTasks({ done: false })
    expect(open.length).toBeGreaterThan(0)
    expect(open.every((t) => !t.done)).toBe(true)
    const dues = open.map((t) => t.due)
    expect([...dues].sort()).toEqual(dues)
  })

  it('a seed determinisztikus SLA-mixet ad (sértés + soon + ok)', async () => {
    const open = await fetchTasks({ done: false })
    const slas = open.map((t) => computeTaskSla(t.due))
    expect(slas).toContain('overdue')
    expect(slas).toContain('soon')
    expect(slas).toContain('ok')
  })

  it('teljesítés: done=true perzisztál', async () => {
    const done = await completeTask(CRM_SEED_IDS.taskSoon)
    expect(done.done).toBe(true)
    const open = await fetchTasks({ done: false })
    expect(open.map((t) => t.id)).not.toContain(CRM_SEED_IDS.taskSoon)
  })

  it('dueInDays helper stabil formátumot ad (YYYY-MM-DD)', () => {
    expect(dueInDays(0)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('legutóbbi tevékenységek (áttekintés)', () => {
  it('lead- és opp-forrású bejegyzéseket ad, legfrissebb elöl, limitálva', async () => {
    const recent = await fetchRecentActivities(5)
    expect(recent).toHaveLength(5)
    const stamps = recent.map((a) => a.at)
    expect([...stamps].sort().reverse()).toEqual(stamps)
    expect(recent.every((a) => ['lead', 'opp'].includes(a.refType))).toBe(true)
  })
})
