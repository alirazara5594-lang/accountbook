// src/CustomerPaymentsWorkspace.tsx
// Professional "Receive Payment" workspace — IAS/GAAP compliant
import { useEffect, useState } from 'react';
import { useCustomerPaymentsStore } from './stores/useCustomerPaymentsStore';
import { salesApi, type Invoice } from './api/modules/sales.api';
import { customersApi, type Customer } from './api/modules/customers.api';
import { apiClient } from './api/client';
import './CustomerPayments.module.css';

// ─── Payment methods by region ──────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { value: 'Cash',            label: 'Cash',                  region: 'Global' },
  { value: 'Cheque',          label: 'Cheque / Check',        region: 'Global' },
  { value: 'BankTransfer',    label: 'Bank Transfer',         region: 'Global' },
  { value: 'ACH',             label: 'ACH',                   region: 'US / Canada' },
  { value: 'WireTransfer',    label: 'Wire Transfer',         region: 'Global' },
  { value: 'BACS',            label: 'BACS',                  region: 'UK' },
  { value: 'FasterPayments',  label: 'Faster Payments',       region: 'UK' },
  { value: 'SEPA',            label: 'SEPA Transfer',         region: 'Europe' },
  { value: 'CreditCard',      label: 'Credit Card',           region: 'Global' },
  { value: 'DebitCard',       label: 'Debit Card',            region: 'Global' },
  { value: 'OnlineBanking',   label: 'Online Banking',        region: 'Global' },
  { value: 'MobilePayment',   label: 'Mobile Payment',        region: 'PK / UAE / KSA' },
  { value: 'PayPal',          label: 'PayPal',                region: 'Global' },
  { value: 'DirectDebit',     label: 'Direct Debit',          region: 'UK / EU' },
  { value: 'Other',           label: 'Other',                 region: '' },
];

// Methods that require a bank/deposit account
const NEEDS_BANK_ACCOUNT = [
  'BankTransfer', 'ACH', 'WireTransfer', 'BACS', 'FasterPayments',
  'SEPA', 'OnlineBanking', 'DirectDebit',
];

interface DepositAccount { id: string; code: string; name: string; }

const emptyForm = {
  customerId: '',
  invoiceId: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  amount: '',
  paymentMethod: 'Cash',
  depositToAccountId: '',
  reference: '',
  memo: '',
};

function CustomerPaymentsWorkspace() {
  const { payments, loading, error, fetchAll, create } = useCustomerPaymentsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [depositAccounts, setDepositAccounts] = useState<DepositAccount[]>([]);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState('');

  // Load payments on mount
  useEffect(() => { fetchAll(); }, []);

  // Load reference data when modal opens
  useEffect(() => {
    if (!isModalOpen) return;
    (async () => {
      try {
        const [custs, invs, accts] = await Promise.all([
          customersApi.getCustomers(),
          salesApi.getInvoices(),
          apiClient<DepositAccount[]>('/customer-payments/deposit-accounts'),
        ]);
        setCustomers(custs);
        setInvoices(invs.filter(i => i.status !== 'Paid' && i.status !== 'Void'));
        setDepositAccounts(accts);
      } catch { /* silently degrade */ }
    })();
  }, [isModalOpen]);

  // Filter invoices for selected customer
  const filteredInvoices = formData.customerId
    ? invoices.filter(i => i.customerId === formData.customerId)
    : invoices;

  // When customer changes, clear invoice selection
  const onCustomerChange = (customerId: string) => {
    setFormData({ ...formData, customerId, invoiceId: '', amount: '' });
  };

  // When invoice is selected, auto-fill amount due
  const onInvoiceChange = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    setFormData({
      ...formData,
      invoiceId,
      customerId: inv ? inv.customerId : formData.customerId,
      amount: inv ? String(inv.amountDue ?? inv.totalAmount) : formData.amount,
    });
  };

  // When payment method changes, auto-select first deposit account if bank method
  const onMethodChange = (method: string) => {
    const needsBank = NEEDS_BANK_ACCOUNT.includes(method);
    setFormData({
      ...formData,
      paymentMethod: method,
      depositToAccountId: needsBank
        ? (formData.depositToAccountId || depositAccounts[0]?.id || '')
        : (method === 'Cash'
          ? (depositAccounts.find(a => a.name.toLowerCase().includes('cash'))?.id || depositAccounts[0]?.id || '')
          : formData.depositToAccountId),
    });
  };

  // Submit
  const handleCreate = async () => {
    setFormError('');
    const amt = parseFloat(formData.amount);
    if (!formData.customerId) { setFormError('Please select a customer.'); return; }
    if (!amt || amt <= 0) { setFormError('Amount must be greater than zero.'); return; }
    if (!formData.depositToAccountId) { setFormError('Please select a Deposit To account (bank or cash).'); return; }

    try {
      await create({
        customerId: formData.customerId,
        invoiceId: formData.invoiceId || undefined,
        paymentDate: formData.paymentDate,
        amount: amt,
        paymentMethod: formData.paymentMethod,
        depositToAccountId: formData.depositToAccountId,
        reference: formData.reference || undefined,
        memo: formData.memo || undefined,
      });
      setIsModalOpen(false);
      setFormData({ ...emptyForm, paymentDate: new Date().toISOString().slice(0, 10) });
    } catch (e: any) {
      setFormError(e?.data?.error || e?.message || 'Failed to create payment.');
    }
  };

  const openModal = () => {
    setFormError('');
    setFormData({ ...emptyForm, paymentDate: new Date().toISOString().slice(0, 10) });
    setIsModalOpen(true);
  };

  return (
    <section className="workspace-card">
      <header className="workspace-header">
        <h2>Customer Payments</h2>
        <button className="primary" onClick={openModal}>+ Receive Payment</button>
      </header>

      {/* ═══════════════════ Receive Payment Modal ═══════════════════ */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal receive-payment-modal">
            <h3>Receive Payment</h3>
            {formError && <p className="error">{formError}</p>}

            {/* ── Row 1: Customer ── */}
            <div className="form-row">
              <div className="form-field full">
                <label>Customer *</label>
                <select value={formData.customerId} onChange={e => onCustomerChange(e.target.value)}>
                  <option value="">— Select Customer —</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.customerNumber})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Row 2: Invoice & Date ── */}
            <div className="form-row">
              <div className="form-field">
                <label>Against Invoice</label>
                <select value={formData.invoiceId} onChange={e => onInvoiceChange(e.target.value)}>
                  <option value="">— On Account (no invoice) —</option>
                  {filteredInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — Due: {(inv.amountDue ?? inv.totalAmount)?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Payment Date *</label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                />
              </div>
            </div>

            {/* ── Row 3: Amount & Payment Method ── */}
            <div className="form-row">
              <div className="form-field">
                <label>Amount Received *</label>
                <input
                  type="number" step="0.01" min="0" placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Payment Method *</label>
                <select value={formData.paymentMethod} onChange={e => onMethodChange(e.target.value)}>
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label}{m.region ? ` (${m.region})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Row 4: Deposit To Account ── */}
            <div className="form-row">
              <div className="form-field full">
                <label>
                  Deposit To *
                  <span className="hint">
                    {NEEDS_BANK_ACCOUNT.includes(formData.paymentMethod)
                      ? ' — Select the bank account receiving funds'
                      : formData.paymentMethod === 'Cash'
                        ? ' — Select cash-in-hand or petty cash account'
                        : ' — Select the account to debit'}
                  </span>
                </label>
                <select
                  value={formData.depositToAccountId}
                  onChange={e => setFormData({ ...formData, depositToAccountId: e.target.value })}
                >
                  <option value="">— Select Account —</option>
                  {depositAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Row 5: Reference & Memo ── */}
            <div className="form-row">
              <div className="form-field">
                <label>Reference / Cheque # / Txn ID</label>
                <input
                  placeholder="e.g. CHQ-001, ACH-REF-123"
                  value={formData.reference}
                  onChange={e => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Memo</label>
                <input
                  placeholder="Internal notes"
                  value={formData.memo}
                  onChange={e => setFormData({ ...formData, memo: e.target.value })}
                />
              </div>
            </div>

            {/* ── Accounting summary ── */}
            {formData.amount && formData.depositToAccountId && (
              <div className="journal-preview">
                <p className="journal-title">Double-Entry Preview</p>
                <table className="journal-table">
                  <thead><tr><th>Account</th><th>Debit</th><th>Credit</th></tr></thead>
                  <tbody>
                    <tr>
                      <td>{depositAccounts.find(a => a.id === formData.depositToAccountId)?.name || 'Bank/Cash'}</td>
                      <td>{parseFloat(formData.amount)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td>—</td>
                    </tr>
                    <tr>
                      <td>Accounts Receivable</td>
                      <td>—</td>
                      <td>{parseFloat(formData.amount)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-actions">
              <button className="primary" onClick={handleCreate}>Save Payment</button>
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ Payments Table ═══════════════════ */}
      {loading && <p>Loading payments…</p>}
      {error && <p className="error">{error}</p>}
      <table className="glass-table">
        <thead>
          <tr>
            <th>Receipt #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Invoice</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Deposit To</th>
            <th>Reference</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 && !loading && (
            <tr><td colSpan={9} style={{ textAlign: 'center', opacity: 0.6 }}>No payments recorded yet.</td></tr>
          )}
          {payments.map((p: any) => (
            <tr key={p.id}>
              <td>{p.receiptNumber}</td>
              <td>{p.date}</td>
              <td>{p.customerName || p.customerId}</td>
              <td>{p.invoiceNumber || '—'}</td>
              <td>{p.amount?.toLocaleString()}</td>
              <td>{p.paymentMethod}</td>
              <td>{p.depositToAccountName || '—'}</td>
              <td>{p.reference || '—'}</td>
              <td><span className={`status-badge status-${(p.status || '').toLowerCase()}`}>{p.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default CustomerPaymentsWorkspace;
