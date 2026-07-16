import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '../../../../components/ui'
import { crmApiHandlers, resetCrmDb, CRM_SEED_IDS } from '../../mocks'
import { crmKeys } from '../keys'
import { fetchLead, useLeadTransition } from '../leads'
import { fetchOpp, useCreateQuoteFromOpp, useOppTransition } from '../opportunities'

/**
 * Detail-kulcs invalidálás (EHS README 6. szabály): a detail kulcs
 * (`['crm','lead',id]` / `['crm','opp',id]`) NEM a lista-prefix alatt él,
 * ezért az onSettled-nek KÜLÖN kell invalidálnia — 409-rollback után így
 * szinkronizál újra a nyitott SlideOver a szerverrel (minta:
 * services/ehs/incidents.ts useIncidentTransition.onSettled).
 */

const server = setupServer(...crmApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetCrmDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    )
  }
}

describe('CRM mutációk — detail-kulcs invalidálás 409 után', () => {
  it('opp-átmenet 409 (fázis-ugrás) után az opp detail kulcs invalidált', async () => {
    const queryClient = createClient()
    const id = CRM_SEED_IDS.oppOpen
    queryClient.setQueryData(crmKeys.opp(id), await fetchOpp(id))

    const { result } = renderHook(() => useOppTransition(), { wrapper: createWrapper(queryClient) })
    act(() => result.current.mutate({ id, action: 'win', payload: {} })) // nyitottból win → 409

    await waitFor(() => expect(result.current.isError).toBe(true))
    await waitFor(() =>
      expect(queryClient.getQueryState(crmKeys.opp(id))?.isInvalidated).toBe(true),
    )
  })

  it('lead-átmenet 409 után a lead detail kulcs invalidált (rollback → re-sync)', async () => {
    const queryClient = createClient()
    const id = CRM_SEED_IDS.leadNew
    queryClient.setQueryData(crmKeys.lead(id), await fetchLead(id))

    const { result } = renderHook(() => useLeadTransition(), { wrapper: createWrapper(queryClient) })
    act(() => result.current.mutate({ id, action: 'qualify', payload: {} })) // új leadből minősítés → 409

    await waitFor(() => expect(result.current.isError).toBe(true))
    await waitFor(() =>
      expect(queryClient.getQueryState(crmKeys.lead(id))?.isInvalidated).toBe(true),
    )
  })

  it('ajánlat-csonk 409 (lezárt lehetőség) után az opp detail kulcs invalidált', async () => {
    const queryClient = createClient()
    const id = CRM_SEED_IDS.oppLost
    queryClient.setQueryData(crmKeys.opp(id), await fetchOpp(id))

    const { result } = renderHook(() => useCreateQuoteFromOpp(), { wrapper: createWrapper(queryClient) })
    act(() => result.current.mutate(id))

    await waitFor(() => expect(result.current.isError).toBe(true))
    await waitFor(() =>
      expect(queryClient.getQueryState(crmKeys.opp(id))?.isInvalidated).toBe(true),
    )
  })

  it('sikeres opp-átmenet után a lista-prefix ÉS a detail kulcs is invalidált', async () => {
    const queryClient = createClient()
    const id = CRM_SEED_IDS.oppOpen
    queryClient.setQueryData(crmKeys.opps({}), [await fetchOpp(id)])
    queryClient.setQueryData(crmKeys.opp(id), await fetchOpp(id))

    const { result } = renderHook(() => useOppTransition(), { wrapper: createWrapper(queryClient) })
    act(() => result.current.mutate({ id, action: 'startDiscovery', payload: {} }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await waitFor(() => {
      expect(queryClient.getQueryState(crmKeys.opps({}))?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(crmKeys.opp(id))?.isInvalidated).toBe(true)
    })
  })
})
