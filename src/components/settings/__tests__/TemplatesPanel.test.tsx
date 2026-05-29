import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TemplatesPanel, TEMPLATES_FALLBACK } from '../TemplatesPanel'

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

describe('TemplatesPanel', () => {
  it('renders heading', async () => {
    mockFetch503()
    render(<TemplatesPanel />)
    await waitFor(() => expect(screen.getByText('Parametrikus sablonok')).toBeTruthy())
  })

  it('renders table headers', async () => {
    mockFetch503()
    render(<TemplatesPanel />)
    await waitFor(() => expect(screen.getByText('Név')).toBeTruthy())
    expect(screen.getByText('Típus')).toBeTruthy()
    expect(screen.getByText('Paraméterek')).toBeTruthy()
    expect(screen.getByText('Státusz')).toBeTruthy()
  })

  it('renders fallback templates', async () => {
    mockFetch503()
    render(<TemplatesPanel />)
    await waitFor(() => expect(screen.getByText('Standard ajtó sablon')).toBeTruthy())
    expect(screen.getByText('Toló ajtó sablon')).toBeTruthy()
    expect(screen.getByText('Konyhai szekrény')).toBeTruthy()
  })

  it('shows active and inactive status badges', async () => {
    mockFetch503()
    render(<TemplatesPanel />)
    await waitFor(() => expect(screen.getAllByText('Aktív').length).toBeGreaterThan(0))
    expect(screen.getByText('Inaktív')).toBeTruthy()
  })

  it('shows trade type badges', async () => {
    mockFetch503()
    render(<TemplatesPanel />)
    await waitFor(() => expect(screen.getAllByText('Ajtó').length).toBeGreaterThan(0))
    expect(screen.getAllByText('Szekrény').length).toBeGreaterThan(0)
  })

  it('clicking a row opens detail SlideOver', async () => {
    mockFetch503()
    render(<TemplatesPanel />)
    await waitFor(() => screen.getByText('Standard ajtó sablon'))
    fireEvent.click(screen.getByText('Standard ajtó sablon'))
    await waitFor(() => expect(screen.getByText('Paraméterek (5)')).toBeTruthy())
  })

  it('detail SlideOver shows parameters table headers', async () => {
    mockFetch503()
    render(<TemplatesPanel />)
    await waitFor(() => screen.getByText('Standard ajtó sablon'))
    fireEvent.click(screen.getByText('Standard ajtó sablon'))
    await waitFor(() => expect(screen.getByText('Kulcs')).toBeTruthy())
    expect(screen.getByText('Érték')).toBeTruthy()
    expect(screen.getByText('Leírás')).toBeTruthy()
  })

  it('detail SlideOver shows parameter keys and values', async () => {
    mockFetch503()
    render(<TemplatesPanel />)
    await waitFor(() => screen.getByText('Standard ajtó sablon'))
    fireEvent.click(screen.getByText('Standard ajtó sablon'))
    await waitFor(() => expect(screen.getByText('width_mm')).toBeTruthy())
    expect(screen.getByText('900')).toBeTruthy()
  })

  it('detail SlideOver shows Graph JSON preview', async () => {
    mockFetch503()
    render(<TemplatesPanel />)
    await waitFor(() => screen.getByText('Standard ajtó sablon'))
    fireEvent.click(screen.getByText('Standard ajtó sablon'))
    await waitFor(() => expect(screen.getByText('Graph JSON előnézet')).toBeTruthy())
  })

  it('closing detail SlideOver removes it', async () => {
    mockFetch503()
    render(<TemplatesPanel />)
    await waitFor(() => screen.getByText('Standard ajtó sablon'))
    fireEvent.click(screen.getByText('Standard ajtó sablon'))
    await waitFor(() => screen.getByText('Bezárás'))
    fireEvent.click(screen.getByText('Bezárás'))
    await waitFor(() => expect(screen.queryByText('Paraméterek (5)')).toBeNull())
  })

  it('TEMPLATES_FALLBACK has 5 entries with expected fields', () => {
    expect(TEMPLATES_FALLBACK.length).toBe(5)
    expect(TEMPLATES_FALLBACK[0].tradeType).toBe('door')
    expect(TEMPLATES_FALLBACK[0].isActive).toBe(true)
    expect(TEMPLATES_FALLBACK[3].isActive).toBe(false)
  })
})
