import type { WorkOrderOperation } from './types';

interface OperationCardProps {
  operation: WorkOrderOperation;
  isDragging?: boolean;
}

export function OperationCard({ operation, isDragging }: OperationCardProps) {
  return (
    <div
      className={`
        p-4 bg-white border rounded-lg shadow-sm
        flex items-center gap-4
        ${isDragging ? 'ring-2 ring-blue-500' : 'hover:border-blue-300'}
        transition-all cursor-grab active:cursor-grabbing
      `}
    >
      {/* Drag handle icon */}
      <div className="text-gray-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Sequence number */}
      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
        {operation.sequence}
      </div>

      {/* Operation details */}
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{operation.description}</h3>
        <p className="text-sm text-gray-500">{operation.operation_type}</p>
      </div>

      {/* Duration */}
      <div className="text-right text-sm text-gray-600">
        {formatDuration(operation.estimated_duration)}
      </div>
    </div>
  );
}

function formatDuration(isoDuration: string): string {
  // Parse ISO 8601 duration (e.g., "PT30M" → "30 perc")
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');

  if (hours > 0) return `${hours}ó ${minutes}p`;
  return `${minutes} perc`;
}
