import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { Icon } from '../components/ui'

const FEATURES = [
  {
    icon: 'orders',
    title: 'Megrendelések',
    desc: 'Ajánlatoktól a szállításig — teljes értékesítési folyamat egy helyen.',
  },
  {
    icon: 'production',
    title: 'Gyártásirányítás',
    desc: 'Vágótervek, nesting vizualizáció, géppark és műhely operáció.',
  },
  {
    icon: 'cut',
    title: 'Lapszabászat',
    desc: 'Optimalizált vágótervek, hulladék minimalizálás, CNC export.',
  },
  {
    icon: 'box',
    title: 'Raktár & Beszerzés',
    desc: 'Készletkezelés, szállítói rendelések, maradék anyag nyilvántartás.',
  },
]

export function LandingPage() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/w', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Betöltés...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      {/* Nav */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500 grid place-items-center">
            <span className="text-[13px] font-bold tracking-tighter text-white">jt</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            joinery<span className="text-teal-400">/</span>
            <span className="text-white/50 font-medium">tech</span>
          </span>
        </div>
        <button
          onClick={login}
          className="h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-[13px] font-medium transition"
        >
          Bejelentkezés
        </button>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32">
        <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11.5px] font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
          Magyar faipar · SaaS platform
        </div>

        <h1 className="text-[36px] md:text-[56px] font-semibold tracking-tight leading-tight max-w-3xl">
          A magyar faipar{' '}
          <span className="text-teal-400">digitális platformja</span>
        </h1>
        <p className="mt-5 text-[16px] md:text-[18px] text-slate-400 max-w-xl leading-relaxed">
          Megrendeléskezelés, gyártásirányítás és lapszabászat — egyetlen összekapcsolt rendszerben.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={login}
            className="h-12 px-8 rounded-xl bg-teal-600 hover:bg-teal-500 text-[15px] font-semibold transition shadow-lg shadow-teal-900/40 w-full sm:w-auto"
          >
            Belépés a portálra
          </button>
          <a
            href="https://joinerytech.hu"
            className="h-12 px-8 rounded-xl border border-white/10 hover:border-white/20 text-[15px] text-slate-300 transition w-full sm:w-auto text-center flex items-center justify-center"
          >
            Tudj meg többet
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-6 md:px-12 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.icon}
              className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:border-white/10 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 grid place-items-center mb-4">
                <Icon name={f.icon} size={20} />
              </div>
              <div className="text-[14px] font-semibold mb-1.5">{f.title}</div>
              <div className="text-[12.5px] text-slate-400 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-5 text-center text-[11px] text-slate-500">
        © 2026 JoineryTech · joinerytech.hu
      </footer>
    </div>
  )
}
