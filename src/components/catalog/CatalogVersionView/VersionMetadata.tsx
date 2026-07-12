import React from 'react';

interface VersionMetadataProps {
  author?: string;
  timestamp: string;
  aiSummary?: string;
  changeCount?: number;
}

export const VersionMetadata: React.FC<VersionMetadataProps> = ({
  author,
  timestamp,
  aiSummary,
  changeCount,
}) => {
  const formattedDate = new Date(timestamp).toLocaleString();

  return (
    <div className="version-metadata bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">
            Modified By
          </div>
          <div className="text-sm text-blue-800">
            {author || 'Unknown'}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">
            Timestamp
          </div>
          <div className="text-sm text-blue-800">{formattedDate}</div>
        </div>

        {changeCount !== undefined && (
          <div>
            <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">
              Changes
            </div>
            <div className="text-sm text-blue-800">
              {changeCount} field{changeCount !== 1 ? 's' : ''} modified
            </div>
          </div>
        )}

        {aiSummary && (
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">
              AI Summary
            </div>
            <div className="text-sm text-blue-800 italic">
              {aiSummary || 'No summary available'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
