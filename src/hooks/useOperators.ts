import { useApi, API_BASE } from './useApi'
import type { Operator } from '../types/scheduling.types'

export function useOperators() {
  return useApi<Operator[]>(
    `${API_BASE.identity}/users?role=machine_operator`
  )
}
