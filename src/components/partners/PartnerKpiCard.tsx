import React, { useEffect, useState } from 'react';
import { calculateKPIs, filterOrdersByMetric } from './KpiCalculator';
import type { Order, DateRange, KpiMetrics } from './KpiCalculator';

interface PartnerKpiCardProps {
  partnerId: string;
  orders: Order[];
  dateRange: DateRange;
  onMetricClick?: (metric: 'missing_data' | 'late_delivery' | 'high_value', filteredOrders: Order[]) => void;
}

export const PartnerKpiCard: React.FC<PartnerKpiCardProps> = ({
  partnerId,
  orders,
  dateRange,
  onMetricClick,
}) => {
  const [kpis, setKpis] = useState<KpiMetrics | null>(null);

  useEffect(() => {
    const partnerOrders = orders.filter((order) => order.partnerId === partnerId);
    const calculatedKpis = calculateKPIs(partnerOrders, dateRange);
    setKpis(calculatedKpis);
  }, [partnerId, orders, dateRange]);

  if (!kpis) {
    return (
      <div className="partner-kpi-card bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const handleMetricClick = (metric: 'missing_data' | 'late_delivery' | 'high_value') => {
    if (!onMetricClick) return;
    const partnerOrders = orders.filter((order) => order.partnerId === partnerId);
    const filtered = filterOrdersByMetric(partnerOrders, metric);
    onMetricClick(metric, filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
    }).format(amount);
  };

  return (
    <div className="partner-kpi-card bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Partner KPI Dashboard
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="kpi-metric bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">
            Total Orders
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {kpis.totalOrders}
          </div>
        </div>

        {/* Total Revenue */}
        <div className="kpi-metric bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-1">
            Total Revenue
          </div>
          <div className="text-2xl font-bold text-green-700">
            {formatCurrency(kpis.totalRevenue)}
          </div>
        </div>

        {/* Average Order Value */}
        <div
          className="kpi-metric bg-purple-50 rounded-lg p-4 border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
          onClick={() => handleMetricClick('high_value')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleMetricClick('high_value');
          }}
        >
          <div className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-1">
            Avg Order Value
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {formatCurrency(kpis.averageOrderValue)}
          </div>
          <div className="text-xs text-purple-600 mt-1">Click for high-value orders</div>
        </div>

        {/* On-Time Delivery */}
        <div
          className={`kpi-metric rounded-lg p-4 border cursor-pointer transition-colors ${
            kpis.onTimeDeliveryRate >= 90
              ? 'bg-green-50 border-green-200 hover:bg-green-100'
              : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
          }`}
          onClick={() => handleMetricClick('late_delivery')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleMetricClick('late_delivery');
          }}
        >
          <div
            className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
              kpis.onTimeDeliveryRate >= 90 ? 'text-green-900' : 'text-yellow-900'
            }`}
          >
            On-Time Delivery
          </div>
          <div
            className={`text-2xl font-bold ${
              kpis.onTimeDeliveryRate >= 90 ? 'text-green-700' : 'text-yellow-700'
            }`}
          >
            {kpis.onTimeDeliveryRate.toFixed(1)}%
          </div>
          <div
            className={`text-xs mt-1 ${
              kpis.onTimeDeliveryRate >= 90 ? 'text-green-600' : 'text-yellow-600'
            }`}
          >
            Click for late deliveries
          </div>
        </div>
      </div>

      {/* Missing Data Warning */}
      {kpis.missingDataCount > 0 && (
        <div
          className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3 cursor-pointer hover:bg-orange-100 transition-colors"
          onClick={() => handleMetricClick('missing_data')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleMetricClick('missing_data');
          }}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-orange-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-orange-800">
              ⚠️ {kpis.missingDataCount} missing data field{kpis.missingDataCount !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-orange-600 ml-auto">
              Click to see affected orders
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
