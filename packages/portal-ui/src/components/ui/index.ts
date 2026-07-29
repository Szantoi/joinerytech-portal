export { Icon } from './Icon'
export { Wordmark, GrainMark } from './Wordmark'
export { StatusPill, STATUS_TONES } from './StatusPill'
export { Sparkline } from './Sparkline'
// GanttChart: a `formatTick` alapértelmezése UTC `óó:pp`-t ad. Ha a `domain`
// helyi idejű (pl. egy naptári nap éjfele), adj saját, lokalizált formattert
// vagy explicit `ticks` listát — különben a felirat eltolódhat a zónával.
export { GanttChart } from './GanttChart'
export type { GanttChartProps, GanttItem, GanttLane, GanttTick, GanttTimeValue } from './GanttChart'
export { DependencyGraph } from './DependencyGraph'
export type { DependencyGraphProps, DependencyGraphNode, DependencyGraphEdge } from './DependencyGraph'
export { CapacityHeatmap } from './CapacityHeatmap'
export type { CapacityHeatmapProps } from './CapacityHeatmap'
export { capacityTone, DEFAULT_CAPACITY_THRESHOLDS } from './capacityHeatmap.types'
export type {
  CapacityBucket,
  CapacityCell,
  CapacityRow,
  CapacityRowSummary,
  CapacityThresholds,
} from './capacityHeatmap.types'
export { Card } from './Card'
export { Button, PrimaryBtn, GhostBtn } from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'
export { KpiCard } from './KpiCard'
export { ProgressBar } from './ProgressBar'
export { Avatar } from './Avatar'
export { SlideOver } from './SlideOver'
export { Tabs, TabPanel } from './Tabs'
export { FsmStepper } from './FsmStepper'
export type { FsmStep } from './FsmStepper'
export type { TabItem } from './Tabs'
export { DataTable } from './DataTable'
export type { DataTableColumn, SortState, SortDirection } from './dataTable.types'
export { ToastProvider } from './Toast'
export { useToast } from './toastContext'
export type { Toast, ToastType } from './toastContext'
export { Input } from './Input'
export { DateField, SelectField, TextAreaField } from './FormFields'
export type { DateFieldProps, SelectFieldProps, TextAreaFieldProps } from './FormFields'
export { QueryGate } from './QueryGate'
export { useFocusTrap } from './hooks/useFocusTrap'
export { useInertBackground } from './hooks/useInertBackground'
export { ConfirmDialog, ConfirmProvider } from './ConfirmDialog'
export type { ConfirmDialogProps } from './ConfirmDialog'
export { useConfirm } from './confirmContext'
export type { ConfirmOptions, ConfirmContextValue, ConfirmDetail } from './confirmContext'
// usePrintScope: a vágást a `src/index.css` `@media print` blokkja végzi
// (data-print-scope / data-print-region attribútum-pár) — a hook önmagában
// csak megjelöl és nyomtat.
export { usePrintScope } from './hooks/usePrintScope'
export type { PrintScope } from './hooks/usePrintScope'
export { useTimeCursor } from './hooks/useTimeCursor'
export type { TimeCursor, TimeCursorOptions } from './hooks/useTimeCursor'
export * from './dataTable.types'

