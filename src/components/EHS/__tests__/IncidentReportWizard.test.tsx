import {
  afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi,
} from 'vitest'
import { fireEvent, render as rtlRender, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { IncidentReportWizard } from '../IncidentReportWizard'
import { useIncidentDraftStore } from '../../../stores/incidentDraftStore'
import { ToastProvider } from '../../ui'
import { ehsApiHandlers, getEhsDb, resetEhsDb } from '../../../modules/ehs/mocks'

vi.mock('../../../auth', () => ({
  useAuth: () => ({
    user: { profile: { sub: '11111111-1111-4111-8111-111111111111' } },
  }),
}))

const server = setupServer(...ehsApiHandlers)

function render(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  )
}

function wizard(onClose = vi.fn()) {
  return <IncidentReportWizard isOpen onClose={onClose} />
}

async function goToDetails() {
  fireEvent.click(screen.getByRole('button', { name: /Személyi sérülés/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Tovább' }))
  await screen.findByRole('option', { name: 'Raktár' })
}

async function goToReview() {
  await goToDetails()
  // Valós seed-helyszínt választunk — a mock ingest a backendhez hasonlóan
  // kötelező, nem üres locationId-t vár.
  const warehouse = screen.getByRole('option', { name: 'Raktár' }) as HTMLOptionElement
  fireEvent.change(screen.getByLabelText(/Helyszín/), { target: { value: warehouse.value } })
  fireEvent.change(screen.getByLabelText(/Leírás/), {
    target: { value: 'Vágási sérülés a szerelőállomáson.' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Tovább' }))
  expect(await screen.findByText('Ellenőrzés és beküldés')).toBeInTheDocument()
}

describe('IncidentReportWizard', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
  })
  afterAll(() => server.close())

  beforeEach(() => {
    resetEhsDb()
    useIncidentDraftStore.setState({ drafts: [], currentDraft: null })
    useIncidentDraftStore.getState().startNewDraft()
  })

  it('magyar, névvel rendelkező modális dialógusként renderel', () => {
    render(wizard())

    const dialog = screen.getByRole('dialog', { name: 'Esemény bejelentése' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('1. lépés / 3')).toBeInTheDocument()
    expect(screen.getByText('Milyen esemény történt?')).toBeInTheDocument()
    expect(screen.queryByText('Report Incident')).not.toBeInTheDocument()
  })

  it('zárt állapotban nem renderel dialógust', () => {
    render(<IncidentReportWizard isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('a magyar incidenscímke az eredeti wire-értéket tárolja', () => {
    render(wizard())

    fireEvent.click(screen.getByRole('button', { name: /Kvázibaleset/ }))

    expect(useIncidentDraftStore.getState().currentDraft?.incidentType).toBe('near-miss')
    expect(screen.getByRole('button', { name: 'Tovább' })).toBeEnabled()
  })

  it('a második lépés magyar és az EHS locations API-ból tölt', async () => {
    render(wizard())
    await goToDetails()

    expect(screen.getByText('Az esemény részletei')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'A csarnok — szabászat' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vissza' })).toBeInTheDocument()
  })

  it('az összegző lépés ugyanazt a magyar típusszótárt és magyar dátumot használja', async () => {
    vi.setSystemTime(new Date('2026-07-15T12:30:00.000Z'))
    useIncidentDraftStore.getState().updateDraft({ timestamp: '2026-07-15T12:30:00.000Z' })
    render(wizard())
    await goToReview()

    expect(screen.getByText('Személyi sérülés')).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
    expect(screen.getByText(/14:30/)).toBeInTheDocument()
    expect(screen.getByText('Adatvédelem és biztonság')).toBeInTheDocument()
    expect(screen.queryByText('Review & Submit')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('Escape bezár, visszaadja a fókuszt, a Tab pedig a dialógusban marad', async () => {
    const onClose = vi.fn()
    // A trigger és a wizard ugyanabban a fában marad (mint a FAB-nál),
    // csak az isOpen vált — így a fókusz-visszaadás a valós elemre mérhető.
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const tree = (open: boolean) => (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <button type="button">Bejelentés megnyitása</button>
          <IncidentReportWizard isOpen={open} onClose={onClose} />
        </ToastProvider>
      </QueryClientProvider>
    )
    const view = rtlRender(tree(false))
    const trigger = screen.getByRole('button', { name: 'Bejelentés megnyitása' })
    trigger.focus()
    view.rerender(tree(true))

    const dialog = screen.getByRole('dialog')
    await waitFor(() => expect(dialog).toHaveFocus())
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('button', { name: 'Mégse' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('mobilon a bezárógombnak magyar accessible neve van', () => {
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true })
    render(wizard())
    expect(screen.getByRole('button', { name: 'Bezárás' })).toBeInTheDocument()
  })

  it('nem támogatott vagy túl nagy fényképet feltöltés előtt elutasít', async () => {
    render(wizard())
    await goToDetails()
    const input = document.querySelector<HTMLInputElement>('#photo-upload')!
    const unsupported = new File(['adat'], 'minta.gif', { type: 'image/gif' })
    fireEvent.change(input, { target: { files: [unsupported] } })
    expect(await screen.findByText('Csak JPEG vagy PNG formátumú fénykép tölthető fel.'))
      .toBeInTheDocument()

    const tooLarge = new File(['adat'], 'minta.jpg', { type: 'image/jpeg' })
    Object.defineProperty(tooLarge, 'size', { value: 10 * 1024 * 1024 + 1 })
    fireEvent.change(input, { target: { files: [tooLarge] } })
    expect(await screen.findByText('A fénykép mérete legfeljebb 10 MB lehet.'))
      .toBeInTheDocument()
    expect(useIncidentDraftStore.getState().currentDraft?.photoFile).toBeNull()
  })

  it('beküldési hibát egységes magyar, technikai részlet nélküli üzenetre képez', async () => {
    render(wizard())
    await goToReview()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('sensitive upstream detail'))

    fireEvent.click(screen.getByRole('button', { name: 'Beküldés' }))

    // A ToastProvider üres role=alert live-regionje mindig a DOM-ban van,
    // ezért az üzenetet keressük, és az alert-konténerségét külön ellenőrizzük.
    const message = await screen.findByText(
      'A bejelentés elküldése nem sikerült. Az adatokat helyben megőriztük; próbáld újra később.',
    )
    expect(message.closest('[role="alert"]')).not.toBeNull()
    expect(screen.queryByText(/sensitive upstream detail/)).not.toBeInTheDocument()
  })

  it('sikeres beküldésnél a mock ingest fogadja az eventet és a szülő zárhat', async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    render(<IncidentReportWizard isOpen onClose={onClose} onSuccess={onSuccess} />)
    const draftId = useIncidentDraftStore.getState().currentDraft!.id
    await goToReview()

    fireEvent.click(screen.getByRole('button', { name: 'Beküldés' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(draftId))
    expect(onClose).toHaveBeenCalledOnce()
    expect(getEhsDb().incidents.find((incident) => incident.incidentId === draftId))
      .toMatchObject({ status: 'Reported', location: 'Raktár' })
    expect(useIncidentDraftStore.getState().drafts).toHaveLength(0)
  })

  it('beküldés közben sem Escape, sem Mégse nem zárja be a dialógust', async () => {
    const onClose = vi.fn()
    render(wizard(onClose))
    const draftId = useIncidentDraftStore.getState().currentDraft!.id
    await goToReview()
    let resolveFetch!: (response: Response) => void
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Beküldés' }))
    expect(await screen.findByText('Beküldés…')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Mégse' })).toBeDisabled()

    resolveFetch(new Response(JSON.stringify({ eventId: draftId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('a Mégse gomb bezárja a wizardot', () => {
    const onClose = vi.fn()
    render(wizard(onClose))
    fireEvent.click(screen.getByRole('button', { name: 'Mégse' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
