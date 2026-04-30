interface WorldIconProps {
  name: string
  size?: number
  className?: string
}

export function WorldIcon({ name, size = 40, className = '' }: WorldIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  }

  const ICONS: Record<string, React.ReactNode> = {
    factory: (
      <svg {...common}>
        <path d="M6 40V22l8 5v-5l8 5v-5l8 5V14l8 -2v28z" />
        <path d="M6 40h36" />
        <path d="M14 32h2M22 32h2M30 32h2M38 28v6" />
      </svg>
    ),
    briefcase: (
      <svg {...common}>
        <rect x="6" y="14" width="36" height="26" rx="2" />
        <path d="M18 14V10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
        <path d="M6 24h36M22 22v4M26 22v4" />
      </svg>
    ),
    ruler: (
      <svg {...common}>
        <path d="M8 8h32v8H32v6H24v6H16v6H8z" />
        <path d="M14 14v3M20 14v3M26 14v3M32 14v3" />
        <path d="M14 22v3M20 22v3M26 22v3" />
        <path d="M14 30v3M20 30v3" />
      </svg>
    ),
    box: (
      <svg {...common}>
        <path d="M24 6 6 14v20l18 8 18-8V14z" />
        <path d="M6 14l18 8 18-8M24 22v20" />
        <path d="M14 10l18 8" />
      </svg>
    ),
    wrench: (
      <svg {...common}>
        <path d="M30 6a8 8 0 0 1 8 12l-2 2 4 4 -8 8 -4 -4 -2 2a8 8 0 0 1 -12 -8" />
        <path d="M14 22 6 30v8h8l8-8" />
        <circle cx="32" cy="14" r="2.5" />
      </svg>
    ),
    settings: (
      <svg {...common}>
        <circle cx="24" cy="24" r="6" />
        <path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4" />
      </svg>
    ),
  }

  return <>{ICONS[name] ?? ICONS.box}</>
}
