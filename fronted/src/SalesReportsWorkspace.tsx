// src/SalesReportsWorkspace.tsx
import { useEffect } from 'react';
import { useReportsStore } from './stores/useReportsStore';
import './SalesReports.module.css';

type Props = { activeEntityId: string };

function SalesReportsWorkspace({ activeEntityId }: Props) {
  const { balanceSheet, loading, error, fetchBalanceSheet } = useReportsStore();

  useEffect(() => {
    // Fetch balance sheet for the active entity – this contains key sales metrics
    fetchBalanceSheet({ entityId: activeEntityId });
  }, [activeEntityId]);

  // Helper to safely format numbers
  const fmt = (n?: number) => (n != null ? n.toLocaleString() : '-');

  return (
    <section className="workspace-card">
      <header className="workspace-header">
        <h2>Sales Reports</h2>
      </header>
      {loading && <p>Loading sales report…</p>}
      {error && <p className="error">{error}</p>}
      {balanceSheet && (
        <table className="glass-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Sales</td>
              <td>{fmt(balanceSheet.totalSales)}</td>
            </tr>
            <tr>
              <td>Cost of Goods Sold</td>
              <td>{fmt(balanceSheet.cogs)}</td>
            </tr>
            <tr>
              <td>Gross Profit</td>
              <td>{fmt(balanceSheet.grossProfit)}</td>
            </tr>
            <tr>
              <td>Operating Expenses</td>
              <td>{fmt(balanceSheet.operatingExpenses)}</td>
            </tr>
            <tr>
              <td>Net Income</td>
              <td>{fmt(balanceSheet.netIncome)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  );
}

export default SalesReportsWorkspace;
