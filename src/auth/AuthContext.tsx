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

// Dev-bypass: VITE_AUTH_MODE=mock esetén Keycloak nélkül, mock userrel fut
// (pl. amíg a localhost redirect URI nincs felvéve a Keycloak kliensbe).
// Az import.meta.env.DEV guard miatt production buildben soha nem aktív.
const AUTH_MOCK = import.meta.env.DEV && import.meta.env.VITE_AUTH_MODE === 'mock'

const mockAuthValue: AuthContextValue = {
  user: {
    profile: {
      sub: '11111111-1111-4111-8111-111111111111',
      name: 'Dev Felhasználó',
      preferred_username: 'dev',
    },
    access_token: 'mock-token',
    expired: false,
  } as unknown as User,
  isAuthenticated: true,
  isLoading: false,
  login: async () => {},
  logout: async () => {},
  token: 'mock-token',
  tenantId: 'mock-tenant',
  roles: ['Admin'],
  enabledModules: ['crm', 'kontrolling', 'hr', 'maintenance', 'qa', 'ehs', 'dms'],
  facilityId: 'mock-facility',
  facilityName: 'Vác főüzem (mock)',
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (AUTH_MOCK) {
    return <AuthContext.Provider value={mockAuthValue}>{children}</AuthContext.Provider>
  }
  return <OidcAuthProvider>{children}</OidcAuthProvider>
}

// A facility a betöltéskori userhez kötve tárolódik — a kulcs-egyezés garantálja,
// hogy user-váltásnál/kijelentkezésnél nem szivárog át az előző bérlő üzeme.
interface FacilityState { userKey: string; id: string; name: string }

function OidcAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [facility, setFacility] = useState<FacilityState | null>(null)

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

  // Bootstrap facility after user loads — csak aszinkron setState (fetch után),
  // a "reset" a lenti kulcs-egyezéses származtatásból adódik, nem effekt-beli
  // setState-ből.
  useEffect(() => {
    if (!user || user.expired) return
    const { tenantId } = parseUserClaims(user)
    if (!tenantId || !user.profile.sub) return
    const userKey = `${user.profile.sub}:${tenantId}`

    fetch(`/api/tenants/${tenantId}/facilities?pageSize=100`, {
      headers: { Authorization: `Bearer ${user.access_token}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then((res: FacilitiesResponse | null) => {
        const picked = pickFacility(res?.items ?? [])
        if (picked) {
          setFacility({ userKey, id: picked.id, name: picked.name })
        }
      })
      .catch(() => { /* silent — facility remains null */ })
  }, [user])

  // Nincs prompt:'login' — élő Keycloak SSO-munkamenettel jelszó újbóli
  // bekérése nélkül enged vissza (a kényszerített re-auth volt a "mindig
  // kétszer kell belépni" érzés egyik forrása).
  const login = useCallback(() => userManager.signinRedirect({
    redirect_uri: window.location.origin + '/callback',
  }), [])

  // Valódi kijelentkezés: a Keycloak SSO-munkamenetet is lezárjuk
  // (signoutRedirect) — enélkül a prompt:'login' kivétele után bárki
  // jelszó nélkül visszaléphetne az előző fiókba egy közös gépen.
  const logout = useCallback(async () => {
    try {
      await userManager.signoutRedirect()
    } catch {
      // Keycloak nem elérhető — legalább a lokális munkamenetet dobjuk el
      await userManager.removeUser()
      window.location.href = window.location.origin + '/'
    }
  }, [])

  const { tenantId, roles, enabledModules } = parseUserClaims(user)

  // A facility csak akkor érvényes, ha a MOSTANI user+bérlő pároshoz töltöttük
  // be (a kulcsban a tid is benne van — tenant-váltásnál sem szivárog át).
  const activeFacility =
    user && !user.expired && user.profile.sub && facility &&
    facility.userKey === `${user.profile.sub}:${tenantId}`
      ? facility
      : null

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
      facilityId: activeFacility?.id ?? null,
      facilityName: activeFacility?.name ?? null,
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
