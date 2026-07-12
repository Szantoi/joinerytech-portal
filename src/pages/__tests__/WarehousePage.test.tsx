import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LotsPage, ZoneMapPage, MovementLogPage } from '../warehouse/LotsPage'

function renderLots() {
  return render(
    <MemoryRouter initialEntries={['/lots']}>
      <Routes>
        <Route path="/lots" element={<LotsPage />} />
      </Routes>
    </MemoryRouter>
  )
}

function renderZones() {
  return render(
    <MemoryRouter initialEntries={['/zones']}>
      <Routes>
        <Route path="/zones" element={<ZoneMapPage />} />
      </Routes>
    </MemoryRouter>
  )
}

function renderMovements() {
  return render(
    <MemoryRouter initialEntries={['/movements']}>
      <Routes>
        <Route path="/movements" element={<MovementLogPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LotsPage', () => {
  it('renders heading', () => {
    renderLots()
    expect(screen.getByText('Lot-kezelés')).toBeTruthy()
  })

  it('renders subheading', () => {
    renderLots()
    expect(screen.getByText(/Aktív lot-ok/)).toBeTruthy()
  })

  it('shows endpoint pending banner', () => {
    renderLots()
    expect(screen.getByText('Backend endpoint nem elérhető')).toBeTruthy()
  })

  it('shows endpoint path in pending banner', () => {
    renderLots()
    expect(screen.getByText(/inventory\/lots/)).toBeTruthy()
  })

  it('shows implementation note', () => {
    renderLots()
    expect(screen.getByText(/Az endpoint implementálása/)).toBeTruthy()
  })
})

describe('ZoneMapPage', () => {
  it('renders zone map heading', () => {
    renderZones()
    expect(screen.getByText('Zóna-térkép')).toBeTruthy()
  })

  it('renders subheading', () => {
    renderZones()
    expect(screen.getByText(/Lot-ok eloszlása/)).toBeTruthy()
  })

  it('shows endpoint pending banner', () => {
    renderZones()
    expect(screen.getByText('Backend endpoint nem elérhető')).toBeTruthy()
  })

  it('shows zones endpoint path', () => {
    renderZones()
    expect(screen.getByText(/inventory\/zones/)).toBeTruthy()
  })
})

describe('MovementLogPage', () => {
  it('renders movement log heading', () => {
    renderMovements()
    expect(screen.getByText('Mozgások naplója')).toBeTruthy()
  })

  it('renders subheading with movement types', () => {
    renderMovements()
    expect(screen.getByText(/Bevét.*Kivét/)).toBeTruthy()
  })

  it('shows endpoint pending banner', () => {
    renderMovements()
    expect(screen.getByText('Backend endpoint nem elérhető')).toBeTruthy()
  })

  it('shows movements endpoint path', () => {
    renderMovements()
    expect(screen.getByText(/inventory\/movements/)).toBeTruthy()
  })
})
