import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SupervisorWorldPage } from '../SupervisorPage'
import { WORKSTATIONS } from '../../mocks/supervisor'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.includes('/tools/workstations')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(WORKSTATIONS) })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderSup(path = '') {
  const url = path ? `/w/supervisor/${path}` : '/w/supervisor'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/supervisor" element={<SupervisorWorldPage />} />
        <Route path="/w/supervisor/:screen" element={<SupervisorWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('SupervisorPage', () => {
  it('renders supervisor dashboard', () => {
    renderSup()
    expect(screen.getAllByText('Műszakvezető').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderSup()
    expect(screen.getAllByText('Dolgozik').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Blokkolt').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Napi terv').length).toBeGreaterThan(0)
  })

  it('dashboard shows alert panel', () => {
    renderSup()
    expect(screen.getByText(/CNC program feltöltés hiányzik/)).toBeTruthy()
  })

  it('dashboard shows high severity alerts', () => {
    renderSup()
    expect(screen.getAllByText('Magas').length).toBeGreaterThan(0)
  })

  it('dashboard shows workstation cards', async () => {
    renderSup()
    await waitFor(() => expect(screen.getAllByText('Holzma HPP380').length).toBeGreaterThan(0))
    expect(screen.getAllByText('Biesse Rover CNC').length).toBeGreaterThan(0)
  })

  it('dashboard shows workstation states', async () => {
    renderSup()
    await waitFor(() => expect(screen.getAllByText('Dolgozik').length).toBeGreaterThan(0))
    expect(screen.getAllByText('Blokkolt').length).toBeGreaterThan(0)
  })

  it('clicking workstation opens detail SlideOver', async () => {
    renderSup()
    await waitFor(() => expect(screen.getAllByText('Holzma HPP380').length).toBeGreaterThan(0))
    fireEvent.click(screen.getAllByText('Holzma HPP380')[0])
    expect(screen.getAllByText('Szabászat').length).toBeGreaterThan(0)
    expect(screen.getByText(/Kihasználtság ma/)).toBeTruthy()
  })

  it('blocked workstation shows blocked reason in detail', async () => {
    renderSup()
    await waitFor(() => expect(screen.getAllByText('Biesse Rover CNC').length).toBeGreaterThan(0))
    fireEvent.click(screen.getAllByText('Biesse Rover CNC')[0])
    expect(screen.getAllByText(/CNC program/).length).toBeGreaterThan(0)
  })

  it('workstation detail shows operator name', async () => {
    renderSup()
    await waitFor(() => expect(screen.getAllByText('Holzma HPP380').length).toBeGreaterThan(0))
    fireEvent.click(screen.getAllByText('Holzma HPP380')[0])
    expect(screen.getAllByText('Nagy J.').length).toBeGreaterThan(0)
  })

  it('day plan button opens SlideOver', () => {
    renderSup()
    fireEvent.click(screen.getAllByText('Napi terv')[0])
    expect(screen.getAllByText('Napi terv').length).toBeGreaterThan(0)
  })

  it('renders floor screen', () => {
    renderSup('floor')
    expect(screen.getAllByText('Műhely-floor').length).toBeGreaterThan(0)
  })

  it('floor screen shows all workstations', async () => {
    renderSup('floor')
    await waitFor(() => expect(screen.getAllByText('Holzma HPP380').length).toBeGreaterThan(0))
    expect(screen.getAllByText('Homag KAL 310').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Szerelőpad 1').length).toBeGreaterThan(0)
  })

  it('floor screen shows utilization percentages', async () => {
    renderSup('floor')
    await waitFor(() => expect(screen.getAllByText(/82%|68%/).length).toBeGreaterThan(0))
  })

  it('renders dayplan screen', () => {
    renderSup('dayplan')
    expect(screen.getAllByText('Napi terv').length).toBeGreaterThan(0)
  })

  it('dayplan screen shows planned items', () => {
    renderSup('dayplan')
    expect(screen.getAllByText(/Bognár|Doorstar|Hegyi/).length).toBeGreaterThan(0)
  })

  it('dayplan shows status labels', () => {
    renderSup('dayplan')
    expect(screen.getAllByText(/Folyamatban|Blokkolt|Késő|Kész/).length).toBeGreaterThan(0)
  })

  it('late items visible in dayplan', () => {
    renderSup('dayplan')
    expect(screen.getAllByText('Késő').length).toBeGreaterThan(0)
  })
})
