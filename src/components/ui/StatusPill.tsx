const STATUS_TONES: Record<string, { bg: string; fg: string; dot: string }> = {
  draft: { bg: 'bg-stone-100', fg: 'text-stone-600', dot: 'bg-stone-400' },
  calc: { bg: 'bg-amber-50', fg: 'text-amber-700', dot: 'bg-amber-500' },
  ready: { bg: 'bg-sky-50', fg: 'text-sky-700', dot: 'bg-sky-500' },
  released: { bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  planned: { bg: 'bg-stone-100', fg: 'text-stone-600', dot: 'bg-stone-400' },
  running: { bg: 'bg-teal-50', fg: 'text-teal-700', dot: 'bg-teal-500' },
  done: { bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  low: { bg: 'bg-amber-50', fg: 'text-amber-700', dot: 'bg-amber-500' },
  ok: { bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  critical: { bg: 'bg-rose-50', fg: 'text-rose-700', dot: 'bg-rose-500' },
}

export { STATUS_TONES }

interface StatusPillProps {
  status: string
  label: string
}

export function StatusPill({ status, label }: StatusPillProps) {
  const t = STATUS_TONES[status] ?? STATUS_TONES.draft
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${t.bg} ${t.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      {label}
    </span>
  )
}
