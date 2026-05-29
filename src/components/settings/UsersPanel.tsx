import { useState, useEffect } from 'react'
import { Card, GhostBtn, Icon, SlideOver } from '../ui'
import { useApi, useMutation, API_BASE } from '../../hooks/useApi'

export interface UserDto {
  id: string
  tenantId: string
  email: string
  firstName: string
  lastName: string
  status: 'Active' | 'Disabled'
  kcSyncStatus: 'Pending' | 'Synced' | 'Failed'
}

interface CreateUserDto {
  email: string
  firstName: string
  lastName: string
}

const SECTION_LABEL = 'text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2'

function SyncSummary({ users }: { users: UserDto[] }) {
  const synced = users.filter((u) => u.kcSyncStatus === 'Synced').length
  const pending = users.filter((u) => u.kcSyncStatus === 'Pending').length
  const failed = users.filter((u) => u.kcSyncStatus === 'Failed').length

  return (
    <Card className="p-4 self-start">
      <div className="text-[12px] font-semibold text-stone-900 mb-3">Szinkronizáció</div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-teal-600">●</span>
          <span className="text-stone-600 flex-1">Synced</span>
          <span className="font-medium text-stone-900">{synced}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-amber-500">○</span>
          <span className="text-stone-600 flex-1">Pending</span>
          <span className="font-medium text-stone-900">{pending}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-red-500">✕</span>
          <span className="text-stone-600 flex-1">Failed</span>
          <span className="font-medium text-stone-900">{failed}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-400">
        Utolsó lekérés: most
      </div>
    </Card>
  )
}

interface UserDetailSlideOverProps {
  user: UserDto | null
  onClose: () => void
  onRefetch: () => void
}

function UserDetailSlideOver({ user, onClose, onRefetch }: UserDetailSlideOverProps) {
  const { mutate } = useMutation<void>()
  const [copied, setCopied] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionDone, setActionDone] = useState<string | null>(null)

  if (!user) return null

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()

  async function handleCopy() {
    await navigator.clipboard.writeText(user!.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleAction(action: 'reset-password' | 'disable' | 'enable') {
    setActionLoading(action)
    setActionDone(null)
    try {
      await mutate(`${API_BASE.identity}/users/${user!.id}/${action}`, { method: 'POST', body: undefined })
      setActionDone(action)
      if (action === 'disable' || action === 'enable') {
        onRefetch()
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <SlideOver
      open={true}
      onClose={onClose}
      title={`${user.firstName} ${user.lastName}`}
      subtitle={user.email}
      width={440}
      footer={<GhostBtn onClick={onClose}>Bezárás</GhostBtn>}
    >
      <div className="px-5 py-4 space-y-5">
        {/* Avatar + header */}
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-full bg-gradient-to-br grid place-items-center text-[16px] font-semibold text-white shrink-0 ${
              user.status === 'Active'
                ? 'from-teal-400 to-teal-600'
                : 'from-stone-300 to-stone-400'
            }`}
          >
            {initials}
          </div>
          <div>
            <div className="text-[13.5px] font-semibold text-stone-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-[11px] text-stone-500 font-mono mt-0.5">{user.email}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium ${
                user.status === 'Active' ? 'bg-teal-100 text-teal-700' : 'bg-stone-100 text-stone-500'
              }`}>
                {user.status === 'Active' ? 'Aktív' : 'Tiltott'}
              </span>
              <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium ${
                user.kcSyncStatus === 'Synced'
                  ? 'bg-teal-50 text-teal-600'
                  : user.kcSyncStatus === 'Failed'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-amber-50 text-amber-600'
              }`}>
                {user.kcSyncStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Adatok */}
        <div>
          <div className={SECTION_LABEL}>Adatok</div>
          <dl className="space-y-2">
            {[
              { label: 'Keresztnév', value: user.firstName },
              { label: 'Vezetéknév', value: user.lastName },
              { label: 'Email', value: user.email },
            ].map((row) => (
              <div key={row.label} className="flex gap-3">
                <dt className="text-stone-500 w-28 shrink-0 text-[12px]">{row.label}</dt>
                <dd className="text-stone-900 text-[12px]">{row.value}</dd>
              </div>
            ))}
            <div className="flex gap-3 items-center">
              <dt className="text-stone-500 w-28 shrink-0 text-[12px]">Azonosító</dt>
              <dd className="text-stone-900 text-[11.5px] font-mono flex items-center gap-1.5">
                <span className="truncate max-w-[160px]">{user.id}</span>
                <button
                  onClick={handleCopy}
                  className="text-stone-400 hover:text-stone-700 shrink-0 text-[11px]"
                  title="Másolás"
                >
                  {copied ? '✓ Másolva' : '📋'}
                </button>
              </dd>
            </div>
          </dl>
        </div>

        {/* Műveletek */}
        <div>
          <div className={SECTION_LABEL}>Műveletek</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAction('reset-password')}
              disabled={actionLoading === 'reset-password'}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-stone-200 text-[11.5px] text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              🔑 Jelszó reset
            </button>
            {user.status === 'Active' ? (
              <button
                onClick={() => handleAction('disable')}
                disabled={actionLoading === 'disable'}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-stone-200 text-[11.5px] text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                ⛔ Tiltás
              </button>
            ) : (
              <button
                onClick={() => handleAction('enable')}
                disabled={actionLoading === 'enable'}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-stone-200 text-[11.5px] text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                ✅ Engedélyezés
              </button>
            )}
          </div>
          {actionDone === 'reset-password' && (
            <p className="text-[11.5px] text-teal-600 mt-2">✓ Jelszó reset elküldve</p>
          )}
        </div>
      </div>
    </SlideOver>
  )
}

interface InviteUserSlideOverProps {
  open: boolean
  onClose: () => void
  onRefetch: () => void
}

function InviteUserSlideOver({ open, onClose, onRefetch }: InviteUserSlideOverProps) {
  const { mutate, isLoading: isSaving, error: saveError } = useMutation<UserDto>()
  const [form, setForm] = useState<CreateUserDto>({ email: '', firstName: '', lastName: '' })
  const [touched, setTouched] = useState({ email: false, firstName: false, lastName: false })
  const [apiError, setApiError] = useState('')

  function reset() {
    setForm({ email: '', firstName: '', lastName: '' })
    setTouched({ email: false, firstName: false, lastName: false })
    setApiError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ email: true, firstName: true, lastName: true })
    if (!form.email || !form.firstName || !form.lastName) return
    setApiError('')
    try {
      await mutate(`${API_BASE.identity}/users`, { method: 'POST', body: form })
      reset()
      onClose()
      onRefetch()
    } catch {
      setApiError(saveError ?? 'Hiba történt')
    }
  }

  const fields: Array<{ key: keyof CreateUserDto; label: string; type: string }> = [
    { key: 'firstName', label: 'Keresztnév', type: 'text' },
    { key: 'lastName', label: 'Vezetéknév', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
  ]

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Új felhasználó meghívása"
      subtitle="A felhasználó email értesítőt kap."
      width={400}
      footer={
        <>
          {apiError && <span className="text-[12px] text-red-500 flex-1">{apiError}</span>}
          <GhostBtn onClick={handleClose}>Mégse</GhostBtn>
          <button
            form="invite-form"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-teal-600 text-white text-[12px] font-medium hover:bg-teal-700 disabled:opacity-60"
          >
            {isSaving ? 'Küldés...' : 'Meghívás →'}
          </button>
        </>
      }
    >
      <form id="invite-form" onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {fields.map(({ key, label, type }) => {
          const isEmpty = touched[key] && !form[key]
          return (
            <div key={key}>
              <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
                {label} *
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                onBlur={() => setTouched((p) => ({ ...p, [key]: true }))}
                className={`w-full h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${
                  isEmpty ? 'border-red-400' : 'border-stone-200'
                }`}
              />
              {isEmpty && <p className="text-[11px] text-red-500 mt-0.5">Kötelező mező</p>}
            </div>
          )
        })}
      </form>
    </SlideOver>
  )
}

export function UsersPanel() {
  const { data: users, isLoading, error, refetch } = useApi<UserDto[]>(`${API_BASE.identity}/users`)
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => { refetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: user list */}
        <div className="lg:col-span-2">
          <Card className="p-0">
            <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between">
              <div className="text-[12.5px] font-semibold text-stone-900">
                {users ? `${users.length} felhasználó` : 'Felhasználók'}
              </div>
              <button
                onClick={() => setShowInvite(true)}
                className="h-8 px-3 bg-teal-600 text-white text-[11.5px] font-medium rounded-lg hover:bg-teal-700 inline-flex items-center gap-1.5"
              >
                <Icon name="plus" size={12} />Meghívás
              </button>
            </div>

            {isLoading && (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="px-5 py-3 border-b border-stone-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-stone-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-stone-100 rounded animate-pulse w-1/3" />
                      <div className="h-2.5 bg-stone-100 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </>
            )}

            {!isLoading && error && (
              <p className="text-[12px] text-red-500 px-5 py-3">Nem sikerült betölteni a felhasználókat.</p>
            )}

            {!isLoading && !error && users && users.map((u) => {
              const initials = `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase()
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="w-full px-5 py-3 border-b border-stone-100 last:border-0 flex items-center gap-3 hover:bg-stone-50/60 text-left"
                >
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br grid place-items-center text-[11px] font-semibold text-white shrink-0 ${
                    u.status === 'Active' ? 'from-teal-400 to-teal-600' : 'from-stone-300 to-stone-400'
                  }`}>
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium text-stone-900">{u.firstName} {u.lastName}</div>
                    <div className="text-[11px] text-stone-500 font-mono">{u.email}</div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    u.status === 'Active' ? 'bg-teal-100 text-teal-700' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {u.status === 'Active' ? 'Aktív' : 'Tiltott'}
                  </span>
                  {u.kcSyncStatus === 'Failed' && (
                    <span className="text-[11px] text-amber-600 shrink-0">Szinkron hiba</span>
                  )}
                  <Icon name="chevron" size={14} className="text-stone-400 shrink-0" />
                </button>
              )
            })}

            {!isLoading && !error && users && users.length === 0 && (
              <div className="px-5 py-8 text-center text-[12px] text-stone-500">Még nincs felhasználó</div>
            )}
          </Card>
        </div>

        {/* Right: sync summary */}
        <div>
          {users && <SyncSummary users={users} />}
          {!users && !isLoading && (
            <Card className="p-4 self-start">
              <div className="text-[12px] font-semibold text-stone-900 mb-2">Szinkronizáció</div>
              <div className="text-[11.5px] text-stone-400">Nincs adat</div>
            </Card>
          )}
        </div>
      </div>

      <UserDetailSlideOver
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onRefetch={refetch}
      />

      <InviteUserSlideOver
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onRefetch={refetch}
      />
    </>
  )
}
