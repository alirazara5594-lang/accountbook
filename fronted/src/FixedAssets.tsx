import React, { useEffect } from 'react';
import { useAssetsInventoryStore } from './stores';

interface FixedAsset {
  id: string;
  assetTag?: string;
  name: string;
  description?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  cost?: number;
  status: number; // 0=Active, 1=Disposed
}

function money(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export const FixedAssets: React.FC<{activeEntityId: string}> = ({activeEntityId}) => {
  const assets = useAssetsInventoryStore((s) => s.assets as unknown as FixedAsset[]);
  const loading = useAssetsInventoryStore((s) => s.loading);
  const fetchFixedAssets = useAssetsInventoryStore((s) => s.fetchFixedAssets);

  useEffect(() => {
    fetchFixedAssets(activeEntityId);
  }, [activeEntityId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading asset register...</div>;

  const totalValue = assets.filter(a => a.status === 0 || (a.status as any) === 'Active').reduce((sum, a) => sum + (a.purchasePrice || a.cost || 0), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fixed Asset Register</h1>
          <p className="text-gray-500 text-sm mt-1">Manage serialized company assets and view historical purchases.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Active Value</p>
          <p className="text-2xl font-bold text-emerald-600">{money(totalValue)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="py-3 px-4 font-medium">Asset Tag</th>
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Description</th>
              <th className="py-3 px-4 font-medium">Purchase Date</th>
              <th className="py-3 px-4 font-medium text-right">Value</th>
              <th className="py-3 px-4 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {assets.map(asset => (
              <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-900">{asset.assetTag || asset.id.slice(0, 8)}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{asset.name}</td>
                <td className="py-3 px-4 text-gray-500 text-xs">{asset.description || '—'}</td>
                <td className="py-3 px-4 text-gray-500">{asset.purchaseDate || '—'}</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{money(asset.purchasePrice || asset.cost || 0)}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${asset.status === 0 || (asset.status as any) === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                    {asset.status === 0 || (asset.status as any) === 'Active' ? 'Active' : 'Disposed'}
                  </span>
                </td>
              </tr>
            ))}
            {assets.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No assets found in the register.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
