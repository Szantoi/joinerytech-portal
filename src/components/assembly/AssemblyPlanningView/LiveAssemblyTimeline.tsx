import React, { useEffect, useRef, useState } from 'react';
import { TimelineBubble } from './TimelineBubble';
import type { TimelineEvent } from './TimelineBubble';
import { FollowModeToggle } from './FollowModeToggle';
import { useLiveAssembly } from '../../../hooks/useLiveAssembly';

interface LiveAssemblyTimelineProps {
  assemblyId: string;
}

export const LiveAssemblyTimeline: React.FC<LiveAssemblyTimelineProps> = ({
  assemblyId,
}) => {
  const { timelineData, isLoading, error, lastUpdate } = useLiveAssembly(assemblyId);
  const [followMode, setFollowMode] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const todayEventRef = useRef<HTMLDivElement>(null);

  const events = timelineData?.events || [];

  // Auto-scroll to today's events when follow mode is enabled
  useEffect(() => {
    if (followMode && todayEventRef.current) {
      todayEventRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [followMode, events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading timeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">
          Error loading timeline: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  const isToday = (timestamp: string) => {
    const eventDate = new Date(timestamp);
    const today = new Date();
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="live-assembly-timeline flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Assembly Timeline</h2>
          <p className="text-sm text-gray-500">
            Last update: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <FollowModeToggle enabled={followMode} onToggle={setFollowMode} />
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4"
        style={{ maxHeight: '600px' }}
      >
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No timeline events available</p>
          </div>
        ) : (
          <div className="space-y-3 pl-4">
            {events.map((event, index) => {
              const isTodayEvent = isToday(event.timestamp);
              return (
                <div
                  key={event.id}
                  ref={isTodayEvent && index === events.findIndex(e => isToday(e.timestamp)) ? todayEventRef : null}
                >
                  <TimelineBubble event={event} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
