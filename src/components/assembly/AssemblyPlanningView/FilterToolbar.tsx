import React from 'react';

export interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  showDeviationsOnly: boolean;
}

interface FilterToolbarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onFilterChange,
}) => {
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, dateFrom: e.target.value });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, dateTo: e.target.value });
  };

  const handleDeviationsToggle = () => {
    onFilterChange({ ...filters, showDeviationsOnly: !filters.showDeviationsOnly });
  };

  const handleClearFilters = () => {
    onFilterChange({
      dateFrom: undefined,
      dateTo: undefined,
      showDeviationsOnly: false,
    });
  };

  return (
    <div className="filter-toolbar bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="date-from" className="text-sm font-medium text-gray-700">
            From:
          </label>
          <input
            type="date"
            id="date-from"
            value={filters.dateFrom || ''}
            onChange={handleDateFromChange}
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
            value={filters.dateTo || ''}
            onChange={handleDateToChange}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={handleDeviationsToggle}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            filters.showDeviationsOnly
              ? 'bg-orange-50 text-orange-700 border-orange-300'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          aria-pressed={filters.showDeviationsOnly}
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Deviations Only
        </button>

        {(filters.dateFrom || filters.dateTo || filters.showDeviationsOnly) && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
