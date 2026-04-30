import { useState } from 'react'
import { Card } from '../ui/Card'
import { Icon } from '../ui/Icon'
import { PrimaryBtn } from '../ui/Button'
import { ROLE_KEYS, PERMISSION_MODULES, ROLE_MATRIX } from '../../mocks/extra2'
import { I18N } from '../../mocks/data'
import type { PermLevel, RoleMatrix } from '../../types'

const PERM_LABEL: Record<PermLevel, { label: string; icon: string; tone: string }> = {
  full: { label: 'Teljes', icon: 'check', tone: 'bg-teal-50 text-teal-700 border-teal-200' },
  read: { label: 'Olvasás', icon: 'user', tone: 'bg-stone-50 text-stone-600 border-stone-200' },
  none: { label: 'Nincs', icon: 'x', tone: 'bg-rose-50/50 text-rose-600 border-rose-100' },
}

function cycle(cur: PermLevel): PermLevel {
  return cur === 'full' ? 'read' : cur === 'read' ? 'none' : 'full'
}

export function RolesPanel() {
  const t = I18N.hu
  const [matrix, setMatrix] = useState<RoleMatrix>({ ...ROLE_MATRIX })

  const set = (role: string, mod: string) => {
    if (role === 'admin') return
    setMatrix((m) => ({
      ...m,
      [role]: {
        ...m[role as keyof RoleMatrix],
        [mod]: cycle(m[role as keyof RoleMatrix][mod as keyof RoleMatrix[keyof RoleMatrix]]),
      },
    }))
  }

  return (
    <div className="space-y-4">
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between">
          <div className="text-[12.5px] font-semibold text-stone-900">Jogosultsági mátrix</div>
          <PrimaryBtn icon="plus">Új szerepkör</PrimaryBtn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-stone-50/60 border-b border-stone-100 text-[10.5px] uppercase tracking-wide text-stone-500">
                <th className="text-left px-5 py-2.5 font-medium w-[160px]">Szerepkör</th>
                {PERMISSION_MODULES.map((m) => (
                  <th key={m} className="text-left px-3 py-2.5 font-medium">
                    {t.nav[m] ?? m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLE_KEYS.map((role) => {
                const locked = role === 'admin'
                return (
                  <tr
                    key={role}
                    className={`border-b border-stone-100 last:border-0 ${locked ? 'bg-stone-50/40' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-md grid place-items-center text-[10px] font-semibold ${
                            locked ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {role[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[12.5px] font-medium text-stone-900">{t.set.role[role]}</div>
                          {locked && (
                            <div className="text-[10px] text-stone-400">Rendszer · nem szerkeszthető</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {PERMISSION_MODULES.map((mod) => {
                      const v = matrix[role][mod]
                      const p = PERM_LABEL[v]
                      return (
                        <td key={mod} className="px-3 py-3">
                          <button
                            disabled={locked}
                            onClick={() => set(role, mod)}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium ${p.tone} ${
                              locked ? 'opacity-80 cursor-not-allowed' : 'hover:brightness-95'
                            }`}
                          >
                            <Icon name={p.icon} size={11} />
                            {p.label}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="text-[11px] text-stone-500 flex items-center gap-3 px-1">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="check" size={11} className="text-teal-700" /> Teljes hozzáférés
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="user" size={11} className="text-stone-500" /> Csak olvasás
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="x" size={11} className="text-rose-600" /> Nincs hozzáférés
        </span>
        <span className="ml-auto text-stone-400">Kattints a cellára a változtatáshoz</span>
      </div>
    </div>
  )
}
