import { useEffect, useState } from 'react'

export const Rfqs = ({ activeEntityId }: { activeEntityId: string }) => {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRfqs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5124/api/v1/rfqs?companyId=${activeEntityId}`);
      if (res.ok) setRfqs(await res.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRfqs();
    
    // Check if we came from PR to create RFQ
    const prId = localStorage.getItem('draftPrIdForRfq');
    if (prId) {
      localStorage.removeItem('draftPrIdForRfq');
      handleCreateRfqFromPr(prId);
    }
  }, [activeEntityId]);

  const handleCreateRfqFromPr = async (prId: string) => {
    try {
      // First fetch the PR to get lines
      const prRes = await fetch(`http://localhost:5124/api/v1/purchaserequests?companyId=${activeEntityId}`);
      if (!prRes.ok) return;
      const prs = await prRes.json();
      const pr = prs.find((x: any) => x.id === prId);
      if (!pr) return;

      const rfqRequest = {
        rfqNumber: `RFQ-${Date.now()}`,
        purchaseRequestId: prId,
        date: new Date().toISOString().slice(0, 10),
        deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), // +7 days
        lines: pr.lines.map((l: any) => ({
          productId: l.productId,
          description: l.description,
          quantity: l.quantity
        }))
      };

      const res = await fetch(`http://localhost:5124/api/v1/rfqs?companyId=${activeEntityId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rfqRequest)
      });
      if (res.ok) fetchRfqs();
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
            {rfqs.map(rfq => (
              <tr key={rfq.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{rfq.rfqNumber}</td>
                <td className="py-3 px-4 text-gray-500">{rfq.date}</td>
                <td className="py-3 px-4 text-gray-500">{rfq.deadline}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${rfq.status === 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {['Open', 'Closed', 'Awarded', 'Canceled'][rfq.status]}
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
