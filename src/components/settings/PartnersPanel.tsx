import { useState } from 'react'
import { Card } from '../ui/Card'
import { Icon } from '../ui/Icon'
import { SlideOver } from '../ui/SlideOver'
import { StatusPill } from '../ui/StatusPill'
import { PrimaryBtn, GhostBtn } from '../ui/Button'
import { PARTNERS, PARTNER_INVITES, PARTNER_TYPES } from '../../mocks/extra2'
import { ORDERS } from '../../mocks/data'
import type { Partner } from '../../types'

const PARTNER_TYPE_TONE: Record<string, string> = {
  manufacturer: 'bg-violet-50 text-violet-700',
  cutter: 'bg-sky-50 text-sky-700',
  trader: 'bg-amber-50 text-amber-700',
  supplier: 'bg-teal-50 text-teal-700',
}

export function PartnersPanel() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const partner: Partner | undefined = PARTNERS.find((p) => p.id === openId)
  const types = PARTNER_TYPES.hu

  const active = PARTNERS.filter((p) => p.status === 'active')
  const pending = PARTNERS.filter((p) => p.status === 'pending')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Active partners */}
      <Card className="lg:col-span-2 p-0">
        <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between">
          <div className="text-[12.5px] font-semibold text-stone-900">
            Aktív partnerek{' '}
            <span className="text-stone-400 font-normal tabular-nums">({active.length})</span>
          </div>
          <PrimaryBtn icon="plus" onClick={() => setShowInvite(true)}>
            Partner meghívása
          </PrimaryBtn>
        </div>
        {active.map((p) => (
          <button
            key={p.id}
            onClick={() => setOpenId(p.id)}
            className="w-full text-left px-5 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50/60 grid grid-cols-[1fr_120px_120px_100px_24px] gap-3 items-center"
          >
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-stone-900 truncate">{p.name}</div>
              <div className="text-[10.5px] text-stone-500 font-mono">{p.contact}</div>
            </div>
            <div>
              <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium ${PARTNER_TYPE_TONE[p.type]}`}>
                {types[p.type]}
              </span>
            </div>
            <div>
              <StatusPill status="ok" label="Aktív" />
            </div>
            <div className="text-[11px] font-mono text-stone-500 text-right">{p.joined}</div>
            <div className="text-stone-400">
              <Icon name="chevron" size={14} />
            </div>
          </button>
        ))}
      </Card>

      {/* Invitations */}
      <Card className="p-0 self-start">
        <div className="px-5 py-3 border-b border-stone-200/80 text-[12.5px] font-semibold text-stone-900">
          Meghívások{' '}
          <span className="text-stone-400 font-normal tabular-nums">
            ({PARTNER_INVITES.length + pending.length})
          </span>
        </div>
        {pending.map((p) => (
          <div key={p.id} className="px-5 py-3 border-b border-stone-100 last:border-0">
            <div className="text-[12px] font-medium text-stone-900">{p.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PARTNER_TYPE_TONE[p.type]}`}>
                {types[p.type]}
              </span>
              <span className="text-[10.5px] text-stone-500 font-mono">{p.joined}</span>
              <StatusPill status="calc" label="Függő" />
            </div>
          </div>
        ))}
        {PARTNER_INVITES.map((inv, i) => (
          <div key={i} className="px-5 py-3 border-b border-stone-100 last:border-0">
            <div className="text-[12px] font-mono text-stone-700 truncate">{inv.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PARTNER_TYPE_TONE[inv.type]}`}>
                {types[inv.type]}
              </span>
              <span className="text-[10.5px] text-stone-500 font-mono">{inv.sent}</span>
              {inv.state === 'pending' ? (
                <StatusPill status="calc" label="Függő" />
              ) : (
                <StatusPill status="critical" label="Lejárt" />
              )}
            </div>
          </div>
        ))}
      </Card>

      {/* Invite drawer */}
      <SlideOver
        open={showInvite}
        onClose={() => setShowInvite(false)}
        title="Partner meghívása"
        subtitle="B2B handshake — API kulcs és szerepkör"
        width={480}
        footer={
          <>
            <GhostBtn onClick={() => setShowInvite(false)}>Mégse</GhostBtn>
            <PrimaryBtn icon="send" onClick={() => setShowInvite(false)}>
              Meghívó küldése
            </PrimaryBtn>
          </>
        }
      >
        <div className="px-5 py-4 space-y-4">
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">E-mail cím</div>
            <input
              placeholder="b2b@partner.hu"
              className="w-full h-10 px-3 rounded-lg border border-stone-200 text-[12.5px] font-mono outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">Partner típus</div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(types).map(([k, label]) => (
                <button
                  key={k}
                  className="h-9 rounded-lg text-[12px] border bg-white text-stone-700 border-stone-200 hover:border-stone-300"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">
              Üzenet (opcionális)
            </div>
            <textarea
              rows={4}
              placeholder="Csatlakozz B2B partnerként a JoineryTech portálhoz…"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-[12.5px] outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
            />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-[11.5px] text-amber-800 flex gap-2">
            <Icon name="alert" size={14} className="shrink-0 mt-0.5" />
            <span>
              A partner API kulcsot generálunk a meghíváskor. A kulcs csak egyszer látható létrehozás után.
            </span>
          </div>
        </div>
      </SlideOver>

      {/* Partner detail */}
      <SlideOver
        open={!!partner}
        onClose={() => setOpenId(null)}
        title={partner?.name ?? ''}
        subtitle={
          partner ? `${types[partner.type]} · csatlakozott ${partner.joined}` : undefined
        }
        width={500}
        footer={
          <>
            <GhostBtn icon="x">Letiltás</GhostBtn>
            <GhostBtn onClick={() => setOpenId(null)}>Bezár</GhostBtn>
          </>
        }
      >
        {partner && (
          <div className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-stone-50 rounded-lg p-3">
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500">Közös rendelések</div>
                <div className="text-[20px] font-semibold tabular-nums text-stone-900">{partner.sharedOrders}</div>
              </div>
              <div className="bg-stone-50 rounded-lg p-3">
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500">Típus</div>
                <div className="text-[12.5px] font-medium text-stone-900 mt-0.5">{types[partner.type]}</div>
              </div>
              <div className="bg-stone-50 rounded-lg p-3">
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500">Státusz</div>
                <div className="mt-1">
                  <StatusPill status="ok" label="Aktív" />
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">API kulcs</div>
              <div className="flex items-center gap-2 px-3 h-10 rounded-lg bg-stone-900 text-stone-100">
                <Icon name="settings" size={13} className="text-teal-300" />
                <span className="text-[12px] font-mono flex-1 truncate">{partner.apiKey ?? '—'}</span>
                <button className="text-[10.5px] px-2 py-1 rounded bg-white/10 hover:bg-white/20">Másol</button>
                <button className="text-[10.5px] px-2 py-1 rounded bg-white/10 hover:bg-white/20">Forgat</button>
              </div>
            </div>

            <div>
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">
                Delegált feladatok
              </div>
              <div className="space-y-1">
                {partner.delegated.length === 0 && (
                  <div className="text-[12px] text-stone-400 italic">Nincs delegált feladat</div>
                )}
                {partner.delegated.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-teal-50/50 border border-teal-100"
                  >
                    <Icon name="check" size={13} className="text-teal-700" />
                    <span className="text-[12px] text-stone-800">{d}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">
                Legutóbbi közös rendelések
              </div>
              <div className="space-y-1">
                {ORDERS.slice(0, 3).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-stone-50 border border-stone-100"
                  >
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-mono text-stone-600">{o.id}</div>
                      <div className="text-[12px] text-stone-900 truncate">{o.customer}</div>
                    </div>
                    <Icon name="chevron" size={13} className="text-stone-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}
