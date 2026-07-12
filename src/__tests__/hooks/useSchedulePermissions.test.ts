import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSchedulePermissions } from '../../hooks/useSchedulePermissions'
import { useAuth } from '../../auth'

// Mock useAuth hook
vi.mock('../../auth', () => ({
  useAuth: vi.fn(),
}))

describe('useSchedulePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns maxPriority=5 for machine_operator role', () => {
    vi.mocked(useAuth).mockReturnValue({
      roles: ['machine_operator'],
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      token: null,
      tenantId: null,
      enabledModules: [],
      facilityId: null,
      facilityName: null,
    })

    const { maxPriority, canAssignBatches, isReadOnly } = useSchedulePermissions()

    expect(maxPriority).toBe(5)
    expect(canAssignBatches).toBe(true)
    expect(isReadOnly).toBe(false)
  })

  it('returns maxPriority=10 for production_manager role', () => {
    vi.mocked(useAuth).mockReturnValue({
      roles: ['production_manager'],
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      token: null,
      tenantId: null,
      enabledModules: [],
      facilityId: null,
      facilityName: null,
    })

    const { maxPriority, canAssignBatches, isReadOnly } = useSchedulePermissions()

    expect(maxPriority).toBe(10)
    expect(canAssignBatches).toBe(true)
    expect(isReadOnly).toBe(false)
  })

  it('returns isReadOnly=true for viewer role', () => {
    vi.mocked(useAuth).mockReturnValue({
      roles: ['viewer'],
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      token: null,
      tenantId: null,
      enabledModules: [],
      facilityId: null,
      facilityName: null,
    })

    const { maxPriority, canAssignBatches, isReadOnly } = useSchedulePermissions()

    expect(maxPriority).toBe(5) // Default
    expect(canAssignBatches).toBe(false)
    expect(isReadOnly).toBe(true)
  })

  it('handles both machine_operator and production_manager roles (machine_operator takes precedence for max)', () => {
    vi.mocked(useAuth).mockReturnValue({
      roles: ['machine_operator', 'other_role'],
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      token: null,
      tenantId: null,
      enabledModules: [],
      facilityId: null,
      facilityName: null,
    })

    const { maxPriority, canAssignBatches } = useSchedulePermissions()

    expect(canAssignBatches).toBe(true)
    expect(maxPriority).toBe(5) // machine_operator max
  })
})
