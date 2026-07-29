import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth, RequireAuth as CoreRequireAuth } from '@spaceos/portal-core'
import { isWorldEnabled } from '../config/worldAccess'

/** Portal-specific route gate. API authorization remains server-side. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { enabledModules } = useAuth()
  const location = useLocation()
  const world = /^\/w\/([^/]+)/.exec(location.pathname)?.[1]

  return <CoreRequireAuth>{world && !isWorldEnabled(world, enabledModules) ? (
    <main role="alert" className="min-h-screen grid place-items-center bg-surface-0 p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold text-ink">Ez a modul nincs engedélyezve</h1>
        <p className="mt-2 text-sm text-ink-soft">A bérlő jelenlegi előfizetése nem ad hozzáférést ehhez a munkavilághoz.</p>
      </div>
    </main>
  ) : children}</CoreRequireAuth>
}
