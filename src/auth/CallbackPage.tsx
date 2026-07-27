import { useEffect, useRef, useState } from 'react'
import { userManager } from './AuthContext'

export function CallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    // A callback-kód egyszer használatos — dupla effekt-futás (React StrictMode)
    // vagy frissítés esetén a második hívás garantáltan elhasal, és korábban
    // némán a /login-ra dobott VISSZA egy sikeres bejelentkezés után is.
    if (ran.current) return
    ran.current = true

    userManager.signinRedirectCallback()
      .then(() => {
        // Full page reload so AuthContext re-reads the stored user from sessionStorage
        // instead of relying on React state that may not have propagated yet.
        window.location.replace('/w')
      })
      .catch(async (err: unknown) => {
        console.error('OIDC callback hiba:', err)
        // Ha a user már el van mentve (pl. a kód már beváltódott egy korábbi
        // futásban), a bejelentkezés valójában SIKERES — nem hibázunk.
        const user = await userManager.getUser().catch(() => null)
        if (user && !user.expired) {
          window.location.replace('/w')
          return
        }
        setError(
          'A bejelentkezés megerősítése nem sikerült. Ez általában lejárt vagy már felhasznált belépési kódot jelent — indítsd újra a bejelentkezést.'
        )
      })
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-teal-50/30 px-5">
        <div className="w-full max-w-[400px] text-center">
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 border border-red-200 text-[12.5px] text-red-800 leading-relaxed text-left"
          >
            {error}
          </div>
          <a
            href="/login"
            className="mt-4 inline-flex items-center justify-center w-full h-11 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[13.5px] font-semibold"
          >
            Vissza a bejelentkezéshez
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-teal-50/30">
      <div className="text-stone-400 text-sm">Bejelentkezés...</div>
    </div>
  )
}
