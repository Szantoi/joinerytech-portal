import React, { useState } from 'react';

interface DataQualityAlertProps {
  missingDataCount: number;
  missingDataDetails: string[];
}

export const DataQualityAlert: React.FC<DataQualityAlertProps> = ({
  missingDataCount,
  missingDataDetails,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (missingDataCount === 0) {
    return (
      <div className="data-quality-alert bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-green-800">
            ✅ Data quality OK — No missing data detected
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="data-quality-alert bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-orange-600 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-orange-900">
              ⚠️ {missingDataCount} missing data field{missingDataCount !== 1 ? 's' : ''} detected
            </span>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-medium text-orange-700 hover:text-orange-900 underline"
            >
              {expanded ? 'Hide details' : 'Show details'}
            </button>
          </div>

          {expanded && (
            <div className="mt-3 bg-white rounded border border-orange-200 p-3 max-h-64 overflow-y-auto">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                Missing Data Details:
              </h4>
              <ul className="space-y-1">
                {missingDataDetails.map((detail, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-orange-700 mt-2">
            Complete missing data to improve KPI accuracy and enable better analytics.
          </p>
        </div>
      </div>
    </div>
  );
};
