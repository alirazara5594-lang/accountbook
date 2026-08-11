// src/CustomerStatementsWorkspace.tsx
import { useEffect } from 'react';
import { useReportsStore } from './stores/useReportsStore';
import './CustomerStatements.module.css';

type Props = { activeEntityId: string };

function CustomerStatementsWorkspace({ activeEntityId }: Props) {
  const { incomeStatement, loading, error, fetchIncomeStatement } = useReportsStore();

  useEffect(() => {
    // Fetch income statement for the active entity
    fetchIncomeStatement({ entityId: activeEntityId });
  }, [activeEntityId]);

  return (
    <section className="workspace-card">
      <header className="workspace-header">
        <h2>Customer Statements</h2>
      </header>
      {loading && <p>Loading statements…</p>}
      {error && <p className="error">{error}</p>}
      {incomeStatement && (
        <table className="glass-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            {incomeStatement.lines?.map((line: any, idx: number) => (
              <tr key={idx}>
                <td>{line.account}</td>
                <td>{line.debit?.toLocaleString()}</td>
                <td>{line.credit?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default CustomerStatementsWorkspace;
