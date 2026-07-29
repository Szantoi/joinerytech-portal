import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }))

vi.mock('@spaceos/portal-core', () => ({
  useAuth: () => authMock(),
  RequireAuth: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

import { RequireAuth } from './RequireAuth'

function renderGate(path: string, enabledModules: string[]) {
  authMock.mockReturnValue({ enabledModules })
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RequireAuth><div>Protected content</div></RequireAuth>
    </MemoryRouter>,
  )
}

describe('portal RequireAuth module gate', () => {
  it('blocks a direct URL for a world outside the tenant subscription', () => {
    renderGate('/w/production', ['crm'])

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.queryByText('Protected content')).toBeNull()
  })

  it('blocks a hidden legacy world even for a fully entitled tenant', () => {
    renderGate('/w/shopfloor', ['cutting', 'joinery', 'inventory', 'procurement'])

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.queryByText('Protected content')).toBeNull()
  })

  it('allows a direct URL for an entitled world', () => {
    renderGate('/w/crm', ['crm'])

    expect(screen.getByText('Protected content')).toBeTruthy()
  })
})
