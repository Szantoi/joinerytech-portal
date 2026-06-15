export type AgentStage = 'definialt' | 'aktiv' | 'varakozik' | 'archivalt'
export type MemoryScope = 'global' | 'project' | 'customer' | 'order'

export interface AiAgent {
  id: string
  name: string
  stage: AgentStage
  role: string
  systemPrompt: string
  skills: string[]
  lastRun: string | null
}

export interface AiSkill {
  id: string
  name: string
  desc: string
  inputs: string[]
  tint: string
  promptTemplate: string
}

export interface AiMemory {
  id: string
  agentId: string
  scope: MemoryScope
  key: string
  value: string
  at: string
}

export const AI_AGENT_STAGE_META: Record<AgentStage, { label: string; bg: string; fg: string; dot: string }> = {
  definialt: { label: 'Definiált',  bg: 'bg-stone-100',   fg: 'text-stone-600',   dot: 'bg-stone-400' },
  aktiv:     { label: 'Aktív',      bg: 'bg-emerald-50',  fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  varakozik: { label: 'Várakozik',  bg: 'bg-amber-50',    fg: 'text-amber-700',   dot: 'bg-amber-500' },
  archivalt: { label: 'Archivált',  bg: 'bg-stone-50',    fg: 'text-stone-400',   dot: 'bg-stone-300' },
}

export const AI_AGENTS: AiAgent[] = [
  {
    id: 'ag-sales', name: 'Értékesítési asszisztens', stage: 'aktiv',
    role: 'Ajánlatok, lead-minősítés és ügyfél-kommunikáció támogatása.',
    systemPrompt: 'Te egy tapasztalt értékesítési asszisztens vagy egy asztalos/bútoripari cégnél. Segítesz ajánlatok megfogalmazásában, leadek minősítésében és az ügyfél-kommunikációban. Mindig a cég értékajánlatára (tartósság, egyedi gyártás) építesz.',
    skills: ['sk-offer', 'sk-lead', 'sk-email'],
    lastRun: 'ma 09:14',
  },
  {
    id: 'ag-service', name: 'Reklamáció-kezelő', stage: 'definialt',
    role: 'Service-jegyek, garancia-válaszok, ügyfél-megbékítés.',
    systemPrompt: 'Te egy empatikus ügyfélszolgálati szakember vagy. Reklamációkra válaszolsz higgadtan, a cég hangnemében, mindig megoldásra törekedve. Sosem hárítasz felelősséget az ügyfélre.',
    skills: ['sk-service'],
    lastRun: null,
  },
  {
    id: 'ag-prod', name: 'Gyártás-koordinátor', stage: 'definialt',
    role: 'Műhely-visszajelzések, ütemezési javaslatok, QA-összefoglalók.',
    systemPrompt: 'Te egy gyártás-koordinátor vagy egy bútorüzemben. Segítesz a terhelés-ütközések feloldásában és a minőségi visszajelzések összefoglalásában. Tömör, gyakorlatias javaslatokat adsz.',
    skills: ['sk-sched', 'sk-qa'],
    lastRun: null,
  },
]

export const AI_SKILLS: AiSkill[] = [
  {
    id: 'sk-offer', name: 'Ajánlat-szövegező',
    desc: 'Ajánlat kísérőszövegének generálása a brief és a persona alapján, a cég hangnemében.',
    inputs: ['brief', 'persona', 'tone'], tint: 'indigo',
    promptTemplate: 'Írj rövid, személyre szabott ajánlat-kísérőszöveget. A vevő igénye: {{brief}}. A megszólított persona: {{persona}}. Tartsd a megadott hangnemet: {{tone}}.',
  },
  {
    id: 'sk-lead', name: 'Lead-minősítő',
    desc: 'Lead pontozása BANT-kritériumok szerint, javasolt következő lépéssel.',
    inputs: ['lead.name', 'lead.source', 'notes'], tint: 'violet',
    promptTemplate: 'Minősítsd a leadet BANT szerint. Lead: {{lead.name}}, forrás: {{lead.source}}. Megjegyzések: {{notes}}.',
  },
  {
    id: 'sk-service', name: 'Reklamáció-válasz',
    desc: 'Empatikus, hangnem-illeszkedő válasz egy service-bejelentésre.',
    inputs: ['complaint', 'customerProfile'], tint: 'rose',
    promptTemplate: 'Fogalmazz empatikus, megoldás-orientált választ erre a reklamációra: {{complaint}}. Az ügyfél profilja: {{customerProfile}}.',
  },
  {
    id: 'sk-sched', name: 'Ütemezés-elemző',
    desc: 'Gyártási terhelés-konfliktusok tömör összefoglalása és javaslat.',
    inputs: ['prodTasks', 'machines', 'week'], tint: 'sky',
    promptTemplate: 'Foglald össze a heti gyártási terhelés ütközéseit. Feladatok: {{prodTasks}}. Gépek/kapacitás: {{machines}}. Hét: {{week}}.',
  },
  {
    id: 'sk-qa', name: 'QA-összefoglaló',
    desc: 'Minőség-ellenőrzés eredményeinek vezetői összefoglalója.',
    inputs: ['inspection', 'defects', 'passRate'], tint: 'lime',
    promptTemplate: 'Készíts tömör QA-összefoglalót. Ellenőrzés: {{inspection}}. Hibajegyzék: {{defects}}. Megfelelési arány: {{passRate}}.',
  },
  {
    id: 'sk-email', name: 'Email-piszkozat',
    desc: 'Ügyfél-kommunikációhoz email-piszkozat a cég hangneme szerint.',
    inputs: ['context', 'recipient', 'intent'], tint: 'amber',
    promptTemplate: 'Írj email-piszkozatot. Kontextus: {{context}}. Címzett: {{recipient}}. Cél: {{intent}}.',
  },
]

export const AI_MEMORY: AiMemory[] = [
  { id: 'am-1', agentId: 'ag-prod',  scope: 'global',   key: 'preferred_shift',    value: 'Délelőtti műszak preferált az összeállításhoz.',        at: '2026-06-13' },
  { id: 'am-2', agentId: 'ag-prod',  scope: 'project',  key: 'project_priority',   value: 'P-2025-0042 prioritásos — átadási határidő 06-20.',      at: '2026-06-12' },
  { id: 'am-3', agentId: 'ag-sales', scope: 'customer', key: 'communication_pref', value: 'Tóth Réka e-mailen érhető el; kerülni a hívásokat.',     at: '2026-06-11' },
  { id: 'am-4', agentId: 'ag-sales', scope: 'customer', key: 'price_sensitivity',  value: 'Árérzékeny — inkább a garanciát hangsúlyozni.',          at: '2026-06-10' },
  { id: 'am-5', agentId: 'ag-sales', scope: 'global',   key: 'best_offer_hook',    value: 'Élethosszig tartó javítás — leghatásosabb értékajánlat.', at: '2026-06-09' },
]
