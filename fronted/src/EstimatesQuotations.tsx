import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Pencil,
  Eye,
  CheckCircle,
  XCircle,
  Send,
  DollarSign,
  Percent,
  Printer
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Entity } from './EntitySettings'
import type { Customer } from './CustomerManagement'

const api = 'http://localhost:5124/api/v1'

export type DiscountType = 'FixedAmount' | 'Percentage'
export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired' | 'Converted'

export type QuotationItem = {
  description: string
  quantity: number
  unitPrice: number
}

export type Quotation = {
  id: string
  quoteNumber: string
  customerId: string
  customerName: string
  companyId?: string
  date: string
  expiryDate: string
  currencyCode: string
  items: QuotationItem[]
  discountType: DiscountType
  discountValue: number
  taxRatePercent: number
  notes?: string
  termsAndConditions?: string
  status: QuotationStatus
  subtotal: number
  discountAmount: number
  taxableAmount: number
  taxAmount: number
  total: number
  createdAt: string
  updatedAt: string
}

type ItemForm = {
  description: string
  quantity: string
  unitPrice: string
}

type QuotationForm = {
  quoteNumber: string
  customerId: string
  companyId: string
  date: string
  expiryDate: string
  currencyCode: string
  discountType: DiscountType
  discountValue: string
  taxRatePercent: string
  notes: string
  termsAndConditions: string
  items: ItemForm[]
}

const blankItem = (): ItemForm => ({
  description: '',
  quantity: '1',
  unitPrice: '0'
})

const blankForm = (): QuotationForm => ({
  quoteNumber: '',
  customerId: '',
  companyId: '',
  date: new Date().toISOString().slice(0, 10),
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  currencyCode: 'USD',
  discountType: 'Percentage',
  discountValue: '0',
  taxRatePercent: '0',
  notes: 'Thank you for your business. Quote is valid for 30 days.',
  termsAndConditions: 'Payment terms: 50% deposit upon acceptance, 50% upon delivery.',
  items: [blankItem()]
})

function money(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export default function EstimatesQuotations({
  entities,
  activeEntityId,
  notify
}: {
  entities: Entity[]
  activeEntityId: string
  notify: (msg: string) => void
}) {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [form, setForm] = useState<QuotationForm>(blankForm())

  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [qRes, cRes] = await Promise.all([
        fetch(`${api}/quotations`),
        fetch(`${api}/customers`)
      ])
      if (qRes.ok) setQuotations(await qRes.json())
      if (cRes.ok) setCustomers(await cRes.json())
    } catch {
      notify('Failed to load quotations from API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchesSearch =
        `${q.quoteNumber} ${q.customerName} ${q.notes || ''}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        q.items.some(i => i.description.toLowerCase().includes(search.toLowerCase()))

      const matchesCompany =
        companyFilter === 'all'
          ? true
          : companyFilter === 'unassigned'
          ? !q.companyId
          : q.companyId === companyFilter

      const matchesStatus = statusFilter === 'all' ? true : q.status === statusFilter

      return matchesSearch && matchesCompany && matchesStatus
    })
  }, [quotations, search, companyFilter, statusFilter])

  const stats = useMemo(() => {
    const total = quotations.length
    const sentCount = quotations.filter(q => q.status === 'Sent').length
    const acceptedCount = quotations.filter(q => q.status === 'Accepted' || q.status === 'Converted').length
    const totalValue = quotations.reduce((sum, q) => sum + (q.total || 0), 0)
    return { total, sentCount, acceptedCount, totalValue }
  }, [quotations])

  // Realtime Live Calculation for Modal Form
  const liveCalculation = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.unitPrice) || 0
      return sum + qty * price
    }, 0)

    const discountVal = Number(form.discountValue) || 0
    const discountAmount =
      form.discountType === 'Percentage'
        ? subtotal * (discountVal / 100)
        : Math.min(discountVal, subtotal)

    const taxableAmount = Math.max(0, subtotal - discountAmount)
    const taxRate = Number(form.taxRatePercent) || 0
    const taxAmount = taxableAmount * (taxRate / 100)
    const total = taxableAmount + taxAmount

    return { subtotal, discountAmount, taxableAmount, taxAmount, total }
  }, [form.items, form.discountType, form.discountValue, form.taxRatePercent])

  const openCreateModal = async () => {
    setEditingQuotation(null)
    const newForm = blankForm()
    if (activeEntityId) newForm.companyId = activeEntityId
    if (customers.length > 0) newForm.customerId = customers[0].id

    try {
      const res = await fetch(`${api}/quotations/next-number`)
      if (res.ok) {
        const data = await res.json()
        newForm.quoteNumber = data.quoteNumber
      }
    } catch {
      // fallback
    }
    setForm(newForm)
    setModalOpen(true)
  }

  const openEditModal = (q: Quotation) => {
    setEditingQuotation(q)
    setForm({
      quoteNumber: q.quoteNumber,
      customerId: q.customerId,
      companyId: q.companyId || '',
      date: q.date,
      expiryDate: q.expiryDate,
      currencyCode: q.currencyCode || 'USD',
      discountType: q.discountType || 'Percentage',
      discountValue: String(q.discountValue || 0),
      taxRatePercent: String(q.taxRatePercent || 0),
      notes: q.notes || '',
      termsAndConditions: q.termsAndConditions || '',
      items: q.items.map(i => ({
        description: i.description,
        quantity: String(i.quantity),
        unitPrice: String(i.unitPrice)
      }))
    })
    setModalOpen(true)
  }

  const handleItemChange = (index: number, key: keyof ItemForm, value: string) => {
    const updated = [...form.items]
    updated[index] = { ...updated[index], [key]: value }
    setForm({ ...form, items: updated })
  }

  const addItemRow = () => {
    setForm({ ...form, items: [...form.items, blankItem()] })
  }

  const removeItemRow = (index: number) => {
    if (form.items.length <= 1) return
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.customerId) {
      notify('Please select a customer.')
      return
    }

    const itemsPayload = form.items.map(i => ({
      description: i.description.trim(),
      quantity: Number(i.quantity) || 1,
      unitPrice: Number(i.unitPrice) || 0
    }))

    if (itemsPayload.some(i => !i.description || i.quantity <= 0 || i.unitPrice < 0)) {
      notify('Please ensure all items have a description, positive quantity, and valid unit price.')
      return
    }

    const payload = {
      quoteNumber: form.quoteNumber || null,
      customerId: form.customerId,
      companyId: form.companyId || null,
      date: form.date,
      expiryDate: form.expiryDate,
      currencyCode: form.currencyCode,
      items: itemsPayload,
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      taxRatePercent: Number(form.taxRatePercent) || 0,
      notes: form.notes.trim() || null,
      termsAndConditions: form.termsAndConditions.trim() || null
    }

    const url = editingQuotation ? `${api}/quotations/${editingQuotation.id}` : `${api}/quotations`
    const method = editingQuotation ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.json()
      notify(err.message || 'Error saving estimate.')
      return
    }

    notify(editingQuotation ? 'Quotation updated successfully.' : 'Quotation created successfully.')
    setModalOpen(false)
    loadData()
  }

  const handleStatusChange = async (q: Quotation, newStatus: QuotationStatus) => {
    const res = await fetch(`${api}/quotations/${q.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })

    if (!res.ok) {
      const err = await res.json()
      notify(err.message || 'Status update failed.')
      return
    }

    notify(`Quotation ${q.quoteNumber} status changed to ${newStatus}.`)
    loadData()
  }

  const handleDelete = async (q: Quotation) => {
    if (!window.confirm(`Are you sure you want to delete quote "${q.quoteNumber}"?`)) return

    const res = await fetch(`${api}/quotations/${q.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      notify(err.message || 'Could not delete quotation.')
      return
    }

    notify('Quotation deleted.')
    loadData()
  }

  const companyMap = useMemo(() => {
    const map = new Map<string, Entity>()
    entities.forEach(e => map.set(e.id, e))
    return map
  }, [entities])

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <section className="stats">
        <article>
          <span className="stat-icon blue">
            <FileText className="w-5 h-5" />
          </span>
          <div>
            <small>TOTAL ESTIMATES</small>
            <h2>{stats.total}</h2>
            <p>{stats.sentCount} sent to customers</p>
          </div>
        </article>

        <article>
          <span className="stat-icon teal">
            <CheckCircle className="w-5 h-5" />
          </span>
          <div>
            <small>ACCEPTED / CONVERTED</small>
            <h2>{stats.acceptedCount}</h2>
            <p>Quotes approved by client</p>
          </div>
        </article>

        <article>
          <span className="stat-icon violet">
            <DollarSign className="w-5 h-5" />
          </span>
          <div>
            <small>TOTAL QUOTED VALUE</small>
            <h2>{money(stats.totalValue)}</h2>
            <p>Combined quotation pipeline</p>
          </div>
        </article>
      </section>

      {/* Toolbar & Filters */}
      <div className="customer-toolbar">
        <div className="customer-search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by quote #, customer, item description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')} title="Clear">
              ×
            </button>
          )}
        </div>

        <div className="customer-filter-group">
          <select
            className="filter-select"
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
          >
            <option value="all">All Group Companies</option>
            <option value="unassigned">Unassigned (Global)</option>
            {entities.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} {e.code ? `(${e.code})` : ''}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Declined">Declined</option>
            <option value="Expired">Expired</option>
            <option value="Converted">Converted</option>
          </select>

          <button className="primary" onClick={openCreateModal}>
            ＋ New Estimate
          </button>
        </div>
      </div>

      {/* Quotations List Table */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Estimates & Quotations</CardTitle>
              <CardDescription>Manage sales quotes, tax calculations, and discount rules</CardDescription>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              Showing {filteredQuotations.length} quotes
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading quotations...</div>
          ) : filteredQuotations.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No estimates or quotations found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold border-b">
                  <tr>
                    <th className="py-3 px-4">Quote #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Date / Expiry</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">Tax</th>
                    <th className="py-3 px-4 text-right font-bold text-foreground">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredQuotations.map(q => {
                    const comp = q.companyId ? companyMap.get(q.companyId) : null
                    return (
                      <tr key={q.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-primary">{q.quoteNumber}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{q.customerName}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {comp ? comp.code || comp.name : 'Group'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <div>{q.date}</div>
                          <small className="text-[10px] text-muted-foreground">Valid to {q.expiryDate}</small>
                        </td>
                        <td className="py-3 px-4 text-right">{money(q.subtotal, q.currencyCode)}</td>
                        <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">
                          {q.discountAmount > 0 ? `-${money(q.discountAmount, q.currencyCode)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {q.taxAmount > 0 ? `+${money(q.taxAmount, q.currencyCode)} (${q.taxRatePercent}%)` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-foreground">
                          {money(q.total, q.currencyCode)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              q.status === 'Accepted' || q.status === 'Converted'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : q.status === 'Sent'
                                ? 'bg-blue-500/10 text-blue-600'
                                : q.status === 'Declined' || q.status === 'Expired'
                                ? 'bg-rose-500/10 text-rose-600'
                                : 'bg-slate-500/10 text-slate-600'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Preview Printable Quote"
                              onClick={() => setPreviewQuotation(q)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Quote"
                              onClick={() => openEditModal(q)}
                              disabled={q.status === 'Converted'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>

                            {q.status === 'Draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Mark as Sent"
                                onClick={() => handleStatusChange(q, 'Sent')}
                              >
                                <Send className="w-3.5 h-3.5 text-blue-600" />
                              </Button>
                            )}

                            {q.status === 'Sent' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Mark Accepted"
                                  onClick={() => handleStatusChange(q, 'Accepted')}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Mark Declined"
                                  onClick={() => handleStatusChange(q, 'Declined')}
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                </Button>
                              </>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete Quote"
                              onClick={() => handleDelete(q)}
                              className="text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal Form */}
      {modalOpen && (
        <div className="overlay">
          <form className="modal max-w-4xl max-h-[90vh] overflow-y-auto" onSubmit={handleSave}>
            <div className="modal-head sticky top-0 bg-background z-10 pb-4 border-b">
              <div>
                <p className="eyebrow">SALES & CUSTOMERS</p>
                <h2>{editingQuotation ? 'Edit Estimate / Quotation' : 'Create New Estimate'}</h2>
              </div>
              <button type="button" className="close" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="space-y-6 pt-4">
              {/* Form Header Info */}
              <div className="form-grid">
                <label>
                  Customer *
                  <select
                    required
                    value={form.customerId}
                    onChange={e => setForm({ ...form, customerId: e.target.value })}
                  >
                    <option value="">Select customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerNumber})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Quote Number
                  <input
                    placeholder="EST-0001"
                    value={form.quoteNumber}
                    onChange={e => setForm({ ...form, quoteNumber: e.target.value })}
                  />
                </label>

                <label>
                  Group Entity
                  <select value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}>
                    <option value="">All / Global Quote</option>
                    {entities.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} {e.code ? `(${e.code})` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Currency
                  <select value={form.currencyCode} onChange={e => setForm({ ...form, currencyCode: e.target.value })}>
                    {['USD', 'PKR', 'EUR', 'GBP', 'AED', 'SAR', 'CAD'].map(curr => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Quote Date
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </label>

                <label>
                  Valid Until (Expiry)
                  <input
                    type="date"
                    required
                    value={form.expiryDate}
                    onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                  />
                </label>
              </div>

              {/* Dynamic Line Items Editor */}
              <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Line Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-muted-foreground px-2">
                    <div className="col-span-6">Description / Item</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-3 text-right">Unit Price</div>
                    <div className="col-span-1 text-center"></div>
                  </div>

                  {form.items.map((item, idx) => {
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <input
                            required
                            className="w-full text-xs"
                            placeholder="e.g. Consulting services or Product item"
                            value={item.description}
                            onChange={e => handleItemChange(idx, 'description', e.target.value)}
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            required
                            className="w-full text-xs text-right"
                            placeholder="1"
                            value={item.quantity}
                            onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                          />
                        </div>

                        <div className="col-span-3 flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            required
                            className="w-full text-xs text-right"
                            placeholder="0.00"
                            value={item.unitPrice}
                            onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                          />
                        </div>

                        <div className="col-span-1 text-center">
                          {form.items.length > 1 && (
                            <button
                              type="button"
                              className="remove"
                              onClick={() => removeItemRow(idx)}
                              title="Remove item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Discount, Tax Rules & Calculations Section */}
              <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4 border rounded-xl p-4 bg-muted/10">
                  <h3 className="text-sm font-bold text-foreground">Discount & Tax Options</h3>

                  {/* Discount Type & Value */}
                  <div>
                    <label className="text-xs font-semibold mb-1">Discount Type</label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={form.discountType === 'Percentage' ? 'default' : 'outline'}
                        size="sm"
                        className={form.discountType === 'Percentage' ? 'primary' : ''}
                        onClick={() => setForm({ ...form, discountType: 'Percentage' })}
                      >
                        <Percent className="w-3.5 h-3.5 mr-1" /> Percentage (%)
                      </Button>
                      <Button
                        type="button"
                        variant={form.discountType === 'FixedAmount' ? 'default' : 'outline'}
                        size="sm"
                        className={form.discountType === 'FixedAmount' ? 'primary' : ''}
                        onClick={() => setForm({ ...form, discountType: 'FixedAmount' })}
                      >
                        <DollarSign className="w-3.5 h-3.5 mr-1" /> Fixed Amount ($)
                      </Button>
                    </div>
                  </div>

                  <label>
                    Discount Value ({form.discountType === 'Percentage' ? '%' : form.currencyCode})
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.discountValue}
                      onChange={e => setForm({ ...form, discountValue: e.target.value })}
                    />
                  </label>

                  <label>
                    Tax Rate (%)
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 15 for 15% Tax"
                      value={form.taxRatePercent}
                      onChange={e => setForm({ ...form, taxRatePercent: e.target.value })}
                    />
                  </label>
                </div>

                {/* Calculation Summary Box */}
                <div className="border rounded-xl p-4 bg-slate-900 text-slate-100 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Quote Financial Calculation
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subtotal:</span>
                      <span className="font-semibold">{money(liveCalculation.subtotal, form.currencyCode)}</span>
                    </div>

                    <div className="flex justify-between text-rose-400">
                      <span>
                        Discount (
                        {form.discountType === 'Percentage'
                          ? `${form.discountValue || 0}%`
                          : money(Number(form.discountValue) || 0, form.currencyCode)}
                        ):
                      </span>
                      <span>-{money(liveCalculation.discountAmount, form.currencyCode)}</span>
                    </div>

                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                      <span>Taxable Net Amount:</span>
                      <span>{money(liveCalculation.taxableAmount, form.currencyCode)}</span>
                    </div>

                    <div className="flex justify-between text-emerald-400">
                      <span>Tax ({form.taxRatePercent || 0}%):</span>
                      <span>+{money(liveCalculation.taxAmount, form.currencyCode)}</span>
                    </div>

                    <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-700">
                      <span>Grand Total:</span>
                      <span className="text-emerald-400">{money(liveCalculation.total, form.currencyCode)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="form-grid">
                <label>
                  Notes for Customer
                  <textarea
                    rows={3}
                    className="w-full text-xs p-2 border rounded-md"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </label>

                <label>
                  Terms & Conditions
                  <textarea
                    rows={3}
                    className="w-full text-xs p-2 border rounded-md"
                    value={form.termsAndConditions}
                    onChange={e => setForm({ ...form, termsAndConditions: e.target.value })}
                  />
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                {editingQuotation ? 'Save Changes' : 'Create Quotation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Document View / Printable Quotation Modal */}
      {previewQuotation && (
        <div className="overlay">
          <div className="modal max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="modal-head border-b pb-3">
              <div>
                <p className="eyebrow">ESTIMATE / QUOTATION PREVIEW</p>
                <h2>{previewQuotation.quoteNumber}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print
                </Button>
                <button type="button" className="close" onClick={() => setPreviewQuotation(null)}>
                  ×
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-6 space-y-6 bg-white text-slate-800 rounded-lg">
              {/* Header Info */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">ESTIMATE / QUOTATION</h1>
                  <p className="text-xs text-slate-500 font-mono mt-1">Ref: {previewQuotation.quoteNumber}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>
                    <strong>Date:</strong> {previewQuotation.date}
                  </p>
                  <p>
                    <strong>Valid Until:</strong> {previewQuotation.expiryDate}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Prepared For:</span>
                <p className="font-bold text-sm text-slate-900">{previewQuotation.customerName}</p>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewQuotation.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-medium">{item.description}</td>
                      <td className="py-2.5 px-3 text-right">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right">
                        {money(item.unitPrice, previewQuotation.currencyCode)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold">
                        {money(item.quantity * item.unitPrice, previewQuotation.currencyCode)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculation Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-medium">{money(previewQuotation.subtotal, previewQuotation.currencyCode)}</span>
                  </div>

                  {previewQuotation.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>
                        Discount (
                        {previewQuotation.discountType === 'Percentage'
                          ? `${previewQuotation.discountValue}%`
                          : money(previewQuotation.discountValue, previewQuotation.currencyCode)}
                        ):
                      </span>
                      <span>-{money(previewQuotation.discountAmount, previewQuotation.currencyCode)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 pt-1 border-t">
                    <span>Taxable Amount:</span>
                    <span>{money(previewQuotation.taxableAmount, previewQuotation.currencyCode)}</span>
                  </div>

                  {previewQuotation.taxAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Tax ({previewQuotation.taxRatePercent}%):</span>
                      <span>+{money(previewQuotation.taxAmount, previewQuotation.currencyCode)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                    <span>Total Amount:</span>
                    <span className="text-emerald-600">
                      {money(previewQuotation.total, previewQuotation.currencyCode)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              {(previewQuotation.notes || previewQuotation.termsAndConditions) && (
                <div className="pt-4 border-t text-xs space-y-3 text-slate-600">
                  {previewQuotation.notes && (
                    <div>
                      <strong className="block text-slate-800">Notes:</strong>
                      <p>{previewQuotation.notes}</p>
                    </div>
                  )}
                  {previewQuotation.termsAndConditions && (
                    <div>
                      <strong className="block text-slate-800">Terms & Conditions:</strong>
                      <p>{previewQuotation.termsAndConditions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setPreviewQuotation(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
