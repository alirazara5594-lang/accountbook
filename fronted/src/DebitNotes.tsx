import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

type Tab = 'dn' | 'ec' | 'pn' | 'sr';

export const DebitNotes: React.FC<{ activeEntityId: string; entities?: any[] }> = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dn');

  const tabsList: { id: Tab; label: string; icon: string }[] = [
    { id: 'dn', label: 'Debit Notes', icon: '📝' },
    { id: 'ec', label: 'Expense Claims', icon: '💰' },
    { id: 'pn', label: 'Payment Notes', icon: '💳' },
    { id: 'sr', label: 'Status Reports', icon: '📊' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>📝</span> Debit Notes Management
          </h1>
          <p className="text-gray-500 text-xs mt-1">Record vendor debit notes, track expenses, and manage payment obligations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab('dn')}>+ New Debit Note</Button>
        </div>
      </div>

      <div className="flex border border-gray-200 gap-1 bg-gray-50/80 p-1.5 rounded-2xl overflow-x-auto">
        {tabsList.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-white text-blue-700 shadow-xs border border-gray-200/60 font-bold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'}`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Debit Notes List */}
      {activeTab === 'dn' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Debit Note Number</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr><td colSpan={6} className="py-12 text-center text-gray-400">No Debit Notes found. Click "+ New Debit Note" to begin.</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Expense Claims */}
      {activeTab === 'ec' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <p className="p-6 text-center text-gray-500">Expense Claims tab - coming soon</p>
        </div>
      )}

      {/* TAB 3: Payment Notes */}
      {activeTab === 'pn' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <p className="p-6 text-center text-gray-500">Payment Notes tab - coming soon</p>
        </div>
      )}

      {/* TAB 4: Status Reports */}
      {activeTab === 'sr' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <p className="p-6 text-center text-gray-500">Status Reports tab - coming soon</p>
        </div>
      )}
    </div>
  );
};
