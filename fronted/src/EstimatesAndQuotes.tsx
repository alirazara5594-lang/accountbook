import { useState, useEffect, useMemo } from 'react'
import {
  FileText, Plus, Check, X, ArrowRight,
  ArrowLeft, Coins, CheckCircle2, Hash, Users, ArrowUpRight, Eye, Pencil, Ban
} from 'lucide-react'
import { useSalesStore, useCustomersStore, useProductsStore, useCompanyStore } from './stores'
import { useFormDraft } from './hooks/useFormDraft'
import { DataToolbar } from '@/components/ui/data-toolbar'
import { money } from './lib/currency'

const statusStyles: Record<number, { label: string; class: string }> = {
  0: { label: 'Draft', class: 'bg-slate-500/10 text-slate-600 border border-slate-500/20' },
  1: { label: 'Sent', class: 'bg-sky-500/10 text-sky-600 border border-sky-500/20' },
  2: { label: 'Finalized', class: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
  3: { label: 'Cancelled', class: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' },
  4: { label: 'Expired', class: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' },
  5: { label: 'Invoiced', class: 'bg-purple-500/10 text-purple-600 border border-purple-500/20' },
}

interface Line {
  productId: string
  description: string
  quantity: string
  unitPrice: string
  discountType: 0 | 1 // 0=Percentage, 1=FixedAmount
  discountValue: string
  taxPercent: string
}

const defaultLine = (): Line => ({
  productId: '',
  description: '',
  quantity: '1',
  unitPrice: '0',
  discountType: 0,
  discountValue: '0',
  taxPercent: '0',
})

export const EstimatesAndQuotes: React.FC<{ activeEntityId: string; entities?: any[] }> = ({
  activeEntityId,
  entities = []
}) => {
  const allEntities = useCompanyStore((s) => s.entities)
  const estimates = useSalesStore((s) => s.estimates)
  const fetchEstimates = useSalesStore((s) => s.fetchEstimates)
  const createEstimateStore = useSalesStore((s) => s.createEstimate)
  const updateEstimateStatusStore = useSalesStore((s) => s.updateEstimateStatus)
  const convertToInvoiceStore = useSalesStore((s) => s.convertToInvoice)

  const customers = useCustomersStore((s) => s.customers)
  const fetchCustomers = useCustomersStore((s) => s.fetchCustomers)

  const products = useProductsStore((s) => s.products)
  const fetchProducts = useProductsStore((s) => s.fetchProducts)

  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [modalTab, setModalTab] = useState<'details' | 'lines' | 'summary' | 'preview'>('details')
  const [convertModal, setConvertModal] = useState<any>(null)
  const [toast, setToast] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [form, setForm] = useState({
    customerId: '',
    estimateDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    reference: '',
    notes: '',
    terms: 'Payment due within 30 days of invoice date.',
    currencyCode: 'PKR'
  })

  const [lines, setLines] = useState<Line[]>([defaultLine()])

  const { saveDraft, clearDraft } = useFormDraft('estimate_quote', { form, lines }, (saved: any) => {
    if (saved.form) setForm(saved.form)
    if (saved.lines) setLines(saved.lines)
  }, showForm)

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchEstimates(activeEntityId),
        fetchCustomers(activeEntityId),
        fetchProducts(),
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

  const [editingEstimate, setEditingEstimate] = useState<any>(null)

  const openCreateModal = async () => {
    setEditingEstimate(null)
    const salesStore = useSalesStore.getState()
    const nextRef = await salesStore.fetchNextNumber('estimate')
    const today = new Date().toISOString().slice(0, 10)

    setForm({
      customerId: customers[0]?.id || '',
      estimateDate: today,
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      reference: nextRef || 'EST-00001',
      notes: 'Quotations valid for 30 days from date of issue.',
      terms: 'Standard trade terms apply.',
      currencyCode: 'PKR'
    })
    setLines([defaultLine()])
    setModalTab('details')
    setShowForm(true)
  }

  const openEditModal = (est: any) => {
    setEditingEstimate(est)
    setForm({
      customerId: est.customerId || '',
      estimateDate: est.estimateDate || new Date().toISOString().slice(0, 10),
      expiryDate: est.expiryDate || '',
      reference: est.estimateNumber || est.reference || '',
      notes: est.notes || '',
      terms: est.terms || '',
      currencyCode: est.currencyCode || 'PKR'
    })
    setLines(
      est.lines && est.lines.length > 0
        ? est.lines.map((l: any) => ({
            productId: l.productId || '',
            description: l.description || '',
            quantity: String(l.quantity || 1),
            unitPrice: String(l.unitPrice || 0),
            discountType: (l.discountType ?? 0) as 0 | 1,
            discountValue: String(l.discountValue || 0),
            taxPercent: String(l.taxPercent || 0),
          }))
        : [defaultLine()]
    )
    setModalTab('details')
    setShowForm(true)
  }

  const finalizeEstimate = async (est: any) => {
    if (!window.confirm(`Do you want to finalize Quotation "${est.estimateNumber || est.reference}"? Once finalized, you can convert it into a Sales Invoice.`)) return
    try {
      await updateEstimateStatusStore(est.id, '2') // 2 = Finalized / Accepted
      notify('✓ Quotation Finalized! You can now convert it to an Invoice.')
      fetchData()
    } catch (e: any) {
      notify(e.message || 'Failed to finalize quotation')
    }
  }

  const cancelEstimate = async (est: any) => {
    if (!window.confirm(`Are you sure you want to cancel Quotation "${est.estimateNumber || est.reference}"?`)) return
    try {
      await updateEstimateStatusStore(est.id, '3') // 3 = Rejected / Cancelled
      notify('✓ Quotation marked as Cancelled.')
      fetchData()
    } catch (e: any) {
      notify(e.message || 'Failed to cancel quotation')
    }
  }

  const updateLine = (i: number, field: string, value: any) => {
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

  const addLine = () => setLines([...lines, defaultLine()])
  const removeLine = (idx: number) => setLines(lines.filter((_, j) => j !== idx))

  const lineCalculations = lines.map(l => {
    const qty = parseFloat(l.quantity) || 0
    const price = parseFloat(l.unitPrice) || 0
    const sub = qty * price
    const discAmt = l.discountType === 0
      ? Math.round(sub * (parseFloat(l.discountValue) || 0) / 100 * 100) / 100
      : (parseFloat(l.discountValue) || 0)
    const afterDisc = sub - discAmt
    const taxAmt = Math.round(afterDisc * (parseFloat(l.taxPercent) || 0) / 100 * 100) / 100
    return { sub, discAmt, taxAmt, total: afterDisc + taxAmt }
  })

  const totals = lineCalculations.reduce(
    (acc, c) => ({
      sub: acc.sub + c.sub,
      disc: acc.disc + c.discAmt,
      tax: acc.tax + c.taxAmt,
      total: acc.total + c.total,
    }),
    { sub: 0, disc: 0, tax: 0, total: 0 }
  )

  const saveEstimate = async () => {
    if (!form.customerId) {
      notify('Please select a customer.')
      return
    }
    const body = {
      ...form,
      estimateNumber: form.reference,
      companyId: activeEntityId || null,
      expiryDate: form.expiryDate || null,
      lines: lines.map(l => ({
        productId: l.productId || null,
        description: l.description,
        quantity: parseFloat(l.quantity || '1'),
        unitPrice: parseFloat(l.unitPrice || '0'),
        discountType: l.discountType,
        discountValue: parseFloat(l.discountValue || '0'),
        taxCodeId: null,
        taxPercent: parseFloat(l.taxPercent || '0'),
      }))
    }
    try {
      await createEstimateStore(body)
      clearDraft()
      notify(editingEstimate ? '✓ Quotation updated successfully!' : '✓ Quotation saved as Draft!')
      setShowForm(false)
      fetchData()
    } catch (e: any) {
      notify(e.message || 'Error saving estimate')
    }
  }

  const convertToInvoice = async (invDate: string, dueDate: string) => {
    try {
      await convertToInvoiceStore(convertModal.id, { invoiceDate: invDate, dueDate })
      notify('✓ Sales invoice created! Check Sales Invoices.')
      setConvertModal(null)
      fetchData()
    } catch (e: any) {
      notify(e.message || 'Conversion failed')
    }
  }

  const filteredEstimates = useMemo(() => {
    return estimates.filter((est: any) => {
      const matchesQuery = !query.trim()
        ? true
        : `${est.estimateNumber || ''} ${est.customerName || ''} ${est.reference || ''}`
            .toLowerCase()
            .includes(query.toLowerCase())

      const matchesStatus = statusFilter === 'all' || String(est.status) === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [estimates, query, statusFilter])

  const exportHeaders = ['Quote #', 'Customer', 'Date', 'Expiry Date', 'Discount', 'Tax', 'Total', 'Status']
  const exportRows = filteredEstimates.map((est: any) => [
    est.estimateNumber,
    est.customerName,
    est.estimateDate,
    est.expiryDate || '—',
    est.discountTotal || 0,
    est.taxTotal || 0,
    est.totalAmount || 0,
    statusStyles[est.status]?.label || 'Draft'
  ])

  const totalQuoteValue = estimates.reduce((s: number, e: any) => s + (e.totalAmount || 0), 0)
  const acceptedValue = estimates.filter((e: any) => e.status === 2).reduce((s: number, e: any) => s + (e.totalAmount || 0), 0)
  const pendingCount = estimates.filter((e: any) => e.status === 0 || e.status === 1).length

  const assignedCompany = (entities && entities.length > 0 ? entities : allEntities).find((e: any) => e.id === activeEntityId) || allEntities.find((e: any) => e.id === activeEntityId) || allEntities[0]

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
            <span className="text-lg">📑</span> Estimates & Quotations
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
            Prepare commercial quotes, RFQ estimates, pricing proposals, and 1-click invoice conversion.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <DataToolbar
            query={query}
            setQuery={setQuery}
            searchPlaceholder="Search quote #, customer..."
            exportFileName="estimates-and-quotes"
            exportSheetName="Quotations"
            exportTitle="Quotations Register"
            exportSubtitle="Sales proposals and quotation records."
            exportHeaders={exportHeaders}
            exportRows={exportRows}
          >
            <select
              className="h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors shadow-2xs box-border"
              style={{ paddingTop: 0, paddingBottom: 0 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">⚡ All Statuses</option>
              <option value="0">⚪ Draft</option>
              <option value="1">🔵 Sent</option>
              <option value="2">🟢 Finalized</option>
              <option value="3">🔴 Cancelled</option>
              <option value="4">🟡 Expired</option>
              <option value="5">🟣 Invoiced</option>
            </select>
          </DataToolbar>
          <button
            onClick={openCreateModal}
            className="primary h-9 px-4 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>＋</span> New Quote
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
            <small>TOTAL PIPELINE VALUE</small>
            <h2>{money(totalQuoteValue)}</h2>
            <p>All issued proposals</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div>
            <small>ACCEPTED PROPOSALS</small>
            <h2>{money(acceptedValue)}</h2>
            <p>Won & ready to bill</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet">
            <FileText className="w-4 h-4" />
          </span>
          <div>
            <small>PENDING PROPOSALS</small>
            <h2>{pendingCount}</h2>
            <p>Awaiting customer approval</p>
          </div>
        </article>
      </section>

      {/* Quotes Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-between">
          <p className="text-xs font-semibold text-[var(--color-text-strong)]">Quotations Directory</p>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Showing {filteredEstimates.length} of {estimates.length} quote{estimates.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">Loading quotations...</div>
        ) : filteredEstimates.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">No estimates found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Quote #</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Customer</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Date</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Expiry</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Discount</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Tax</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Total</th>
                  <th className="text-center px-3 py-2 font-semibold text-[var(--color-text-muted)]">Status</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEstimates.map((est: any) => {
                  const badge = statusStyles[est.status] || statusStyles[0]
                  return (
                    <tr key={est.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors">
                      <td className="px-3 py-2 font-mono font-semibold text-[var(--color-text-strong)]">{est.estimateNumber}</td>
                      <td className="px-3 py-2 font-semibold text-[var(--color-text-strong)]">{est.customerName || '—'}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{est.estimateDate}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{est.expiryDate || '—'}</td>
                      <td className="px-3 py-2 text-right text-rose-500 font-mono">
                        {est.discountTotal > 0 ? `-${money(est.discountTotal)}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-amber-500 font-mono">
                        {est.taxTotal > 0 ? money(est.taxTotal) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-sky-600 font-mono">{money(est.totalAmount)}</td>
                      <td className="px-3 py-2 text-center">
                        {est.status === 0 ? (
                          <button
                            onClick={() => finalizeEstimate(est)}
                            title="Click to Finalize Quotation"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/30 hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer transition-all shadow-2xs group"
                          >
                            <span>Draft</span>
                            <span className="text-[9px] opacity-70 group-hover:opacity-100 font-normal">→ Finalize</span>
                          </button>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.class}`}>
                            {badge.label}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. EDIT BUTTON */}
                          <button
                            onClick={() => openEditModal(est)}
                            title="Edit Quotation"
                            className="h-7 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                          >
                            <Pencil className="w-3 h-3 text-indigo-500" />
                            <span>Edit</span>
                          </button>

                          {/* 2. CANCEL BUTTON */}
                          {est.status !== 3 && est.status !== 5 && (
                            <button
                              onClick={() => cancelEstimate(est)}
                              title="Cancel Quotation"
                              className="h-7 px-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-600 text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Ban className="w-3 h-3 text-rose-500" />
                              <span>Cancel</span>
                            </button>
                          )}

                          {/* 3. CONVERT INTO INVOICE BUTTON (Displayed when Finalized / Accepted) */}
                          {est.status === 2 && (
                            <button
                              onClick={() => setConvertModal(est)}
                              title="Convert Finalized Quotation into Sales Invoice"
                              className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors animate-in fade-in"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>To Invoice</span>
                            </button>
                          )}

                          {/* IF DRAFT: Option to Finalize directly from actions */}
                          {est.status === 0 && (
                            <button
                              onClick={() => finalizeEstimate(est)}
                              title="Finalize Quotation to enable Invoicing"
                              className="h-7 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                              <span>Finalize</span>
                            </button>
                          )}

                          {est.status === 5 && (
                            <span className="text-[11px] font-semibold text-purple-600 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                              Invoiced
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Professional Multi-Tab Quote Creation Modal */}
      {showForm && (
        <div className="overlay animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight">Create Commercial Quotation</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                      Draft Estimate
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
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'details'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Users className="w-3 h-3" /> 1. Customer & Expiry
              </button>

              <button
                type="button"
                onClick={() => setModalTab('lines')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'lines'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Coins className="w-3 h-3" /> 2. Items & Pricing ({lines.length})
              </button>

              <button
                type="button"
                onClick={() => setModalTab('summary')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'summary'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <FileText className="w-3 h-3" /> 3. Terms & Summary
              </button>

              <button
                type="button"
                onClick={() => setModalTab('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'preview'
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-500/10'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Eye className="w-3 h-3" /> Preview
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
              {modalTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      <span className="text-rose-500 font-bold mr-1">*</span> Customer / Client
                    </label>
                    <select
                      value={form.customerId}
                      onChange={e => setForm({ ...form, customerId: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    >
                      <option value="">Select customer...</option>
                      {customers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.customerNumber ? `(${c.customerNumber})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Quote Reference / RFQ #
                    </label>
                    <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-[var(--color-primary)] transition-colors shadow-2xs">
                      <Hash className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                      <input
                        placeholder="e.g. EST-0001"
                        value={form.reference}
                        onChange={e => setForm({ ...form, reference: e.target.value })}
                        className="w-full h-full border-0 outline-none bg-transparent font-mono text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                        style={{ border: 0, outline: 'none', padding: 0, background: 'transparent' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Quotation Currency
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
                      Quotation Date
                    </label>
                    <input
                      type="date"
                      value={form.estimateDate}
                      onChange={e => setForm({ ...form, estimateDate: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Proposal Expiry Date
                    </label>
                    <input
                      type="date"
                      value={form.expiryDate}
                      onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {modalTab === 'lines' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-strong)]">Quotation Line Items</p>
                  </div>

                  <div className="border border-[var(--color-border)] rounded-xl shadow-2xs bg-[var(--color-surface)] overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] font-semibold border-b border-[var(--color-border)]">
                        <tr>
                          <th className="p-2.5 text-left min-w-[180px]">Product / Service</th>
                          <th className="p-2.5 text-left min-w-[160px]">Description</th>
                          <th className="p-2.5 text-right w-20">Qty</th>
                          <th className="p-2.5 text-right w-28">Price ({form.currencyCode || 'PKR'})</th>
                          <th className="p-2.5 text-center min-w-[170px] w-48">Discount</th>
                          <th className="p-2.5 text-right w-20">Tax %</th>
                          <th className="p-2.5 text-right w-36">Total ({form.currencyCode || 'PKR'})</th>
                          <th className="p-2.5 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {lines.map((l, i) => (
                          <tr key={i} className="hover:bg-[var(--color-surface-muted)]/50 transition-colors">
                            <td className="p-2">
                              <select
                                value={l.productId}
                                onChange={e => updateLine(i, 'productId', e.target.value)}
                                className="w-full h-8.5 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] outline-none"
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
                                className="w-full h-8.5 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="1"
                                value={l.quantity}
                                onChange={e => updateLine(i, 'quantity', e.target.value)}
                                className="w-full h-8.5 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-right font-mono text-[var(--color-text-strong)] outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                value={l.unitPrice}
                                onChange={e => updateLine(i, 'unitPrice', e.target.value)}
                                className="w-full h-8.5 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-right font-mono text-[var(--color-text-strong)] outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={l.discountType}
                                  onChange={e => updateLine(i, 'discountType', parseInt(e.target.value))}
                                  className="h-8.5 min-w-[62px] shrink-0 border border-[var(--color-border)] rounded-lg px-2 text-xs bg-[var(--color-surface)] text-[var(--color-text-strong)] font-semibold outline-none"
                                >
                                  <option value={0}>%</option>
                                  <option value={1}>{form.currencyCode || 'PKR'}</option>
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  step={l.discountType === 0 ? "1" : "0.01"}
                                  placeholder="0"
                                  value={l.discountValue}
                                  onChange={e => updateLine(i, 'discountValue', e.target.value)}
                                  className="w-full min-w-[85px] h-8.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-right font-mono font-medium text-[var(--color-text-strong)] outline-none"
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0"
                                value={l.taxPercent}
                                onChange={e => updateLine(i, 'taxPercent', e.target.value)}
                                className="w-full h-8.5 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-right font-mono text-[var(--color-text-strong)] outline-none"
                              />
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              {money(lineCalculations[i]?.total || 0)}
                            </td>
                            <td className="p-2 text-center">
                              {lines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeLine(i)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-rose-500 hover:bg-rose-500/10"
                                >
                                  <X className="w-3 h-3" />
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
                      <Plus className="w-3 h-3" /> Add Line
                    </button>
                  </div>
                </div>
              )}

              {modalTab === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                        Terms & Conditions
                      </label>
                      <textarea
                        rows={3}
                        value={form.terms}
                        onChange={e => setForm({ ...form, terms: e.target.value })}
                        className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] outline-none shadow-2xs resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                        Client Notes
                      </label>
                      <textarea
                        rows={2}
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        placeholder="Additional remarks or scope inclusions..."
                        className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] outline-none shadow-2xs resize-none"
                      />
                    </div>
                  </div>

                  <div className="bg-[var(--color-surface-muted)]/60 border border-[var(--color-border)] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-strong)]">Quotation Summary</p>
                    <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                      <span>Gross Subtotal</span>
                      <span className="font-semibold font-mono text-[var(--color-text-strong)]">{money(totals.sub)}</span>
                    </div>
                    {totals.disc > 0 && (
                      <div className="flex justify-between text-xs text-rose-500 font-mono">
                        <span>Total Discount</span>
                        <span>-{money(totals.disc)}</span>
                      </div>
                    )}
                    {totals.tax > 0 && (
                      <div className="flex justify-between text-xs text-amber-500 font-mono">
                        <span>Sales Tax / VAT</span>
                        <span>+{money(totals.tax)}</span>
                      </div>
                    )}
                    <div className="border-t border-[var(--color-border)] pt-2.5 flex justify-between text-sm font-bold text-[var(--color-text-strong)]">
                      <span>Estimated Total</span>
                      <span className="text-indigo-600 font-mono">{money(totals.total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'preview' && (
                <div className="space-y-6">
                  {/* Quote Header Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-sky-500/10 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[var(--color-text-strong)]">Quotation / Estimate: {form.reference || 'Auto-generated'}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">Draft Quotation</span>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Client: <strong className="text-[var(--color-text-strong)]">{customers.find((c: any) => c.id === form.customerId)?.name || 'Selected Customer'}</strong> • Currency: <span className="font-mono font-bold">{form.currencyCode || 'PKR'}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-[var(--color-text-muted)] block text-[11px]">Estimate Date:</span>
                        <strong className="text-[var(--color-text-strong)]">{form.estimateDate}</strong>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-muted)] block text-[11px]">Expiration Date:</span>
                        <strong className="text-[var(--color-text-strong)]">{form.expiryDate}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xs">
                    <div className="px-4 py-2.5 bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] text-xs font-bold text-[var(--color-text-strong)]">
                      Quotation Items & Cost Breakdown
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                          <th className="text-left px-3.5 py-2 font-semibold">#</th>
                          <th className="text-left px-3.5 py-2 font-semibold">Description</th>
                          <th className="text-center px-3.5 py-2 font-semibold">Qty</th>
                          <th className="text-right px-3.5 py-2 font-semibold">Unit Price</th>
                          <th className="text-right px-3.5 py-2 font-semibold">Discount</th>
                          <th className="text-right px-3.5 py-2 font-semibold">Tax</th>
                          <th className="text-right px-3.5 py-2 font-semibold">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {lines.map((l, i) => {
                          const q = parseFloat(l.quantity) || 0;
                          const p = parseFloat(l.unitPrice) || 0;
                          const gross = q * p;
                          const dVal = parseFloat(l.discountValue) || 0;
                          const dAmt = l.discountType === 0 ? (gross * dVal) / 100 : dVal;
                          const taxable = Math.max(0, gross - dAmt);
                          const tAmt = (taxable * (parseFloat(l.taxPercent) || 0)) / 100;
                          const total = taxable + tAmt;
                          return (
                            <tr key={i} className="hover:bg-[var(--color-surface-muted)]/50">
                              <td className="px-3.5 py-2 text-[var(--color-text-muted)] font-mono">{i + 1}</td>
                              <td className="px-3.5 py-2 font-semibold text-[var(--color-text-strong)]">{l.description || '—'}</td>
                              <td className="px-3.5 py-2 text-center font-mono">{q}</td>
                              <td className="px-3.5 py-2 text-right font-mono">{money(p)}</td>
                              <td className="px-3.5 py-2 text-right font-mono text-rose-500">{dAmt > 0 ? `-${money(dAmt)}` : '—'}</td>
                              <td className="px-3.5 py-2 text-right font-mono text-amber-600">{tAmt > 0 ? `+${money(tAmt)}` : '—'}</td>
                              <td className="px-3.5 py-2 text-right font-mono font-bold text-[var(--color-text-strong)]">{money(total)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Financial Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2">
                      <p className="font-bold text-[var(--color-text-strong)]">Terms, Conditions & Expiration</p>
                      <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">{form.terms || 'Standard quotation terms apply.'}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2 shadow-2xs">
                      <div className="flex justify-between text-[11px] text-[var(--color-text-muted)]">
                        <span>Gross Items Subtotal:</span>
                        <span className="font-mono font-semibold text-[var(--color-text-strong)]">{money(totals.sub)}</span>
                      </div>
                      {totals.disc > 0 && (
                        <div className="flex justify-between text-[11px] text-rose-500 font-mono">
                          <span>Total Discount:</span>
                          <span>-{money(totals.disc)}</span>
                        </div>
                      )}
                      {totals.tax > 0 && (
                        <div className="flex justify-between text-[11px] text-amber-600 font-mono">
                          <span>Sales Tax / VAT:</span>
                          <span>+{money(totals.tax)}</span>
                        </div>
                      )}
                      <div className="border-t border-[var(--color-border)] pt-2 flex justify-between text-sm font-bold text-[var(--color-text-strong)]">
                        <span>Total Estimated Quote:</span>
                        <span className="text-indigo-600 font-mono text-base">{money(totals.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 flex items-center justify-between gap-3">
              <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>{modalTab === 'preview' ? 'Ready for final verification & creation' : 'Auto-draft protection active'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-8.5 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                {modalTab !== 'preview' && (
                  <button
                    type="button"
                    className="h-8.5 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors"
                    onClick={(e) => { e.preventDefault(); saveDraft(); notify('Estimate draft saved locally.'); }}
                  >
                    Save Draft
                  </button>
                )}

                {modalTab !== 'details' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (modalTab === 'preview') setModalTab('summary')
                      else if (modalTab === 'summary') setModalTab('lines')
                      else if (modalTab === 'lines') setModalTab('details')
                    }}
                    className="h-8.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>{modalTab === 'preview' ? 'Back to Edit' : 'Back'}</span>
                  </button>
                )}

                {modalTab !== 'preview' ? (
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
                      } else if (modalTab === 'summary') {
                        setModalTab('preview')
                      }
                    }}
                    className="primary h-8.5 px-4 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <span>
                      {modalTab === 'details' ? 'Next: Items & Pricing' : modalTab === 'lines' ? 'Next: Terms & Summary' : 'Preview & Review'}
                    </span>
                    {modalTab === 'summary' ? <Eye className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={saveEstimate}
                    className="primary h-8.5 px-5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Check className="w-3 h-3" />
                    <span>Confirm & Create Estimate</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Invoice Modal */}
      {convertModal && (
        <ConvertModal
          estimate={convertModal}
          onConfirm={convertToInvoice}
          onClose={() => setConvertModal(null)}
        />
      )}
    </div>
  )
}

const ConvertModal = ({
  estimate,
  onConfirm,
  onClose
}: {
  estimate: any
  onConfirm: (inv: string, due: string) => void
  onClose: () => void
}) => {
  const [invDate, setInvDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
  return (
    <div className="overlay animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight">Convert to Sales Invoice</h3>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3.5 text-xs space-y-1">
          <p className="font-semibold text-[var(--color-text-strong)]">{estimate.estimateNumber} — {estimate.customerName}</p>
          <p className="text-[var(--color-text-muted)]">Total Amount: <strong className="text-indigo-600 font-mono">{money(estimate.totalAmount)}</strong></p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1">Invoice Date</label>
            <input
              type="date"
              value={invDate}
              onChange={e => setInvDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] outline-none"
            />
          </div>
        </div>
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => onConfirm(invDate, dueDate)}
            className="flex-1 h-8.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
          >
            Create Invoice
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8.5 px-4 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
