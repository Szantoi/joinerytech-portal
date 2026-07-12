import React, { useMemo } from 'react';
import { diffLines } from 'diff';
import type { Change } from 'diff';

interface DiffHighlightProps {
  oldVersion: Record<string, unknown>;
  newVersion: Record<string, unknown>;
}

export const DiffHighlight: React.FC<DiffHighlightProps> = ({
  oldVersion,
  newVersion,
}) => {
  const differences = useMemo(() => {
    const oldJson = JSON.stringify(oldVersion, null, 2);
    const newJson = JSON.stringify(newVersion, null, 2);
    return diffLines(oldJson, newJson);
  }, [oldVersion, newVersion]);

  const renderDiffLine = (change: Change, index: number) => {
    let bgColor = 'bg-white';
    let textColor = 'text-gray-800';
    let prefix = ' ';

    if (change.added) {
      bgColor = 'bg-green-50';
      textColor = 'text-green-900';
      prefix = '+';
    } else if (change.removed) {
      bgColor = 'bg-red-50';
      textColor = 'text-red-900';
      prefix = '-';
    }

    return (
      <div key={index} className={`${bgColor} ${textColor} px-4 py-1 font-mono text-sm`}>
        <span className="opacity-50 mr-2">{prefix}</span>
        <span className="whitespace-pre">{change.value}</span>
      </div>
    );
  };

  return (
    <div className="diff-highlight border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
        <h4 className="text-sm font-semibold text-gray-700">Changes</h4>
      </div>
      <div className="overflow-auto max-h-96">
        {differences.map((change, index) => renderDiffLine(change, index))}
      </div>
    </div>
  );
};
