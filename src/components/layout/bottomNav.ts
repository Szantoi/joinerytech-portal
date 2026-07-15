import type { WorldScreen } from '../../types'

/**
 * Bottom-nav screen selection — pure logic for MobileBottomNav
 * (DESIGN_SYSTEM_SPEC_V1 §3.1).
 *
 * Rule: max 5 tabs. If the world has more screens than that, the first
 * (maxTabs − 1) screens become direct tabs and the 5th slot is the "Több"
 * (More) overflow button, which opens the mobile drawer with the full list.
 * Kept as a pure function so the ≤5 + overflow rule is unit-testable
 * without rendering.
 */

/** Spec §3.1: legfeljebb ennyi fül fér a bottom nav-ba (a "Több"-bel együtt). */
export const MAX_BOTTOM_NAV_TABS = 5

export interface BottomNavSelection {
  /** Screens rendered as direct tabs (≤ maxTabs). */
  tabs: WorldScreen[]
  /** Screens that only appear behind the "Több" overflow. */
  overflow: WorldScreen[]
  /** Whether the "Több" overflow button is needed at all. */
  hasMore: boolean
  /** True when the active screen lives in the overflow — the "Több" button shows the active tint. */
  moreActive: boolean
}

export function selectBottomNavItems(
  screens: WorldScreen[],
  activeKey: string,
  maxTabs: number = MAX_BOTTOM_NAV_TABS,
): BottomNavSelection {
  // Everything fits → every screen is a direct tab, no overflow slot needed.
  if (screens.length <= maxTabs) {
    return { tabs: screens, overflow: [], hasMore: false, moreActive: false }
  }

  // Too many screens → reserve the last slot for "Több".
  const tabs = screens.slice(0, maxTabs - 1)
  const overflow = screens.slice(maxTabs - 1)
  return {
    tabs,
    overflow,
    hasMore: true,
    moreActive: overflow.some((s) => s.key === activeKey),
  }
}

/**
 * Screen-key → Icon name map (config, not hardcoded per component).
 * Covers the recurring screen keys across the worlds; anything unknown
 * falls back to BOTTOM_NAV_FALLBACK_ICON so new screens degrade gracefully.
 */
export const SCREEN_ICON_MAP: Record<string, string> = {
  dash: 'dashboard',
  workflow: 'workflow',
  analytics: 'chart',
  orders: 'orders',
  quotes: 'receipt',
  customers: 'user',
  inventory: 'inventory',
  procurement: 'procurement',
  movements: 'route',
  cutting: 'cut',
  machining: 'cpu',
  machines: 'wrench',
  schedule: 'calendar',
  files: 'file',
  list: 'clipboard',
  leads: 'user',
  opps: 'briefcase',
  pipeline: 'workflow',
  forecast: 'chart',
  projects: 'folder',
  people: 'user',
  absences: 'calendar',
  capacity: 'chart',
  assets: 'wrench',
  tickets: 'clipboard',
  incidents: 'alert',
  risks: 'shield',
  actions: 'check',
  ncr: 'alert',
  templates: 'file',
  audits: 'clipboard',
  audit: 'clipboard',
  history: 'clock',
  chat: 'chat',
  users: 'user',
  company: 'home',
  settings: 'settings',
}

/** Fallback icon for screen keys not present in SCREEN_ICON_MAP. */
export const BOTTOM_NAV_FALLBACK_ICON = 'folder'

export function screenIcon(key: string): string {
  return SCREEN_ICON_MAP[key] ?? BOTTOM_NAV_FALLBACK_ICON
}
