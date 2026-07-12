import { useState } from 'react';
import { TradeDashboard } from '../components/TradeDashboard';
import { PricingRulesPanel } from '../components/PricingRulesPanel';

export const TradeWorld = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pricing'>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Trade World</h1>
        <p className="text-gray-600">Manage pricing, quotes, and revenue</p>
      </header>

      {/* Tabs */}
      <div className="border-b bg-white px-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pricing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pricing Rules
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'dashboard' && <TradeDashboard />}
        {activeTab === 'pricing' && <PricingRulesPanel />}
      </div>
    </div>
  );
};
