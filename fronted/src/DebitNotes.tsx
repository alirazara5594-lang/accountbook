import { useState, useEffect, useMemo } from 'react'
import {
  FileText, Check, X, ArrowRight, ArrowLeft, Coins,
  CheckCircle2, Users, ShieldCheck, Trash2
} from 'lucide-react'
import { useVendorsStore, useCompanyStore } from './stores'
import { useFormDraft } from './hooks/useFormDraft'
import { DataToolbar } from '@/components/ui/data-toolbar'
import { money } from '@/lib/currency'

interface DebitNoteItem {
  id: string
  debitNoteNumber: string
  vendorId: string
  vendorName: string
  date: string
  reason: string
  amount: number
  taxAmount: number
  totalAmount: number
  status: 'Draft' | 'Posted' | 'Void'
}

const statusStyles: Record<string, { label: string; class: string }> = {
  Draft: { label: 'Draft', class: 'bg-slate-500/10 text-slate-600 border border-slate-500/20' },
  Posted: { label: 'Posted', class: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
  Void: { label: 'Void', class: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' }
}

export const DebitNotes: React.FC<{ activeEntityId: string; entities?: any[] }> = ({
  activeEntityId,
  entities = []
}) => {
  const vendors = useVendorsStore(s => s.vendors)
  const fetchVendors = useVendorsStore(s => s.fetchVendors)
  const { entities: companies } = useCompanyStore()

  const [notes, setNotes] = useState<DebitNoteItem[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [modalTab, setModalTab] = useState<'details' | 'items' | 'summary'>('details')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [toast, setToast] = useState('')

  const [form, setForm] = useState({
    vendorId: '',
    date: new Date().toISOString().slice(0, 10),
    reason: '',
    amount: '0',
    taxAmount: '0',
    currencyCode: 'PKR'
  })

  const { saveDraft, clearDraft } = useFormDraft('debit_note', form, setForm, showCreate)

  useEffect(() => {
    fetchVendors(activeEntityId)
    // Load local stored debit notes if any
    const stored = localStorage.getItem(`debit_notes_${activeEntityId || 'global'}`)
    if (stored) {
      try {
        setNotes(JSON.parse(stored))
      } catch {}
    }
  }, [activeEntityId])

  const notify = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 3500)
  }

  const openCreateModal = () => {
    setForm({
      vendorId: vendors[0]?.id || '',
      date: new Date().toISOString().slice(0, 10),
      reason: 'Purchase return / supplier price overcharge adjustment.',
      amount: '0',
      taxAmount: '0',
      currencyCode: 'PKR'
    })
    setModalTab('details')
    setShowCreate(true)
  }

  const handleCreate = () => {
    if (!form.vendorId) {
      notify('Please select a vendor.')
      return
    }
    const amt = parseFloat(form.amount || '0')
    if (amt <= 0) {
      notify('Please enter a valid debit amount.')
      return
    }

    const vendor = vendors.find(v => v.id === form.vendorId)
    const tax = parseFloat(form.taxAmount || '0')
    const newNote: DebitNoteItem = {
      id: `dn_${Date.now()}`,
      debitNoteNumber: `DN-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorId: form.vendorId,
      vendorName: vendor?.name || 'Vendor',
      date: form.date,
      reason: form.reason,
      amount: amt,
      taxAmount: tax,
      totalAmount: amt + tax,
      status: 'Draft'
    }

    const updated = [newNote, ...notes]
    setNotes(updated)
    localStorage.setItem(`debit_notes_${activeEntityId || 'global'}`, JSON.stringify(updated))
    clearDraft()
    setShowCreate(false)
    notify('✓ Debit Note created as Draft!')
  }

  const handlePost = (id: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, status: 'Posted' as const } : n)
    setNotes(updated)
    localStorage.setItem(`debit_notes_${activeEntityId || 'global'}`, JSON.stringify(updated))
    notify('✓ Debit Note posted to Accounts Payable ledger!')
  }

  const handleVoid = (id: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, status: 'Void' as const } : n)
    setNotes(updated)
    localStorage.setItem(`debit_notes_${activeEntityId || 'global'}`, JSON.stringify(updated))
    notify('Debit Note marked as Void.')
  }

  const filtered = useMemo(() => {
    return notes.filter(n => {
      const matchesQuery = !query.trim()
        ? true
        : `${n.debitNoteNumber} ${n.vendorName} ${n.reason}`.toLowerCase().includes(query.toLowerCase())

      const matchesStatus = statusFilter === 'all' || n.status.toLowerCase() === statusFilter.toLowerCase()

      return matchesQuery && matchesStatus
    })
  }, [notes, query, statusFilter])

  const exportHeaders = ['Debit Note #', 'Vendor', 'Date', 'Reason', 'Principal (Rs)', 'Tax (Rs)', 'Total (Rs)', 'Status']
  const exportRows = filtered.map(n => [
    n.debitNoteNumber,
    n.vendorName,
    n.date,
    n.reason,
    n.amount,
    n.taxAmount,
    n.totalAmount,
    n.status
  ])

  const totalDebit = notes.reduce((s, n) => s + (n.totalAmount || 0), 0)
  const postedCount = notes.filter(n => n.status === 'Posted').length
  const draftCount = notes.filter(n => n.status === 'Draft').length

  const assignedCompany = (companies || entities).find((e: any) => e.id === activeEntityId)

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
            <span className="text-lg">📝</span> Vendor Debit Notes & Purchase Returns
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
            Issue debit memos to suppliers for goods returned, rate discrepancies, or purchase claims with AP deduction.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <select
            className="h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors shadow-2xs box-border"
            style={{ paddingTop: 0, paddingBottom: 0 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">⚡ All Statuses</option>
            <option value="draft">⚪ Draft</option>
            <option value="posted">🟢 Posted</option>
            <option value="void">🔴 Void</option>
          </select>

          <DataToolbar
            query={query}
            setQuery={setQuery}
            searchPlaceholder="Search vendor, debit #..."
            exportFileName="debit-notes"
            exportSheetName="Debit Notes"
            exportTitle="Vendor Debit Notes"
            exportSubtitle="Supplier debit memos and return records."
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Debit Value', value: totalDebit }]}
            onRefresh={() => fetchVendors(activeEntityId)}
          />
          <button
            onClick={openCreateModal}
            className="primary h-9 px-4 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>＋</span> New Debit Note
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
            <small>TOTAL DEBIT VALUE</small>
            <h2>{money(totalDebit)}</h2>
            <p>All supplier claims</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div>
            <small>POSTED TO AP</small>
            <h2>{postedCount}</h2>
            <p>Applied against vendor balances</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet">
            <FileText className="w-4 h-4" />
          </span>
          <div>
            <small>DRAFT CLAIMS</small>
            <h2>{draftCount}</h2>
            <p>Pending supplier approval</p>
          </div>
        </article>
      </section>

      {/* Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-between">
          <p className="text-xs font-semibold text-[var(--color-text-strong)]">Debit Notes Directory</p>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Showing {filtered.length} of {notes.length} record{notes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
            No debit notes found. Click "＋ New Debit Note" to record a purchase return.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Debit Note #</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Vendor</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Date</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--color-text-muted)]">Reason</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Principal</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Tax Adj</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Total Amount</th>
                  <th className="text-center px-3 py-2 font-semibold text-[var(--color-text-muted)]">Status</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--color-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(n => {
                  const badge = statusStyles[n.status] || statusStyles.Draft
                  return (
                    <tr key={n.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors">
                      <td className="px-3 py-2 font-mono font-semibold text-[var(--color-text-strong)]">{n.debitNoteNumber}</td>
                      <td className="px-3 py-2 font-semibold text-[var(--color-text-strong)]">{n.vendorName}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{n.date}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{n.reason}</td>
                      <td className="px-3 py-2 text-right font-mono text-[var(--color-text-strong)]">{money(n.amount)}</td>
                      <td className="px-3 py-2 text-right font-mono text-amber-500">{n.taxAmount > 0 ? money(n.taxAmount) : '—'}</td>
                      <td className="px-3 py-2 text-right font-bold text-sky-600 font-mono">{money(n.totalAmount)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {n.status === 'Draft' && (
                            <button
                              onClick={() => handlePost(n.id)}
                              className="h-6.5 px-2 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-[11px] font-semibold"
                            >
                              Post AP
                            </button>
                          )}
                          {n.status !== 'Void' && (
                            <button
                              onClick={() => handleVoid(n.id)}
                              className="p-1 rounded text-rose-500 hover:bg-rose-500/10"
                              title="Void"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* Stepped / Tabbed Debit Note Creation Modal */}
      {showCreate && (
        <div className="overlay animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight">Create Vendor Debit Note</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Debit Memo
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
                onClick={() => setShowCreate(false)}
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
                <Users className="w-3.5 h-3.5" /> 1. Vendor & Date
              </button>

              <button
                type="button"
                onClick={() => setModalTab('items')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'items'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Coins className="w-3.5 h-3.5" /> 2. Debit Amount & Tax
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
                <FileText className="w-3.5 h-3.5" /> 3. Return Reason & Summary
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
              {modalTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Vendor / Supplier <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.vendorId}
                      onChange={e => setForm({ ...form, vendorId: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    >
                      <option value="">Select vendor...</option>
                      {vendors.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.vendorNumber ? `(${v.vendorNumber})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Debit Note Date
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Currency
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
                </div>
              )}

              {modalTab === 'items' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Claim Amount (Rs) <span className="text-rose-500">*</span>
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

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Input Tax Reversal (Rs)
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
                        value={form.taxAmount}
                        onChange={e => setForm({ ...form, taxAmount: e.target.value })}
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
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Return Reason & Supplier Claim Remarks
                    </label>
                    <textarea
                      rows={4}
                      value={form.reason}
                      onChange={e => setForm({ ...form, reason: e.target.value })}
                      placeholder="e.g. Returned rejected raw materials from PO-1020 / supplier over-billing correction..."
                      className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] outline-none shadow-2xs resize-none"
                    />
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Posting this note will debit Accounts Payable and adjust supplier outstanding balance.</span>
                    </div>
                  </div>

                  <div className="bg-[var(--color-surface-muted)]/60 border border-[var(--color-border)] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-strong)]">Debit Summary</p>
                    <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                      <span>Claim Principal</span>
                      <span className="font-semibold font-mono text-[var(--color-text-strong)]">{money(Number(form.amount) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-amber-500 font-mono">
                      <span>Tax Reversal</span>
                      <span>+{money(Number(form.taxAmount) || 0)}</span>
                    </div>
                    <div className="border-t border-[var(--color-border)] pt-2.5 flex justify-between text-sm font-bold text-[var(--color-text-strong)]">
                      <span>Total Debit</span>
                      <span className="text-amber-600 font-mono">{money((Number(form.amount) || 0) + (Number(form.taxAmount) || 0))}</span>
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
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-8.5 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors"
                  onClick={(e) => { e.preventDefault(); saveDraft(); notify('Debit note draft saved locally.'); }}
                >
                  Save Draft
                </button>

                {modalTab !== 'details' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (modalTab === 'summary') setModalTab('items')
                      else if (modalTab === 'items') setModalTab('details')
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
                        if (!form.vendorId) {
                          notify('Please select a vendor.')
                          return
                        }
                        setModalTab('items')
                      } else if (modalTab === 'items') {
                        setModalTab('summary')
                      }
                    }}
                    className="primary h-8.5 px-4 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <span>Next: {modalTab === 'details' ? 'Amount & Tax' : 'Reason & Summary'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="primary h-8.5 px-4.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Create Debit Note</span>
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

export default DebitNotes
