import { useState, useEffect, useRef } from 'react'
import { Icon } from '../ui/Icon'

const SUGGESTIONS = [
  'Hány rendelés van gyártás alatt?',
  'Foglald össze a mai szabászati tervet',
  'Mi az utolsó készletriasztás?',
]

const SCRIPTED: Record<string, string> = {
  default:
    'Sziasztok! Én vagyok a JoineryTech AI asszisztens. Segíthetek rendelésekkel, gyártással, készlettel. Mit tehetek érted ma?',
  prod: 'Most 28 rendelés van gyártás alatt. A Holzma HPP380 78%-on, a Biesse Selco 64%-on üzemel. Két vágóterv kész, négy folyamatban.',
  plan: 'Mai szabászat: 12 vágóterv · 84 lap. Fő anyagok: Bükk 18mm, Tölgy 40mm, MDF 16mm. Két gép aktív.',
  alert: '3 anyag van riasztási szinten: Tölgy 22mm (8/15), MDF 19mm (12/25), Vasalat CLIP top (4/50 — kritikus).',
}

function pickReply(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('gyárt') || m.includes('rendel')) return SCRIPTED.prod
  if (m.includes('szabász') || m.includes('vágóterv') || m.includes('terv')) return SCRIPTED.plan
  if (m.includes('riaszt') || m.includes('készlet')) return SCRIPTED.alert
  return 'Megnézem... A kérdés alapján itt nincs nyilvánvaló találat. Próbáld pontosítani — pl. "rendelések gyártás alatt" vagy "mai szabászati terv".'
}

interface Message {
  role: 'user' | 'assistant'
  text: string
  ts: string
  streaming?: boolean
  tool?: string | null
}

interface ChatPanelProps {
  open: boolean
  onClose: () => void
  page: string
}

export function ChatPanel({ open, onClose, page }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: SCRIPTED.default, ts: '9:14' },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streaming])

  const send = (text?: string) => {
    const t = (text ?? input).trim()
    if (!t) return
    setInput('')
    const userMsg: Message = { role: 'user', text: t, ts: 'most' }
    setMessages((prev) => [...prev, userMsg])
    setStreaming(true)

    const reply = pickReply(t)
    let i = 0
    const id = setInterval(() => {
      i += 4
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last.role === 'assistant' && last.streaming) {
          return [...prev.slice(0, -1), { ...last, text: reply.slice(0, i) }]
        }
        return [...prev, { role: 'assistant', text: reply.slice(0, i), ts: 'most', streaming: true }]
      })
      if (i >= reply.length) {
        clearInterval(id)
        setStreaming(false)
        setMessages((prev) =>
          prev.map((m, idx) =>
            idx === prev.length - 1
              ? { ...m, streaming: false, text: reply, tool: t.toLowerCase().includes('rendel') ? 'orders' : null }
              : m,
          ),
        )
      }
    }, 24)
  }

  if (!open) return null

  return (
    <aside className="fixed right-4 bottom-20 w-[380px] max-h-[80vh] bg-white rounded-2xl border border-stone-200 shadow-2xl z-40 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-200 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 grid place-items-center text-white">
          <Icon name="sparkle" size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold text-stone-900">JoineryTech AI</div>
          <div className="text-[10.5px] text-stone-500">Kontextus: {page} · streaming</div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 grid place-items-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/40">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-800'
              }`}
            >
              {m.text}
              {m.streaming && (
                <span className="inline-block w-1.5 h-3.5 align-middle bg-stone-400 animate-pulse ml-0.5" />
              )}
              {m.tool === 'orders' && (
                <div className="mt-2 -mx-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-stone-100">
                  <div className="text-[10px] uppercase tracking-wide text-stone-500">Eszköz eredmény</div>
                  <div className="text-[11.5px] font-medium text-stone-900 flex items-center gap-1.5 mt-0.5">
                    <Icon name="orders" size={12} />
                    28 rendelés gyártás alatt
                    <Icon name="external" size={11} className="ml-auto" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 border-t border-stone-200">
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => send(s)}
            className="text-[10.5px] px-2 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="p-3 flex items-center gap-2 border-t border-stone-200 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Kérdezz valamit..."
          className="flex-1 h-9 px-3 rounded-lg bg-stone-100 outline-none text-[12.5px] focus:bg-stone-50 focus:ring-1 focus:ring-teal-500"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim()}
          className="w-9 h-9 grid place-items-center rounded-lg bg-teal-700 text-white disabled:opacity-40 hover:bg-teal-800"
        >
          <Icon name="send" size={15} />
        </button>
      </div>
    </aside>
  )
}
