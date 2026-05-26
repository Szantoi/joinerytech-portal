/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { UserManager, User } from 'oidc-client-ts'
import { authConfig } from './authConfig'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  token: string | null
  tenantId: string | null
  roles: string[]
  enabledModules: string[]
  facilityId: string | null
  facilityName: string | null
}

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  try {
    const payload = jwt.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>
  } catch {
    return {}
  }
}

function parseUserClaims(user: User | null) {
  if (!user) return { tenantId: null, roles: [], enabledModules: [] }

  // Access token has realm_access.roles + custom claims
  const at = user.access_token ? decodeJwtPayload(user.access_token) : {}
  const realmAccess = at['realm_access'] as { roles?: string[] } | undefined
  const roles = realmAccess?.roles?.filter(r => ['Admin', 'Designer', 'Joiner'].includes(r)) ?? []

  // Custom claims present in both ID token (profile) and access token
  const profile = user.profile as Record<string, unknown>
  const tidSource = (at['tid'] ?? profile['tid']) as string | undefined
  const tenantId = tidSource ?? null

  const rawModules = (at['enabled_modules'] ?? profile['enabled_modules'])
  const enabledModules: string[] = Array.isArray(rawModules)
    ? (rawModules as unknown[]).map(String)
    : rawModules ? [String(rawModules)] : []

  return { tenantId, roles, enabledModules }
}

interface FacilityItem { id: string; name: string }
interface FacilitiesResponse { items: FacilityItem[] }

// Prefer a named "real" facility over E2E/auto-generated ones
function pickFacility(items: FacilityItem[]): FacilityItem | null {
  if (!items.length) return null
  return (
    items.find(f => f.name === 'Vác főüzem') ??
    items.find(f => f.name === 'Doorstar Üzem') ??
    items.find(f => !f.name.startsWith('E2E') && !f.name.match(/^Fac\d/) && !f.name.match(/^Fac-/)) ??
    items[0]
  )
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const userManager = new UserManager(authConfig)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [facilityName, setFacilityName] = useState<string | null>(null)

  useEffect(() => {
    userManager.getUser().then((u) => {
      setUser(u)
      setIsLoading(false)
    })

    const onUserLoaded = (u: User) => setUser(u)
    const onUserUnloaded = () => setUser(null)

    userManager.events.addUserLoaded(onUserLoaded)
    userManager.events.addUserUnloaded(onUserUnloaded)

    return () => {
      userManager.events.removeUserLoaded(onUserLoaded)
      userManager.events.removeUserUnloaded(onUserUnloaded)
    }
  }, [])

  // Bootstrap facilityId after user loads
  useEffect(() => {
    if (!user || user.expired) {
      setFacilityId(null)
      setFacilityName(null)
      return
    }
    const { tenantId } = parseUserClaims(user)
    if (!tenantId) return

    fetch(`/api/tenants/${tenantId}/facilities?pageSize=100`, {
      headers: { Authorization: `Bearer ${user.access_token}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then((res: FacilitiesResponse | null) => {
        const facility = pickFacility(res?.items ?? [])
        if (facility) {
          setFacilityId(facility.id)
          setFacilityName(facility.name)
        }
      })
      .catch(() => { /* silent — facilityId remains null */ })
  }, [user])

  const login = useCallback(() => userManager.signinRedirect({
    redirect_uri: window.location.origin + '/callback',
    prompt: 'login',
  }), [])

  const logout = useCallback(async () => {
    await userManager.removeUser()
    setFacilityId(null)
    setFacilityName(null)
    window.location.href = window.location.origin + '/'
  }, [])

  const { tenantId, roles, enabledModules } = parseUserClaims(user)

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user && !user.expired,
      isLoading,
      login,
      logout,
      token: user?.access_token ?? null,
      tenantId,
      roles,
      enabledModules,
      facilityId,
      facilityName,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
