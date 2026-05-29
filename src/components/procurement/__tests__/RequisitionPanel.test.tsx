import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RequisitionPanel } from '../RequisitionPanel'

vi.mock('../../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test' } },
  })),
}))

afterEach(() => { vi.unstubAllGlobals() })

function mockFetch503() {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
}

describe('RequisitionPanel', () => {
  it('renders heading', async () => {
    mockFetch503()
    render(<RequisitionPanel />)
    await waitFor(() => expect(screen.getByText('Beszerzési igénylések')).toBeTruthy())
  })

  it('renders table headers', async () => {
    mockFetch503()
    render(<RequisitionPanel />)
    await waitFor(() => expect(screen.getByText('Igénylésszám')).toBeTruthy())
    expect(screen.getByText('Anyagkód')).toBeTruthy()
  })

  it('renders fallback requisitions', async () => {
    mockFetch503()
    render(<RequisitionPanel />)
    await waitFor(() => expect(screen.getByText('IGE-2026-041')).toBeTruthy())
  })

  it('shows status pills', async () => {
    mockFetch503()
    render(<RequisitionPanel />)
    await waitFor(() => expect(screen.getByText('Vázlat')).toBeTruthy())
    expect(screen.getAllByText('Jóváhagyva').length).toBeGreaterThan(0)
  })

  it('shows Új igénylés button', async () => {
    mockFetch503()
    render(<RequisitionPanel />)
    await waitFor(() => expect(screen.getByText('Új igénylés')).toBeTruthy())
  })

  it('clicking Új igénylés opens create drawer', async () => {
    mockFetch503()
    render(<RequisitionPanel />)
    await waitFor(() => screen.getByText('Új igénylés'))
    fireEvent.click(screen.getByText('Új igénylés'))
    await waitFor(() => expect(screen.getByText('Anyagkód *')).toBeTruthy())
  })

  it('clicking row opens detail SlideOver', async () => {
    mockFetch503()
    render(<RequisitionPanel />)
    await waitFor(() => screen.getByText('IGE-2026-041'))
    fireEvent.click(screen.getByText('IGE-2026-041'))
    await waitFor(() => expect(screen.getByText('Igénylés adatai')).toBeTruthy())
  })

  it('detail SlideOver shows SoD warning when submitter matches current user', async () => {
    mockFetch503()
    render(<RequisitionPanel />)
    await waitFor(() => screen.getByText('IGE-2026-041'))
    fireEvent.click(screen.getByText('IGE-2026-041'))
    await waitFor(() => expect(screen.getByText(/Érdekeltségi összeférhetetlenség/)).toBeTruthy())
  })

  it('create drawer shows validation errors on empty submit', async () => {
    mockFetch503()
    render(<RequisitionPanel />)
    await waitFor(() => screen.getByText('Új igénylés'))
    fireEvent.click(screen.getByText('Új igénylés'))
    await waitFor(() => screen.getByText('Igénylés →'))
    fireEvent.click(screen.getByText('Igénylés →'))
    await waitFor(() => {
      const errors = screen.getAllByText('Kötelező mező')
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  it('ConvertedToPO pill renders correctly', async () => {
    mockFetch503()
    render(<RequisitionPanel />)
    await waitFor(() => expect(screen.getByText('PO létrehozva')).toBeTruthy())
  })
})
