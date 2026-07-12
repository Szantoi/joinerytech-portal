import { useMutation, API_BASE } from './useApi'
import type { AssignBatchRequest, AssignBatchResponse } from '../types/scheduling.types'

export function useBatchAssignment(planDate: string) {
  const { mutate, isLoading, error } = useMutation<AssignBatchResponse>()

  const assignBatch = async (request: AssignBatchRequest) => {
    return mutate(
      `${API_BASE.cutting}/api/plans/${planDate}/assign-batch`,
      {
        method: 'POST',
        body: request
      }
    )
  }

  return {
    assignBatch,
    isLoading,
    error
  }
}
