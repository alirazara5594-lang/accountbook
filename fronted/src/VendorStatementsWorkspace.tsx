import { useEffect } from 'react';
import { useVendorsStore } from './stores';
import { Button } from '@/components/ui/button';
import { DataToolbar } from '@/components/ui/data-toolbar';

type VendorStatementsProps = { activeEntityId: string };

function VendorStatementsWorkspace({ activeEntityId }: VendorStatementsProps) {
  const vendors = useVendorsStore((s) => s.vendors);
  const loading = useVendorsStore((s) => s.loading);
  const error = useVendorsStore((s) => s.error);

  const fetchVendors = useVendorsStore((s) => s.fetchVendors);

  useEffect(() => {
    fetchVendors(activeEntityId);
  }, [activeEntityId]);

  const fmt = (n?: number) => (n != null ? n.toLocaleString() : '0.00');

  const exportHeaders = ['Vendor', 'Vendor Number', 'Total Purchases', 'Unpaid Invoices', 'Status'];
  const exportRows = vendors.map((v: any) => [v.name, v.vendorNumber || '', 0, 0, v.status]);

  return (
    <section className="workspace-card">
      <header className="workspace-header">
        <h2>Vendor Statements</h2>
        <DataToolbar
          exportFileName="vendor-statements"
          exportSheetName="Vendor Statements"
          exportTitle="Vendor Statements"
          exportSubtitle="Vendor balances and unpaid invoice register."
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          onRefresh={() => fetchVendors(activeEntityId)}
        />
      </header>
      {loading && <p>Loading vendors…</p>}
      {error && <p className="error">{error}</p>}
      {vendors.length > 0 && (
        <>
          <div className="statistics-grid">
            <div className="stat-card">
              <h3>Total Vendors</h3>
              <h2>{vendors.length}</h2>
            </div>
            <div className="stat-card">
              <h3>Total Purchases</h3>
              <h2>${fmt(0)}</h2>
            </div>
          </div>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Vendor Number</th>
                <th>Total Purchases</th>
                <th>Unpaid Invoices</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v: any, idx: number) => (
                <tr key={idx}>
                  <td>{v.name}</td>
                  <td>{v.vendorNumber || '—'}</td>
                  <td>${fmt(0)}</td>
                  <td>${fmt(0)}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      v.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                      v.status === 'Blocked' ? 'bg-rose-50 text-rose-600' :
                      v.status === 'Inactive' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-50 text-gray-600'
                    }`}>{v.status}</span>
                  </td>
                  <td>
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200">
                      Make Payment
                    </Button>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', opacity: 0.6 }}>
                    No vendors found. Click "Add Vendor" to register a new supplier.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
      {vendors.length === 0 && !loading && (
        <p className="text-center text-gray-500 mt-4">
          No vendors registered. Use the Procurement sidebar to add a new vendor.
        </p>
      )}
    </section>
  );
}

export default VendorStatementsWorkspace;