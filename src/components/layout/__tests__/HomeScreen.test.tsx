import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HomeScreen } from '../HomeScreen'
import type { AuthContextValue } from '@spaceos/portal-core'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('../../../hooks/useAuth', () => ({ useAuth: useAuthMock }))

const authValue: AuthContextValue = {
  user: null, isAuthenticated: true, isLoading: false,
  login: vi.fn(), logout: vi.fn(), token: 'test-token',
  tenantId: '11111111-1111-4111-8111-111111111111', roles: ['Admin'],
  enabledModules: ['crm', 'maintenance'], facilityId: null, facilityName: null,
}

function renderHome(
  onEnter = vi.fn(),
  enabledModules = authValue.enabledModules,
  overrides: Partial<AuthContextValue> = {},
) {
  useAuthMock.mockReturnValue({ ...authValue, enabledModules, ...overrides })
  return render(<HomeScreen onEnter={onEnter} />)
}

describe('HomeScreen', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue(authValue)
  })

  it('renders greeting', () => {
    renderHome()
    expect(screen.getByText(/J\u00f3 reggelt/)).toBeTruthy()
  })

  it('renders world cards', () => {
    renderHome()
    expect(screen.getByText('CRM')).toBeTruthy()
    expect(screen.getByText('Karbantart\u00e1s')).toBeTruthy()
    expect(screen.queryByText('Gy\u00e1rt\u00e1s')).toBeNull()
  })

  it('changes the grid by claim and keeps only the base world for an empty claim', () => {
    const { rerender } = renderHome(vi.fn(), ['crm'])
    expect(screen.getByText('CRM')).toBeTruthy()
    expect(screen.queryByText('Karbantart\u00e1s')).toBeNull()

    useAuthMock.mockReturnValue({ ...authValue, enabledModules: [] })
    rerender(<HomeScreen onEnter={vi.fn()} />)
    expect(screen.getByText('Be\u00e1ll\u00edt\u00e1sok')).toBeTruthy()
    expect(screen.queryByText('CRM')).toBeNull()
  })

  it('shows the modern production world and settings, but no Admin worlds, to a Joiner', () => {
    renderHome(vi.fn(), [
      'spaceos.crm', 'spaceos.controlling', 'spaceos.hr', 'spaceos.maintenance',
      'spaceos.qa', 'spaceos.ehs', 'spaceos.dms', 'joinerytech.cutting',
      'joinerytech.joinery', 'joinerytech.inventory', 'joinerytech.procurement',
    ], { roles: ['Joiner'] })

    expect(screen.getByText('Gyártás')).toBeTruthy()
    expect(screen.getByText('Beállítások')).toBeTruthy()
    expect(screen.queryByText('CRM')).toBeNull()
    expect(screen.queryByText('Raktár')).toBeNull()
  })

  it('keeps hidden legacy worlds out of an anonymous grid', () => {
    renderHome(vi.fn(), authValue.enabledModules, { isAuthenticated: false, roles: [] })

    expect(screen.getByText('Beállítások')).toBeTruthy()
    expect(screen.queryByText('Értékesítés')).toBeNull()
  })

  it('renders recent activity', () => {
    renderHome()
    expect(screen.getByText('Legut\u00f3bbi tev\u00e9kenys\u00e9g')).toBeTruthy()
  })

  it('calls onEnter when world card is clicked', () => {
    const fn = vi.fn()
    renderHome(fn)
    fireEvent.click(screen.getByText('CRM'))
    expect(fn).toHaveBeenCalledWith('crm')
  })

  it('renders user info', () => {
    renderHome()
    const matches = screen.getAllByText(/Kov\u00e1cs P\u00e9ter/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders version footer', () => {
    renderHome()
    expect(screen.getByText(/v3\.2\.1/)).toBeTruthy()
  })
})
