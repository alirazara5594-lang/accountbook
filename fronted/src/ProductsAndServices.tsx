import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Wrench, Pencil, Trash2, Package, Tag, Archive,
  Receipt, Check, X, Hash, Layers,
  ShieldCheck, ArrowRight, ArrowLeft, Coins
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataToolbar } from '@/components/ui/data-toolbar'

import { useProductsStore, useCoaStore, useTaxStore } from './stores'
import { useFormDraft } from './hooks/useFormDraft'
import { money } from './lib/currency'

export type ProductType = 'Physical' | 'Service' | 'NonInventory' | 'Bundle'
export type ProductStatus = 'Active' | 'Inactive' | 'Discontinued'

export type Product = {
  id: string
  code: string
  name: string
  description?: string
  type: ProductType
  category?: string
  unit: string
  unitPrice: number
  costPrice: number
  taxCodeId?: string
  incomeAccountId?: string
  expenseAccountId?: string
  assetAccountId?: string
  status: 'Active' | 'Inactive'
  createdAt: string
  updatedAt: string
}

type Account = {
  id: string
  code: string
  name: string
  type: string
}

type TaxCode = {
  id: string
  code: string
  name: string
  rate: number
  rates?: { percentage: number }[]
  taxAuthorityId?: string
}

type ProductForm = {
  code: string
  name: string
  description: string
  type: ProductType
  category: string
  unit: string
  currencyCode: string
  unitPrice: string
  costPrice: string
  taxCodeId: string
  incomeAccountId: string
  expenseAccountId: string
  assetAccountId: string
}

const blankForm = (): ProductForm => ({
  code: '',
  name: '',
  description: '',
  type: 'Physical',
  category: 'General',
  unit: 'Each',
  currencyCode: 'PKR',
  unitPrice: '0',
  costPrice: '0',
  taxCodeId: '',
  incomeAccountId: '',
  expenseAccountId: '',
  assetAccountId: ''
})

export default function ProductsAndServices({
  entities = [],
  activeEntityId,
  notify
}: {
  entities?: any[]
  activeEntityId?: string
  notify: (msg: string) => void
}) {
  const products = useProductsStore((s: any) => s.products as Product[])
  const loading = useProductsStore((s: any) => s.loading)
  const fetchProducts = useProductsStore((s: any) => s.fetchProducts)
  const fetchNextCode = useProductsStore((s: any) => s.fetchNextCode)
  const saveProductStore = useProductsStore((s: any) => s.saveProduct)
  const deleteProductStore = useProductsStore((s: any) => s.deleteProduct)

  const accounts = useCoaStore((s: any) => s.accounts as Account[])
  const fetchAccounts = useCoaStore((s: any) => s.fetchAccounts)

  const taxCodes = useTaxStore((s: any) => s.taxCodes as TaxCode[])
  const fetchTaxCodes = useTaxStore((s: any) => s.fetchTaxCodes)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'info' | 'pricing' | 'accounting' | 'tax'>('info')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(blankForm())
  const { saveDraft, clearDraft } = useFormDraft('product', form, setForm, modalOpen)

  useEffect(() => {
    fetchProducts()
    fetchAccounts()
    fetchTaxCodes()
  }, [])

  const defaultTaxAuthorityId = useMemo(() => {
    return entities?.find((e: any) => e.id === activeEntityId)?.taxAuthorityId || ''
  }, [entities, activeEntityId])

  const groupedTaxCodes = useMemo(() => {
    return {
      default: taxCodes.filter((t: any) => t.taxAuthorityId === defaultTaxAuthorityId),
      other: taxCodes.filter((t: any) => t.taxAuthorityId !== defaultTaxAuthorityId)
    }
  }, [taxCodes, defaultTaxAuthorityId])

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchesSearch = `${p.code} ${p.name} ${p.category || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || p.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [products, search, typeFilter])

  const exportHeaders = ['Code', 'Name', 'Description', 'Type', 'Category', 'Unit', 'Unit Price', 'Cost Price', 'Status']
  const exportRows = filteredProducts.map((p: any) => [
    p.code, p.name, p.description || '', p.type, p.category || '', p.unit, p.unitPrice, p.costPrice, p.status,
  ])

  const stats = useMemo(() => {
    const total = products.length
    const physical = products.filter((p: any) => p.type === 'Physical').length
    const services = products.filter((p: any) => p.type === 'Service').length
    const nonInv = products.filter((p: any) => p.type === 'NonInventory' || p.type === 'Bundle').length
    return { total, physical, services, nonInv }
  }, [products])

  const openCreateModal = async () => {
    setEditingProduct(null)
    const newForm = blankForm()
    const code = await fetchNextCode()
    if (code) newForm.code = code

    try {
      const saved = localStorage.getItem('draft_product')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.currencyCode === 'USD' || !parsed.currencyCode) parsed.currencyCode = 'PKR'
        localStorage.setItem('draft_product', JSON.stringify(parsed))
      }
    } catch {}

    setForm(newForm)
    setModalTab('info')
    setModalOpen(true)
  }

  const openEditModal = (p: Product) => {
    setEditingProduct(p)
    setForm({
      code: p.code,
      name: p.name,
      description: p.description || '',
      type: p.type,
      category: p.category || '',
      unit: p.unit || 'Each',
      currencyCode: 'PKR',
      unitPrice: String(p.unitPrice || 0),
      costPrice: String(p.costPrice || 0),
      taxCodeId: p.taxCodeId || '',
      incomeAccountId: p.incomeAccountId || '',
      expenseAccountId: p.expenseAccountId || '',
      assetAccountId: p.assetAccountId || ''
    })
    setModalTab('info')
    setModalOpen(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      notify('Product name is required.')
      return
    }

    const payload = {
      code: form.code || null,
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: form.type,
      category: form.category.trim() || null,
      unit: form.unit.trim() || 'Each',
      unitPrice: Number(form.unitPrice) || 0,
      costPrice: Number(form.costPrice) || 0,
      taxCodeId: form.taxCodeId || null,
      incomeAccountId: form.incomeAccountId || null,
      expenseAccountId: form.expenseAccountId || null,
      assetAccountId: form.assetAccountId || null
    }

    try {
      await saveProductStore(payload, editingProduct ? editingProduct.id : undefined)
      clearDraft()
      notify(editingProduct ? 'Product updated successfully.' : 'Product created successfully.')
      setModalOpen(false)
    } catch (err: any) {
      notify(err.message || 'Error saving product.')
    }
  }

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${p.name}"?`)) return
    try {
      await deleteProductStore(p.id)
      notify('Product deleted.')
    } catch (err: any) {
      notify(err.message || 'Could not delete product.')
    }
  }

  const getAccountName = (id?: string) => {
    if (!id) return 'Not mapped'
    const acc = accounts.find((a: any) => a.id === id)
    return acc ? `${acc.code} ${acc.name}` : 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Submodule Heading Banner (Row 1) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight flex items-center gap-2">
            <span className="text-lg">📦</span> Products & Services Catalog
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">Manage physical inventory goods, billable services, kits, and GAAP GL mappings.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <DataToolbar
            query={search}
            setQuery={setSearch}
            searchPlaceholder="Search item name, SKU..."
            exportFileName="products-and-services"
            exportSheetName="Products & Services"
            exportTitle="Product & Service Catalog"
            exportSubtitle={`Master catalog (${filteredProducts.length} items).`}
            exportHeaders={exportHeaders}
            exportRows={exportRows}
          >
            <select
              className="h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors shadow-2xs box-border"
              style={{ paddingTop: 0, paddingBottom: 0 }}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">⚡ All Item Types</option>
              <option value="Physical">📦 Physical Goods</option>
              <option value="Service">🛠️ Services</option>
              <option value="NonInventory">📑 Non-Inventory Supplies</option>
              <option value="Bundle">🎁 Bundles / Kits</option>
            </select>
          </DataToolbar>
          <button onClick={openCreateModal} className="primary h-9 px-4 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center justify-center gap-1.5 shadow-sm">
            <span>＋</span> Add Item
          </button>
        </div>
      </div>

      {/* Stats Cards (Row 2) */}
      <section className="stats">
        <article>
          <span className="stat-icon blue"><Package className="w-4 h-4" /></span>
          <div>
            <small>TOTAL CATALOG ITEMS</small>
            <h2>{stats.total}</h2>
            <p>Active products & services</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal"><Archive className="w-4 h-4" /></span>
          <div>
            <small>PHYSICAL GOODS</small>
            <h2>{stats.physical}</h2>
            <p>Inventory tracked in warehouse</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet"><Wrench className="w-4 h-4" /></span>
          <div>
            <small>BILLABLE SERVICES</small>
            <h2>{stats.services}</h2>
            <p>Non-inventory consulting & labor</p>
          </div>
        </article>
      </section>

      {/* Products & Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-[var(--color-text-muted)]">Loading catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)]">
            No products or services found matching your criteria.
          </div>
        ) : (
          filteredProducts.map(p => (
            <Card key={p.id} className="relative flex flex-col justify-between border-[var(--color-border)] bg-[var(--color-surface)] hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] uppercase tracking-wider font-mono">
                      {p.code} • {p.type}
                    </span>
                    <CardTitle className="mt-1 text-sm font-bold text-[var(--color-text-strong)]">{p.name}</CardTitle>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                    p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  }`}>
                    {p.status}
                  </span>
                </div>
                {p.category && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--color-text-muted)]">
                    <Tag className="w-3 h-3" /> {p.category}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-3 text-xs pb-4">
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-[var(--color-surface-muted)]/60 rounded-xl border border-[var(--color-border)]">
                  <div>
                    <small className="text-[var(--color-text-muted)] block text-[10px] uppercase font-bold">Sales Price</small>
                    <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">{money(p.unitPrice)}</span>
                  </div>
                  <div>
                    <small className="text-[var(--color-text-muted)] block text-[10px] uppercase font-bold">Cost Price</small>
                    <span className="font-semibold font-mono text-rose-600 dark:text-rose-400">{money(p.costPrice)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <small className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">GAAP GL Mappings</small>
                  <div className="flex justify-between text-[var(--color-text-muted)]">
                    <span>Revenue:</span>
                    <span className="font-medium text-[var(--color-text-strong)]">{getAccountName(p.incomeAccountId)}</span>
                  </div>
                  {p.type !== 'Service' && (
                    <div className="flex justify-between text-[var(--color-text-muted)]">
                      <span>COGS:</span>
                      <span className="font-medium text-[var(--color-text-strong)]">{getAccountName(p.expenseAccountId)}</span>
                    </div>
                  )}
                  {p.type === 'Physical' && (
                    <div className="flex justify-between text-[var(--color-text-muted)]">
                      <span>Inventory:</span>
                      <span className="font-medium text-[var(--color-text-strong)]">{getAccountName(p.assetAccountId)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[var(--color-text-muted)]">
                    <span>Default Tax Code:</span>
                    <span className="font-medium text-[var(--color-text-strong)]">
                      {taxCodes.find((t: any) => t.id === p.taxCodeId)?.code || 'Standard VAT'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-1 justify-end">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(p)} className="h-7.5 px-2.5 text-xs">
                    <Pencil className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} className="h-7.5 w-7.5 p-0 text-rose-600 hover:text-rose-700">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Professional Product / Service Modal */}
      {modalOpen && (
        <div className="overlay animate-in fade-in duration-200">
          <form
            className="w-full max-w-4xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onSubmit={handleSave}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight">
                      {editingProduct ? 'Edit Catalog Item' : 'Create Product / Service Item'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {form.type}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Configure sales price, cost price, GAAP general ledger mappings, and tax codes.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-surface-muted)] transition-colors"
                onClick={() => setModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <button
                type="button"
                onClick={() => setModalTab('info')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'info'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Package className="w-3.5 h-3.5" /> Item Info & Type
              </button>

              <button
                type="button"
                onClick={() => setModalTab('pricing')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'pricing'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Coins className="w-3.5 h-3.5" /> Pricing & Costing
              </button>

              <button
                type="button"
                onClick={() => setModalTab('accounting')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'accounting'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> GAAP GL Accounts
              </button>

              <button
                type="button"
                onClick={() => setModalTab('tax')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'tax'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" /> Tax & Classification
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
              {modalTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      <span className="text-rose-500 font-bold mr-1">*</span> Item Type
                    </label>
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value as ProductType })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs cursor-pointer"
                    >
                      <option value="Physical">📦 Physical Good (Inventory Tracked)</option>
                      <option value="Service">🛠️ Service (Consulting, Labor, Hours)</option>
                      <option value="NonInventory">📑 Non-Inventory (Consumables, Office)</option>
                      <option value="Bundle">🎁 Bundle / Kit (Composite Items)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Item SKU / Code
                    </label>
                    <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-[var(--color-primary)] transition-colors shadow-2xs">
                      <Hash className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                      <input
                        placeholder="Auto-generated if blank"
                        value={form.code}
                        onChange={e => setForm({ ...form, code: e.target.value })}
                        className="w-full h-full border-0 outline-none bg-transparent font-mono text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                        style={{ border: 0, outline: 'none', padding: 0, background: 'transparent' }}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      <span className="text-rose-500 font-bold mr-1">*</span> Item Name
                    </label>
                    <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-[var(--color-primary)] transition-colors shadow-2xs">
                      <Package className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                      <input
                        required
                        placeholder="e.g. Enterprise Accounting Consultation"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full h-full border-0 outline-none bg-transparent text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                        style={{ border: 0, outline: 'none', padding: 0, background: 'transparent' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Category
                    </label>
                    <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-[var(--color-primary)] transition-colors shadow-2xs">
                      <Tag className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                      <input
                        placeholder="e.g. Professional Services"
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="w-full h-full border-0 outline-none bg-transparent text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                        style={{ border: 0, outline: 'none', padding: 0, background: 'transparent' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Unit of Measure
                    </label>
                    <input
                      placeholder="Each, Hour, Kg, Meter, Box"
                      value={form.unit}
                      onChange={e => setForm({ ...form, unit: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Description / Sales Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Internal descriptions, product specifications, or invoice line details..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] outline-none shadow-2xs resize-none"
                    />
                  </div>
                </div>
              )}

              {modalTab === 'pricing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Unit Sales Price
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
                        value={form.unitPrice}
                        onChange={e => setForm({ ...form, unitPrice: e.target.value })}
                        className="w-full h-full border-0 outline-none bg-transparent font-mono text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                        style={{ border: 0, outline: 'none', padding: 0, background: 'transparent' }}
                      />
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                      Default unit selling rate billed on customer invoices.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Unit Cost / Purchase Price
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
                        value={form.costPrice}
                        onChange={e => setForm({ ...form, costPrice: e.target.value })}
                        className="w-full h-full border-0 outline-none bg-transparent font-mono text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                        style={{ border: 0, outline: 'none', padding: 0, background: 'transparent' }}
                      />
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                      Estimated purchase or standard landed cost per unit.
                    </p>
                  </div>
                </div>
              )}

              {modalTab === 'accounting' && (
                <div className="space-y-5">
                  <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>GAAP Double-Entry compliance: Transactions using this item automatically post to these mapped ledger lines.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                        <span className="text-rose-500 font-bold mr-1">*</span> Income Account (Revenue)
                      </label>
                      <select
                        required
                        value={form.incomeAccountId}
                        onChange={e => setForm({ ...form, incomeAccountId: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                      >
                        <option value="">Select Revenue Account...</option>
                        {accounts.filter((a: any) => a.type === 'Revenue').map((a: any) => (
                          <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                        ))}
                      </select>
                    </div>

                    {form.type !== 'Service' && (
                      <div>
                        <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                          COGS / Expense Account
                        </label>
                        <select
                          value={form.expenseAccountId}
                          onChange={e => setForm({ ...form, expenseAccountId: e.target.value })}
                          className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                        >
                          <option value="">Select Expense / COGS Account...</option>
                          {accounts.filter((a: any) => a.type === 'Expense').map((a: any) => (
                            <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {form.type === 'Physical' && (
                      <div>
                        <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                          Inventory Asset Account
                        </label>
                        <select
                          value={form.assetAccountId}
                          onChange={e => setForm({ ...form, assetAccountId: e.target.value })}
                          className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                        >
                          <option value="">Select Inventory Asset Account...</option>
                          {accounts.filter((a: any) => a.type === 'Asset').map((a: any) => (
                            <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {modalTab === 'tax' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--color-text-strong)] mb-1.5">
                      Default Sales Tax / VAT Code
                    </label>
                    <select
                      value={form.taxCodeId}
                      onChange={e => setForm({ ...form, taxCodeId: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none shadow-2xs"
                    >
                      <option value="">Standard VAT / FBR Sales Tax (Default)</option>
                      {groupedTaxCodes.default.length > 0 && (
                        <optgroup label="Active Workspace Authority">
                          {groupedTaxCodes.default.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.code} ({t.rates && t.rates.length > 0 ? t.rates[t.rates.length - 1].percentage : 0}%)</option>
                          ))}
                        </optgroup>
                      )}
                      {groupedTaxCodes.other.length > 0 && (
                        <optgroup label="Other Regional Tax Codes">
                          {groupedTaxCodes.other.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.code} ({t.rates && t.rates.length > 0 ? t.rates[t.rates.length - 1].percentage : 0}%)</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                      Automatically calculated when added to customer invoices or sales orders.
                    </p>
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
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-8.5 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors"
                  onClick={(e) => { e.preventDefault(); saveDraft(); notify('Item draft saved locally.'); }}
                >
                  Save Draft
                </button>

                {modalTab !== 'info' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (modalTab === 'tax') setModalTab('accounting')
                      else if (modalTab === 'accounting') setModalTab('pricing')
                      else if (modalTab === 'pricing') setModalTab('info')
                    }}
                    className="h-8.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                {modalTab !== 'tax' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (modalTab === 'info') {
                        if (!form.name.trim()) {
                          notify('Item name is required.')
                          return
                        }
                        setModalTab('pricing')
                      } else if (modalTab === 'pricing') {
                        setModalTab('accounting')
                      } else if (modalTab === 'accounting') {
                        setModalTab('tax')
                      }
                    }}
                    className="primary h-8.5 px-4 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <span>Next: {modalTab === 'info' ? 'Pricing & Costing' : modalTab === 'pricing' ? 'GAAP GL Accounts' : 'Tax & Classification'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="primary h-8.5 px-4.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingProduct ? 'Save Changes' : 'Create Item'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
