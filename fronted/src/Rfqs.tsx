import { useEffect } from 'react'
import { FileText } from 'lucide-react'
import { useProcurementStore } from './stores'
import { DataToolbar } from '@/components/ui/data-toolbar'
import { EmptyState, TableSkeleton } from './components/ui/empty-state'
import { StatusChip } from './components/ui/status-chip'

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

  if (loading) return <TableSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">RFQ List</h2>
        <DataToolbar
          exportFileName="rfqs"
          exportSheetName="RFQs"
          exportTitle="Requests for Quotation"
          exportSubtitle="RFQs issued to suppliers with deadlines and status."
          exportHeaders={['RFQ No.', 'Date', 'Deadline', 'Status']}
          exportRows={(rfqs as any[]).map((rfq: any) => [rfq.rfqNumber, rfq.issueDate || rfq.date || '-', rfq.dueDate || rfq.deadline || '-', String(rfq.status || 'Open')])}
          onRefresh={() => fetchRfqs(activeEntityId)}
        />
      </div>
      
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-green-500/[0.05] dark:bg-green-400/[0.07] text-gray-500 border-b border-gray-100">
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
                  <StatusChip status={String(rfq.status || 'open')} label={String(rfq.status || 'Open')} />
                </td>
              </tr>
            ))}
            {rfqs.length === 0 && (
              <tr><td colSpan={4}>
                <EmptyState icon={FileText} title="No RFQs found" hint="Issue a request for quotation from an approved purchase request to populate this register." />
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
