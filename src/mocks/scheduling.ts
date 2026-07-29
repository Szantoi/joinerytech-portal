import { http, HttpResponse } from 'msw'
import type {
  AssignBatchRequest,
  AssignBatchResponse,
  Batch,
  Execution,
  Machine,
  Operator,
} from '../types/scheduling.types'

/**
 * Gép/operátor-ütemezés MSW-mockjai (PLAN-05 F4).
 *
 * Miért kellett: a `/w/production/scheduling` képernyő beroutolása után
 * kiderült, hogy a négy végpontjára NINCS handler — mock módban minden
 * fejlesztő hibadobozt látott, és a böngésző-kapu sem tudta végigvinni a
 * kiosztás folyamatát (operátor → drop → megerősítés).
 *
 * A séma a `types/scheduling.types.ts` kontraktus-tükörből jön, nem kitalálva.
 * Az adat állapottartó a lap élettartamára: a sikeres kiosztás tényleg elveszi
 * a köteget a kiosztatlanok közül és felveszi a végrehajtások közé — különben
 * a mock zöldet mutatna olyan folyamatra, ami valójában nem zárul le.
 */

const OPERATORS: Operator[] = [
  { id: 'op-1', name: 'Kovács Péter', email: 'kovacs.peter@joinerytech.hu', role: 'machine_operator' },
  { id: 'op-2', name: 'Nagy Anna', email: 'nagy.anna@joinerytech.hu', role: 'machine_operator' },
  { id: 'op-3', name: 'Tóth Gergő', email: 'toth.gergo@joinerytech.hu', role: 'machine_operator' },
]

const MACHINES: Machine[] = [
  { id: 'machine-1', name: 'Holzma HPP380', type: 'Szabászgép', capacity: 100, status: 'Available' },
  { id: 'machine-2', name: 'Homag Edgeteq', type: 'Élzáró', capacity: 80, status: 'Busy' },
  { id: 'machine-3', name: 'Weeke CNC', type: 'Megmunkáló', capacity: 60, status: 'Available' },
  { id: 'machine-4', name: 'Brandt Ambition', type: 'Élzáró', capacity: 70, status: 'Maintenance' },
]

/** A modul-szintű állapot: a kiosztás ténylegesen mozgatja a kötegeket. */
let batches: Batch[] = [
  { id: 'batch-1', name: 'Konyhai frontok — JT-2426-0182', materialType: 'Tölgy 22mm', quantity: 48, priority: 8, status: 'Unassigned', estimatedMinutes: 180 },
  { id: 'batch-2', name: 'Polcos korpuszok — JT-2426-0177', materialType: 'EG-3303-18', quantity: 24, priority: 5, status: 'Unassigned', estimatedMinutes: 120 },
  { id: 'batch-3', name: 'Fiókoldalak — JT-2426-0190', materialType: 'MDF-019', quantity: 96, priority: 2, status: 'Unassigned', estimatedMinutes: 90 },
]

let executions: Execution[] = [
  {
    id: 'exec-1', batchId: 'batch-0', batchName: 'Hátlapok — JT-2426-0165',
    machineId: 'machine-1', operatorId: 'op-1', priority: 4,
    startTime: '2026-07-29T07:00:00', estimatedMinutes: 150, status: 'InProgress',
  },
]

let nextExecutionId = 2

/** Teszt-hook: a handlerek állapota futtatások között visszaállítható. */
export function resetSchedulingMockState() {
  batches = [
    { id: 'batch-1', name: 'Konyhai frontok — JT-2426-0182', materialType: 'Tölgy 22mm', quantity: 48, priority: 8, status: 'Unassigned', estimatedMinutes: 180 },
    { id: 'batch-2', name: 'Polcos korpuszok — JT-2426-0177', materialType: 'EG-3303-18', quantity: 24, priority: 5, status: 'Unassigned', estimatedMinutes: 120 },
    { id: 'batch-3', name: 'Fiókoldalak — JT-2426-0190', materialType: 'MDF-019', quantity: 96, priority: 2, status: 'Unassigned', estimatedMinutes: 90 },
  ]
  executions = [
    {
      id: 'exec-1', batchId: 'batch-0', batchName: 'Hátlapok — JT-2426-0165',
      machineId: 'machine-1', operatorId: 'op-1', priority: 4,
      startTime: '2026-07-29T07:00:00', estimatedMinutes: 150, status: 'InProgress',
    },
  ]
  nextExecutionId = 2
}

export const schedulingHandlers = [
  http.get('/identity/users', ({ request }) => {
    const role = new URL(request.url).searchParams.get('role')
    // A végpont szerep szerint szűr; ismeretlen szerepre üres lista a helyes
    // válasz, nem a teljes névsor.
    return HttpResponse.json(role === 'machine_operator' ? OPERATORS : [])
  }),

  http.get('/cutting/api/machines', () => HttpResponse.json(MACHINES)),

  http.get('/cutting/api/batches', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    return HttpResponse.json(status ? batches.filter((b) => b.status === status) : batches)
  }),

  http.get('/cutting/api/plans/:planDate/executions', () => HttpResponse.json(executions)),

  http.post('/cutting/api/plans/:planDate/assign-batch', async ({ request }) => {
    const body = (await request.json()) as AssignBatchRequest
    const batch = batches.find((b) => b.id === body.batchId)
    const machine = MACHINES.find((m) => m.id === body.machineId)

    if (!batch || !machine) {
      return HttpResponse.json({ error: 'Ismeretlen köteg vagy gép' }, { status: 404 })
    }

    // A jogosultsági határ a szerveré: a UI csúszkája korlátoz, de a mock is
    // kimondja, különben a 403-as ág sosem lenne kipróbálható.
    if (body.priority > 10) {
      return HttpResponse.json({ error: 'Túl magas prioritás' }, { status: 403 })
    }

    batch.status = 'Assigned'
    batches = batches.filter((b) => b.id !== batch.id)

    const execution: Execution = {
      id: `exec-${nextExecutionId++}`,
      batchId: batch.id,
      batchName: batch.name,
      machineId: body.machineId,
      operatorId: body.operatorId,
      priority: body.priority,
      startTime: body.startTime,
      estimatedMinutes: batch.estimatedMinutes,
      status: 'Planned',
    }
    executions = [...executions, execution]

    const response: AssignBatchResponse = { executionId: execution.id, status: 'Planned' }
    return HttpResponse.json(response, { status: 201 })
  }),
]
