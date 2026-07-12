import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OperationCard } from './OperationCard';
import type { WorkOrderOperation } from './types';

interface SortableOperationProps {
  operation: WorkOrderOperation;
  disabled?: boolean;
}

export function SortableOperation({ operation, disabled }: SortableOperationProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: operation.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`Reorder ${operation.description}, currently position ${operation.sequence}`}
      tabIndex={0}
    >
      <OperationCard operation={operation} isDragging={isDragging} />
    </div>
  );
}
