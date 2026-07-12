import React from 'react';

export interface VarianceKPI {
  label: string;
  value: string | number;
  status: 'ok' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

interface VarianceSummaryCardProps {
  kpis: VarianceKPI[];
}

export const VarianceSummaryCard: React.FC<VarianceSummaryCardProps> = ({ kpis }) => {
  const getStatusColor = (status: VarianceKPI['status']) => {
    switch (status) {
      case 'ok':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend?: VarianceKPI['trend']) => {
    if (!trend) return null;

    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="variance-summary-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Variance Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className={`rounded-lg p-3 ${getStatusColor(kpi.status)}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium uppercase tracking-wide">
                {kpi.label}
              </span>
              {getTrendIcon(kpi.trend)}
            </div>
            <div className="text-2xl font-bold">{kpi.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
