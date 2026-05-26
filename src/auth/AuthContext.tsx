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

const AuthContext = createContext<AuthContextValue | null>(null)

export const userManager = new UserManager(authConfig)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const login = useCallback(() => userManager.signinRedirect({
    redirect_uri: window.location.origin + '/callback',
    prompt: 'login',
  }), [])
  const logout = useCallback(async () => {
    // Clear local session immediately.
    await userManager.removeUser()
    // For full Keycloak SSO logout, add the app origin to
    // "Valid post logout redirect URIs" in the portal-app client config,
    // then replace the line below with: userManager.signoutRedirect(...)
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
