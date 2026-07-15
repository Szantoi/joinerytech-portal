import { useState } from 'react'
import { Icon } from '../ui/Icon'
import { ChatPanel } from './ChatPanel'

interface ChatBubbleProps {
  page?: string
  /** When the mobile bottom nav is mounted, float the bubble above it (< md). */
  aboveBottomNav?: boolean
}

export function ChatBubble({ page = 'dashboard', aboveBottomNav = false }: ChatBubbleProps) {
  const [open, setOpen] = useState(false)

  // Spec §3.2 pattern: floating action sits above the 58px bottom nav + safe area on mobile.
  const bottomOffset = aboveBottomNav
    ? 'bottom-[calc(58px+env(safe-area-inset-bottom)+16px)] md:bottom-4'
    : 'bottom-4'

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Chat bezárása' : 'Chat megnyitása'}
        aria-expanded={open}
        className={`fixed right-4 ${bottomOffset} w-12 h-12 rounded-full bg-stone-900 text-white grid place-items-center shadow-lg hover:bg-stone-800 z-30`}
      >
        {open ? <Icon name="x" size={18} /> : <Icon name="chat" size={18} />}
        {!open && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-stone-900" />
        )}
      </button>
      <ChatPanel open={open} onClose={() => setOpen(false)} page={page} />
    </>
  )
}
