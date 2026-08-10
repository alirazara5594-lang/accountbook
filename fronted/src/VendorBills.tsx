import { useEffect } from 'react'
import { useProcurementStore } from './stores'

export const VendorBills = ({ activeEntityId }: { activeEntityId: string }) => {
  const bills = useProcurementStore((s) => s.bills);
  const loading = useProcurementStore((s) => s.loading);
  const fetchBills = useProcurementStore((s) => s.fetchBills);

  useEffect(() => {
    fetchBills(activeEntityId);
  }, [activeEntityId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Bills...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Vendor Bills List</h2>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="py-3 px-4 font-medium">Bill No.</th>
              <th className="py-3 px-4 font-medium">Invoice No.</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Due Date</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">3-Way Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(bills as any[]).map((bill: any) => (
              <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{bill.billNumber}</td>
                <td className="py-3 px-4 text-gray-500">{bill.vendorBillNumber || (bill as any).vendorInvoiceNumber}</td>
                <td className="py-3 px-4 text-gray-500">{bill.date}</td>
                <td className="py-3 px-4 text-gray-500">{bill.dueDate}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${bill.status === 'Paid' || (bill as any).status === 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {bill.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {(bill as any).hasVarianceWarning ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Variance Detected</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Matched</span>
                  )}
                </td>
              </tr>
            ))}
            {bills.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No Bills found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
