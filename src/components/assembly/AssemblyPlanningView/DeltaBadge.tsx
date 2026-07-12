import React from 'react';

interface DeltaBadgeProps {
  delta: number;
}

export const DeltaBadge: React.FC<DeltaBadgeProps> = ({ delta }) => {
  const getColorClasses = () => {
    if (delta > 0) return 'bg-green-100 text-green-800 border-green-300';
    if (delta < 0) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const sign = delta > 0 ? '+' : '';

  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getColorClasses()}`}
      aria-label={`${sign}${delta} minutes difference`}
    >
      {sign}{delta} perc
    </span>
  );
};
