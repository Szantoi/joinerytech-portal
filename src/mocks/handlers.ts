import { http, HttpResponse } from 'msw'
import {
  mockConfigureResponse,
  mockWorkOrderResponse
} from './configuratorMocks'

export const handlers = [
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

  // EHS: POST /api/ehs/events
  http.post('/api/ehs/events', async ({ request }) => {
    const body = await request.json()
    console.log('MSW: POST /api/ehs/events', body)

    await new Promise((resolve) => setTimeout(resolve, 400))

    return HttpResponse.json({
      eventId: crypto.randomUUID(),
      sequence: 42,
      status: 'accepted',
      serverTimestamp: new Date().toISOString()
    }, { status: 201 })
  }),

  // Assembly: PATCH /api/v1/work-orders/:id/assembly-sequence
  http.patch('/api/v1/work-orders/:id/assembly-sequence', async ({ request, params }) => {
    const body = await request.json() as any
    console.log('MSW: PATCH /api/v1/work-orders/:id/assembly-sequence', params, body)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock successful response
    return HttpResponse.json({
      updated_operations: body.operations.map((op: any) => ({
        ...op,
        last_modified: new Date().toISOString()
      })),
      estimated_duration_change: '+0min',
      total_duration: 'PT2H30M'
    })
  })
]
