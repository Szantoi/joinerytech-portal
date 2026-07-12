import React from 'react';

interface SnapshotPreviewProps {
  version: Record<string, unknown>;
  isLoading?: boolean;
}

export const SnapshotPreview: React.FC<SnapshotPreviewProps> = ({
  version,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="snapshot-preview bg-white border border-gray-300 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  const renderValue = (value: unknown): React.ReactNode => {
    if (value === null) return <span className="text-gray-400">null</span>;
    if (value === undefined) return <span className="text-gray-400">undefined</span>;
    if (typeof value === 'object') {
      return <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>;
    }
    return String(value);
  };

  return (
    <div className="snapshot-preview bg-white border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
        <h4 className="text-sm font-semibold text-gray-700">Version Preview</h4>
      </div>
      <div className="p-4 overflow-auto max-h-96">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="divide-y divide-gray-200">
            {Object.entries(version).map(([key, value]) => (
              <tr key={key} className="hover:bg-gray-50">
                <td className="py-2 pr-4 text-sm font-medium text-gray-900 align-top">
                  {key}
                </td>
                <td className="py-2 text-sm text-gray-700">
                  {renderValue(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
