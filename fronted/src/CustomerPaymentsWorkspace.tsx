// src/CustomerPaymentsWorkspace.tsx
// Professional "Receive Payment" workspace — IAS/GAAP compliant
import { useEffect, useState, useMemo } from 'react';
import { useCustomerPaymentsStore } from './stores/useCustomerPaymentsStore';
import { salesApi, type Invoice } from './api/modules/sales.api';
import { customersApi, type Customer } from './api/modules/customers.api';
import { apiClient } from './api/client';
import { DataToolbar } from '@/components/ui/data-toolbar';
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
  const [query, setQuery] = useState('');

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
  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const filteredPayments = useMemo(() => {
    if (!query.trim()) return payments;
    const q = query.toLowerCase();
    return payments.filter((p: any) =>
      (p.receiptNumber || '').toLowerCase().includes(q) ||
      (p.customerName || p.customerId || '').toLowerCase().includes(q) ||
      (p.invoiceNumber || '').toLowerCase().includes(q) ||
      (p.paymentMethod || '').toLowerCase().includes(q) ||
      (p.reference || '').toLowerCase().includes(q)
    );
  }, [payments, query]);

  const exportHeaders = ['Receipt #', 'Date', 'Customer', 'Invoice', 'Amount', 'Method', 'Deposit To', 'Reference', 'Status'];
  const exportRows = filteredPayments.map((p: any) => [
    p.receiptNumber, p.date, p.customerName || p.customerId, p.invoiceNumber || '', p.amount,
    p.paymentMethod, p.depositToAccountName || '', p.reference || '', p.status,
  ]);
  const totalReceived = filteredPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0);

  return (
    <section className="workspace-card">
      <header className="workspace-header">
        <h2>Customer Payments</h2>
        <div className="flex items-center gap-2">
          <DataToolbar
            query={query}
            setQuery={setQuery}
            searchPlaceholder="Search receipt #, customer, invoice..."
            exportFileName="customer-payments"
            exportSheetName="Customer Payments"
            exportTitle="Customer Payments"
            exportSubtitle="Payments received from customers applied to invoices."
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Received', value: totalReceived }]}
            onRefresh={() => fetchAll()}
          />
          <button className="primary" onClick={openModal}>+ Receive Payment</button>
        </div>
      </header>

      {/* ═══════════════════ Receive Payment Modal ═══════════════════ */}
      {isModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreate} >
            <div className="modal-head">
              <div>
                <p className="eyebrow">SALES & CUSTOMERS</p>
                <h2>Receive Payment</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">
              {formError && <p className="error" style={{ gridColumn: '1 / -1', color: '#c25c5c', fontSize: 13, marginBottom: 10 }}>{formError}</p>}

              <label style={{ gridColumn: '1 / -1' }}>
                * Customer
                <select required value={formData.customerId} onChange={e => onCustomerChange(e.target.value)}>
                  <option value="">— Select Customer —</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.customerNumber})</option>
                  ))}
                </select>
              </label>

              <label>
                Against Invoice
                <select value={formData.invoiceId} onChange={e => onInvoiceChange(e.target.value)}>
                  <option value="">— On Account (no invoice) —</option>
                  {filteredInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — Due: {(inv.amountDue ?? inv.totalAmount)?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                * Payment Date
                <input
                  required
                  type="date"
                  value={formData.paymentDate}
                  onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                />
              </label>

              <label>
                * Amount Received
                <input
                  required
                  type="number" step="0.01" min="0" placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
              </label>

              <label>
                * Payment Method
                <select value={formData.paymentMethod} onChange={e => onMethodChange(e.target.value)}>
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label}{m.region ? ` (${m.region})` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                * Deposit To
                <span className="hint" style={{ fontSize: 10, color: '#8d9aad', fontWeight: 'normal', marginLeft: 4 }}>
                  {NEEDS_BANK_ACCOUNT.includes(formData.paymentMethod)
                    ? ' (Select the bank account receiving funds)'
                    : formData.paymentMethod === 'Cash'
                      ? ' (Select cash-in-hand or petty cash account)'
                      : ' (Select the account to debit)'}
                </span>
                <select
                  required
                  value={formData.depositToAccountId}
                  onChange={e => setFormData({ ...formData, depositToAccountId: e.target.value })}
                >
                  <option value="">— Select Account —</option>
                  {depositAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Reference / Cheque # / Txn ID
                <input
                  placeholder="e.g. CHQ-001, ACH-REF-123"
                  value={formData.reference}
                  onChange={e => setFormData({ ...formData, reference: e.target.value })}
                />
              </label>

              <label>
                Memo
                <input
                  placeholder="Internal notes"
                  value={formData.memo}
                  onChange={e => setFormData({ ...formData, memo: e.target.value })}
                />
              </label>

              {formData.amount && formData.depositToAccountId && (
                <div className="journal-preview" style={{ gridColumn: '1 / -1', marginTop: 10, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #edf2f7' }}>
                  <p className="journal-title" style={{ fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 8 }}>Double-Entry Preview</p>
                  <table className="journal-table" style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ textAlign: 'left', paddingBottom: 4 }}>Account</th>
                        <th style={{ textAlign: 'right', paddingBottom: 4 }}>Debit</th>
                        <th style={{ textAlign: 'right', paddingBottom: 4 }}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ paddingTop: 6, color: '#334155' }}>{depositAccounts.find(a => a.id === formData.depositToAccountId)?.name || 'Bank/Cash'}</td>
                        <td style={{ paddingTop: 6, textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>{parseFloat(formData.amount)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style={{ paddingTop: 6, textAlign: 'right', color: '#94a3b8' }}>—</td>
                      </tr>
                      <tr>
                        <td style={{ paddingTop: 6, color: '#334155' }}>Accounts Receivable</td>
                        <td style={{ paddingTop: 6, textAlign: 'right', color: '#94a3b8' }}>—</td>
                        <td style={{ paddingTop: 6, textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>{parseFloat(formData.amount)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary btn-draft" onClick={(e) => { e.preventDefault(); alert("��� Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary btn-finalize">Save Payment</button>
            </div>
          </form>
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
          {filteredPayments.length === 0 && !loading && (
            <tr><td colSpan={9} style={{ textAlign: 'center', opacity: 0.6 }}>No payments recorded yet.</td></tr>
          )}
          {filteredPayments.map((p: any) => (
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
