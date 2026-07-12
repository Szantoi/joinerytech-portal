import React from 'react';
import { DeltaBadge } from './DeltaBadge';

export interface TimelineEvent {
  id: string;
  type: 'plan' | 'actual';
  step: string;
  material: string;
  status: 'ok' | 'delay' | 'ahead';
  deltaMinutes?: number;
  timestamp: string;
}

interface TimelineBubbleProps {
  event: TimelineEvent;
}

export const TimelineBubble: React.FC<TimelineBubbleProps> = ({ event }) => {
  const isActual = event.type === 'actual';

  const getStatusColor = () => {
    switch (event.status) {
      case 'ok':
        return 'green';
      case 'delay':
        return 'red';
      case 'ahead':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const statusColor = getStatusColor();

  const bubbleClasses = isActual
    ? `bg-${statusColor}-50 border-2 border-${statusColor}-500`
    : `bg-white border-2 border-${statusColor}-300 border-dashed`;

  return (
    <div
      className={`timeline-bubble relative p-4 rounded-lg shadow-sm mb-3 ${bubbleClasses}`}
      role="listitem"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-medium text-gray-900">{event.step}</div>
          <div className="text-sm text-gray-600">{event.material}</div>
          <div className="text-xs text-gray-500 mt-1">{event.timestamp}</div>
        </div>
        {event.deltaMinutes !== undefined && (
          <div className="ml-2">
            <DeltaBadge delta={event.deltaMinutes} />
          </div>
        )}
      </div>
      <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
        <div className={`w-6 h-6 rounded-full ${isActual ? `bg-${statusColor}-500` : `border-2 border-${statusColor}-400 bg-white`}`} />
      </div>
    </div>
  );
};
