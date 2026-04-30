import { useAuth } from './AuthContext'
import { Navigate } from 'react-router-dom'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-teal-50/30">
        <div className="text-stone-400 text-sm">Betöltés...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Auto-redirect to Keycloak — vagy fallback navigate
    login()
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
