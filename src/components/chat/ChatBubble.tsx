import { useState } from 'react'
import { Icon } from '../ui/Icon'
import { ChatPanel } from './ChatPanel'

interface ChatBubbleProps {
  page?: string
}

export function ChatBubble({ page = 'dashboard' }: ChatBubbleProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 bottom-4 w-12 h-12 rounded-full bg-stone-900 text-white grid place-items-center shadow-lg hover:bg-stone-800 z-30"
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
