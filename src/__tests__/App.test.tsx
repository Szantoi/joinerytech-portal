import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../App'

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )
}

describe('App Router', () => {
  it('renders home at /', () => {
    renderApp('/')
    expect(screen.getByText(/J\u00f3 reggelt/)).toBeTruthy()
  })

  it('renders shopfloor at /w/shopfloor', () => {
    renderApp('/w/shopfloor')
    expect(screen.getByText('Bejelentkezés')).toBeTruthy()
  })

  it('redirects unknown routes to home', () => {
    renderApp('/nonexistent')
    expect(screen.getByText(/J\u00f3 reggelt/)).toBeTruthy()
  })

  it('renders production world shell', () => {
    renderApp('/w/production')
    const matches = screen.getAllByText(/Gy\u00e1rt\u00e1s/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders settings world shell', () => {
    renderApp('/w/settings')
    const matches = screen.getAllByText(/Be\u00e1ll\u00edt\u00e1sok/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders warehouse overview', () => {
    renderApp('/w/warehouse')
    const matches = screen.getAllByText(/Rakt\u00e1r/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders warehouse procurement screen', () => {
    renderApp('/w/warehouse/procurement')
    expect(screen.getByText('Akt\u00edv megrendel\u00e9sek')).toBeTruthy()
  })

  it('renders warehouse movements screen', () => {
    renderApp('/w/warehouse/movements')
    expect(screen.getByText('Backend endpoint nem elérhető')).toBeTruthy()
  })
})
