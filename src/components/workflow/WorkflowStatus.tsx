import { Icon } from '../ui'

export type WorkflowState =
  | 'design_active'
  | 'cutting_assigned'
  | 'nesting_complete'
  | 'execution_planned'
  | 'completed'

interface WorkflowStatusProps {
  currentState: WorkflowState
  size?: 'sm' | 'md' | 'lg'
}

const WORKFLOW_CONFIG: Record<WorkflowState, {
  label: string
  color: string
  bgColor: string
  icon: string
}> = {
  design_active: {
    label: 'Design aktív',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    icon: 'edit',
  },
  cutting_assigned: {
    label: 'Szabászaton hozzárendelve',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: 'tool',
  },
  nesting_complete: {
    label: 'Nesting kész',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    icon: 'grid',
  },
  execution_planned: {
    label: 'Végrehajtás tervezve',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    icon: 'calendar',
  },
  completed: {
    label: 'Befejezett',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: 'check',
  },
}

const SIZE_CONFIG = {
  sm: {
    padding: 'px-2 py-1',
    fontSize: 'text-[10px]',
    iconSize: 10,
  },
  md: {
    padding: 'px-2.5 py-1.5',
    fontSize: 'text-[11px]',
    iconSize: 12,
  },
  lg: {
    padding: 'px-3 py-2',
    fontSize: 'text-[12px]',
    iconSize: 14,
  },
}

/**
 * WorkflowStatus Badge Component
 *
 * Displays the current workflow state with an icon and label.
 *
 * @example
 * <WorkflowStatus currentState="cutting_assigned" size="md" />
 */
export function WorkflowStatus({ currentState, size = 'md' }: WorkflowStatusProps) {
  const config = WORKFLOW_CONFIG[currentState]
  const sizeConfig = SIZE_CONFIG[size]

  if (!config) {
    console.warn(`Unknown workflow state: ${currentState}`)
    return null
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold ${config.color} ${config.bgColor} ${sizeConfig.padding} ${sizeConfig.fontSize}`}
    >
      <Icon name={config.icon as any} size={sizeConfig.iconSize} />
      {config.label}
    </div>
  )
}

/**
 * WorkflowStatusTimeline Component
 *
 * Displays all workflow states with the current one highlighted.
 *
 * @example
 * <WorkflowStatusTimeline currentState="cutting_assigned" />
 */
export function WorkflowStatusTimeline({ currentState }: { currentState: WorkflowState }) {
  const states: WorkflowState[] = [
    'design_active',
    'cutting_assigned',
    'nesting_complete',
    'execution_planned',
    'completed',
  ]

  const currentIndex = states.indexOf(currentState)

  return (
    <div className="flex items-center gap-2">
      {states.map((state, index) => {
        const config = WORKFLOW_CONFIG[state]
        const isActive = index === currentIndex
        const isComplete = index < currentIndex
        const isFuture = index > currentIndex

        return (
          <div key={state} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition ${
                isActive
                  ? `${config.color} ${config.bgColor} font-semibold`
                  : isComplete
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-stone-100 text-stone-500'
              }`}
            >
              <Icon
                name={isComplete ? 'check' : config.icon as any}
                size={12}
              />
              <span className="hidden sm:inline">{config.label}</span>
            </div>
            {index < states.length - 1 && (
              <div className={`w-6 h-px ${isFuture ? 'bg-stone-200' : 'bg-emerald-400'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
