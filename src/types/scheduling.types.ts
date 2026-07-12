export interface Operator {
  id: string
  name: string
  email: string
  role: string
}

export interface Batch {
  id: string
  name: string
  materialType: string
  quantity: number
  priority: number
  status: 'Unassigned' | 'Assigned' | 'InProgress' | 'Completed'
  estimatedMinutes: number
}

export interface Machine {
  id: string
  name: string
  type: string
  capacity: number
  status: 'Available' | 'Busy' | 'Maintenance'
}

export interface Execution {
  id: string
  batchId: string
  batchName: string
  machineId: string
  operatorId: string
  priority: number
  startTime: string // ISO 8601
  estimatedMinutes: number
  status: 'Planned' | 'InProgress' | 'Completed'
}

export interface AssignBatchRequest {
  batchId: string
  machineId: string
  operatorId: string
  priority: number
  startTime: string
}

export interface AssignBatchResponse {
  executionId: string
  status: 'Planned'
}

export interface PendingAssignment {
  batch: Batch
  machine: Machine
  priority: number
}
