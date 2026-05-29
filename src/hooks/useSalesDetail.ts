import { useState } from 'react'

export type SalesDetailState =
  | { type: 'none' }
  | { type: 'quoteDetail'; quoteId: string }
  | { type: 'customerDetail'; customerId: string }
  | { type: 'createQuote'; prefillCustomerId?: string }
  | { type: 'createCustomer' }

export function useSalesDetail() {
  const [state, setState] = useState<SalesDetailState>({ type: 'none' })

  return {
    state,
    openQuoteDetail:    (quoteId: string)    => setState({ type: 'quoteDetail', quoteId }),
    openCustomerDetail: (customerId: string) => setState({ type: 'customerDetail', customerId }),
    openCreateQuote:    (prefillCustomerId?: string) => setState({ type: 'createQuote', prefillCustomerId }),
    openCreateCustomer: ()                   => setState({ type: 'createCustomer' }),
    closeAll:           ()                   => setState({ type: 'none' }),
    // CreateQuote success → automatikusan QuoteDetail
    onQuoteCreated:     (quoteId: string)    => setState({ type: 'quoteDetail', quoteId }),
    // CustomerDetail → QuoteDetail cross-navigation
    openQuoteFromCustomer: (quoteId: string) => setState({ type: 'quoteDetail', quoteId }),
  }
}
