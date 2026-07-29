import { http, HttpResponse } from 'msw'
import {
  mockConfigureResponse,
  mockWorkOrderResponse
} from './configuratorMocks'
import { ehsApiHandlers } from '@spaceos/module-ehs/mocks'
import { crmApiHandlers } from '@spaceos/module-crm/mocks'
import { controllingApiHandlers } from '@spaceos/module-controlling/mocks'
import { hrApiHandlers } from '@spaceos/module-hr/mocks'
import { maintenanceApiHandlers } from '@spaceos/module-maintenance/mocks'
import { qaApiHandlers } from '@spaceos/module-qa/mocks'
import { dmsApiHandlers } from '@spaceos/module-dms/mocks'
import { productionApiHandlers } from '@joinerytech/world-production/mocks'
import { warehouseHandlers } from '@joinerytech/world-warehouse/mocks'
import { schedulingHandlers } from './scheduling'

export const handlers = [
  // EHS modul-API (openapi-tükör, állapottartó store + FSM guardok) — ld. ./ehsApi
  ...ehsApiHandlers,

  // CRM modul-API (MSW-first kontraktus, állapottartó store + FSM guardok) — ld. ./crmApi
  ...crmApiHandlers,

  // Kontrolling modul-API (backend-kontraktus tükör, számított EAC/variance) — ld. ./controllingApi
  ...controllingApiHandlers,

  // HR modul-API (MSW-first kontraktus, állapottartó store + távollét-FSM guardok) — ld. ./hrApi
  ...hrApiHandlers,

  // Maintenance modul-API (MSW-first kontraktus, számított eszköz-státusz + munkalap-FSM guardok) — ld. ./maintenanceApi
  ...maintenanceApiHandlers,

  // QA modul-API (MSW-first kontraktus, átvizsgálás + hibajegy FSM guardok, számított blocking/openTickets) — ld. ./qaApi
  ...qaApiHandlers,

  // DMS modul-API (MSW-first kontraktus, dokumentum-FSM + verzió-lánc, számított releasedVersion/expiry) — ld. ./dmsApi
  ...dmsApiHandlers,

  // Production modul-API (API-FIRST kontraktus-tükör: cutting+joinery valós DTO/FSM/hibakód,
  // WORLDS_API_CONTRACTS_2026-07-18.md szerint) — ld. ./productionApi. VITE_DATA_MODE=api
  // esetén ez irreleváns: a worker maga sem indul (src/main.tsx).
  ...productionApiHandlers,

  // Warehouse modul-API (inventory/procurement contract mirror). This must be
  // registered in the global worker as well as the module-local node test server.
  ...warehouseHandlers,

  // Gép/operátor-ütemezés (/w/production/scheduling) — a képernyő beroutolásáig
  // ezek hiányoztak, ezért mock módban hibadobozt mutatott. Ld. ./scheduling
  ...schedulingHandlers,

  // Collaboration modul-API (B2B Collaboration contract mirror)

  // POST /api/products/configure
  http.post('/api/products/configure', async ({ request }) => {
    const body = await request.json()
    console.log('MSW: POST /api/products/configure', body)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return HttpResponse.json(mockConfigureResponse)
  }),

  // GET /api/products/preview/:configId
  http.get('/api/products/preview/:configId', ({ params }) => {
    console.log('MSW: GET /api/products/preview', params)

    // Simulate network delay
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve(
          HttpResponse.json({
            configId: params.configId,
            bomItems: mockConfigureResponse.bomPreview,
            estimatedPrice: mockConfigureResponse.estimatedPrice
          })
        )
      }, 300)
    )
  }),

  // POST /api/work-orders
  http.post('/api/work-orders', async ({ request }) => {
    const body = await request.json()
    console.log('MSW: POST /api/work-orders', body)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    return HttpResponse.json(mockWorkOrderResponse)
  }),

  // EHS wizard fotó-handlerek: a module-ehs mocks része (handlers.wizardPhotos)

  // EHS: POST /api/ehs/events → az ehsApi incidens-handlere kezeli (store-ba ír)

  // Assembly: PATCH /api/v1/work-orders/:id/assembly-sequence
  http.patch('/api/v1/work-orders/:id/assembly-sequence', async ({ request, params }) => {
    const body = (await request.json()) as { operations: Record<string, unknown>[] }
    console.log('MSW: PATCH /api/v1/work-orders/:id/assembly-sequence', params, body)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock successful response
    return HttpResponse.json({
      updated_operations: body.operations.map((op) => ({
        ...op,
        last_modified: new Date().toISOString()
      })),
      estimated_duration_change: '+0min',
      total_duration: 'PT2H30M'
    })
  })
]
