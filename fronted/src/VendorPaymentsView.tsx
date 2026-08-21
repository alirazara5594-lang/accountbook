import React, { useState, useEffect, useMemo } from 'react'
import { useVendorsStore } from './stores'
import { vendorPaymentsApi, type VendorPayment, type WithdrawAccount, type VendorBillLite } from './api/modules/vendorPayments.api'
import { useFormDraft } from './hooks/useFormDraft'
import {
  Check, X, ArrowRight, ArrowLeft, Coins,
  CheckCircle2, Users, CreditCard, ShieldCheck, FileText
} from 'lucide-react'
import { DataToolbar } from '@/components/ui/data-toolbar'
import { money } from '@/lib/currency'
import type { Entity } from './EntitySettings'

type PaymentMode = 'ACH' | 'Wire Transfer' | 'Cheque / Pay Order' | 'SWIFT' | 'RTGS' | 'Credit Card' | 'Direct Debit' | 'Online Banking'

const MODE_METHOD: Record<string, string> = {
  'Wire Transfer': 'WireTransfer',
  'ACH': 'ACH',
  'Cheque / Pay Order': 'Cheque',
  'SWIFT': 'WireTransfer',
  'RTGS': 'BankTransfer',
  'Credit Card': 'CreditCard',
  'Direct Debit': 'DirectDebit',
  'Online Banking': 'OnlineBanking',
}

const statusStyles: Record<string, { label: string; class: string }> = {
  Completed: { label: 'Completed', class: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
  Pending: { label: 'Pending', class: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' },
  Failed: { label: 'Failed', class: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' }
}

interface VendorPaymentsViewProps {
  activeEntityId: string
  entities?: Entity[]
}

export const VendorPaymentsView: React.FC<VendorPaymentsViewProps> = ({
  activeEntityId,
  entities = []
}) => {
  const currentEntity = entities.find(e => e.id === activeEntityId)
  const [payments, setPayments] = useState<VendorPayment[]>([])
  const [loading, setLoading] = useState(false)
  const vendors = useVendorsStore((s) => s.vendors)
  const fetchVendors = useVendorsStore((s) => s.fetchVendors)
  const [query, setQuery] = useState('')
  const [selectedMode, setSelectedMode] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'vendor' | 'account' | 'summary'>('vendor')
  const [withdrawAccounts, setWithdrawAccounts] = useState<WithdrawAccount[]>([])
  const [bills, setBills] = useState<VendorBillLite[]>([])
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const [form, setForm] = useState({
    vendorId: '',
    billId: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMode: 'Wire Transfer' as PaymentMode,
    withdrawFromAccountId: '',
    amount: '',
    currency: 'PKR',
    reference: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
    description: ''
  })

  const { saveDraft, clearDraft } = useFormDraft('vendor_payment', form, setForm, isModalOpen)

  const loadPayments = async () => {
    setLoading(true)
    try {
      const data = await vendorPaymentsApi.getAll(activeEntityId || undefined)
      setPayments(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    loadPayments()
    fetchVendors(activeEntityId)
    vendorPaymentsApi.getWithdrawAccounts().then(setWithdrawAccounts).catch(() => {})
  }, [activeEntityId])

  useEffect(() => {
    if (!isModalOpen) return
    vendorPaymentsApi.getBills().then(setBills).catch(() => {})
  }, [isModalOpen])

  const notify = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 3500)
  }

  const openCreateModal = () => {
    setForm({
      vendorId: vendors[0]?.id || '',
      billId: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMode: 'Wire Transfer',
      withdrawFromAccountId: withdrawAccounts[0]?.id || '',
      amount: '',
      currency: 'PKR',
      reference: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      description: 'Vendor invoice payment disbursement.'
    })
    setModalTab('vendor')
    setFormError('')
    setIsModalOpen(true)
  }

  const onVendorChange = (vendorId: string) => {
    setForm({ ...form, vendorId, billId: '', amount: '' })
    vendorPaymentsApi.getBills(vendorId).then(b => {
      setBills(b)
      if (b.length > 0) {
        setForm(prev => ({ ...prev, vendorId, billId: b[0].id, amount: String(b[0].amountDue) }))
      }
    }).catch(() => {})
  }

  const onBillChange = (billId: string) => {
    const bill = bills.find(b => b.id === billId)
    setForm({
      ...form,
      billId,
      vendorId: bill ? bill.vendorId : form.vendorId,
      amount: bill ? String(bill.amountDue) : form.amount,
    })
  }

  const handleCreatePayment = async () => {
    setFormError('')
    const amt = parseFloat(form.amount)
    if (!form.vendorId) { setFormError('Please select a vendor.'); return }
    if (isNaN(amt) || amt <= 0) { setFormError('Amount must be greater than zero.'); return }
    if (!form.withdrawFromAccountId) { setFormError('Please select a funding bank account.'); return }

    setSaving(true)
    try {
      await vendorPaymentsApi.create({
        vendorId: form.vendorId,
        billId: form.billId || undefined,
        paymentDate: form.paymentDate,
        amount: amt,
        paymentMethod: MODE_METHOD[form.paymentMode] || 'BankTransfer',
        withdrawFromAccountId: form.withdrawFromAccountId,
        reference: form.reference || undefined,
        memo: form.description || undefined,
        companyId: activeEntityId || undefined,
      })
      clearDraft()
      setIsModalOpen(false)
      notify('✓ Vendor payment recorded & AP liability settled!')
      loadPayments()
    } catch (e: any) {
      setFormError(e?.message || 'Failed to record payment.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (selectedMode !== 'All' && p.paymentMethod !== selectedMode) return false
      if (query.trim()) {
        const lower = query.toLowerCase()
        const matchesVendor = (p.vendorName || '').toLowerCase().includes(lower)
        const matchesRef = (p.reference || p.paymentNumber || '').toLowerCase().includes(lower)
        const matchesBank = (p.withdrawFromAccountName || p.bankAccountName || '').toLowerCase().includes(lower)
        if (!matchesVendor && !matchesRef && !matchesBank) return false
      }
      return true
    })
  }, [payments, query, selectedMode])

  const exportHeaders = ['Payment Number', 'Date', 'Vendor', 'Bill', 'Amount', 'Mode', 'Bank Account', 'Reference', 'Status']
  const exportRows = filtered.map(p => [
    p.paymentNumber || '',
    p.date,
    p.vendorName || '',
    p.billNumber || '',
    p.amount,
    p.paymentMethod,
    p.withdrawFromAccountName || p.bankAccountName || '',
    p.reference || '',
    p.status,
  ])

  const totalDisbursed = filtered.reduce((s, p) => s + (p.amount || 0), 0)
  const bankPaymentsCount = filtered.filter(p => p.paymentMethod === 'WireTransfer' || p.paymentMethod === 'BankTransfer' || p.paymentMethod === 'ACH').length

  return (
    <div className="space-y-6">
      {toast && (
        <div className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-semibold">
          {toast}
        </div>
      )}

      {/* Submodule Heading Banner (Row 1) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight flex items-center gap-2">
            <span className="text-lg">💳</span> Vendor Payments & Disbursements
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
            Disburse payments to suppliers, reconcile bank withdrawals, and extinguish Accounts Payable liabilities.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <DataToolbar
            query={query}
            setQuery={setQuery}
            searchPlaceholder="Search vendor, reference, bank..."
            exportFileName="vendor-payments"
            exportSheetName="Vendor Payments"
            exportTitle="Vendor Payments Register"
            exportSubtitle="Supplier payments and bank disbursement records."
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Disbursed', value: totalDisbursed }]}
          >
            <select
              className="h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors shadow-2xs box-border"
              style={{ paddingTop: 0, paddingBottom: 0 }}
              value={selectedMode}
              onChange={e => setSelectedMode(e.target.value)}
            >
              <option value="All">⚡ All Payment Modes</option>
              <option value="WireTransfer">🏦 Wire Transfer / SWIFT</option>
              <option value="BankTransfer">⚡ RTGS / 1Link</option>
              <option value="Cheque">📜 Cheque / Pay Order</option>
              <option value="ACH">💳 ACH / Direct Debit</option>
              <option value="CreditCard">💳 Credit Card</option>
            </select>
          </DataToolbar>
          <button
            onClick={openCreateModal}
            className="primary h-9 px-4 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>＋</span> Record Payment
          </button>
        </div>
      </div>

      {/* Stats Cards (Row 2) */}
      <section className="stats">
        <article>
          <span className="stat-icon blue">
            <Coins className="w-4 h-4" />
          </span>
          <div>
            <small>TOTAL DISBURSED</small>
            <h2>{money(totalDisbursed)}</h2>
            <p>Settled vendor liabilities</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal">
            <CreditCard className="w-4 h-4" />
          </span>
          <div>
            <small>ELECTRONIC TRANSFERS</small>
            <h2>{bankPaymentsCount}</h2>
            <p>Bank wires & RTGS settlements</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div>
            <small>TOTAL TRANSACTIONS</small>
            <h2>{filtered.length}</h2>
            <p>All recorded payments</p>
          </div>
        </article>
      </section>

      {/* Payments Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-between">
          <p className="text-xs font-semibold text-[var(--color-text-strong)]">Disbursements Register</p>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Showing {filtered.length} of {payments.length} record{payments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">Loading payments...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">No payments found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Payment #</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Date</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Vendor</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Bill Ref</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Funding Account</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Mode</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Amount (Rs)</th>
                  <th className="text-center px-3 py-2 font-semibold text-[var(--color-text-muted)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const badge = statusStyles[p.status] || statusStyles.Completed
                  return (
                    <tr key={p.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors">
                      <td className="px-3 py-2 font-mono font-semibold text-[var(--color-text-strong)]">{p.paymentNumber || p.reference || '—'}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{p.date}</td>
                      <td className="px-3 py-2 font-semibold text-[var(--color-text-strong)]">{p.vendorName || '—'}</td>
                      <td className="px-3 py-2 font-mono text-[var(--color-text-muted)]">{p.billNumber || '—'}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{p.withdrawFromAccountName || p.bankAccountName || 'Bank Account'}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{p.paymentMethod}</td>
                      <td className="px-3 py-2 text-right font-bold text-sky-600 font-mono">{money(p.amount)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stepped / Tabbed Payment Modal */}
      {isModalOpen && (
        <div className="overlay animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight">Record Supplier Payment</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Disbursement
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1.5">
                    <span>Operating Unit:</span>
                    <span className="font-semibold text-[var(--color-text-strong)]">
                      🏢 {currentEntity ? currentEntity.name : 'Global Group Book'}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-surface-muted)] transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <button
                type="button"
                onClick={() => setModalTab('vendor')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'vendor'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> 1. Vendor & Bill Reference
              </button>

              <button
                type="button"
                onClick={() => setModalTab('account')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'account'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Coins className="w-3.5 h-3.5" /> 2. Bank Account & Amount
              </button>

              <button
                type="button"
                onClick={() => setModalTab('summary')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'summary'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> 3. Verification & Settle
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              {modalTab === 'vendor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      <span className="text-rose-500 font-bold mr-1">*</span> Vendor / Supplier
                    </label>
                    <select
                      value={form.vendorId}
                      onChange={e => onVendorChange(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    >
                      <option value="">Select a vendor...</option>
                      {vendors.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.vendorNumber ? `(${v.vendorNumber})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Apply to Open Bill (Optional)
                    </label>
                    <select
                      value={form.billId}
                      onChange={e => onBillChange(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    >
                      <option value="">-- Direct Advance / On-Account Payment --</option>
                      {bills.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.billNumber} — Due: {money(b.amountDue)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={form.paymentDate}
                      onChange={e => setForm({ ...form, paymentDate: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {modalTab === 'account' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      <span className="text-rose-500 font-bold mr-1">*</span> Withdraw From Bank / Cash Account
                    </label>
                    <select
                      value={form.withdrawFromAccountId}
                      onChange={e => setForm({ ...form, withdrawFromAccountId: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    >
                      <option value="">Select funding account...</option>
                      {withdrawAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} — {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Payment Method
                    </label>
                    <select
                      value={form.paymentMode}
                      onChange={e => setForm({ ...form, paymentMode: e.target.value as PaymentMode })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    >
                      <option value="Wire Transfer">Wire Transfer / SWIFT</option>
                      <option value="ACH">RTGS / 1Link / Bank Transfer</option>
                      <option value="Cheque / Pay Order">Cheque / Pay Order</option>
                      <option value="Credit Card">Corporate Credit Card</option>
                      <option value="Direct Debit">Direct Debit</option>
                      <option value="Online Banking">Online Banking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      <span className="text-rose-500 font-bold mr-1">*</span> Disbursement Amount (Rs)
                    </label>
                    <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-[var(--color-primary)] transition-colors shadow-2xs">
                      <span className="text-[11px] font-bold font-mono text-[var(--color-text-muted)] shrink-0 px-1.5 py-0.5 rounded bg-[var(--color-surface-muted)]">
                        Rs
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        className="w-full h-full border-0 outline-none bg-transparent font-mono text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                        style={{ border: 0, outline: 'none', padding: 0, background: 'transparent' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                        Payment Reference / Cheque #
                      </label>
                      <input
                        placeholder="e.g. CHQ-9901, FT-88219"
                        value={form.reference}
                        onChange={e => setForm({ ...form, reference: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                        Memo / Description
                      </label>
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Payment details, invoice reference..."
                        className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] outline-none shadow-2xs resize-none"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Posting automatically debits Accounts Payable (20000) and credits the Funding Bank Account (10100).</span>
                    </div>
                  </div>

                  <div className="bg-[var(--color-surface-muted)]/60 border border-[var(--color-border)] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-strong)]">Payment Voucher</p>
                    <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                      <span>Method</span>
                      <span className="font-semibold text-[var(--color-text-strong)]">{form.paymentMode}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                      <span>Currency</span>
                      <span className="font-semibold text-[var(--color-text-strong)]">{form.currency}</span>
                    </div>
                    <div className="border-t border-[var(--color-border)] pt-2.5 flex justify-between text-sm font-bold text-[var(--color-text-strong)]">
                      <span>Total Paid</span>
                      <span className="text-emerald-600 font-mono">{money(parseFloat(form.amount || '0'))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 flex items-center justify-between gap-3">
              <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>Auto-draft protection active</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-8.5 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-8.5 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors"
                  onClick={(e) => { e.preventDefault(); saveDraft(); notify('Payment draft saved locally.'); }}
                >
                  Save Draft
                </button>

                {modalTab !== 'vendor' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (modalTab === 'summary') setModalTab('account')
                      else if (modalTab === 'account') setModalTab('vendor')
                    }}
                    className="h-8.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                {modalTab !== 'summary' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (modalTab === 'vendor') {
                        if (!form.vendorId) {
                          setFormError('Please select a vendor.')
                          return
                        }
                        setModalTab('account')
                      } else if (modalTab === 'account') {
                        if (!form.withdrawFromAccountId) {
                          setFormError('Please select a bank account.')
                          return
                        }
                        if (parseFloat(form.amount || '0') <= 0) {
                          setFormError('Please enter a valid amount.')
                          return
                        }
                        setModalTab('summary')
                      }
                    }}
                    className="primary h-8.5 px-4 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <span>Next: {modalTab === 'vendor' ? 'Funding Bank' : 'Summary & Settle'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreatePayment}
                    disabled={saving}
                    className="primary h-8.5 px-4.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{saving ? 'Recording...' : 'Record Payment'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
