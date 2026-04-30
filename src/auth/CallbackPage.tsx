import { useEffect } from 'react'
import { UserManager } from 'oidc-client-ts'
import { useNavigate } from 'react-router-dom'
import { authConfig } from './authConfig'

const userManager = new UserManager(authConfig)

export function CallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    userManager.signinRedirectCallback()
      .then(() => navigate('/w/dashboard', { replace: true }))
      .catch(() => navigate('/', { replace: true }))
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-stone-500 text-sm">Bejelentkezés...</div>
    </div>
  )
}
