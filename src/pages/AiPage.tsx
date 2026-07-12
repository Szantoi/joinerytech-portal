import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import { AI_AGENTS, AI_SKILLS, AI_MEMORY, AI_AGENT_STAGE_META, type AiAgent } from '../mocks/ai'
import { useAuth } from '../auth'
import { API_BASE } from '../hooks/useApi'

// ── Helpers ────────────────────────────────────────────────────────────────
function AgentStagePill({ stage }: { stage: AiAgent['stage'] }) {
  const m = AI_AGENT_STAGE_META[stage]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── Agent Detail SlideOver ─────────────────────────────────────────────────
function AgentDetailSlideOver({ agent, onClose }: { agent: AiAgent | null; onClose: () => void }) {
  if (!agent) return null
  const agentMemory = AI_MEMORY.filter((m) => m.agentId === agent.id)
  const agentSkillNames = AI_SKILLS.filter((s) => agent.skills.includes(s.id)).map((s) => s.name)
  return (
    <SlideOver open={true} onClose={onClose} title={agent.name} subtitle={`${agent.id} · ${agent.stage}`} width={480}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-2">
          <AgentStagePill stage={agent.stage} />
        </div>

        <div>
          <div className="text-[10.5px] text-stone-400 mb-0.5">Szerepkör</div>
          <div className="text-[12.5px] text-stone-800">{agent.role}</div>
        </div>

        <div>
          <div className="text-[10.5px] text-stone-400 mb-0.5">Rendszerprompt (részlet)</div>
          <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-[11.5px] text-stone-600 line-clamp-4">
            {agent.systemPrompt}
          </div>
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">
            Receptek ({agentSkillNames.length})
          </div>
          <div className="space-y-1">
            {agentSkillNames.map((name) => (
              <div key={name} className="text-[12px] text-stone-700 bg-stone-50 rounded px-2 py-1">{name}</div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10.5px] text-stone-400 mb-0.5">Memória bejegyzések</div>
          <div className="text-[12px] text-stone-800">{agentMemory.length} db</div>
        </div>
      </div>
    </SlideOver>
  )
}

// ── Agents List ────────────────────────────────────────────────────────────
function AgentsList() {
  const [selected, setSelected] = useState<AiAgent | null>(null)
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Ágensek</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">AI munkatársak és konfigurációjuk</p>
      </div>
      <div className="space-y-2">
        {AI_AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelected(agent)}
            className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-purple-200 transition flex items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <AgentStagePill stage={agent.stage} />
              </div>
              <div className="text-[13px] font-semibold text-stone-900">{agent.name}</div>
              <div className="text-[11.5px] text-stone-500 mt-0.5">{agent.role}</div>
              {agent.lastRun && (
                <div className="text-[11px] text-stone-400 mt-1">Utolsó futás: {agent.lastRun}</div>
              )}
            </div>
          </button>
        ))}
      </div>
      <AgentDetailSlideOver agent={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Skills List ────────────────────────────────────────────────────────────
function SkillsList() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Receptek</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Újrahasznosítható prompt-sablonok</p>
      </div>
      <div className="space-y-2">
        {AI_SKILLS.map((skill) => (
          <div
            key={skill.id}
            className="bg-white rounded-xl border border-stone-200 px-4 py-3"
          >
            <div className="text-[13px] font-semibold text-stone-900 mb-0.5">{skill.name}</div>
            <div className="text-[11.5px] text-stone-500 mb-2">{skill.desc}</div>
            <div className="flex flex-wrap gap-1.5">
              {skill.inputs.map((inp) => (
                <span key={inp} className="inline-flex items-center px-2 h-5 bg-stone-100 text-stone-600 rounded text-[10px] font-mono">
                  {inp}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── AI Chat Panel ──────────────────────────────────────────────────────────
interface ChatMsg { role: 'user' | 'assistant'; text: string }

function AiChatPanel() {
  const { token } = useAuth()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  async function sendMessage() {
    if (!input.trim() || isStreaming || !token) return
    const userMsg: ChatMsg = { role: 'user', text: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages([...newMessages, { role: 'assistant', text: '' }])
    setInput('')
    setIsStreaming(true)

    try {
      const res = await fetch(`${API_BASE.ai}/bff/chat/stream`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.text })),
        }),
      })

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', text: 'Hiba történt a kérés során.' }
          return updated
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const chunk = JSON.parse(data) as { type: string; text?: string }
            if (chunk.type === 'text' && chunk.text) {
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  text: updated[updated.length - 1].text + chunk.text,
                }
                return updated
              })
            }
          } catch { /* ignore malformed SSE chunks */ }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', text: 'Kapcsolati hiba.' }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[900px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">AI Chat</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Közvetlen kommunikáció az AI ágensekkel</p>
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="p-4 space-y-3 min-h-[300px]">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-[260px] text-stone-400 text-[13px]">
              Kezdj el egy beszélgetést az AI ágensekkel
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-[12.5px] ${
                  msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-stone-100 text-stone-800'
                }`}
              >
                {msg.text || <span className="animate-pulse text-stone-400">…</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-stone-100 p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
            placeholder="Írj üzenetet..."
            disabled={isStreaming}
            className="flex-1 h-9 px-3 rounded-lg border border-stone-200 text-[12.5px] focus:outline-none focus:border-purple-400 disabled:bg-stone-50"
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="h-9 px-4 rounded-lg bg-purple-600 text-white text-[12.5px] font-medium disabled:opacity-50"
          >
            Küld
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AI Dashboard ───────────────────────────────────────────────────────────
function AiDashboard() {
  const aktiv = AI_AGENTS.filter((a) => a.stage === 'aktiv').length

  const KpiCard = ({ label, value, tone }: { label: string; value: number | string; tone: string }) => (
    <div className="bg-white rounded-2xl border border-stone-200 p-4">
      <div className={`text-[22px] font-semibold text-${tone}-700 leading-none`}>{value}</div>
      <div className="text-[12px] font-medium text-stone-700 mt-2">{label}</div>
    </div>
  )

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">AI munkaterület</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Ágensek, receptek, memória</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Ma indított sessionök" value={1}               tone="purple" />
        <KpiCard label="Tool hívások"           value={6}               tone="indigo" />
        <KpiCard label="Mentett receptek"       value={AI_SKILLS.length} tone="sky" />
        <KpiCard label="Aktív ágensek"          value={aktiv}           tone="emerald" />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-2.5 border-b border-stone-100">
          <span className="text-[12.5px] font-semibold text-stone-800">Ágensek</span>
        </div>
        <div className="divide-y divide-stone-50">
          {AI_AGENTS.map((agent) => (
            <div key={agent.id} className="px-4 py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-stone-900 truncate">{agent.name}</div>
                <div className="text-[11px] text-stone-500 mt-0.5">{agent.role}</div>
              </div>
              <AgentStagePill stage={agent.stage} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── AI World Page ──────────────────────────────────────────────────────────
export function AiWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'chat')   return <AiChatPanel />
    if (currentScreen === 'agents') return <AgentsList />
    if (currentScreen === 'skills') return <SkillsList />
    return <AiDashboard />
  }

  return (
    <WorldShell
      worldKey="ai"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/ai/${key}`)}
      onHome={() => navigate('/')}
    >
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}
