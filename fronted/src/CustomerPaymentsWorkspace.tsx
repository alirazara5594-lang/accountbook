// src/CustomerPaymentsWorkspace.tsx
import { useEffect } from 'react';
import { useCustomerPaymentsStore } from './stores/useCustomerPaymentsStore';
import './CustomerPayments.module.css';

function CustomerPaymentsWorkspace() {
  const { payments, loading, error, fetchAll, create } = useCustomerPaymentsStore();

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async () => {
    const newPayment = {
      receiptNumber: 'AUTO',
      customerId: '',
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      paymentMethod: 'Cash',
      status: 'Draft',
    };
    try {
      await create(newPayment);
    } catch (e) {
      // error handled in store
    }
  };

  return (
    <section className="workspace-card">
      <header className="workspace-header">
        <h2>Customer Payments</h2>
        <button className="primary" onClick={handleCreate}>+ New Payment</button>
      </header>
      {loading && <p>Loading payments…</p>}
      {error && <p className="error">{error}</p>}
      <table className="glass-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p, i) => (
            <tr key={p.id}>
              <td>{p.receiptNumber || i + 1}</td>
              <td>{p.date}</td>
              <td>{p.customerName || p.customerId}</td>
              <td>{p.amount?.toLocaleString()}</td>
              <td>{p.paymentMethod}</td>
              <td>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default CustomerPaymentsWorkspace;
