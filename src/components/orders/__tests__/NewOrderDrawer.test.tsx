import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NewOrderDrawer } from '../NewOrderDrawer'

vi.mock('../../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test' } },
  })),
}))

afterEach(() => { vi.unstubAllGlobals() })

function mockFetch201(id = 'order-uuid-1') {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
    ok: true, status: 201,
    json: () => Promise.resolve({ id }),
  })))
}

function mockFetch503() {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
}

describe('NewOrderDrawer', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<NewOrderDrawer open={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders drawer title when open (mock mode)', () => {
    render(<NewOrderDrawer open={true} onClose={() => {}} />)
    expect(screen.getByText('Új rendelés')).toBeTruthy()
  })

  it('renders type selector buttons in mock mode', () => {
    render(<NewOrderDrawer open={true} onClose={() => {}} />)
    expect(screen.getByText('Ajtó')).toBeTruthy()
    expect(screen.getByText('Szekrény')).toBeTruthy()
  })

  it('calls onClose when Mégse clicked', () => {
    const onClose = vi.fn()
    render(<NewOrderDrawer open={true} onClose={onClose} />)
    fireEvent.click(screen.getByText('Mégse'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  // POST mode tests
  it('renders POST mode title when flowEpicId provided', () => {
    render(<NewOrderDrawer open={true} onClose={() => {}} flowEpicId="EPIC-001" />)
    expect(screen.getByText('Rendelés indítása')).toBeTruthy()
  })

  it('renders project fields in POST mode', () => {
    render(<NewOrderDrawer open={true} onClose={() => {}} flowEpicId="EPIC-001" />)
    expect(screen.getByPlaceholderText('pl. Bognár konyha')).toBeTruthy()
    expect(screen.getByPlaceholderText('pl. DOOR-2026-001')).toBeTruthy()
    expect(screen.getByPlaceholderText('pl. Bognár Gábor')).toBeTruthy()
    expect(screen.getByPlaceholderText('+36 30 123 4567')).toBeTruthy()
  })

  it('shows validation errors on empty submit in POST mode', async () => {
    mockFetch503()
    render(<NewOrderDrawer open={true} onClose={() => {}} flowEpicId="EPIC-001" />)
    fireEvent.click(screen.getByText('Rendelés létrehozása →'))
    await waitFor(() => {
      const errs = screen.getAllByText('Kötelező mező')
      expect(errs.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('calls onSuccess with orderId on successful POST', async () => {
    mockFetch201('new-order-42')
    const onSuccess = vi.fn()
    render(<NewOrderDrawer open={true} onClose={() => {}} flowEpicId="EPIC-001" onSuccess={onSuccess} />)
    fireEvent.change(screen.getByPlaceholderText('pl. Bognár konyha'), { target: { value: 'Teszt projekt' } })
    fireEvent.change(screen.getByPlaceholderText('pl. DOOR-2026-001'), { target: { value: 'DOOR-2026-001' } })
    fireEvent.click(screen.getByText('Rendelés létrehozása →'))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('new-order-42'))
  })

  it('does not call onSuccess without required fields', async () => {
    mockFetch503()
    const onSuccess = vi.fn()
    render(<NewOrderDrawer open={true} onClose={() => {}} flowEpicId="EPIC-001" onSuccess={onSuccess} />)
    fireEvent.change(screen.getByPlaceholderText('pl. Bognár konyha'), { target: { value: 'Teszt' } })
    // projectId not filled
    fireEvent.click(screen.getByText('Rendelés létrehozása →'))
    await waitFor(() => expect(screen.getAllByText('Kötelező mező').length).toBeGreaterThan(0))
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('shows POST mode without optional client fields filled', async () => {
    mockFetch201('oid-1')
    const onSuccess = vi.fn()
    render(<NewOrderDrawer open={true} onClose={() => {}} flowEpicId="EPIC-XYZ" onSuccess={onSuccess} />)
    fireEvent.change(screen.getByPlaceholderText('pl. Bognár konyha'), { target: { value: 'Szekrénysor' } })
    fireEvent.change(screen.getByPlaceholderText('pl. DOOR-2026-001'), { target: { value: 'PROJ-001' } })
    fireEvent.click(screen.getByText('Rendelés létrehozása →'))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('oid-1'))
  })
})
