// src/CustomerStatementsWorkspace.tsx
import { useEffect, useMemo, useState } from 'react';
import { useReportsStore } from './stores/useReportsStore';
import { useCustomersStore } from './stores';
import { DataToolbar } from '@/components/ui/data-toolbar';
import './CustomerStatements.module.css';

type Props = { activeEntityId: string };

function CustomerStatementsWorkspace({ activeEntityId }: Props) {
  const { incomeStatement, loading, error, fetchIncomeStatement } = useReportsStore();
  const customers = useCustomersStore((s) => s.customers as any[]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Fetch income statement for the active entity
    fetchIncomeStatement({ entityId: activeEntityId });
  }, [activeEntityId]);

  // Format currency safely
  const fmt = (n?: number) => (n != null ? n.toLocaleString() : '0.00');

  const balances = useMemo(() => incomeStatement?.customerBalances || [], [incomeStatement]);

  const filteredBalances = useMemo(() => {
    if (!query.trim()) return balances;
    const q = query.toLowerCase();
    return balances.filter((b: any) =>
      (b.customerName || b.customerId || '').toLowerCase().includes(q)
    );
  }, [balances, query]);

  const exportHeaders = ['Customer', 'Outstanding Balance', 'Status'];
  const exportRows = filteredBalances.map((b: any) => [
    b.customerName || b.customerId,
    b.outstandingBalance,
    b.outstandingBalance > 0 ? 'Outstanding' : 'Current',
  ]);
  const totalOutstanding = filteredBalances.reduce((s: number, b: any) => s + (b.outstandingBalance || 0), 0);

  return (
    <>
      <section className="workspace-card">
        <header className="workspace-header">
          <h2>Customer Statements</h2>
          <DataToolbar
            query={query}
            setQuery={setQuery}
            searchPlaceholder="Search customer..."
            exportFileName="customer-statements"
            exportSheetName="Customer Statements"
            exportTitle="Customer Statements"
            exportSubtitle="Customer account balances for statement generation."
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Outstanding', value: totalOutstanding }]}
            onRefresh={() => fetchIncomeStatement({ entityId: activeEntityId })}
          />
        </header>
        {loading && <p>Loading statements…</p>}
        {error && <p className="error">{error}</p>}
        {incomeStatement && (
          <>
            <div className="statistics-grid">
              <div className="stat-card">
                <h3>Total Customers</h3>
                <h2>{customers.length}</h2>
              </div>
              <div className="stat-card">
                <h3>Outstanding Balance</h3>
                <h2>${fmt(incomeStatement?.totalOutstanding)}</h2>
              </div>
            </div>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBalances.map((balance: any, idx: number) => (
                  <tr key={idx}>
                    <td>{balance.customerName || balance.customerId}</td>
                    <td>${fmt(balance.outstandingBalance)}</td>
                    <td>
                      {balance.outstandingBalance > 0 ? 'Outstanding' : 'Current'}
                    </td>
                  </tr>
                ))}
                {filteredBalances.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', opacity: 0.6 }}>
                      {query ? 'No customer balances match your search.' : 'No customer balances found. Ensure customers have outstanding invoices.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </section>
    </>
  );
}

export default CustomerStatementsWorkspace;