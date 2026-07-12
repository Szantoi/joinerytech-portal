// ShopFloor Kiosk types for MSG-FRONTEND-020

export interface OperatorSession {
  sessionId: string
  operatorId: string
  operatorName: string
  operatorPin: string
  workstationId: string
  workstationName: string
  loginTime: string
}

export interface Workstation {
  id: string
  name: string
  type: 'cutting' | 'edgeband' | 'cnc'
  facility: string
  status: 'idle' | 'active' | 'maintenance'
}

export interface QueuedBatch {
  batchId: string
  queuePosition: number
  status: 'Queued' | 'InProgress' | 'Completed'
  pieceCount: number
  material?: string
  estimatedDuration: string
  assignedOperator?: string
}

export interface MachineQueue {
  workstationId: string
  workstationName: string
  status: 'Active' | 'Idle'
  batches: QueuedBatch[]
}

export interface Batch {
  batchId: string
  pieceCount: number
  material?: string
  parts?: Array<{ name: string; quantity: number }>
}

export interface BatchCompletionPayload {
  sessionId: string
  producedPieces: number
  wastePieces: number
}
