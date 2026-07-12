export interface WorkOrderOperation {
  id: string;
  sequence: number;
  description: string;
  estimated_duration: string; // ISO 8601 duration
  operation_type: string;
  last_modified: string;
}

export interface UndoCommand {
  previousState: WorkOrderOperation[];
  newState: WorkOrderOperation[];
  timestamp: number;
}

export interface AssemblySequenceUpdateRequest {
  operations: Array<{ id: string; sequence: number }>;
  timestamp: string;
}

export interface AssemblySequenceUpdateResponse {
  updated_operations: WorkOrderOperation[];
  estimated_duration_change?: string;
  total_duration: string;
}
