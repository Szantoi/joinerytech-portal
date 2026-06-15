import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { TasksWorldPage } from '../TasksPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderTasks(path = '') {
  const url = path ? `/w/tasks/${path}` : '/w/tasks'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/tasks" element={<TasksWorldPage />} />
        <Route path="/w/tasks/:screen" element={<TasksWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TasksPage', () => {
  it('renders tasks dashboard', () => {
    renderTasks()
    expect(screen.getAllByText(/Feladataim/).length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderTasks()
    expect(screen.getAllByText('Lejárt').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ma esedékes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Folyamatban').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Kész ezen a héten').length).toBeGreaterThan(0)
  })

  it('dashboard shows recent tasks', () => {
    renderTasks()
    expect(screen.getAllByText(/Doorstar|NCR-2026|Karbantartási/).length).toBeGreaterThan(0)
  })

  it('renders mytasks screen', () => {
    renderTasks('mytasks')
    expect(screen.getAllByText(/Saját feladatok/).length).toBeGreaterThan(0)
  })

  it('mytasks shows task items', () => {
    renderTasks('mytasks')
    expect(screen.getAllByText(/Doorstar|NCR-2026|Karbantartási|Petőfi/).length).toBeGreaterThan(0)
  })

  it('mytasks shows priority badges', () => {
    renderTasks('mytasks')
    expect(screen.getAllByText(/Sürgős|Magas|Közepes|Alacsony/).length).toBeGreaterThan(0)
  })

  it('clicking task opens detail SlideOver', () => {
    renderTasks('mytasks')
    fireEvent.click(screen.getAllByText(/Doorstar ajánlat finalizálása/)[0])
    expect(screen.getAllByText(/TASK-001/).length).toBeGreaterThan(0)
  })

  it('task detail shows assignee', () => {
    renderTasks('mytasks')
    fireEvent.click(screen.getAllByText(/Doorstar ajánlat finalizálása/)[0])
    expect(screen.getAllByText(/Kovács Péter/).length).toBeGreaterThan(0)
  })

  it('task detail shows subtasks progress', () => {
    renderTasks('mytasks')
    fireEvent.click(screen.getAllByText(/Doorstar ajánlat finalizálása/)[0])
    expect(screen.getAllByText(/Részfeladatok|teljesítve/).length).toBeGreaterThan(0)
  })

  it('renders kanban screen', () => {
    renderTasks('kanban')
    expect(screen.getAllByText(/Kanban/).length).toBeGreaterThan(0)
  })

  it('kanban shows column headers', () => {
    renderTasks('kanban')
    expect(screen.getAllByText(/Todo|In Progress|Review|Done|Teendő|Folyamatban|Átvizsgálás|Kész/).length).toBeGreaterThan(0)
  })

  it('kanban shows task items', () => {
    renderTasks('kanban')
    expect(screen.getAllByText(/Doorstar|NCR-2026|Havi jelenléti/).length).toBeGreaterThan(0)
  })

  it('kanban shows status badges', () => {
    renderTasks('kanban')
    expect(screen.getAllByText(/Teendő|Folyamatban|Átvizsgálás|Kész/).length).toBeGreaterThan(0)
  })

  it('mytasks shows status pills', () => {
    renderTasks('mytasks')
    expect(screen.getAllByText(/Folyamatban|Átvizsgálás/).length).toBeGreaterThan(0)
  })

  it('mytasks shows due dates', () => {
    renderTasks('mytasks')
    expect(screen.getAllByText(/2026-06/).length).toBeGreaterThan(0)
  })
})
