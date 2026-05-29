import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSalesDetail } from '../useSalesDetail'

describe('useSalesDetail', () => {
  it('initial state is none', () => {
    const { result } = renderHook(() => useSalesDetail())
    expect(result.current.state.type).toBe('none')
  })

  it('openQuoteDetail sets quoteDetail state', () => {
    const { result } = renderHook(() => useSalesDetail())
    act(() => { result.current.openQuoteDetail('q-123') })
    expect(result.current.state).toEqual({ type: 'quoteDetail', quoteId: 'q-123' })
  })

  it('openCustomerDetail sets customerDetail state', () => {
    const { result } = renderHook(() => useSalesDetail())
    act(() => { result.current.openCustomerDetail('c-456') })
    expect(result.current.state).toEqual({ type: 'customerDetail', customerId: 'c-456' })
  })

  it('openCreateQuote sets createQuote state with optional prefillCustomerId', () => {
    const { result } = renderHook(() => useSalesDetail())
    act(() => { result.current.openCreateQuote('c-001') })
    expect(result.current.state).toEqual({ type: 'createQuote', prefillCustomerId: 'c-001' })
  })

  it('openCreateQuote without args has no prefillCustomerId', () => {
    const { result } = renderHook(() => useSalesDetail())
    act(() => { result.current.openCreateQuote() })
    expect(result.current.state.type).toBe('createQuote')
  })

  it('openCreateCustomer sets createCustomer state', () => {
    const { result } = renderHook(() => useSalesDetail())
    act(() => { result.current.openCreateCustomer() })
    expect(result.current.state).toEqual({ type: 'createCustomer' })
  })

  it('closeAll resets state to none', () => {
    const { result } = renderHook(() => useSalesDetail())
    act(() => { result.current.openQuoteDetail('q-1') })
    act(() => { result.current.closeAll() })
    expect(result.current.state.type).toBe('none')
  })

  it('onQuoteCreated transitions to quoteDetail', () => {
    const { result } = renderHook(() => useSalesDetail())
    act(() => { result.current.onQuoteCreated('q-new') })
    expect(result.current.state).toEqual({ type: 'quoteDetail', quoteId: 'q-new' })
  })

  it('openQuoteFromCustomer transitions to quoteDetail from customer view', () => {
    const { result } = renderHook(() => useSalesDetail())
    act(() => { result.current.openCustomerDetail('c-1') })
    act(() => { result.current.openQuoteFromCustomer('q-999') })
    expect(result.current.state).toEqual({ type: 'quoteDetail', quoteId: 'q-999' })
  })
})
