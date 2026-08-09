import React, { useState } from 'react';
import { PurchaseRequests } from './PurchaseRequests';
import { Rfqs } from './Rfqs';
import { PurchaseOrders } from './PurchaseOrders';
import { VendorBills } from './VendorBills';

export const ProcurementWorkspace: React.FC<{activeEntityId: string, entities: any[]}> = ({ activeEntityId, entities }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'rfqs' | 'orders' | 'bills'>('requests');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Procurement Workspace</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the complete procurement lifecycle from request to bill payment.</p>
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-200/50">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'requests' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
        >
          1. Purchase Requests
        </button>
        <button
          onClick={() => setActiveTab('rfqs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'rfqs' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
        >
          2. RFQs & Quotes
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
        >
          3. Purchase Orders
        </button>
        <button
          onClick={() => setActiveTab('bills')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'bills' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
        >
          4. Vendor Bills
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'requests' && (
          <PurchaseRequests 
            activeEntityId={activeEntityId} 
            entities={entities} 
            goToPo={() => setActiveTab('orders')} 
            goToRfq={() => setActiveTab('rfqs')} 
          />
        )}
        {activeTab === 'rfqs' && (
          <Rfqs activeEntityId={activeEntityId} />
        )}
        {activeTab === 'orders' && (
          <PurchaseOrders activeEntityId={activeEntityId} entities={entities} />
        )}
        {activeTab === 'bills' && (
          <VendorBills activeEntityId={activeEntityId} />
        )}
      </div>
    </div>
  );
};
