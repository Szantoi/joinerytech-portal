import React from 'react';

interface FollowModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const FollowModeToggle: React.FC<FollowModeToggleProps> = ({
  enabled,
  onToggle,
}) => {
  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
        enabled
          ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
      aria-pressed={enabled}
      aria-label="Toggle follow mode"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      {enabled ? 'Follow Mode ON' : 'Follow Mode OFF'}
    </button>
  );
};
