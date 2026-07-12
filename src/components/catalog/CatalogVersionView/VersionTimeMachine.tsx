import React, { useState } from 'react';
import { VersionSlider } from './VersionSlider';
import { SnapshotPreview } from './SnapshotPreview';
import { DiffHighlight } from './DiffHighlight';
import { VersionMetadata } from './VersionMetadata';
import { useCatalogVersion } from '../../../hooks/useCatalogVersion';

interface VersionTimeMachineProps {
  catalogId: string;
}

export const VersionTimeMachine: React.FC<VersionTimeMachineProps> = ({
  catalogId,
}) => {
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareIndex, setCompareIndex] = useState<number | null>(null);

  const {
    snapshots,
    selectedVersionIndex,
    selectedVersion,
    isLoading,
    onVersionChange,
    onRestore,
  } = useCatalogVersion(catalogId);

  const handleRestore = async () => {
    try {
      await onRestore();
      alert('Version restored as draft successfully!');
    } catch (error) {
      alert('Failed to restore version: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading version history...</div>
      </div>
    );
  }

  const previousVersion = selectedVersionIndex > 0 && snapshots[selectedVersionIndex - 1]
    ? snapshots[selectedVersionIndex - 1]
    : null;

  return (
    <div className="version-time-machine bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Catalog Version History
        </h2>
        <p className="text-sm text-gray-600">
          Navigate through catalog versions and restore previous states
        </p>
      </div>

      <VersionSlider
        snapshots={snapshots}
        selectedIndex={selectedVersionIndex}
        onVersionChange={onVersionChange}
      />

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setComparisonMode(!comparisonMode)}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            comparisonMode
              ? 'bg-purple-50 text-purple-700 border-purple-300'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {comparisonMode ? 'Hide Diff' : 'Show Diff'}
        </button>

        {selectedVersion && (
          <button
            type="button"
            onClick={handleRestore}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Restore This Version
          </button>
        )}
      </div>

      {selectedVersion && (
        <div className="mt-6">
          <VersionMetadata
            author={selectedVersion.author}
            timestamp={selectedVersion.timestamp}
            changeCount={selectedVersion.keyChanges?.length}
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6">
        {comparisonMode && previousVersion && selectedVersion ? (
          <DiffHighlight
            oldVersion={selectedVersion.data}
            newVersion={selectedVersion.data}
          />
        ) : (
          selectedVersion && (
            <SnapshotPreview
              version={selectedVersion.data}
              isLoading={isLoading}
            />
          )
        )}
      </div>
    </div>
  );
};
