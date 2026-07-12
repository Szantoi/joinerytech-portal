import { useAuth } from '../auth'

export function useSchedulePermissions() {
  const { roles } = useAuth()

  const canAssignBatches = roles.includes('machine_operator') ||
                           roles.includes('production_manager')

  const maxPriority = roles.includes('production_manager') ? 10 : 5

  const isReadOnly = !canAssignBatches

  return {
    canAssignBatches,
    maxPriority,
    isReadOnly
  }
}
