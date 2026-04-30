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
  }), [])
  const logout = useCallback(async () => {
    // Clear local session immediately.
    await userManager.removeUser()
    // For full Keycloak SSO logout, add the app origin to
    // "Valid post logout redirect URIs" in the portal-app client config,
    // then replace the line below with: userManager.signoutRedirect(...)
    window.location.href = window.location.origin + '/'
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user && !user.expired,
      isLoading,
      login,
      logout,
      token: user?.access_token ?? null,
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
