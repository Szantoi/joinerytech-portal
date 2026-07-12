export const TradeDashboard = () => {
  // Mock data (real analytics deferred to Q4)
  const metrics = {
    totalRevenue: 1250000,
    avgQuotePrice: 25000,
    quoteCount: 50,
    conversionRate: 0.68 // 68% approval rate
  };

  const topMaterials = [
    { type: 'MDF', revenue: 680000, percentage: 54 },
    { type: 'Plywood', revenue: 420000, percentage: 34 },
    { type: 'Chipboard', revenue: 150000, percentage: 12 }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-stone-200/80">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-3xl font-bold mt-2">
            {metrics.totalRevenue.toLocaleString()} HUF
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-stone-200/80">
          <p className="text-sm text-gray-600">Avg Quote Price</p>
          <p className="text-3xl font-bold mt-2">
            {metrics.avgQuotePrice.toLocaleString()} HUF
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-stone-200/80">
          <p className="text-sm text-gray-600">Total Quotes</p>
          <p className="text-3xl font-bold mt-2">{metrics.quoteCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-stone-200/80">
          <p className="text-sm text-gray-600">Conversion Rate</p>
          <p className="text-3xl font-bold mt-2">
            {(metrics.conversionRate * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Top Materials by Revenue */}
      <div className="bg-white p-6 rounded-lg shadow border border-stone-200/80">
        <h2 className="text-lg font-medium mb-4">Top Materials by Revenue</h2>
        <div className="space-y-4">
          {topMaterials.map((material) => (
            <div key={material.type}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{material.type}</span>
                <span className="text-sm text-gray-600">
                  {material.revenue.toLocaleString()} HUF ({material.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${material.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
