import { useEffect, useState, useMemo } from 'react';
import { useCustomerPaymentsStore } from './stores/useCustomerPaymentsStore';
import { salesApi, type Invoice } from './api/modules/sales.api';
import { customersApi, type Customer } from './api/modules/customers.api';
import { apiClient } from './api/client';
import { useCompanyStore } from './stores';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { money } from '@/lib/currency';
import { Plus, X, DollarSign, Receipt, Building2, Clock } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash', region: 'Global' },
  { value: 'Cheque', label: 'Cheque / Check', region: 'Global' },
  { value: 'BankTransfer', label: 'Bank Transfer', region: 'Global' },
  { value: 'ACH', label: 'ACH', region: 'US / Canada' },
  { value: 'WireTransfer', label: 'Wire Transfer', region: 'Global' },
  { value: 'BACS', label: 'BACS', region: 'UK' },
  { value: 'FasterPayments', label: 'Faster Payments', region: 'UK' },
  { value: 'SEPA', label: 'SEPA Transfer', region: 'Europe' },
  { value: 'CreditCard', label: 'Credit Card', region: 'Global' },
  { value: 'DebitCard', label: 'Debit Card', region: 'Global' },
  { value: 'OnlineBanking', label: 'Online Banking', region: 'Global' },
  { value: 'MobilePayment', label: 'Mobile Payment', region: 'PK / UAE / KSA' },
  { value: 'PayPal', label: 'PayPal', region: 'Global' },
  { value: 'DirectDebit', label: 'Direct Debit', region: 'UK / EU' },
  { value: 'Other', label: 'Other', region: '' },
];

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
  const { payments, loading, fetchAll, create } = useCustomerPaymentsStore();
  const { activeEntityId } = useCompanyStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [depositAccounts, setDepositAccounts] = useState<DepositAccount[]>([]);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => { fetchAll(activeEntityId); }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    (async () => {
      try {
        const [custs, invs, accts] = await Promise.all([
          customersApi.getCustomers(activeEntityId),
          salesApi.getInvoices(activeEntityId),
          apiClient<DepositAccount[]>('/customer-payments/deposit-accounts'),
        ]);
        setCustomers(custs);
        setInvoices(invs.filter(i => i.status !== 'Paid' && i.status !== 'Void'));
        setDepositAccounts(accts);
      } catch { /* silently degrade */ }
    })();
  }, [isModalOpen]);

  const filteredInvoices = formData.customerId
    ? invoices.filter(i => i.customerId === formData.customerId)
    : invoices;

  const onCustomerChange = (customerId: string) => {
    setFormData({ ...formData, customerId, invoiceId: '', amount: '' });
  };

  const onInvoiceChange = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    setFormData({
      ...formData,
      invoiceId,
      customerId: inv ? inv.customerId : formData.customerId,
      amount: inv ? String(inv.amountDue ?? inv.totalAmount) : formData.amount,
    });
  };

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

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError('');
    const amt = parseFloat(formData.amount);
    if (!formData.customerId) { setFormError('Please select a customer.'); return; }
    if (!amt || amt <= 0) { setFormError('Amount must be greater than zero.'); return; }
    if (!formData.depositToAccountId) { setFormError('Please select a Deposit To account.'); return; }

    try {
      await create({
        companyId: activeEntityId,
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
      fetchAll(activeEntityId);
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

  const totalReceived = filteredPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const todayPayments = filteredPayments.filter((p: any) => p.date === new Date().toISOString().slice(0, 10)).length;
  const pendingCount = filteredPayments.filter((p: any) => p.status === 'Draft').length;

  const exportHeaders = ['Receipt #', 'Date', 'Customer', 'Invoice', 'Amount', 'Method', 'Deposit To', 'Reference', 'Status'];
  const exportRows = filteredPayments.map((p: any) => [
    p.receiptNumber, p.date, p.customerName || p.customerId, p.invoiceNumber || '', p.amount,
    p.paymentMethod, p.depositToAccountName || '', p.reference || '', p.status,
  ]);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="text-lg">💰</span> Customer Payments
          </h1>
          <p className="text-gray-500 text-[10px] mt-0.5">Record and manage payments received from customers against invoices.</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
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
            onRefresh={() => fetchAll(activeEntityId)}
          />
          <button
            onClick={openModal}
            className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Receive Payment
          </button>
        </div>
      </div>

      {/* Stats */}
      <section className="stats">
        <article>
          <span className="stat-icon blue"><DollarSign className="w-4 h-4" /></span>
          <div>
            <small>TOTAL RECEIVED</small>
            <h2>{money(totalReceived)}</h2>
            <p>All recorded payments</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal"><Receipt className="w-4 h-4" /></span>
          <div>
            <small>PAYMENT COUNT</small>
            <h2>{filteredPayments.length}</h2>
            <p>Total transactions</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet"><Clock className="w-4 h-4" /></span>
          <div>
            <small>TODAY'S PAYMENTS</small>
            <h2>{todayPayments}</h2>
            <p>Received today</p>
          </div>
        </article>
        <article>
          <span className="stat-icon blue"><Building2 className="w-4 h-4" /></span>
          <div>
            <small>DRAFT PAYMENTS</small>
            <h2>{pendingCount}</h2>
            <p>Awaiting posting</p>
          </div>
        </article>
      </section>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Receipt #</th>
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Customer</th>
              <th className="py-2.5 px-4">Invoice</th>
              <th className="py-2.5 px-4 text-right">Amount</th>
              <th className="py-2.5 px-4">Method</th>
              <th className="py-2.5 px-4">Deposit To</th>
              <th className="py-2.5 px-4">Reference</th>
              <th className="py-2.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPayments.length === 0 && !loading && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">💰</span>
                    <p className="text-sm font-semibold">No payments recorded</p>
                    <p className="text-[10px]">Click "Receive Payment" to record your first payment.</p>
                  </div>
                </td>
              </tr>
            )}
            {filteredPayments.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-2.5 px-4 font-medium text-blue-600">{p.receiptNumber}</td>
                <td className="py-2.5 px-4 text-gray-600">{p.date}</td>
                <td className="py-2.5 px-4 font-medium text-gray-900">{p.customerName || p.customerId}</td>
                <td className="py-2.5 px-4 text-gray-600">{p.invoiceNumber || '—'}</td>
                <td className="py-2.5 px-4 text-right font-bold text-gray-900">
                  {money(p.amount || 0)}
                </td>
                <td className="py-2.5 px-4">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold">
                    {p.paymentMethod}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-gray-600 text-[11px]">{p.depositToAccountName || '—'}</td>
                <td className="py-2.5 px-4 text-gray-500 text-[11px]">{p.reference || '—'}</td>
                <td className="py-2.5 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    p.status === 'Posted' ? 'bg-emerald-100 text-emerald-700' :
                    p.status === 'Void' ? 'bg-rose-100 text-rose-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receive Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-lg">💰</span> Receive Payment
                </h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Record a payment received from a customer</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              {formError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px]">
                  {formError}
                </div>
              )}

              {/* Customer */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Customer *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={e => onCustomerChange(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400"
                >
                  <option value="">Select customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Invoice + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Against Invoice</label>
                  <select
                    value={formData.invoiceId}
                    onChange={e => onInvoiceChange(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400"
                  >
                    <option value="">On Account (no invoice)</option>
                    {filteredInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — Due: {(inv.amountDue ?? inv.totalAmount)?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Payment Date *</label>
                  <input
                    required
                    type="date"
                    value={formData.paymentDate}
                    onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Amount + Method */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Amount Received *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400 placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Payment Method *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => onMethodChange(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m.value} value={m.value}>
                        {m.label}{m.region ? ` (${m.region})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deposit To */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Deposit To *
                  <span className="text-gray-400 font-normal normal-case ml-1">
                    {NEEDS_BANK_ACCOUNT.includes(formData.paymentMethod)
                      ? '(Select bank account receiving funds)'
                      : formData.paymentMethod === 'Cash'
                        ? '(Select cash-in-hand account)'
                        : '(Select account to debit)'}
                  </span>
                </label>
                <select
                  required
                  value={formData.depositToAccountId}
                  onChange={e => setFormData({ ...formData, depositToAccountId: e.target.value })}
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400"
                >
                  <option value="">Select account</option>
                  {depositAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>

              {/* Reference + Memo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Reference / Cheque #</label>
                  <input
                    placeholder="e.g. CHQ-001, ACH-REF-123"
                    value={formData.reference}
                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400 placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Memo</label>
                  <input
                    placeholder="Internal notes"
                    value={formData.memo}
                    onChange={e => setFormData({ ...formData, memo: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Journal Preview */}
              {formData.amount && formData.depositToAccountId && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Double-Entry Preview</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="text-left pb-1">Account</th>
                        <th className="text-right pb-1">Debit</th>
                        <th className="text-right pb-1">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-1 text-gray-700">{depositAccounts.find(a => a.id === formData.depositToAccountId)?.name || 'Bank/Cash'}</td>
                        <td className="py-1 text-right font-semibold">{parseFloat(formData.amount)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-1 text-right text-gray-400">—</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Accounts Receivable</td>
                        <td className="py-1 text-right text-gray-400">—</td>
                        <td className="py-1 text-right font-semibold">{parseFloat(formData.amount)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 px-4 text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerPaymentsWorkspace;
