import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DocsWorldPage } from '../DocsPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderDocs(path = '') {
  const url = path ? `/w/docs/${path}` : '/w/docs'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/docs" element={<DocsWorldPage />} />
        <Route path="/w/docs/:screen" element={<DocsWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DocsPage', () => {
  it('renders docs dashboard', () => {
    renderDocs()
    expect(screen.getAllByText(/Dokumentumtár/).length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderDocs()
    expect(screen.getAllByText('Összes dokumentum').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Kiadott').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ellenőrzés alatt').length).toBeGreaterThan(0)
  })

  it('dashboard shows recent docs', () => {
    renderDocs()
    expect(screen.getAllByText(/Petőfi|Bognár|Doorstar|FSC/).length).toBeGreaterThan(0)
  })

  it('renders files screen', () => {
    renderDocs('files')
    expect(screen.getAllByText(/Dokumentumok/).length).toBeGreaterThan(0)
  })

  it('files screen shows document names', () => {
    renderDocs('files')
    expect(screen.getAllByText(/Petőfi|Bognár|FSC|Doorstar/).length).toBeGreaterThan(0)
  })

  it('files screen shows type badges', () => {
    renderDocs('files')
    expect(screen.getAllByText(/Műszaki rajz|Szerződés|Tanúsítvány|Munkautasítás/).length).toBeGreaterThan(0)
  })

  it('files screen shows status badges', () => {
    renderDocs('files')
    expect(screen.getAllByText(/Kiadott|Ellenőrzés|Piszkozat|Archivált/).length).toBeGreaterThan(0)
  })

  it('clicking doc opens detail SlideOver', () => {
    renderDocs('files')
    fireEvent.click(screen.getAllByText(/Petőfi u\. 12\..*konyha kiviteli rajz/)[0])
    expect(screen.getAllByText(/DOC-2426-001/).length).toBeGreaterThan(0)
  })

  it('doc detail shows version history', () => {
    renderDocs('files')
    fireEvent.click(screen.getAllByText(/Petőfi u\. 12\..*konyha kiviteli rajz/)[0])
    expect(screen.getAllByText(/Verziótörténet|Első koncepció|Végleges méretek/).length).toBeGreaterThan(0)
  })

  it('doc detail shows note/description', () => {
    renderDocs('files')
    fireEvent.click(screen.getAllByText(/Petőfi u\. 12\..*konyha kiviteli rajz/)[0])
    expect(screen.getAllByText(/Jóváhagyott|gyártásra kiadva/).length).toBeGreaterThan(0)
  })

  it('doc detail shows owner', () => {
    renderDocs('files')
    fireEvent.click(screen.getAllByText(/Petőfi u\. 12\..*konyha kiviteli rajz/)[0])
    expect(screen.getAllByText(/Kovács Péter/).length).toBeGreaterThan(0)
  })

  it('files screen shows version numbers', () => {
    renderDocs('files')
    expect(screen.getAllByText(/v\d|verzió/).length).toBeGreaterThan(0)
  })

  it('files screen shows owner names', () => {
    renderDocs('files')
    expect(screen.getAllByText(/Kovács|Szabó|Tóth/).length).toBeGreaterThan(0)
  })

  it('dashboard shows document stats', () => {
    renderDocs()
    const allNums = screen.getAllByText(/^\d+$/)
    expect(allNums.length).toBeGreaterThan(0)
  })

  it('doc detail shows link info', () => {
    renderDocs('files')
    fireEvent.click(screen.getAllByText(/Petőfi u\. 12\..*konyha kiviteli rajz/)[0])
    expect(screen.getAllByText(/Kapcsolat|Petőfi u\. 12\./).length).toBeGreaterThan(0)
  })
})
