import React from 'react';
import type { DateRange } from './KpiCalculator';

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (dateRange: DateRange) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onChange,
}) => {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...dateRange, from: e.target.value });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...dateRange, to: e.target.value });
  };

  const handlePresetClick = (preset: 'week' | 'month' | 'quarter' | 'year') => {
    const today = new Date();
    const from = new Date();

    switch (preset) {
      case 'week':
        from.setDate(today.getDate() - 7);
        break;
      case 'month':
        from.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        from.setMonth(today.getMonth() - 3);
        break;
      case 'year':
        from.setFullYear(today.getFullYear() - 1);
        break;
    }

    onChange({
      from: from.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
    });
  };

  return (
    <div className="date-range-picker bg-white border border-gray-300 rounded-lg p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="date-from" className="text-sm font-medium text-gray-700">
            From:
          </label>
          <input
            type="date"
            id="date-from"
            value={dateRange.from}
            onChange={handleFromChange}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="date-to" className="text-sm font-medium text-gray-700">
            To:
          </label>
          <input
            type="date"
            id="date-to"
            value={dateRange.to}
            onChange={handleToChange}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handlePresetClick('week')}
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
          >
            Last Week
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick('month')}
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
          >
            Last Month
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick('quarter')}
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
          >
            Last Quarter
          </button>
        </div>
      </div>
    </div>
  );
};
