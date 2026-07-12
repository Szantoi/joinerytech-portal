import { useState } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import toast from 'react-hot-toast';
import { SortableOperation } from './SortableOperation';
import type { WorkOrderOperation, UndoCommand } from './types';

interface AssemblyOperationsListProps {
  workOrderId: string;
  operations: WorkOrderOperation[];
  onReorder?: (operations: WorkOrderOperation[]) => void;
  readOnly?: boolean;
}

export function AssemblyOperationsList({
  workOrderId,
  operations: initialOps,
  readOnly = false,
  onReorder
}: AssemblyOperationsListProps) {
  const [operations, setOperations] = useState(initialOps);
  const [undoStack, setUndoStack] = useState<UndoCommand[]>([]);

  // Sensor configuration (Plan-B: touch scroll vs drag fix)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }  // 8px threshold before drag starts
    }),
    useSensor(KeyboardSensor)  // A11y: arrow keys + enter to reorder
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = operations.findIndex(op => op.id === active.id);
    const newIndex = operations.findIndex(op => op.id === over.id);

    // Optimistic UI update
    const reorderedOps = arrayMove(operations, oldIndex, newIndex).map((op, idx) => ({
      ...op,
      sequence: idx + 1
    }));

    setOperations(reorderedOps);

    // Command pattern for undo
    const command: UndoCommand = {
      previousState: operations,
      newState: reorderedOps,
      timestamp: Date.now()
    };
    setUndoStack([...undoStack, command]);

    // Haptic feedback (mobile)
    if ('vibrate' in navigator) {
      navigator.vibrate([5, 50, 5]);  // Short-pause-short pattern
    }

    // Callback for parent component
    if (onReorder) {
      onReorder(reorderedOps);
    }

    // API call
    try {
      const response = await fetch(`/api/v1/work-orders/${workOrderId}/assembly-sequence`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: reorderedOps.map(op => ({ id: op.id, sequence: op.sequence })),
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        if (response.status === 409) {
          // Conflict: someone else modified
          toast.error('A munkarendet más felhasználó módosította. Frissítsd az oldalt!');
          // TODO: Auto-refresh operations from server
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } else {
        const data = await response.json();
        // Update with server response (LastModified timestamps)
        setOperations(data.updated_operations);

        // Show duration change if available
        if (data.estimated_duration_change && data.estimated_duration_change !== '+0min') {
          toast.success(`Átrendezve! Időbecslés változás: ${data.estimated_duration_change}`);
        }
      }
    } catch (error) {
      // Rollback on error
      setOperations(operations);
      setUndoStack(undoStack.slice(0, -1));
      toast.error('Mentés sikertelen - változtatások visszavonva');
      console.error('Assembly reorder failed:', error);
    }
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const lastCommand = undoStack[undoStack.length - 1];

    // Check if undo is still valid (< 30 seconds old)
    if (Date.now() - lastCommand.timestamp > 30000) {
      toast.error('Visszavonás lejárt (30 másodperc limit)');
      setUndoStack([]);
      return;
    }

    setOperations(lastCommand.previousState);
    setUndoStack(undoStack.slice(0, -1));
    toast.success('Visszavonva');

    // Send revert to backend
    try {
      await fetch(`/api/v1/work-orders/${workOrderId}/assembly-sequence`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: lastCommand.previousState.map(op => ({ id: op.id, sequence: op.sequence })),
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Undo failed to sync with backend:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Undo button (show for 30s after change) */}
      {undoStack.length > 0 && Date.now() - undoStack[undoStack.length - 1].timestamp < 30000 && (
        <button
          onClick={handleUndo}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          aria-label="Utolsó művelet visszavonása"
        >
          ↶ Visszavonás
        </button>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={operations} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {operations.map(operation => (
              <SortableOperation
                key={operation.id}
                operation={operation}
                disabled={readOnly}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
