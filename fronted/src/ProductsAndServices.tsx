import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Wrench, Search, Plus, Pencil, Trash2, Package, Tag, Archive } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const api = 'http://localhost:5124/api/v1'

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
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

type Account = {
  id: string
  code: string
  name: string
  type: string
}

type TaxRate = {
  percentage: number;
}
type TaxCode = {
  id: string;
  code: string;
  name: string;
  taxAuthorityId?: string;
  rates: TaxRate[];
}

type ProductForm = {
  code: string
  name: string
  description: string
  type: ProductType
  category: string
  unit: string
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
  category: '',
  unit: 'Each',
  unitPrice: '0.00',
  costPrice: '0.00',
  taxCodeId: '',
  incomeAccountId: '',
  expenseAccountId: '',
  assetAccountId: ''
})

function money(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function ProductsAndServices({ notify, activeEntityId, entities }: { notify: (msg: string) => void, activeEntityId: string, entities: any[] }) {
  const [products, setProducts] = useState<Product[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(blankForm())

  const loadData = async () => {
    try {
      setLoading(true)
      const [prodRes, accRes, taxRes] = await Promise.all([
        fetch(`${api}/products`),
        fetch(`${api}/accounts`),
        fetch(`${api}/taxes/codes`)
      ])
      
      if (prodRes.ok) setProducts(await prodRes.json())
      if (accRes.ok) setAccounts(await accRes.json())
      if (taxRes.ok) setTaxCodes(await taxRes.json())
    } catch {
      notify('Failed to load data from API.')
    } finally {
      setLoading(false)
    }
  }

  const defaultTaxAuthorityId = useMemo(() => {
    return entities?.find((e: any) => e.id === activeEntityId)?.taxAuthorityId || '';
  }, [entities, activeEntityId]);

  const groupedTaxCodes = useMemo(() => {
    return {
      default: taxCodes.filter(t => t.taxAuthorityId === defaultTaxAuthorityId),
      other: taxCodes.filter(t => t.taxAuthorityId !== defaultTaxAuthorityId)
    };
  }, [taxCodes, defaultTaxAuthorityId]);

  useEffect(() => {
    loadData()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = `${p.code} ${p.name} ${p.category || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || p.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [products, search, typeFilter])

  const stats = useMemo(() => {
    const total = products.length
    const physical = products.filter(p => p.type === 'Physical').length
    const services = products.filter(p => p.type === 'Service').length
    return { total, physical, services }
  }, [products])

  const openCreateModal = async () => {
    setEditingProduct(null)
    const newForm = blankForm()
    try {
      const res = await fetch(`${api}/products/next-code`)
      if (res.ok) {
        const data = await res.json()
        newForm.code = data.code
      }
    } catch {
      // fallback
    }
    setForm(newForm)
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
      unitPrice: String(p.unitPrice || 0),
      costPrice: String(p.costPrice || 0),
      taxCodeId: p.taxCodeId || '',
      incomeAccountId: p.incomeAccountId || '',
      expenseAccountId: p.expenseAccountId || '',
      assetAccountId: p.assetAccountId || ''
    })
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

    const url = editingProduct ? `${api}/products/${editingProduct.id}` : `${api}/products`
    const method = editingProduct ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.json()
      notify(err.message || 'Error saving product.')
      return
    }

    notify(editingProduct ? 'Product updated successfully.' : 'Product created successfully.')
    setModalOpen(false)
    loadData()
  }

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${p.name}"?`)) return
    const res = await fetch(`${api}/products/${p.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      notify(err.message || 'Could not delete product.')
      return
    }
    notify('Product deleted.')
    loadData()
  }

  const getAccountName = (id?: string) => {
    if (!id) return 'Not mapped'
    const acc = accounts.find(a => a.id === id)
    return acc ? `${acc.code} ${acc.name}` : 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <section className="stats">
        <article>
          <span className="stat-icon blue"><Package className="w-5 h-5" /></span>
          <div>
            <small>TOTAL ITEMS</small>
            <h2>{stats.total}</h2>
            <p>Active items in catalog</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal"><Archive className="w-5 h-5" /></span>
          <div>
            <small>PHYSICAL GOODS</small>
            <h2>{stats.physical}</h2>
            <p>Inventory tracked</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet"><Wrench className="w-5 h-5" /></span>
          <div>
            <small>SERVICES</small>
            <h2>{stats.services}</h2>
            <p>Non-inventory billables</p>
          </div>
        </article>
      </section>

      {/* Toolbar */}
      <div className="customer-toolbar">
        <div className="customer-search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, code, or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="customer-filter-group">
          <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="Physical">Physical Goods</option>
            <option value="Service">Services</option>
            <option value="NonInventory">Non-Inventory</option>
            <option value="Bundle">Bundles / Kits</option>
          </select>

          <button className="primary flex items-center gap-2" onClick={openCreateModal}>
            <Plus className="w-4 h-4" /> New Item
          </button>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Loading items...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl bg-card">
            No products or services found.
          </div>
        ) : (
          filteredProducts.map(p => (
            <Card key={p.id} className="relative flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                      {p.code} • {p.type}
                    </span>
                    <CardTitle className="mt-1 text-base font-bold text-foreground">{p.name}</CardTitle>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                    {p.status}
                  </span>
                </div>
                {p.category && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Tag className="w-3.5 h-3.5" /> {p.category}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-3 text-xs pb-4">
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <div>
                    <small className="text-muted-foreground block text-[10px] uppercase font-bold">Sales Price</small>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{money(p.unitPrice)}</span>
                  </div>
                  <div>
                    <small className="text-muted-foreground block text-[10px] uppercase font-bold">Cost</small>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">{money(p.costPrice)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <small className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">GAAP GL Mappings</small>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Income:</span>
                    <span className="font-medium text-foreground">{getAccountName(p.incomeAccountId)}</span>
                  </div>
                  {p.type !== 'Service' && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>COGS:</span>
                      <span className="font-medium text-foreground">{getAccountName(p.expenseAccountId)}</span>
                    </div>
                  )}
                  {p.type === 'Physical' && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Inventory:</span>
                      <span className="font-medium text-foreground">{getAccountName(p.assetAccountId)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Default Tax Code:</span>
                    <span className="font-medium text-foreground">
                      {taxCodes.find(t => t.id === p.taxCodeId)?.code || 'None'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex gap-1 justify-end">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(p)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleSave}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">PRODUCTS & SERVICES</p>
                <h2>{editingProduct ? 'Edit Item' : 'Create New Item'}</h2>
              </div>
              <button type="button" className="close" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">
              <label>
                Item Type *
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ProductType })}>
                  <option value="Physical">Physical Good (Inventory)</option>
                  <option value="Service">Service (Labor, Consulting)</option>
                  <option value="NonInventory">Non-Inventory (Materials)</option>
                  <option value="Bundle">Bundle / Kit</option>
                </select>
              </label>

              <label>
                Item Code
                <input placeholder="Auto-generated if blank" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                Item Name *
                <input required placeholder="e.g. Senior Consulting Hour" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                Description
                <input placeholder="Internal description or sales notes" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </label>

              <label>
                Category
                <input placeholder="e.g. Professional Services" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </label>

              <label>
                Unit of Measure
                <input placeholder="Each, Hour, Kg" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
              </label>

              <label>
                Sales Price
                <input type="number" step="0.01" min="0" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
              </label>

              <label>
                Cost Price
                <input type="number" step="0.01" min="0" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} />
              </label>
              
              <label>
                Default Tax Code
                <select value={form.taxCodeId} onChange={e => setForm({ ...form, taxCodeId: e.target.value })}>
                  <option value="">None (0%)</option>
                  {groupedTaxCodes.default.length > 0 && (
                    <optgroup label="Default Tax Authority">
                      {groupedTaxCodes.default.map(t => (
                        <option key={t.id} value={t.id}>{t.code} ({t.rates.length > 0 ? t.rates[t.rates.length - 1].percentage : 0}%)</option>
                      ))}
                    </optgroup>
                  )}
                  {groupedTaxCodes.other.length > 0 && (
                    <optgroup label="Other Tax Authorities">
                      {groupedTaxCodes.other.map(t => (
                        <option key={t.id} value={t.id}>{t.code} ({t.rates.length > 0 ? t.rates[t.rates.length - 1].percentage : 0}%)</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>

              {/* GAAP Mappings */}
              <div style={{ gridColumn: '1 / -1', marginTop: '10px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
                <p className="eyebrow" style={{ color: '#16a34a' }}>GAAP ACCOUNTING MAPPINGS</p>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>
                  Select the General Ledger accounts this item will hit when bought or sold.
                </p>
                <div className="form-grid">
                  <label>
                    Income Account (Revenue) *
                    <select required value={form.incomeAccountId} onChange={e => setForm({ ...form, incomeAccountId: e.target.value })}>
                      <option value="">Select an account...</option>
                      {accounts.filter(a => a.type === 'Revenue').map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                  </label>

                  {form.type !== 'Service' && (
                    <label>
                      COGS / Expense Account
                      <select value={form.expenseAccountId} onChange={e => setForm({ ...form, expenseAccountId: e.target.value })}>
                        <option value="">Select an account...</option>
                        {accounts.filter(a => a.type === 'Expense').map(a => (
                          <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                        ))}
                      </select>
                    </label>
                  )}

                  {form.type === 'Physical' && (
                    <label>
                      Inventory Asset Account
                      <select value={form.assetAccountId} onChange={e => setForm({ ...form, assetAccountId: e.target.value })}>
                        <option value="">Select an account...</option>
                        {accounts.filter(a => a.type === 'Asset').map(a => (
                          <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="primary">{editingProduct ? 'Save Changes' : 'Create Item'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
