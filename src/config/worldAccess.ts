import type { WorldKey } from '../types'

const aliases: Record<string, string> = { crm: 'spaceos.crm', kontrolling: 'spaceos.controlling', hr: 'spaceos.hr', maintenance: 'spaceos.maintenance', qa: 'spaceos.qa', ehs: 'spaceos.ehs', dms: 'spaceos.dms', cutting: 'joinerytech.cutting', joinery: 'joinerytech.joinery', inventory: 'joinerytech.inventory', procurement: 'joinerytech.procurement' }

/**
 * UI roles restrict the worlds a person can discover. This remains distinct
 * from tenant entitlements and API authorization: Home renders their
 * intersection, while server-side authorization remains authoritative.
 */
export const ROLE_WORLDS: Readonly<Record<string, readonly WorldKey[]>> = {
  Admin: ['production', 'sales', 'design', 'warehouse', 'shopfloor', 'crm', 'finance', 'projects', 'logistics', 'mfgprep', 'supervisor', 'masterdata', 'trade', 'interior', 'maintenance', 'quality', 'ehs', 'attendance', 'hr', 'kontrolling', 'service', 'tasks', 'docs', 'ai', 'execbi', 'shop', 'settings'],
  Designer: ['production', 'sales', 'design', 'warehouse', 'crm', 'finance', 'projects', 'logistics', 'masterdata', 'trade', 'interior', 'maintenance', 'quality', 'ehs', 'tasks', 'docs', 'ai', 'settings'],
  Joiner: ['production', 'settings'],
  // Üzemi szerepek (PLAN-05 F6). Az ütemezés-képernyő a `production` világ
  // alatt él — egy szerep, amit épp ehhez hoztunk létre, nem kaphat üres
  // rácsot. Szándékosan a MINIMUM: a tágabb hozzáférés (raktár, karbantartás,
  // minőség) az üzemvezetőnek külön termékdöntés, nem a szerep-bekötésé.
  production_manager: ['production', 'settings'],
  machine_operator: ['production', 'settings'],
}

// A magasabb jogosultság nyer. Az üzemi szerepek a Joiner elé kerülnek, de a
// Designer mögé: az adminisztratív szerepek rács-politikája nem változik.
const ROLE_PRIORITY = ['Admin', 'Designer', 'production_manager', 'machine_operator', 'Joiner'] as const

export const WORLD_MODULES: Partial<Record<WorldKey, readonly string[]>> = {
  crm: ['spaceos.crm'], kontrolling: ['spaceos.controlling'], hr: ['spaceos.hr'], maintenance: ['spaceos.maintenance'], quality: ['spaceos.qa'], ehs: ['spaceos.ehs'], docs: ['spaceos.dms'], production: ['joinerytech.cutting', 'joinerytech.joinery'], warehouse: ['joinerytech.inventory', 'joinerytech.procurement'],
}

/** Worlds without a sellable module package. They remain unavailable by default. */
export const HIDDEN_LEGACY_WORLDS: readonly WorldKey[] = [
  'sales', 'design', 'shopfloor', 'finance', 'projects', 'logistics', 'mfgprep',
  'supervisor', 'masterdata', 'trade', 'interior', 'attendance', 'tasks', 'ai',
  'execbi', 'shop', 'service',
]

const showLegacyWorlds = import.meta.env.DEV && import.meta.env.VITE_SHOW_LEGACY_WORLDS === 'true'

export function isWorldEnabled(world: string, modules: readonly string[]): boolean {
  if (world === 'settings') return true
  if (HIDDEN_LEGACY_WORLDS.includes(world as WorldKey)) return showLegacyWorlds
  const required = WORLD_MODULES[world as WorldKey]
  if (!required) return false
  const enabled = new Set(modules.map(value => aliases[value] ?? value))
  return required.every(module => enabled.has(module))
}

export function visibleWorlds(worlds: readonly WorldKey[], modules: readonly string[]): WorldKey[] {
  return worlds.filter(world => isWorldEnabled(world, modules))
}

export function visibleWorldsForRoles(
  worlds: readonly WorldKey[],
  modules: readonly string[],
  roles: readonly string[],
): WorldKey[] {
  // Highest privilege wins, matching the historic Home grid policy.
  const role = ROLE_PRIORITY.find(candidate => roles.includes(candidate))
  const roleWorlds = role ? ROLE_WORLDS[role] : undefined
  if (!roleWorlds) return []

  const entitledWorlds = new Set(visibleWorlds(worlds, modules))
  return roleWorlds.filter(world => entitledWorlds.has(world))
}
