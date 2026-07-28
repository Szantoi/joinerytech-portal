import { useState, useEffect } from 'react'
import { useAuth } from '../auth'
import { Icon } from '@spaceos/portal-ui'

export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If already authenticated, redirect to home
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.replace('/w')
    }
  }, [isAuthenticated, isLoading])

  // Vissza-gombbal (bfcache-ből) visszatérve a busy-állapot beragadna —
  // a pageshow persisted eseménye jelzi, hogy nem friss betöltés történt.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(false)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const handleLogin = () => {
    setBusy(true)
    setError(null)
    login().catch(() => {
      // signinRedirect elnavigál — ide csak akkor jutunk, ha az átirányítás el sem indult
      setBusy(false)
      setError('Nem sikerült elérni a bejelentkezési szolgáltatást. Ellenőrizd az internetkapcsolatot, majd próbáld újra.')
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Betöltés...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-stone-50">
      {/* LEFT — brand storyboard panel */}
      <aside className="hidden lg:flex flex-col w-[44%] xl:w-[48%] relative overflow-hidden bg-stone-900 text-stone-100">
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, transparent 0 22px, rgba(255,255,255,0.07) 22px 23px)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 600px at 80% 10%, rgba(13,148,136,0.35), transparent 60%), radial-gradient(700px 500px at 10% 90%, rgba(180,83,9,0.25), transparent 60%)',
          }}
        />

        <div className="relative px-12 pt-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-600 grid place-items-center">
              <Icon name="wrench" size={18} className="text-white" />
            </div>
            <div className="text-[16px] font-semibold tracking-tight">
              joinery<span className="text-teal-400">/</span>tech
            </div>
          </div>
        </div>

        <div className="relative flex-1 flex flex-col justify-center px-12 py-12 max-w-[640px]">
          <div className="text-[11px] uppercase tracking-[0.22em] text-teal-300/80 mb-4">
            Bútor- és nyílászárógyártóknak
          </div>
          <h1 className="text-[42px] xl:text-[48px] font-semibold leading-[1.05] tracking-tight">
            Egy rendszer
            <br />
            a tervezéstől
            <br />
            <span className="text-teal-400">a kiszállításig.</span>
          </h1>
          <p className="text-[14px] text-stone-300/90 mt-5 max-w-md leading-relaxed">
            Parametrikus sablonok, automatikus szabászat, élő gépterhelés és raktárkészlet — egy helyen, magyar nyelven.
          </p>
        </div>

        <div className="relative px-12 pb-10 flex items-center justify-between text-[11px] text-stone-400">
          <div className="flex items-center gap-4">
            <span>Magyarország</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-stone-200">
              Adatvédelem
            </a>
            <a href="#terms" className="hover:text-stone-200">
              ÁSZF
            </a>
          </div>
        </div>
      </aside>

      {/* RIGHT — auth */}
      <main className="flex-1 flex flex-col">
        {/* mobile brand */}
        <div className="lg:hidden flex items-center gap-2 px-5 py-4 border-b border-stone-200 bg-white">
          <div className="w-8 h-8 rounded-lg bg-teal-600 grid place-items-center">
            <Icon name="wrench" size={16} className="text-white" />
          </div>
          <div className="text-[14px] font-semibold tracking-tight">
            joinery<span className="text-teal-600">/</span>tech
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[400px]">
            <div className="mb-7">
              <h2 className="text-[26px] font-semibold tracking-tight text-stone-900">Üdv újra!</h2>
              <p className="text-[13px] text-stone-500 mt-1">
                Lépj be a céges fiókoddal — a gombra kattintva a biztonságos
                bejelentkezési oldalra irányítunk, és utána visszahozunk ide.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[12.5px] text-red-800 leading-relaxed"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={busy}
              className="w-full h-11 rounded-lg bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-60 disabled:cursor-wait text-white text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 shadow-sm shadow-teal-900/10 transition"
            >
              {busy ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Átirányítás a bejelentkezéshez…
                </>
              ) : (
                <>
                  Bejelentkezés <Icon name="chevron" size={14} />
                </>
              )}
            </button>

            <p className="mt-4 text-[11.5px] text-stone-500 leading-relaxed">
              A jelszavadat kizárólag a központi bejelentkezési oldalon kell megadnod
              — ha ott már van élő munkameneted, jelszó nélkül visszaengedünk.
            </p>

            <div className="mt-6 pt-5 border-t border-stone-100 text-[11.5px] text-stone-500 leading-relaxed">
              Üzemi (Shop Floor) belépéshez ne itt jelentkezz be — a portál Home
              oldalán válaszd az „Üzem" csempét, ott külön PIN-kódos belépés van.
            </div>
          </div>
        </div>

        <footer className="px-5 py-4 border-t border-stone-200 text-[11px] text-stone-500 flex items-center justify-between flex-wrap gap-2">
          <div>© 2026 JoineryTech Kft. · Minden jog fenntartva</div>
          <div className="flex items-center gap-4">
            <a href="#help" className="hover:text-stone-700 cursor-pointer">
              Súgó
            </a>
            <a href="#contact" className="hover:text-stone-700 cursor-pointer">
              Kapcsolat
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
