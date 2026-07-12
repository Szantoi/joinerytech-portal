import { useState } from 'react'
import { Card } from '../ui/Card'
import { Icon } from '../ui/Icon'
import { PrimaryBtn, GhostBtn } from '../ui/Button'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthConfig {
  poValue: number       // PO jóváhagyási küszöb (HUF)
  voidValue: number     // Sztornó limit (HUF)
  discountPct: number   // Max kedvezmény % jóváhagyás nélkül
  overtimeHours: number // Túlóra limit (óra/hó)
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type ApprovalAction =
  | 'po_over_limit'
  | 'void_over_limit'
  | 'discount_over_limit'
  | 'overtime_over_limit'

export interface Approval {
  id: string
  action: ApprovalAction
  requester: string
  requestedAt: string
  amount: number
  unit: string
  status: ApprovalStatus
  decidedBy?: string
  decidedAt?: string
  reason?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<ApprovalAction, string> = {
  po_over_limit: 'PO túllépés',
  void_over_limit: 'Sztornó limit',
  discount_over_limit: 'Kedvezmény túllépés',
  overtime_over_limit: 'Túlóra túllépés',
}

const STATUS_STYLES: Record<ApprovalStatus, { bg: string; text: string; label: string }> = {
  pending:  { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Függőben' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Jóváhagyva' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Elutasítva' },
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_CONFIG: AuthConfig = {
  poValue: 500000,
  voidValue: 100000,
  discountPct: 15,
  overtimeHours: 20,
}

const MOCK_APPROVALS: Approval[] = [
  {
    id: 'apr-001',
    action: 'po_over_limit',
    requester: 'Nagy János',
    requestedAt: '2026-06-18T08:30:00',
    amount: 750000,
    unit: 'HUF',
    status: 'pending',
  },
  {
    id: 'apr-002',
    action: 'discount_over_limit',
    requester: 'Kovács Anna',
    requestedAt: '2026-06-17T14:15:00',
    amount: 22,
    unit: '%',
    status: 'pending',
  },
  {
    id: 'apr-003',
    action: 'overtime_over_limit',
    requester: 'Tóth Péter',
    requestedAt: '2026-06-16T09:00:00',
    amount: 28,
    unit: 'óra',
    status: 'approved',
    decidedBy: 'Admin',
    decidedAt: '2026-06-16T10:30:00',
  },
  {
    id: 'apr-004',
    action: 'void_over_limit',
    requester: 'Szabó Éva',
    requestedAt: '2026-06-15T16:45:00',
    amount: 180000,
    unit: 'HUF',
    status: 'rejected',
    decidedBy: 'Admin',
    decidedAt: '2026-06-15T17:00:00',
    reason: 'Túl magas összeg, részletfizetés javasolt',
  },
]

// ─── Permission check (mock) ──────────────────────────────────────────────────

function usePermissions() {
  // Mock permission state - in real app, this would come from auth context
  return {
    canManageSettings: true,  // settings.manage
    canApprove: true,         // auth.approve
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuthorityPanel() {
  const { canManageSettings, canApprove } = usePermissions()
  const [config, setConfig] = useState<AuthConfig>(INITIAL_CONFIG)
  const [approvals, setApprovals] = useState<Approval[]>(MOCK_APPROVALS)
  const [rejectModal, setRejectModal] = useState<{ id: string; open: boolean }>({ id: '', open: false })
  const [rejectReason, setRejectReason] = useState('')

  function updateConfig<K extends keyof AuthConfig>(key: K, value: AuthConfig[K]) {
    if (!canManageSettings) return
    setConfig((c) => ({ ...c, [key]: value }))
  }

  function handleApprove(id: string) {
    if (!canApprove) return
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'approved' as const, decidedBy: 'Admin', decidedAt: new Date().toISOString() }
          : a
      )
    )
  }

  function handleReject(id: string) {
    if (!canApprove || !rejectReason.trim()) return
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'rejected' as const,
              decidedBy: 'Admin',
              decidedAt: new Date().toISOString(),
              reason: rejectReason,
            }
          : a
      )
    )
    setRejectModal({ id: '', open: false })
    setRejectReason('')
  }

  const pendingApprovals = approvals.filter((a) => a.status === 'pending')
  const decidedApprovals = approvals.filter((a) => a.status !== 'pending')

  return (
    <div className="space-y-5">
      {/* Threshold settings */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[13px] font-semibold text-stone-900">Jóváhagyási küszöbök</div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              A küszöb feletti műveletek jóváhagyást igényelnek
            </div>
          </div>
          {!canManageSettings && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px]">
              <Icon name="lock" size={12} />
              Szerkesztéshez settings.manage jog szükséges
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ThresholdInput
            label="PO jóváhagyási limit"
            value={config.poValue}
            unit="HUF"
            onChange={(v) => updateConfig('poValue', v)}
            disabled={!canManageSettings}
            step={10000}
          />
          <ThresholdInput
            label="Sztornó limit"
            value={config.voidValue}
            unit="HUF"
            onChange={(v) => updateConfig('voidValue', v)}
            disabled={!canManageSettings}
            step={10000}
          />
          <ThresholdInput
            label="Kedvezmény limit"
            value={config.discountPct}
            unit="%"
            onChange={(v) => updateConfig('discountPct', v)}
            disabled={!canManageSettings}
            max={100}
            step={1}
          />
          <ThresholdInput
            label="Túlóra limit (havi)"
            value={config.overtimeHours}
            unit="óra"
            onChange={(v) => updateConfig('overtimeHours', v)}
            disabled={!canManageSettings}
            max={100}
            step={1}
          />
        </div>

        {canManageSettings && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <PrimaryBtn>Küszöbök mentése</PrimaryBtn>
          </div>
        )}
      </Card>

      {/* Pending approvals */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-[12.5px] font-semibold text-stone-900">Függőben lévő kérelmek</div>
            {pendingApprovals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10.5px] font-semibold">
                {pendingApprovals.length}
              </span>
            )}
          </div>
          {!canApprove && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px]">
              <Icon name="lock" size={12} />
              Döntéshez auth.approve jog szükséges
            </div>
          )}
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="px-5 py-8 text-center text-[12px] text-stone-400">
            Nincs függőben lévő kérelem
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {pendingApprovals.map((approval) => (
              <div key={approval.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10.5px] font-medium">
                      {ACTION_LABELS[approval.action]}
                    </span>
                    <span className="text-[12px] font-semibold text-stone-900">
                      {approval.amount.toLocaleString('hu-HU')} {approval.unit}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-stone-600">
                    Kérelmező: <span className="font-medium">{approval.requester}</span>
                  </div>
                  <div className="text-[10.5px] text-stone-400 mt-0.5">
                    {new Date(approval.requestedAt).toLocaleString('hu-HU')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(approval.id)}
                    disabled={!canApprove}
                    title={!canApprove ? 'auth.approve jog szükséges' : 'Jóváhagyás'}
                    className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 grid place-items-center disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Icon name="check" size={16} />
                  </button>
                  <button
                    onClick={() => setRejectModal({ id: approval.id, open: true })}
                    disabled={!canApprove}
                    title={!canApprove ? 'auth.approve jog szükséges' : 'Elutasítás'}
                    className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 grid place-items-center disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Decided approvals */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200/80">
          <div className="text-[12.5px] font-semibold text-stone-900">Korábbi döntések</div>
        </div>

        {decidedApprovals.length === 0 ? (
          <div className="px-5 py-8 text-center text-[12px] text-stone-400">
            Nincs korábbi döntés
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {decidedApprovals.map((approval) => {
              const statusStyle = STATUS_STYLES[approval.status]
              return (
                <div key={approval.id} className="px-5 py-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10.5px] font-medium">
                        {ACTION_LABELS[approval.action]}
                      </span>
                      <span className="text-[12px] font-semibold text-stone-900">
                        {approval.amount.toLocaleString('hu-HU')} {approval.unit}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-stone-600">
                      Kérelmező: <span className="font-medium">{approval.requester}</span>
                    </div>
                    {approval.reason && (
                      <div className="mt-1 text-[11px] text-stone-500 italic">
                        Indoklás: {approval.reason}
                      </div>
                    )}
                    <div className="text-[10.5px] text-stone-400 mt-1">
                      Döntés: {approval.decidedBy} · {approval.decidedAt && new Date(approval.decidedAt).toLocaleString('hu-HU')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Reject modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="text-[14px] font-semibold text-stone-900 mb-3">Elutasítás indoklása</div>
            <div className="text-[12px] text-stone-600 mb-4">
              Az elutasításhoz kötelező megadni az indoklást.
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Indoklás..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-[12.5px] resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
            <div className="flex justify-end gap-2 mt-4">
              <GhostBtn onClick={() => { setRejectModal({ id: '', open: false }); setRejectReason('') }}>
                Mégse
              </GhostBtn>
              <button
                onClick={() => handleReject(rejectModal.id)}
                disabled={!rejectReason.trim()}
                className="h-9 px-4 rounded-lg bg-rose-600 text-white text-[12px] font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Elutasítás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Threshold Input ──────────────────────────────────────────────────────────

interface ThresholdInputProps {
  label: string
  value: number
  unit: string
  onChange: (value: number) => void
  disabled?: boolean
  max?: number
  step?: number
}

function ThresholdInput({ label, value, unit, onChange, disabled, max, step = 1 }: ThresholdInputProps) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">
        {label}
      </div>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          max={max}
          step={step}
          className="w-full h-10 pl-3 pr-14 rounded-lg border border-stone-200 text-[13px] font-mono text-stone-900 disabled:bg-stone-50 disabled:text-stone-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-stone-500 font-medium">
          {unit}
        </span>
      </div>
    </div>
  )
}
