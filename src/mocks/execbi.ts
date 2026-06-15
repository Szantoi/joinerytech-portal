export interface ExecTrendPoint {
  ym: string
  revenue: number
  margin: number
  backlog: number
  pipeline: number
  intake: number
}

export type ExecTab = 'finance' | 'production' | 'sales' | 'hr'

export const EXEC_TREND_DATA: ExecTrendPoint[] = [
  { ym: '2025-05', revenue: 12.4, margin: 0.17, backlog: 9.6,  pipeline: 8.4,  intake: 10.1 },
  { ym: '2025-06', revenue: 13.8, margin: 0.19, backlog: 10.8, pipeline: 9.1,  intake: 12.0 },
  { ym: '2025-07', revenue: 15.1, margin: 0.21, backlog: 12.2, pipeline: 10.0, intake: 13.4 },
  { ym: '2025-08', revenue: 11.9, margin: 0.16, backlog: 11.0, pipeline: 9.6,  intake: 9.8  },
  { ym: '2025-09', revenue: 16.7, margin: 0.23, backlog: 14.1, pipeline: 11.8, intake: 15.2 },
  { ym: '2025-10', revenue: 17.9, margin: 0.25, backlog: 16.0, pipeline: 13.2, intake: 16.6 },
  { ym: '2025-11', revenue: 16.2, margin: 0.22, backlog: 15.2, pipeline: 12.9, intake: 14.0 },
  { ym: '2025-12', revenue: 13.1, margin: 0.18, backlog: 12.4, pipeline: 11.5, intake: 10.7 },
  { ym: '2026-01', revenue: 14.6, margin: 0.20, backlog: 13.1, pipeline: 12.6, intake: 13.9 },
  { ym: '2026-02', revenue: 16.9, margin: 0.24, backlog: 15.6, pipeline: 14.1, intake: 15.8 },
  { ym: '2026-03', revenue: 18.8, margin: 0.27, backlog: 18.0, pipeline: 15.7, intake: 18.2 },
  { ym: '2026-04', revenue: 17.4, margin: 0.25, backlog: 16.8, pipeline: 16.2, intake: 16.9 },
]

export const EXEC_TAB_META: Record<ExecTab, { label: string }> = {
  finance:    { label: 'Pénzügy' },
  production: { label: 'Gyártás' },
  sales:      { label: 'Értékesítés' },
  hr:         { label: 'HR' },
}

export const EXEC_TOP5_PROJECTS: Array<{ name: string; revenue: number; margin: number }> = [
  { name: 'Petőfi u. 12.',    revenue: 4200000,  margin: 0.28 },
  { name: 'Doorstar ajtók',   revenue: 12400000, margin: 0.22 },
  { name: 'Belváros Café',    revenue: 3100000,  margin: 0.31 },
  { name: 'Bognár konyha',    revenue: 2850000,  margin: 0.25 },
  { name: 'Vella Interior',   revenue: 3000000,  margin: 0.24 },
]

export const EXEC_TOP5_CUSTOMERS: Array<{ name: string; ytd: number }> = [
  { name: 'Doorstar Hungary Zrt.',    ytd: 15600000 },
  { name: 'Bognár Bútor Kft.',        ytd: 8900000 },
  { name: 'Vella Interior Design',    ytd: 5200000 },
  { name: 'Belváros Café',            ytd: 3100000 },
  { name: 'Várdai Konyhastúdió',      ytd: 2400000 },
]
