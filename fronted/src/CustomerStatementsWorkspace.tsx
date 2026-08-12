// src/CustomerStatementsWorkspace.tsx
import { useEffect } from 'react';
import { useReportsStore } from './stores/useReportsStore';
import { useCustomersStore } from './stores';
import './CustomerStatements.module.css';

type Props = { activeEntityId: string };

function CustomerStatementsWorkspace({ activeEntityId }: Props) {
  const { incomeStatement, loading, error, fetchIncomeStatement } = useReportsStore();
  const customers = useCustomersStore((s) => s.customers as any[]);

  useEffect(() => {
    // Fetch income statement for the active entity
    fetchIncomeStatement({ entityId: activeEntityId });
  }, [activeEntityId]);

  // Format currency safely
  const fmt = (n?: number) => (n != null ? n.toLocaleString() : '0.00');

  return (
    <>
      <section className="workspace-card">
        <header className="workspace-header">
          <h2>Customer Statements</h2>
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
                {incomeStatement?.customerBalances?.map((balance: any, idx: number) => (
                  <tr key={idx}>
                    <td>{balance.customerName || balance.customerId}</td>
                    <td>${fmt(balance.outstandingBalance)}</td>
                    <td>
                      {balance.outstandingBalance > 0 ? 'Outstanding' : 'Current'}
                    </td>
                  </tr>
                ))}
                {(!incomeStatement?.customerBalances || incomeStatement.customerBalances.length === 0) && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', opacity: 0.6 }}>
                      No customer balances found. Ensure customers have outstanding invoices.
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