// ─── Joinery API Response Types ─────────────────────────────────────────────

export interface MaterialReqItem {
  id: string
  name: string
  materialType: 'wood' | 'hardware' | 'finishing'
  quantity: number
  unit: 'piece' | 'meter' | 'kg'
  unitPrice: number
  warehouseQty: number
  status: 'in-stock' | 'on-order' | 'insufficient'
}

export interface MaterialReqResponse {
  orderId: string
  materials: MaterialReqItem[]
  totalCost: number
  generatedAt: string
}

export interface HardwareSpecItem {
  spec: 'edge-banding' | 'hinge' | 'lacquer' | 'stain'
  value: string
  quantity: number
}

export interface HardwareListResponse {
  orderId: string
  specs: HardwareSpecItem[]
  generatedAt: string
}

// ─── Cutting Plan API Types ─────────────────────────────────────────────────

export interface CuttingPlanPart {
  partId: string
  x: number
  y: number
  width: number
  height: number
}

export interface CuttingPlanSheet {
  sheetId: string
  parts: CuttingPlanPart[]
  wastePercent: number
}

export interface CuttingPlanRequest {
  date: string  // YYYY-MM-DD
  capacity: number
  orders: string[]
}

export interface CuttingPlanResponse {
  id: string
  date: string
  status: 'queued' | 'processing' | 'complete'
  sheets: CuttingPlanSheet[]
}

export interface CuttingPlansResponse {
  plans: CuttingPlanResponse[]
}
