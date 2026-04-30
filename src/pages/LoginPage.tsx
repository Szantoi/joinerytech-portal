import { useEffect } from 'react'
import { useAuth } from '../auth'

// Since Keycloak now uses the JoineryTech theme, this page just redirects:
// - authenticated → /w
// - not authenticated → Keycloak login (which shows the JoineryTech design)
export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated) {
      window.location.replace('/w')
    } else {
      login()
    }
  }, [isAuthenticated, isLoading, login])

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-stone-400 text-sm">Bejelentkezés...</div>
    </div>
  )
}
