import { describe, it, expect } from 'vitest'
import { configure, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../App'

// The route pages are lazy chunks (React.lazy + Suspense) since F1-C, so every
// assertion awaits the chunk resolution via findBy*/findAllBy* queries.
//
// The default 1s findBy timeout is not enough for the bigger chunks (ProcurementPage
// pulls in the whole catalog panel) when the suite runs its files in parallel forks
// on a loaded machine — the Suspense fallback is still up at 1s and the query fails.
// The wait is chunk-import latency, not product behaviour, so give it real headroom.
configure({ asyncUtilTimeout: 5000 })

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )
}

describe('App Router', () => {
  it('renders home at /', async () => {
    renderApp('/')
    expect(await screen.findByText(/Jó reggelt/)).toBeTruthy()
  })

  it('renders shopfloor at /w/shopfloor', async () => {
    renderApp('/w/shopfloor')
    expect(await screen.findByText('Bejelentkezés')).toBeTruthy()
  })

  it('redirects unknown routes to home', async () => {
    renderApp('/nonexistent')
    expect(await screen.findByText(/Jó reggelt/)).toBeTruthy()
  })

  it('renders production world shell', async () => {
    renderApp('/w/production')
    const matches = await screen.findAllByText(/Gyártás/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders settings world shell', async () => {
    renderApp('/w/settings')
    const matches = await screen.findAllByText(/Beállítások/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders warehouse overview', async () => {
    renderApp('/w/warehouse')
    const matches = await screen.findAllByText(/Raktár/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders warehouse procurement screen', async () => {
    renderApp('/w/warehouse/procurement')
    expect(await screen.findByText('Aktív megrendelések')).toBeTruthy()
  })

  it('renders warehouse movements screen', async () => {
    renderApp('/w/warehouse/movements')
    expect(await screen.findByText('Backend endpoint nem elérhető')).toBeTruthy()
  })
})
