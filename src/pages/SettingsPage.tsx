import { useState } from 'react'
import { Card, PrimaryBtn, Icon, StatusPill } from '../components/ui'
import { USERS, I18N } from '../mocks/data'
import { FACILITIES, PARTNERS, PARTNER_INVITES, PARTNER_TYPES, ROLE_KEYS, PERMISSION_MODULES, ROLE_MATRIX } from '../mocks/extra2'
import { WORKSTATIONS, AUDIT_LOG } from '../mocks/extra'

type SettingsTab = 'general' | 'users' | 'roles' | 'facilities' | 'machines' | 'partners' | 'audit' | 'billing' | 'api' | 'advanced'

const TAB_LIST: Array<{ key: SettingsTab; label: string }> = [
  { key: 'general', label: 'Általános' },
  { key: 'users', label: 'Felhasználók' },
  { key: 'roles', label: 'Jogosultságok' },
  { key: 'facilities', label: 'Telephely' },
  { key: 'machines', label: 'Géppark' },
  { key: 'partners', label: 'Partnerek' },
  { key: 'audit', label: 'Audit napló' },
  { key: 'billing', label: 'Számlázás' },
  { key: 'api', label: 'API' },
  { key: 'advanced', label: 'Haladó' },
]

export function SettingsPage() {
  const t = I18N.hu
  const [tab, setTab] = useState<SettingsTab>('general')

  return (
    <div className="p-7 space-y-5">
      <h2 className="text-[18px] font-semibold text-stone-900">{t.set.title}</h2>

      <div className="flex gap-1 flex-wrap bg-stone-100 rounded-lg p-1">
        {TAB_LIST.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition ${
              tab === tb.key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab />}
      {tab === 'users' && <UsersTab t={t} />}
      {tab === 'roles' && <RolesTab t={t} />}
      {tab === 'facilities' && <FacilitiesTab />}
      {tab === 'machines' && <MachinesTab />}
      {tab === 'partners' && <PartnersTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'billing' && <PlaceholderTab label="Számlázás beállítások hamarosan" />}
      {tab === 'api' && <PlaceholderTab label="API kulcs kezelés hamarosan" />}
      {tab === 'advanced' && <PlaceholderTab label="Haladó beállítások hamarosan" />}
    </div>
  )
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <Card className="p-8 text-center">
      <div className="text-[14px] text-stone-500">{label}</div>
    </Card>
  )
}

function GeneralTab() {
  return (
    <Card className="p-6 space-y-4">
      <div>
        <label className="text-[12px] text-stone-500 font-medium block mb-1">Cégnév</label>
        <input defaultValue="Doorstar Hungary Zrt." className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[13px]" />
      </div>
      <div>
        <label className="text-[12px] text-stone-500 font-medium block mb-1">Cím</label>
        <input defaultValue="2600 Vác, Ipari park 14." className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[13px]" />
      </div>
      <div>
        <label className="text-[12px] text-stone-500 font-medium block mb-1">Nyelv</label>
        <select className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[13px]">
          <option>Magyar</option>
          <option>English</option>
        </select>
      </div>
      <PrimaryBtn>Mentés</PrimaryBtn>
    </Card>
  )
}

function UsersTab({ t }: { t: typeof I18N.hu }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PrimaryBtn icon="plus">{t.set.inviteUser}</PrimaryBtn>
      </div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200/60">
              {['Név', 'E-mail', 'Szerep', 'Kezdőbetűk'].map((col) => (
                <th key={col} className="px-5 py-3 text-[11px] uppercase tracking-wide text-stone-500 font-medium">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {USERS.map((u) => (
              <tr key={u.email} className="hover:bg-stone-50/50">
                <td className="px-5 py-3 text-[12.5px] font-medium text-stone-900">{u.name}</td>
                <td className="px-5 py-3 text-[12px] text-stone-500">{u.email}</td>
                <td className="px-5 py-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">{t.set.role[u.role]}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 grid place-items-center text-[10px] font-semibold text-white">
                    {u.initials}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function RolesTab({ t }: { t: typeof I18N.hu }) {
  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-stone-50/80 border-b border-stone-200/60">
            <th className="px-5 py-3 text-[11px] uppercase tracking-wide text-stone-500 font-medium">Modul</th>
            {ROLE_KEYS.map((r) => (
              <th key={r} className="px-5 py-3 text-[11px] uppercase tracking-wide text-stone-500 font-medium">{t.set.role[r]}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {PERMISSION_MODULES.map((mod) => (
            <tr key={mod}>
              <td className="px-5 py-3 text-[12.5px] font-medium text-stone-900 capitalize">{mod}</td>
              {ROLE_KEYS.map((role) => {
                const level = ROLE_MATRIX[role][mod]
                const color = level === 'full' ? 'text-emerald-600' : level === 'read' ? 'text-amber-600' : 'text-stone-300'
                return (
                  <td key={role} className={`px-5 py-3 text-[12px] font-medium ${color}`}>
                    {level === 'full' ? 'Teljes' : level === 'read' ? 'Olvasás' : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function FacilitiesTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {FACILITIES.map((f) => (
        <Card key={f.id} className="p-5">
          <div className="text-[14px] font-semibold text-stone-900">{f.name}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">{f.address}</div>
          <div className="mt-3 space-y-1.5 text-[12px]">
            <div className="flex justify-between">
              <span className="text-stone-500">Kontakt</span>
              <span className="text-stone-700">{f.contactName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Gépek</span>
              <span className="text-stone-700">{f.machines} db</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Dolgozók</span>
              <span className="text-stone-700">{f.workers} fő</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function MachinesTab() {
  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-stone-50/80 border-b border-stone-200/60">
            {['Gép', 'Típus', 'Kapacitás', 'Állapot', 'Utolsó szerviz'].map((col) => (
              <th key={col} className="px-5 py-3 text-[11px] uppercase tracking-wide text-stone-500 font-medium">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {WORKSTATIONS.map((w) => (
            <tr key={w.name} className="hover:bg-stone-50/50">
              <td className="px-5 py-3 text-[12.5px] font-medium text-stone-900">{w.name}</td>
              <td className="px-5 py-3 text-[12px] text-stone-500">{w.type}</td>
              <td className="px-5 py-3 text-[12px] text-stone-700">{w.capacity}%</td>
              <td className="px-5 py-3">
                <StatusPill status={w.status} label={w.status === 'ok' ? 'OK' : w.status === 'low' ? 'Alacsony' : 'Kritikus'} />
              </td>
              <td className="px-5 py-3 text-[12px] text-stone-500 font-mono">{w.lastService}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function PartnersTab() {
  return (
    <div className="space-y-4">
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-stone-900">Partnerek</h3>
          <PrimaryBtn icon="plus">Meghívás</PrimaryBtn>
        </div>
        <div className="divide-y divide-stone-100">
          {PARTNERS.map((p) => (
            <div key={p.id} className="px-5 py-3 flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium text-stone-900">{p.name}</div>
                <div className="text-[11px] text-stone-500">
                  {PARTNER_TYPES.hu[p.type]} &middot; {p.contact}
                </div>
              </div>
              <div className="text-[11px] text-stone-500">{p.sharedOrders} megrendelés</div>
              <StatusPill
                status={p.status === 'active' ? 'ok' : 'draft'}
                label={p.status === 'active' ? 'Aktív' : 'Függőben'}
              />
            </div>
          ))}
        </div>
      </Card>

      {PARTNER_INVITES.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="text-[13px] font-semibold text-stone-900">Függő meghívások</h3>
          </div>
          <div className="divide-y divide-stone-100">
            {PARTNER_INVITES.map((inv) => (
              <div key={inv.email} className="px-5 py-3 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] text-stone-700">{inv.email}</div>
                  <div className="text-[11px] text-stone-500">{PARTNER_TYPES.hu[inv.type]} &middot; {inv.sent}</div>
                </div>
                <StatusPill
                  status={inv.state === 'pending' ? 'calc' : 'critical'}
                  label={inv.state === 'pending' ? 'Függőben' : 'Lejárt'}
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function AuditTab() {
  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-stone-50/80 border-b border-stone-200/60">
            {['Időpont', 'Aktor', 'Esemény', 'Cél', 'Hash', 'Hitelesített'].map((col) => (
              <th key={col} className="px-5 py-3 text-[11px] uppercase tracking-wide text-stone-500 font-medium">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {AUDIT_LOG.map((a, i) => (
            <tr key={i} className="hover:bg-stone-50/50">
              <td className="px-5 py-3 text-[12px] text-stone-500 font-mono">{a.ts}</td>
              <td className="px-5 py-3 text-[12.5px] text-stone-700">{a.actor}</td>
              <td className="px-5 py-3 text-[12px] text-stone-900 font-mono">{a.event}</td>
              <td className="px-5 py-3 text-[12px] text-stone-700">{a.target}</td>
              <td className="px-5 py-3 text-[11px] text-stone-400 font-mono">{a.hash}</td>
              <td className="px-5 py-3">
                {a.verified ? (
                  <Icon name="check" size={14} className="text-emerald-600" />
                ) : (
                  <Icon name="x" size={14} className="text-rose-500" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
