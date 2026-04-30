import type { Stage, FlowEpic, Workstation, AuditEntry } from '../types'

export interface CatalogMaterial {
  name: string
  thicknesses: string[]
  sizes: string
  price: number
  supplier: string
}

export const CATALOG_MATERIALS: CatalogMaterial[] = [
  { name: 'Bükk tábla', thicknesses: ['18mm', '22mm'], sizes: '2440×1220', price: 18500, supplier: 'Egger' },
  { name: 'Tölgy tábla', thicknesses: ['22mm', '40mm'], sizes: '2440×1220', price: 32400, supplier: 'Egger' },
  { name: 'MDF fehér', thicknesses: ['16mm', '19mm'], sizes: '2800×2070', price: 8900, supplier: 'Kronospan' },
  { name: 'Forgácsolt csendes', thicknesses: ['18mm'], sizes: '2800×2070', price: 7400, supplier: 'Falco' },
]

export const STAGES: Stage[] = [
  { key: "sales", hu: "Értékesítés", en: "Sales" },
  { key: "survey", hu: "Felmérés", en: "Survey", optional: true },
  { key: "production", hu: "Gyártás", en: "Production" },
  { key: "delivery", hu: "Szállítás", en: "Delivery" },
  { key: "install", hu: "Beszerelés", en: "Install" },
]

export const FLOW_EPICS: FlowEpic[] = [
  { id: "FE-2426-184", title: "16-fiókos konyhab\u00fator", customer: "Bognár Bútor Kft.", type: "cabinet", stage: "production", due: "2026-05-08", assignee: "NJ", priority: "high", delegated: false },
  { id: "FE-2426-183", title: "Konyhasziget egyedi", customer: "Várdai Konyhastúdió", type: "cabinet", stage: "production", due: "2026-05-04", assignee: "TK", priority: "med", delegated: false },
  { id: "FE-2426-182", title: "42db beltéri ajtó", customer: "Doorstar Hungary Zrt.", type: "door", stage: "production", due: "2026-05-15", assignee: "KA", priority: "high", delegated: true },
  { id: "FE-2426-181", title: "Ablak felmérés villa", customer: "Pesti Ablakműhely", type: "window", stage: "survey", due: "2026-04-30", assignee: "SA", priority: "low", delegated: false },
  { id: "FE-2426-180", title: "Nappali szekrénysor", customer: "Hegyi Lakberendezés", type: "cabinet", stage: "delivery", due: "2026-04-29", assignee: "HE", priority: "med", delegated: false },
  { id: "FE-2426-179", title: "Egyedi tárgyaló asztal", customer: "Szabó Asztalos Bt.", type: "custom", stage: "install", due: "2026-04-30", assignee: "NJ", priority: "low", delegated: false },
  { id: "FE-2426-178", title: "Lakás teljes bútorzat", customer: "Vella Interior Design", type: "cabinet", stage: "install", due: "2026-05-02", assignee: "TK", priority: "med", delegated: false },
  { id: "FE-2426-177", title: "28db bejárati ajtó", customer: "Doorstar Hungary Zrt.", type: "door", stage: "delivery", due: "2026-05-06", assignee: "KA", priority: "high", delegated: false },
  { id: "FE-2426-176", title: "Modern konyha pultos", customer: "Tóth Konyha & Társa", type: "cabinet", stage: "sales", due: "2026-05-12", assignee: "SA", priority: "med", delegated: false },
  { id: "FE-2426-175", title: "Egyedi rejtett bar", customer: "Erdei Műbútor", type: "custom", stage: "sales", due: "2026-05-20", assignee: "SA", priority: "low", delegated: false },
  { id: "FE-2426-174", title: "Iroda építés bútor", customer: "Vella Interior Design", type: "cabinet", stage: "sales", due: "2026-05-22", assignee: "SA", priority: "med", delegated: false },
  { id: "FE-2426-173", title: "Hotel szoba kit", customer: "Doorstar Hungary Zrt.", type: "door", stage: "production", due: "2026-05-18", assignee: "NJ", priority: "high", delegated: false },
  { id: "FE-2426-172", title: "Pénzügyi pult", customer: "OTP Bank Zrt.", type: "custom", stage: "production", due: "2026-05-10", assignee: "TK", priority: "med", delegated: true },
]

export const WORKSTATIONS: Workstation[] = [
  { name: "Holzma HPP380", type: "Szériaszékény", category: "cutting", status: "ok", capacity: 88, lastService: "2026-03-14", operators: ["NJ", "KA"] },
  { name: "Biesse Selco WN6", type: "Szériaszékény", category: "cutting", status: "ok", capacity: 76, lastService: "2026-04-02", operators: ["TK"] },
  { name: "Homag Edge KAL", type: "Élzáró", category: "edgebanding", status: "ok", capacity: 64, lastService: "2026-03-21", operators: ["KA"] },
  { name: "Biesse Rover B", type: "CNC megmunk.", category: "cnc", status: "low", capacity: 42, lastService: "2026-04-18", operators: ["NJ", "TK"] },
  { name: "Holzma CNC Profile", type: "CNC megmunk.", category: "cnc", status: "critical", capacity: 0, lastService: "2025-11-30", operators: [] },
  { name: "Holz-Her Sándo", type: "Furógép", category: "drilling", status: "ok", capacity: 58, lastService: "2026-04-09", operators: ["KA"] },
]

export const AUDIT_LOG: AuditEntry[] = [
  { ts: "2026-04-28 09:14:22", actor: "Kovács Péter", event: "order.create", target: "JT-2426-0184", hash: "a3f4b29c", verified: true },
  { ts: "2026-04-28 09:08:11", actor: "Nagy János", event: "stage.handoff", target: "FE-2426-183", hash: "9e2c8d11", verified: true },
  { ts: "2026-04-28 08:42:55", actor: "Tóth Kinga", event: "production.start", target: "CP-184-A", hash: "f1d04b87", verified: true },
  { ts: "2026-04-27 17:21:09", actor: "Szabó Anna", event: "user.invite", target: "horvath.e@", hash: "c47a92ee", verified: true },
  { ts: "2026-04-27 16:55:30", actor: "Kovács Péter", event: "settings.update", target: "stagechain", hash: "b8a31f04", verified: true },
  { ts: "2026-04-27 14:08:44", actor: "Nagy János", event: "stage.handoff", target: "FE-2426-180", hash: "5d6b7c92", verified: true },
  { ts: "2026-04-27 11:32:18", actor: "Kiss András", event: "machine.fault", target: "Holzma CNC", hash: "ee198c3a", verified: true },
  { ts: "2026-04-27 10:14:02", actor: "System", event: "snapshot.create", target: "FE-2426-178", hash: "7c2d9a14", verified: true },
]
