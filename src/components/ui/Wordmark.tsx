interface GrainMarkProps {
  tone?: 'dark' | 'light'
}

export function GrainMark({ tone = 'dark' }: GrainMarkProps) {
  const stroke = tone === 'dark' ? '#fff' : '#0c1322'
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <rect x="1" y="1" width="20" height="20" rx="5" fill="none" stroke={stroke} strokeOpacity=".22" />
      <path d="M5 16 Q 11 6, 17 16" fill="none" stroke={stroke} strokeOpacity=".95" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 13 Q 11 5, 17 13" fill="none" stroke="#5eead4" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 19 Q 11 9, 17 19" fill="none" stroke={stroke} strokeOpacity=".4" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

interface WordmarkProps {
  tone?: 'dark' | 'light'
  size?: number
}

export function Wordmark({ tone = 'dark', size = 14 }: WordmarkProps) {
  const fg = tone === 'dark' ? 'text-white' : 'text-stone-900'
  const dim = tone === 'dark' ? 'text-white/55' : 'text-stone-500'
  const accent = 'text-teal-300'
  return (
    <div className="flex items-center gap-2 select-none" style={{ fontSize: size }}>
      <GrainMark tone={tone} />
      <span className={`font-semibold tracking-tight ${fg}`}>joinery</span>
      <span className={`${accent} font-light`} style={{ marginLeft: -4, marginRight: -4 }}>/</span>
      <span className={`${dim} font-medium tracking-tight`}>tech</span>
    </div>
  )
}
