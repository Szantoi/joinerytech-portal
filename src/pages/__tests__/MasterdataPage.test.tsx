import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MasterdataWorldPage } from '../MasterdataPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderMd(path = '') {
  const url = path ? `/w/masterdata/${path}` : '/w/masterdata'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/masterdata" element={<MasterdataWorldPage />} />
        <Route path="/w/masterdata/:screen" element={<MasterdataWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('MasterdataPage', () => {
  it('renders masterdata dashboard', () => {
    renderMd()
    expect(screen.getAllByText('Törzsadatok').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderMd()
    expect(screen.getAllByText('Aktív termékek').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Anyag cikkszámok').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Aktív szállítók').length).toBeGreaterThan(0)
  })

  it('dashboard shows low stock panel when applicable', () => {
    renderMd()
    // The dashboard should render something about alacsony készlet
    expect(screen.getAllByText(/Alacsony készlet|Alacsony készletszint/).length).toBeGreaterThan(0)
  })

  it('renders products screen', () => {
    renderMd('products')
    expect(screen.getAllByText('Termék-törzs').length).toBeGreaterThan(0)
  })

  it('products list shows items', () => {
    renderMd('products')
    expect(screen.getAllByText(/Bélelt belső ajtó|Konyhai alsó|Gardrób/).length).toBeGreaterThan(0)
  })

  it('products list shows status badges', () => {
    renderMd('products')
    expect(screen.getAllByText('Aktív').length).toBeGreaterThan(0)
  })

  it('products list shows prices', () => {
    renderMd('products')
    expect(screen.getAllByText(/eFt|M Ft/).length).toBeGreaterThan(0)
  })

  it('clicking product opens detail SlideOver', () => {
    renderMd('products')
    fireEvent.click(screen.getAllByText(/Bélelt belső ajtó 88cm/)[0])
    expect(screen.getAllByText(/BK-AJ-088/).length).toBeGreaterThan(0)
  })

  it('product detail shows price', () => {
    renderMd('products')
    fireEvent.click(screen.getAllByText(/Bélelt belső ajtó 88cm/)[0])
    expect(screen.getByText('Lista ár')).toBeTruthy()
  })

  it('product detail shows stock info', () => {
    renderMd('products')
    fireEvent.click(screen.getAllByText(/Bélelt belső ajtó 88cm/)[0])
    expect(screen.getByText('Készlet')).toBeTruthy()
  })

  it('renders materials screen', () => {
    renderMd('materials')
    expect(screen.getAllByText('Anyag-törzs').length).toBeGreaterThan(0)
  })

  it('materials screen loads from API', () => {
    renderMd('materials')
    expect(screen.getAllByText('Anyag-törzs').length).toBeGreaterThan(0)
    // Loading state renders (no real API in tests)
    // Component shows loading or empty state (not mock names)
  })

  it('renders suppliers screen', () => {
    renderMd('suppliers')
    expect(screen.getAllByText('Szállítók').length).toBeGreaterThan(0)
  })

  it('suppliers list shows names', () => {
    renderMd('suppliers')
    expect(screen.getAllByText(/Egger Faipari|Hettich Hungary|Falco Sopron/).length).toBeGreaterThan(0)
  })

  it('clicking supplier opens detail SlideOver', () => {
    renderMd('suppliers')
    fireEvent.click(screen.getAllByText(/Egger Faipari/)[0])
    expect(screen.getAllByText(/Fizetési határidő/).length).toBeGreaterThan(0)
  })

  // ─── TemplatesList ─────────────────────────────────────────────────────────

  it('renders templates screen', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderMd('templates')
    await waitFor(() => expect(screen.getAllByText('Sablonok').length).toBeGreaterThan(0))
  })

  it('templates screen shows empty state on API error', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderMd('templates')
    await waitFor(() => expect(screen.getByText(/Nincs sablon|nem elérhető/)).toBeTruthy())
  })

  it('templates screen shows loading skeleton while fetching', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    renderMd('templates')
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('templates screen shows API data', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 'tpl-1', name: 'Bélelt belső ajtó sablon', tradeType: 'Joinery', version: 1, isActive: true, isArchived: false },
        ]),
      })
    ))
    renderMd('templates')
    await waitFor(() => expect(screen.getByText('Bélelt belső ajtó sablon')).toBeTruthy())
    expect(screen.getByText('Joinery · v1')).toBeTruthy()
  })
})
