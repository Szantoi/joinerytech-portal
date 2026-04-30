import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userManager } from './AuthContext'

export function CallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    userManager.signinRedirectCallback()
      .then(() => navigate('/w', { replace: true }))
      .catch(() => navigate('/', { replace: true }))
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-teal-50/30">
      <div className="text-stone-400 text-sm">Bejelentkezés...</div>
    </div>
  )
}
