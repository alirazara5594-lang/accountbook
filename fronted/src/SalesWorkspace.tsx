import { useState, useEffect, useMemo } from 'react'
import {
  Receipt, Plus, Check, X, ShieldCheck, ArrowRight,
  ArrowLeft, Hash, Users, FileText, Coins, CheckCircle2
} from 'lucide-react'
import { useSalesStore, useCustomersStore, useProductsStore, useCoaStore } from './stores'
import { useFormDraft } from './hooks/useFormDraft'
import { DataToolbar } from '@/components/ui/data-toolbar'
import { money } from './lib/currency'

const statusStyles: Record<string, { label: string; class: string }> = {
  Draft: { label: 'Draft', class: 'bg-slate-500/10 text-slate-600 border border-slate-500/20' },
  Sent: { label: 'Sent', class: 'bg-sky-500/10 text-sky-600 border border-sky-500/20' },
  Paid: { label: 'Paid', class: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
  PartiallyPaid: { label: 'Partially Paid', class: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' },
  Overdue: { label: 'Overdue', class: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' },
  Void: { label: 'Void', class: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' }
}

export const SalesWorkspace: React.FC<{ activeEntityId: string; entities?: any[] }> = ({
  activeEntityId,
  entities = []
}) => {
  const invoices = useSalesStore((s) => s.invoices)
  const fetchInvoices = useSalesStore((s) => s.fetchInvoices)
  const createInvoiceStore = useSalesStore((s) => s.createInvoice)

  const customers = useCustomersStore((s) => s.customers)
  const fetchCustomers = useCustomersStore((s) => s.fetchCustomers)

  const products = useProductsStore((s) => s.products)
  const fetchProducts = useProductsStore((s) => s.fetchProducts)

  const accounts = useCoaStore((s) => s.accounts)
  const fetchAccounts = useCoaStore((s) => s.fetchAccounts)

  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [modalTab, setModalTab] = useState<'details' | 'lines' | 'summary'>('details')
  const [postModal, setPostModal] = useState<any>(null)
  const [toast, setToast] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Form state
  const [form, setForm] = useState({
    customerId: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    reference: '',
    notes: '',
    currencyCode: 'PKR'
  })

  const [lines, setLines] = useState([
    { productId: '', description: '', quantity: '1', unitPrice: '0', discountAmount: '0', taxAmount: '0' }
  ])

  const { saveDraft, clearDraft } = useFormDraft('sales_invoice', { form, lines }, (saved: any) => {
    if (saved.form) setForm(saved.form)
    if (saved.lines) setLines(saved.lines)
  }, showForm)

  // Post form
  const [postForm, setPostForm] = useState({ arAccId: '', revenueAccId: '', taxLiabilityAccId: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchInvoices(activeEntityId),
        fetchCustomers(activeEntityId),
        fetchProducts(),
        fetchAccounts()
      ])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [activeEntityId])

  const notify = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 3500)
  }

  const openCreateModal = async () => {
    const salesStore = useSalesStore.getState()
    const nextRef = await salesStore.fetchNextNumber('invoice')
    setForm({
      customerId: customers[0]?.id || '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      reference: nextRef || 'INV-0001',
      notes: 'Payment is due within invoice terms. Thank you for your business.',
      currencyCode: 'PKR'
    })
    setLines([{ productId: '', description: '', quantity: '1', unitPrice: '0', discountAmount: '0', taxAmount: '0' }])
    setModalTab('details')
    setShowForm(true)
  }

  const addLine = () =>
    setLines([...lines, { productId: '', description: '', quantity: '1', unitPrice: '0', discountAmount: '0', taxAmount: '0' }])
  
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i))

  const updateLine = (i: number, field: string, value: string) => {
    const updated = [...lines]
    updated[i] = { ...updated[i], [field]: value }
    if (field === 'productId' && value) {
      const prod = products.find((p: any) => p.id === value)
      if (prod) {
        updated[i] = {
          ...updated[i],
          description: prod.name,
          unitPrice: String(prod.unitPrice || prod.salesPrice || 0)
        }
      }
    }
    setLines(updated)
  }

  const subTotal = lines.reduce((s, l) => s + parseFloat(l.quantity || '0') * parseFloat(l.unitPrice || '0'), 0)
  const discountTotal = lines.reduce((s, l) => s + parseFloat(l.discountAmount || '0'), 0)
  const taxTotal = lines.reduce((s, l) => s + parseFloat(l.taxAmount || '0'), 0)
  const netTotal = subTotal - discountTotal + taxTotal

  const saveInvoice = async () => {
    if (!form.customerId) {
      notify('Please select a customer.')
      return
    }
    const body = {
      ...form,
      companyId: activeEntityId || null,
      lines: lines.map(l => ({
        productId: l.productId || null,
        description: l.description,
        quantity: parseFloat(l.quantity || '1'),
        unitPrice: parseFloat(l.unitPrice || '0'),
        discountAmount: parseFloat(l.discountAmount || '0'),
        taxCodeId: null,
        taxAmount: parseFloat(l.taxAmount || '0')
      }))
    }
    try {
      await createInvoiceStore(body)
      clearDraft()
      notify('✓ Sales invoice created as Draft')
      setShowForm(false)
      fetchData()
    } catch (e: any) {
      notify(e.message || 'Error saving invoice')
    }
  }

  const postInvoice = async () => {
    try {
      await useSalesStore.getState().fetchAllSales(activeEntityId)
      notify('✓ Invoice posted to General Ledger!')
      setPostModal(null)
    } catch (e: any) {
      notify(e.message || 'Error posting invoice')
    }
  }

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv: any) => {
      const statusText = typeof inv.status === 'number'
        ? ['Draft', 'Sent', 'Paid', 'Void', 'Partly Paid', 'Overdue'][inv.status] || ''
        : String(inv.status || '')

      const matchesQuery = !query.trim()
        ? true
        : `${inv.invoiceNumber || ''} ${inv.customerName || ''} ${statusText}`
            .toLowerCase()
            .includes(query.toLowerCase())

      const matchesStatus = statusFilter === 'all' || statusText.toLowerCase() === statusFilter.toLowerCase()

      return matchesQuery && matchesStatus
    })
  }, [invoices, query, statusFilter])

  const exportHeaders = ['Invoice #', 'Customer', 'Date', 'Due Date', 'Discount', 'Tax', 'Total', 'Due', 'Status']
  const exportRows = filteredInvoices.map((inv: any) => [
    inv.invoiceNumber,
    inv.customerName,
    inv.invoiceDate,
    inv.dueDate,
    inv.discountTotal || 0,
    inv.taxTotal || 0,
    inv.totalAmount || 0,
    inv.amountDue || 0,
    typeof inv.status === 'number'
      ? ['Draft', 'Sent', 'Paid', 'Void', 'Partly Paid', 'Overdue'][inv.status]
      : inv.status
  ])

  const totalOutstanding = invoices
    .filter((i: any) => i.status !== 2 && i.status !== 3)
    .reduce((s: number, i: any) => s + (i.amountDue || 0), 0)

  const totalPaid = invoices
    .filter((i: any) => i.status === 2)
    .reduce((s: number, i: any) => s + (i.totalAmount || 0), 0)

  const draftCount = invoices.filter((i: any) => i.status === 0).length

  const assignedCompany = entities.find(e => e.id === activeEntityId)

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
            <span className="text-lg">🧾</span> Sales Invoices & Billing
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
            Manage customer sales invoices, automated GAAP general ledger posting, and accounts receivable.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <DataToolbar
            query={query}
            setQuery={setQuery}
            searchPlaceholder="Search invoice #, customer..."
            exportFileName="sales-invoices"
            exportSheetName="Sales Invoices"
            exportTitle="Sales Invoices"
            exportSubtitle="Sales invoice register with posting to the general ledger."
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Outstanding', value: totalOutstanding }]}
          >
            <select
              className="h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors shadow-2xs box-border"
              style={{ paddingTop: 0, paddingBottom: 0 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">⚡ All Statuses</option>
              <option value="draft">⚪ Draft</option>
              <option value="sent">🔵 Sent</option>
              <option value="paid">🟢 Paid</option>
              <option value="partly paid">🟡 Partially Paid</option>
              <option value="overdue">🔴 Overdue</option>
            </select>
          </DataToolbar>
          <button
            onClick={openCreateModal}
            className="primary h-9 px-4 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>＋</span> Create Invoice
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
            <small>TOTAL OUTSTANDING</small>
            <h2>{money(totalOutstanding)}</h2>
            <p>Receivables awaiting collection</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div>
            <small>PAID COLLECTIONS</small>
            <h2>{money(totalPaid)}</h2>
            <p>Total receipts settled</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet">
            <FileText className="w-4 h-4" />
          </span>
          <div>
            <small>DRAFT INVOICES</small>
            <h2>{draftCount}</h2>
            <p>Ready for ledger posting</p>
          </div>
        </article>
      </section>

      {/* Invoices Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-between">
          <p className="text-xs font-semibold text-[var(--color-text-strong)]">Invoice Register</p>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Showing {filteredInvoices.length} of {invoices.length} record{invoices.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">No sales invoices found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Invoice #</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Customer</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Date</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Due Date</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Discount</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Tax</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Total</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Due</th>
                  <th className="text-center px-3 py-2 font-semibold text-[var(--color-text-muted)]">Status</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv: any) => {
                  const statusKey = typeof inv.status === 'number'
                    ? ['Draft', 'Sent', 'Paid', 'Void', 'PartiallyPaid', 'Overdue'][inv.status] || 'Draft'
                    : String(inv.status || 'Draft')
                  const badge = statusStyles[statusKey] || statusStyles.Draft

                  return (
                    <tr key={inv.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors">
                      <td className="px-3 py-2 font-mono font-semibold text-[var(--color-text-strong)]">{inv.invoiceNumber}</td>
                      <td className="px-3 py-2 font-semibold text-[var(--color-text-strong)]">{inv.customerName || '—'}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{inv.invoiceDate}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{inv.dueDate}</td>
                      <td className="px-3 py-2 text-right text-rose-500 font-mono">
                        {inv.discountTotal > 0 ? `-${money(inv.discountTotal)}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-amber-500 font-mono">
                        {inv.taxTotal > 0 ? money(inv.taxTotal) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-sky-600 font-mono">{money(inv.totalAmount)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-rose-600 font-mono">{money(inv.amountDue)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {inv.status === 0 && (
                          <button
                            onClick={() => {
                              const mappingsStr = localStorage.getItem('system_account_mappings')
                              let mappings: any = {}
                              if (mappingsStr) {
                                try {
                                  mappings = JSON.parse(mappingsStr)
                                } catch {}
                              }
                              const arAccount = accounts.find((a: any) => a.id === mappings.arAccountId || a.code === '12000')
                              const revAccount = accounts.find((a: any) => a.id === mappings.revenueAccountId || a.code === '41100')
                              const taxAccount = accounts.find((a: any) => a.id === mappings.taxAccountId || a.code === '22000')

                              setPostModal(inv)
                              setPostForm({
                                arAccId: arAccount?.id || '',
                                revenueAccId: revAccount?.id || '',
                                taxLiabilityAccId: taxAccount?.id || ''
                              })
                            }}
                            className="h-7 px-2.5 rounded-lg border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 text-xs font-semibold transition-colors"
                          >
                            Post to Ledger
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabbed / Stepped Invoice Creation Modal */}
      {showForm && (
        <div className="overlay animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight">Create Sales Invoice</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-600 border border-sky-500/20">
                      Draft Voucher
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1.5">
                    <span>Assigned Entity:</span>
                    <span className="font-semibold text-[var(--color-text-strong)]">
                      🏢 {assignedCompany ? assignedCompany.name : 'Global Group Book'}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-surface-muted)] transition-colors"
                onClick={() => setShowForm(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'details'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> 1. Customer & Terms
              </button>

              <button
                type="button"
                onClick={() => setModalTab('lines')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'lines'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" /> 2. Invoice Line Items ({lines.length})
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
                <Coins className="w-3.5 h-3.5" /> 3. Summary & Posting
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
              {modalTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      <span className="text-rose-500 font-bold mr-1">*</span> Customer Account
                    </label>
                    <select
                      value={form.customerId}
                      onChange={e => setForm({ ...form, customerId: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    >
                      <option value="">Select a customer...</option>
                      {customers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.customerNumber ? `(${c.customerNumber})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Invoice Reference # / Code
                    </label>
                    <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-[var(--color-primary)] transition-colors shadow-2xs">
                      <Hash className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                      <input
                        placeholder="e.g. INV-0001"
                        value={form.reference}
                        onChange={e => setForm({ ...form, reference: e.target.value })}
                        className="w-full h-full border-0 outline-none bg-transparent font-mono text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                        style={{ border: 0, outline: 'none', padding: 0, background: 'transparent' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Default Currency
                    </label>
                    <select
                      value={form.currencyCode}
                      onChange={e => setForm({ ...form, currencyCode: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    >
                      {['PKR', 'USD', 'AED', 'SAR', 'GBP', 'EUR', 'CAD', 'AUD'].map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      value={form.invoiceDate}
                      onChange={e => setForm({ ...form, invoiceDate: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Payment Due Date
                    </label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm({ ...form, dueDate: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {modalTab === 'lines' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-strong)]">Invoice Items & Quantities</p>
                  </div>

                  <div className="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs">
                      <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] font-semibold border-b border-[var(--color-border)]">
                        <tr>
                          <th className="p-2.5 text-left">Product / Service</th>
                          <th className="p-2.5 text-left">Description</th>
                          <th className="p-2.5 text-right w-16">Qty</th>
                          <th className="p-2.5 text-right w-24">Price (Rs)</th>
                          <th className="p-2.5 text-right w-20">Disc (Rs)</th>
                          <th className="p-2.5 text-right w-20">Tax (Rs)</th>
                          <th className="p-2.5 text-right w-24">Total</th>
                          <th className="p-2.5 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {lines.map((l, i) => (
                          <tr key={i} className="hover:bg-[var(--color-surface-muted)]/50">
                            <td className="p-2">
                              <select
                                value={l.productId}
                                onChange={e => updateLine(i, 'productId', e.target.value)}
                                className="w-full h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] outline-none"
                              >
                                <option value="">Select Item...</option>
                                {products.map((p: any) => (
                                  <option key={p.id} value={p.id}>
                                    {p.code} — {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                placeholder="Description"
                                value={l.description}
                                onChange={e => updateLine(i, 'description', e.target.value)}
                                className="w-full h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={l.quantity}
                                onChange={e => updateLine(i, 'quantity', e.target.value)}
                                className="w-full h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-right font-mono text-[var(--color-text-strong)] outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                value={l.unitPrice}
                                onChange={e => updateLine(i, 'unitPrice', e.target.value)}
                                className="w-full h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-right font-mono text-[var(--color-text-strong)] outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                value={l.discountAmount}
                                onChange={e => updateLine(i, 'discountAmount', e.target.value)}
                                className="w-full h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-right font-mono text-[var(--color-text-strong)] outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                value={l.taxAmount}
                                onChange={e => updateLine(i, 'taxAmount', e.target.value)}
                                className="w-full h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-right font-mono text-[var(--color-text-strong)] outline-none"
                              />
                            </td>
                            <td className="p-2 text-right font-mono font-semibold text-[var(--color-text-strong)]">
                              {money(
                                parseFloat(l.quantity || '0') * parseFloat(l.unitPrice || '0') -
                                  parseFloat(l.discountAmount || '0') +
                                  parseFloat(l.taxAmount || '0')
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {lines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeLine(i)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-rose-500 hover:bg-rose-500/10"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-start pt-1">
                    <button
                      type="button"
                      onClick={addLine}
                      className="h-8 px-3.5 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] text-xs font-semibold hover:bg-[var(--color-primary)]/10 transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Line
                    </button>
                  </div>
                </div>
              )}

              {modalTab === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2 space-y-4">
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Invoice Notes & Payment Instructions
                    </label>
                    <textarea
                      rows={4}
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="Payment terms, bank transfer details, delivery notes..."
                      className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] outline-none shadow-2xs resize-none"
                    />
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Saving as Draft creates the audit record. You can post to the GL at any time.</span>
                    </div>
                  </div>

                  <div className="bg-[var(--color-surface-muted)]/60 border border-[var(--color-border)] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-strong)]">Invoice Breakdown</p>
                    <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                      <span>Subtotal</span>
                      <span className="font-semibold font-mono text-[var(--color-text-strong)]">{money(subTotal)}</span>
                    </div>
                    {discountTotal > 0 && (
                      <div className="flex justify-between text-xs text-rose-500 font-mono">
                        <span>Total Discount</span>
                        <span>-{money(discountTotal)}</span>
                      </div>
                    )}
                    {taxTotal > 0 && (
                      <div className="flex justify-between text-xs text-amber-500 font-mono">
                        <span>Sales Tax / VAT</span>
                        <span>+{money(taxTotal)}</span>
                      </div>
                    )}
                    <div className="border-t border-[var(--color-border)] pt-2.5 flex justify-between text-sm font-bold text-[var(--color-text-strong)]">
                      <span>Net Total</span>
                      <span className="text-sky-600 font-mono">{money(netTotal)}</span>
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
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-8.5 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors"
                  onClick={(e) => { e.preventDefault(); saveDraft(); notify('Invoice draft saved locally.'); }}
                >
                  Save Draft
                </button>

                {modalTab !== 'details' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (modalTab === 'summary') setModalTab('lines')
                      else if (modalTab === 'lines') setModalTab('details')
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
                      if (modalTab === 'details') {
                        if (!form.customerId) {
                          notify('Please select a customer.')
                          return
                        }
                        setModalTab('lines')
                      } else if (modalTab === 'lines') {
                        setModalTab('summary')
                      }
                    }}
                    className="primary h-8.5 px-4 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <span>Next: {modalTab === 'details' ? 'Line Items' : 'Summary & Posting'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={saveInvoice}
                    className="primary h-8.5 px-4.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Create Invoice (Draft)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Invoice Modal */}
      {postModal && (
        <div className="overlay animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight">Post Invoice to Ledger</h3>
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3.5 text-xs">
              <p className="font-semibold text-[var(--color-text-strong)]">{postModal.invoiceNumber} — {postModal.customerName}</p>
              <p className="text-[var(--color-text-muted)] mt-1">Total Amount: <strong className="text-sky-600 font-mono">{money(postModal.totalAmount)}</strong></p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                Posting generates GAAP double entries: <strong>Dr Accounts Receivable</strong> and <strong>Cr Revenue / Sales Tax</strong>.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                <span className="text-rose-500 font-bold mr-1">*</span> Accounts Receivable Account
              </label>
              <select
                value={postForm.arAccId}
                onChange={e => setPostForm({ ...postForm, arAccId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] outline-none"
              >
                <option value="">Select AR Account...</option>
                {accounts.filter((a: any) => a.type === 'Asset').map((a: any) => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                <span className="text-rose-500 font-bold mr-1">*</span> Revenue Account
              </label>
              <select
                value={postForm.revenueAccId}
                onChange={e => setPostForm({ ...postForm, revenueAccId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] outline-none"
              >
                <option value="">Select Revenue Account...</option>
                {accounts.filter((a: any) => a.type === 'Revenue').map((a: any) => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={postInvoice}
                disabled={!postForm.arAccId || !postForm.revenueAccId}
                className="flex-1 h-8.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-semibold text-xs transition-colors"
              >
                Post to Ledger
              </button>
              <button
                type="button"
                onClick={() => setPostModal(null)}
                className="h-8.5 px-4 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
