import React from 'react';
import ReactSlider from 'react-slider';

export interface VersionSnapshot {
  id: string;
  version: string;
  timestamp: string;
  keyChanges?: string[];
}

interface VersionSliderProps {
  snapshots: VersionSnapshot[];
  selectedIndex: number;
  onVersionChange: (index: number) => void;
}

export const VersionSlider: React.FC<VersionSliderProps> = ({
  snapshots,
  selectedIndex,
  onVersionChange,
}) => {
  if (snapshots.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No versions available
      </div>
    );
  }

  return (
    <div className="version-slider w-full px-4 py-6">
      <div className="mb-2 text-sm text-gray-600">
        Version {snapshots[selectedIndex]?.version || ''} -{' '}
        {new Date(snapshots[selectedIndex]?.timestamp || '').toLocaleString()}
      </div>

      <div className="relative">
        <ReactSlider
          className="horizontal-slider h-2 bg-gray-200 rounded-full relative"
          thumbClassName="slider-thumb w-6 h-6 bg-blue-600 rounded-full cursor-pointer -top-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          trackClassName="slider-track h-2 rounded-full"
          min={0}
          max={snapshots.length - 1}
          value={selectedIndex}
          onChange={(value: number | readonly number[]) => {
            const index = Array.isArray(value) ? value[0] : value;
            onVersionChange(index);
          }}
        />
        {/* Manual version markers */}
        <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
          {snapshots.map((snapshot, index) => {
            const hasKeyChanges = snapshot.keyChanges && snapshot.keyChanges.length > 0;
            const position = (index / (snapshots.length - 1)) * 100;
            return (
              <div
                key={snapshot.id}
                className={`absolute w-2 h-2 rounded-full top-0 transform -translate-x-1/2 ${
                  hasKeyChanges ? 'bg-orange-500' : 'bg-gray-400'
                }`}
                style={{ left: `${position}%` }}
                title={`Version ${snapshot.version}`}
              />
            );
          })}
        </div>
      </div>

      <div className="flex justify-between mt-4 text-xs text-gray-500">
        <span>Oldest</span>
        <span>Latest</span>
      </div>
    </div>
  );
};
