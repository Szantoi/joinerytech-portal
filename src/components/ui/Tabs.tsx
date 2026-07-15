import { useId, useRef, useState, type ReactNode } from 'react'

/**
 * Tabs — WAI-ARIA tabs primitive (DESIGN_SYSTEM_SPEC_V1 §2.3).
 *
 * - Roving tabindex: a single tab stop on the tablist.
 * - MANUAL activation: arrow keys only move focus; Enter/Space (or click) activates.
 *   (Our tabs trigger route changes / lazy panels — automatic activation would
 *   fire needless loads.)
 * - ArrowLeft/ArrowRight cycle (wrap at both ends), Home/End jump to first/last.
 * - Horizontal scroll with fade mask on mobile; the activated tab scrolls into view.
 *
 * Pair with <TabPanel> using the same `idBase` so tab↔panel ARIA wiring resolves:
 *   <Tabs idBase="ehs" ... />  <TabPanel idBase="ehs" id="incidents" active={...}>
 */

export interface TabItem {
  id: string
  label: ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: TabItem[]
  activeId: string
  onChange: (id: string) => void
  /** Accessible name of the tablist, e.g. "EHS képernyők". */
  label: string
  /** Shared id prefix for tab/panel ARIA wiring. Defaults to a generated id. */
  idBase?: string
  className?: string
}

const tabDomId = (base: string, id: string) => `${base}-tab-${id}`
const panelDomId = (base: string, id: string) => `${base}-panel-${id}`

export function Tabs({ tabs, activeId, onChange, label, idBase, className = '' }: TabsProps) {
  const autoId = useId()
  const base = idBase ?? autoId
  const listRef = useRef<HTMLDivElement>(null)

  // Roving focus target. Follows arrow-key navigation while focus is inside the
  // tablist; snaps back to the active tab whenever focus leaves (single tab stop).
  const [focusedId, setFocusedId] = useState(activeId)
  // Re-sync when the active tab changes externally (adjust-state-during-render pattern).
  const [prevActiveId, setPrevActiveId] = useState(activeId)
  if (activeId !== prevActiveId) {
    setPrevActiveId(activeId)
    setFocusedId(activeId)
  }

  const enabledTabs = tabs.filter((t) => !t.disabled)

  const focusTab = (id: string) => {
    setFocusedId(id)
    listRef.current?.querySelector<HTMLElement>(`[id="${tabDomId(base, id)}"]`)?.focus()
  }

  const moveFocus = (delta: number) => {
    if (enabledTabs.length === 0) return
    const currentIndex = enabledTabs.findIndex((t) => t.id === focusedId)
    const nextIndex = (currentIndex + delta + enabledTabs.length) % enabledTabs.length
    focusTab(enabledTabs[nextIndex].id)
  }

  const activate = (tab: TabItem, el: HTMLElement | null) => {
    if (tab.disabled) return
    onChange(tab.id)
    // Keep the freshly activated tab visible in the scrollable strip.
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        moveFocus(1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        moveFocus(-1)
        break
      case 'Home':
        e.preventDefault()
        if (enabledTabs[0]) focusTab(enabledTabs[0].id)
        break
      case 'End':
        e.preventDefault()
        if (enabledTabs.length > 0) focusTab(enabledTabs[enabledTabs.length - 1].id)
        break
      // Enter/Space activate via the native <button> click — no handling needed here.
    }
  }

  const onBlur = (e: React.FocusEvent) => {
    // Focus left the tablist → reset the roving stop to the active tab.
    if (!listRef.current?.contains(e.relatedTarget as Node | null)) {
      setFocusedId(activeId)
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      className={`flex gap-1 overflow-x-auto max-md:[mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tabDomId(base, tab.id)}
            aria-selected={isActive}
            aria-controls={panelDomId(base, tab.id)}
            aria-disabled={tab.disabled || undefined}
            tabIndex={tab.id === focusedId ? 0 : -1}
            onFocus={() => setFocusedId(tab.id)}
            onClick={(e) => activate(tab, e.currentTarget)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1 motion-reduce:transition-none ${
              // Active state is signalled by pill bg + weight, not colour alone.
              isActive
                ? 'bg-world-soft font-semibold text-world-soft-fg'
                : 'font-medium text-ink-muted hover:bg-surface-2 hover:text-ink'
            } ${tab.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

interface TabPanelProps {
  /** Must match the `idBase` passed to the owning <Tabs>. */
  idBase: string
  /** Tab id this panel belongs to. */
  id: string
  active: boolean
  children: ReactNode
  className?: string
}

/**
 * TabPanel — role="tabpanel" wired to its tab via aria-labelledby.
 * tabIndex={0} so keyboard users can reach panels without focusable content.
 * Inactive panels stay mounted but hidden (cheap toggling, state preserved).
 */
export function TabPanel({ idBase, id, active, children, className = '' }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={panelDomId(idBase, id)}
      aria-labelledby={tabDomId(idBase, id)}
      tabIndex={0}
      hidden={!active}
      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring ${className}`}
    >
      {children}
    </div>
  )
}
