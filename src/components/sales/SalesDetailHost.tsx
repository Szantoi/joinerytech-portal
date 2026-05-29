import { QuoteDetailSlideOver } from './QuoteDetailSlideOver'
import { CreateQuoteSlideOver } from './CreateQuoteSlideOver'
import { CustomerDetailSlideOver } from './CustomerDetailSlideOver'
import type { useSalesDetail } from '../../hooks/useSalesDetail'

interface Props {
  detail: ReturnType<typeof useSalesDetail>
}

export function SalesDetailHost({ detail }: Props) {
  const { state, closeAll, onQuoteCreated, openQuoteFromCustomer, openCreateCustomer } = detail

  return (
    <>
      <QuoteDetailSlideOver
        open={state.type === 'quoteDetail'}
        quoteId={state.type === 'quoteDetail' ? state.quoteId : ''}
        onClose={closeAll}
      />

      <CustomerDetailSlideOver
        open={state.type === 'customerDetail'}
        customerId={state.type === 'customerDetail' ? state.customerId : ''}
        onClose={closeAll}
        onOpenQuote={openQuoteFromCustomer}
      />

      <CreateQuoteSlideOver
        open={state.type === 'createQuote'}
        prefillCustomerId={state.type === 'createQuote' ? state.prefillCustomerId : undefined}
        onClose={closeAll}
        onQuoteCreated={onQuoteCreated}
        onOpenCreateCustomer={openCreateCustomer}
      />
    </>
  )
}
