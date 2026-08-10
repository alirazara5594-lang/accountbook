import { useEffect } from 'react'
import { useProcurementStore } from './stores'

export const Rfqs = ({ activeEntityId }: { activeEntityId: string }) => {
  const rfqs = useProcurementStore((s) => s.rfqs);
  const loading = useProcurementStore((s) => s.loading);
  const fetchRfqs = useProcurementStore((s) => s.fetchRfqs);

  useEffect(() => {
    fetchRfqs(activeEntityId);
    
    // Check if we came from PR to create RFQ
    const prId = localStorage.getItem('draftPrIdForRfq');
    if (prId) {
      localStorage.removeItem('draftPrIdForRfq');
      handleCreateRfqFromPr(prId);
    }
  }, [activeEntityId]);

  const handleCreateRfqFromPr = async (prId: string) => {
    try {
      const prs = await useProcurementStore.getState().fetchRequests(activeEntityId);
      const pr = prs.find((x: any) => x.id === prId);
      if (!pr) return;

      await useProcurementStore.getState().fetchRfqs(activeEntityId);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading RFQs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">RFQ List</h2>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="py-3 px-4 font-medium">RFQ No.</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Deadline</th>
              <th className="py-3 px-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(rfqs as any[]).map(rfq => (
              <tr key={rfq.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{rfq.rfqNumber}</td>
                <td className="py-3 px-4 text-gray-500">{rfq.issueDate || rfq.date || '-'}</td>
                <td className="py-3 px-4 text-gray-500">{rfq.dueDate || rfq.deadline || '-'}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                    {String(rfq.status || 'Open')}
                  </span>
                </td>
              </tr>
            ))}
            {rfqs.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400">No RFQs found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
