interface IconProps {
  name: string
  size?: number
  className?: string
}

export function Icon({ name, size = 18, className = '' }: IconProps) {
  const s = size
  const common = {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  }

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      )
    case 'orders':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      )
    case 'production':
      return (
        <svg {...common}>
          <path d="M3 20V9l5 3V9l5 3V9l5 3v8H3z" />
          <path d="M3 20h18" />
        </svg>
      )
    case 'inventory':
      return (
        <svg {...common}>
          <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
          <path d="M3 7l9 4 9-4M12 11v10" />
        </svg>
      )
    case 'procurement':
      return (
        <svg {...common}>
          <path d="M3 6h2l2 11h11l2-8H6" />
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="17" cy="20" r="1.4" />
        </svg>
      )
    case 'analytics':
      return (
        <svg {...common}>
          <path d="M4 19h16" />
          <path d="M6 16V9M11 16V5M16 16v-7M21 16v-4" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...common}>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'filter':
      return (
        <svg {...common}>
          <path d="M4 5h16l-6 8v6l-4-2v-4z" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      )
    case 'down':
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      )
    case 'up':
      return (
        <svg {...common}>
          <path d="m6 15 6-6 6 6" />
        </svg>
      )
    case 'external':
      return (
        <svg {...common}>
          <path d="M14 4h6v6" />
          <path d="M20 4 10 14" />
          <path d="M20 14v6H4V4h6" />
        </svg>
      )
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 4v12" />
          <path d="m7 11 5 5 5-5" />
          <path d="M4 20h16" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 5 5 9-11" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 3 2 21h20L12 3z" />
          <path d="M12 10v5" />
          <circle cx="12" cy="18" r=".8" fill="currentColor" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1-4 5-6 8-6s7 2 8 6" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...common}>
          <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      )
    case 'factory':
      return (
        <svg {...common}>
          <path d="M2 21V10l5 3V8l5 3V8l5 3v10z" />
          <circle cx="6" cy="17" r=".8" fill="currentColor" />
          <circle cx="11" cy="17" r=".8" fill="currentColor" />
          <circle cx="16" cy="17" r=".8" fill="currentColor" />
        </svg>
      )
    case 'workflow':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="5" height="7" rx="1" />
          <rect x="10" y="4" width="5" height="10" rx="1" />
          <rect x="17" y="4" width="4" height="5" rx="1" />
          <path d="M3 18h18" />
        </svg>
      )
    case 'chat':
      return (
        <svg {...common}>
          <path d="M21 12a8 8 0 0 1-11.3 7.3L4 21l1.7-5.7A8 8 0 1 1 21 12z" />
        </svg>
      )
    case 'send':
      return (
        <svg {...common}>
          <path d="M22 2 11 13" />
          <path d="M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
        </svg>
      )
    case 'qr':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="3" height="3" />
          <rect x="18" y="14" width="3" height="3" />
          <rect x="14" y="18" width="3" height="3" />
          <rect x="18" y="18" width="3" height="3" />
        </svg>
      )
    case 'cut':
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M9 8l12 12M9 16 21 4" />
        </svg>
      )
    case 'layers':
      return (
        <svg {...common}>
          <path d="M12 3 2 8l10 5 10-5-10-5z" />
          <path d="M2 14l10 5 10-5" />
          <path d="M2 11l10 5 10-5" />
        </svg>
      )
    case 'cpu':
      return (
        <svg {...common}>
          <rect x="6" y="6" width="12" height="12" rx="1.5" />
          <path d="M9 9h6v6H9z" />
          <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
        </svg>
      )
    case 'camera':
      return (
        <svg {...common}>
          <path d="M3 8h4l2-3h6l2 3h4v12H3z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      )
    case 'more':
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="1.4" fill="currentColor" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          <circle cx="19" cy="12" r="1.4" fill="currentColor" />
        </svg>
      )
    case 'box':
      return (
        <svg {...common}>
          <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
          <path d="M3 7l9 4 9-4M12 11v10" />
        </svg>
      )
    case 'cube':
      return (
        <svg {...common}>
          <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
          <path d="M3 7l9 4 9-4M12 11v10" />
        </svg>
      )
    case 'ruler':
      return (
        <svg {...common}>
          <path d="M3 3h18v6H15v6H9v6H3z" />
          <path d="M7 3v3M11 3v3M15 3v3M3 11h3M3 15h3M3 19h3" />
        </svg>
      )
    case 'wrench':
      return (
        <svg {...common}>
          <path d="M14 4a5 5 0 0 1 5 7l-2 2 3 3-4 4-3-3-2 2a5 5 0 0 1-7-7l3 3 3-3-3-3 4-4z" />
        </svg>
      )
    case 'briefcase':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="1.5" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M3 13h18" />
        </svg>
      )
    case 'bolt':
      return (
        <svg {...common}>
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </svg>
      )
    default:
      return null
  }
}
