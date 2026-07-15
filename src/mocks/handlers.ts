import { http, HttpResponse } from 'msw'
import {
  mockConfigureResponse,
  mockWorkOrderResponse
} from './configuratorMocks'
import { ehsApiHandlers } from './ehsApi'
import { crmApiHandlers } from './crmApi'
import { controllingApiHandlers } from './controllingApi'
import { hrApiHandlers } from './hrApi'
import { maintenanceApiHandlers } from './maintenanceApi'
import { qaApiHandlers } from './qaApi'
import { dmsApiHandlers } from './dmsApi'

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

  // EHS: POST /api/ehs/photos/presigned-url
  http.post('/api/ehs/photos/presigned-url', async ({ request }) => {
    const body = await request.json()
    console.log('MSW: POST /api/ehs/photos/presigned-url', body)

    await new Promise((resolve) => setTimeout(resolve, 300))

    return HttpResponse.json({
      uploadUrl: 'https://mock-s3.amazonaws.com/upload',
      s3Key: `ehs/photos/${crypto.randomUUID()}.jpg`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    })
  }),

  // EHS: PUT to S3 (mock)
  http.put('https://mock-s3.amazonaws.com/upload', async () => {
    console.log('MSW: PUT https://mock-s3.amazonaws.com/upload')

    await new Promise((resolve) => setTimeout(resolve, 500))

    return new HttpResponse(null, { status: 200 })
  }),

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
