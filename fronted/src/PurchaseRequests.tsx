import React, { useState, useEffect } from 'react';
import { useProcurementStore, useProductsStore } from './stores';
import { DataToolbar } from '@/components/ui/data-toolbar';

interface PurchaseRequestLine {
  id?: string;
  productId: string;
  description: string;
  quantity: number;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requesterName: string;
  date: string;
  status: number; // 0=Draft, 1=Submitted, 2=Approved, 3=Rejected, 4=Ordered
  lines: PurchaseRequestLine[];
}

export const PurchaseRequests: React.FC<{activeEntityId: string, entities: any[], goToPo: () => void, goToRfq: () => void}> = ({activeEntityId, goToPo, goToRfq}) => {
  const requests = useProcurementStore((s) => s.requests as any[]);
  const fetchRequests = useProcurementStore((s) => s.fetchRequests);
  const createPurchaseRequestStore = useProcurementStore((s) => s.createPurchaseRequest);

  const products = useProductsStore((s) => s.products as any[]);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requesterName, setRequesterName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<PurchaseRequestLine[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeEntityId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRequests(activeEntityId),
        fetchProducts(),
      ]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const addLine = () => setLines([...lines, { productId: '', description: '', quantity: 1 }]);

  const updateLine = (index: number, field: keyof PurchaseRequestLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    if (field === 'productId') {
      const p = products.find(p => p.id === value);
      if (p) newLines[index].description = p.name;
    }
    setLines(newLines);
  };

  const submitPr = async () => {
    if (!requesterName || lines.length === 0) return alert('Requester Name and at least one line required.');
    try {
      await createPurchaseRequestStore({
        requestNumber: `PR-${Date.now().toString().slice(-6)}`,
        requesterName,
        date,
        lines,
        companyId: activeEntityId || null
      });
      setIsModalOpen(false);
      setRequesterName('');
      setLines([]);
    } catch (e: any) {
      alert(e.message || 'Failed to create PR');
    }
  };

  const approvePr = async (_id: string) => {
    try {
      await useProcurementStore.getState().fetchAllProcurement(activeEntityId);
    } catch (e) {
      console.error(e);
    }
  };

  const convertToPo = (id: string) => {
    localStorage.setItem('draftPrId', id);
    goToPo();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading purchase requests...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Request List</h2>
        <div className="flex items-center gap-2">
          <DataToolbar
            exportFileName="purchase-requests"
            exportSheetName="Purchase Requests"
            exportTitle="Purchase Requests"
            exportSubtitle="Internal requisitions from requester through approval to ordering."
            exportHeaders={['Request No.', 'Date', 'Requester', 'Status']}
            exportRows={requests.map((pr: any) => [pr.requestNumber, pr.date, pr.requesterName, ['Draft', 'Submitted', 'Approved', 'Rejected', 'Ordered'][pr.status]])}
            onRefresh={fetchData}
          />
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-all">
            + New Request
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="py-3 px-4 font-medium">Request No.</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Requester</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map(pr => (
              <tr key={pr.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{pr.requestNumber}</td>
                <td className="py-3 px-4 text-gray-500">{pr.date}</td>
                <td className="py-3 px-4 text-gray-900">{pr.requesterName}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${pr.status === 2 ? 'bg-green-100 text-green-700' : pr.status === 4 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {['Draft', 'Submitted', 'Approved', 'Rejected', 'Ordered'][pr.status]}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  {pr.status < 2 && (
                    <button onClick={() => approvePr(pr.id)} className="text-blue-600 hover:text-blue-800 font-medium">Approve</button>
                  )}
                  {pr.status === 2 && (
                    <>
                      <button onClick={() => {
                        localStorage.setItem('draftPrIdForRfq', pr.id);
                        goToRfq();
                      }} className="text-purple-600 hover:text-purple-800 font-medium whitespace-nowrap">Create RFQ</button>
                      <button onClick={() => convertToPo(pr.id)} className="text-green-600 hover:text-green-800 font-medium whitespace-nowrap">Convert to PO</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">No requests found.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in pl-64">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">New Purchase Request</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Requester Name</label>
                  <input required value={requesterName} onChange={e => setRequesterName(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
              </div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="font-medium">Requested Items</h3>
                <button onClick={addLine} className="text-sm px-3 py-1.5 bg-gray-100 rounded-lg">+ Add Item</button>
              </div>
              {lines.map((line, i) => (
                <div key={i} className="flex gap-4 mb-3">
                  <select value={line.productId} onChange={e => updateLine(i, 'productId', e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select Product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" min="1" value={line.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} className="w-24 border rounded-lg px-3 py-2 text-sm text-right" />
                  <button onClick={() => setLines(lines.filter((_, idx) => idx !== i))} className="text-red-500">✕</button>
                </div>
              ))}
            </div>
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50/50">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl hover:bg-gray-200">Cancel</button>
              <button onClick={submitPr} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700">Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
