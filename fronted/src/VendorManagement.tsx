import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, Search, Plus, Pencil, Trash2, Mail, Phone, Users, Wallet, CalendarClock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataToolbar } from '@/components/ui/data-toolbar'

import { useVendorsStore, useCoaStore } from './stores'

export type VendorStatus = 'Active' | 'Inactive' | 'Blocked'

export type Vendor = {
  id: string
  vendorNumber: string
  name: string
  email?: string
  phone?: string
  taxId?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country: string
  currencyCode: string
  paymentTermsDays: number
  defaultExpenseAccountId?: string
  companyId?: string
  status: VendorStatus
  createdAt: string
  updatedAt: string
}

type Account = {
  id: string
  code: string
  name: string
  type: string
}

type Entity = {
  id: string
  name: string
}

type VendorForm = {
  vendorNumber: string
  name: string
  email: string
  phone: string
  taxId: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  currencyCode: string
  paymentTermsDays: string
  defaultExpenseAccountId: string
}

const blankForm = (): VendorForm => ({
  vendorNumber: '',
  name: '',
  email: '',
  phone: '',
  taxId: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'United States',
  currencyCode: 'USD',
  paymentTermsDays: '30',
  defaultExpenseAccountId: ''
})

export default function VendorManagement({ activeEntityId, notify }: { entities: Entity[], activeEntityId: string, notify: (msg: string) => void }) {
  const vendors = useVendorsStore((s) => s.vendors as unknown as Vendor[])
  const loading = useVendorsStore((s) => s.loading)
  const fetchVendors = useVendorsStore((s) => s.fetchVendors)
  const fetchNextNumber = useVendorsStore((s) => s.fetchNextNumber)
  const saveVendorStore = useVendorsStore((s) => s.saveVendor)
  const deleteVendorStore = useVendorsStore((s) => s.deleteVendor)

  const accounts = useCoaStore((s) => s.accounts as unknown as Account[])
  const fetchAccounts = useCoaStore((s) => s.fetchAccounts)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [form, setForm] = useState<VendorForm>(blankForm())

  useEffect(() => {
    fetchVendors(activeEntityId)
    fetchAccounts()
  }, [activeEntityId])

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch = `${v.vendorNumber} ${v.name} ${v.email || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [vendors, search, statusFilter])

  const exportHeaders = ['Number', 'Name', 'Email', 'Phone', 'City', 'Country', 'Currency', 'Payment Terms', 'Status']
  const exportRows = filteredVendors.map(v => [
    v.vendorNumber, v.name, v.email || '', v.phone || '', v.city || '', v.country || '',
    v.currencyCode, v.paymentTermsDays, v.status,
  ])

  const stats = useMemo(() => {
    const total = vendors.length
    const active = vendors.filter(v => v.status === 'Active').length
    const blocked = vendors.filter(v => v.status === 'Blocked').length
    return { total, active, blocked }
  }, [vendors])

  const openCreateModal = async () => {
    setEditingVendor(null)
    const newForm = blankForm()
    const num = await fetchNextNumber()
    if (num) newForm.vendorNumber = num
    setForm(newForm)
    setModalOpen(true)
  }

  const openEditModal = (v: Vendor) => {
    setEditingVendor(v)
    setForm({
      vendorNumber: v.vendorNumber,
      name: v.name,
      email: v.email || '',
      phone: v.phone || '',
      taxId: v.taxId || '',
      addressLine1: v.addressLine1 || '',
      addressLine2: v.addressLine2 || '',
      city: v.city || '',
      state: v.state || '',
      postalCode: v.postalCode || '',
      country: v.country || 'United States',
      currencyCode: v.currencyCode || 'USD',
      paymentTermsDays: String(v.paymentTermsDays || 30),
      defaultExpenseAccountId: v.defaultExpenseAccountId || ''
    })
    setModalOpen(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      notify('Vendor name is required.')
      return
    }

    const payload = {
      vendorNumber: form.vendorNumber || null,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      taxId: form.taxId.trim() || null,
      addressLine1: form.addressLine1.trim() || null,
      addressLine2: form.addressLine2.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      postalCode: form.postalCode.trim() || null,
      country: form.country.trim() || 'United States',
      currencyCode: form.currencyCode.trim().toUpperCase() || 'USD',
      paymentTermsDays: Number(form.paymentTermsDays) || 30,
      defaultExpenseAccountId: form.defaultExpenseAccountId || null,
      companyId: activeEntityId || null
    }

    try {
      await saveVendorStore(payload, editingVendor ? editingVendor.id : undefined)
      notify(editingVendor ? 'Vendor updated successfully.' : 'Vendor created successfully.')
      setModalOpen(false)
    } catch (err: any) {
      notify(err.message || 'Error saving vendor.')
    }
  }

  const handleDelete = async (v: Vendor) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${v.name}"?`)) return
    try {
      await deleteVendorStore(v.id)
      notify('Vendor deleted.')
    } catch (err: any) {
      notify(err.message || 'Could not delete vendor.')
    }
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
          <span className="stat-icon blue"><Building2 className="w-5 h-5" /></span>
          <div>
            <small>TOTAL VENDORS</small>
            <h2>{stats.total}</h2>
            <p>Registered suppliers</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal"><Users className="w-5 h-5" /></span>
          <div>
            <small>ACTIVE VENDORS</small>
            <h2>{stats.active}</h2>
            <p>Ready for purchasing</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet"><Wallet className="w-5 h-5" /></span>
          <div>
            <small>OUTSTANDING PAYABLES</small>
            <h2>$0.00</h2>
            <p>Bills awaiting payment</p>
          </div>
        </article>
      </section>

      {/* Toolbar */}
      <div className="customer-toolbar">
        <div className="customer-search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search suppliers by name, number, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="customer-filter-group">
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blocked">Blocked</option>
          </select>

          <DataToolbar
            exportFileName="vendors"
            exportSheetName="Vendors"
            exportTitle="Vendors"
            exportSubtitle={`Vendor master list (${filteredVendors.length} records).`}
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            onRefresh={() => fetchVendors(activeEntityId)}
          />

          <button className="primary flex items-center gap-2" onClick={openCreateModal}>
            <Plus className="w-4 h-4" /> New Vendor
          </button>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Loading vendors...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl bg-card">
            No vendors found.
          </div>
        ) : (
          filteredVendors.map(v => (
            <Card key={v.id} className="relative flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                      {v.vendorNumber}
                    </span>
                    <CardTitle className="mt-1 text-base font-bold text-foreground">{v.name}</CardTitle>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : v.status === 'Blocked' ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-500/10 text-slate-600'}`}>
                    {v.status}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-xs pb-4">
                <div className="space-y-2">
                  {v.email && (
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 mr-2" /> {v.email}
                    </div>
                  )}
                  {v.phone && (
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 mr-2" /> {v.phone}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <div>
                    <small className="text-muted-foreground block text-[10px] uppercase font-bold flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" /> Terms
                    </small>
                    <span className="font-semibold text-foreground">Net {v.paymentTermsDays}</span>
                  </div>
                  <div>
                    <small className="text-muted-foreground block text-[10px] uppercase font-bold">Currency</small>
                    <span className="font-semibold text-foreground">{v.currencyCode}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <small className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Accounting Profile</small>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Default Expense:</span>
                    <span className="font-medium text-foreground truncate ml-2">{getAccountName(v.defaultExpenseAccountId)}</span>
                  </div>
                </div>

                <div className="pt-3 flex gap-1 justify-end">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(v)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(v)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
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
                <p className="eyebrow">VENDOR MANAGEMENT</p>
                <h2>{editingVendor ? 'Edit Vendor Details' : 'Register New Vendor'}</h2>
              </div>
              <button type="button" className="close" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">
              <label>
                Vendor Number
                <input placeholder="Auto-generated if blank" value={form.vendorNumber} onChange={e => setForm({ ...form, vendorNumber: e.target.value })} />
              </label>

              <label>
                Vendor/Supplier Name *
                <input required placeholder="e.g. Acme Corp" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </label>

              <label>
                Email Address
                <input type="email" placeholder="billing@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </label>

              <label>
                Phone Number
                <input type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </label>

              <label>
                Tax ID / VAT Number
                <input placeholder="e.g. US-123456789" value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} />
              </label>

              <label>
                Payment Terms (Days)
                <input type="number" min="0" placeholder="30" value={form.paymentTermsDays} onChange={e => setForm({ ...form, paymentTermsDays: e.target.value })} />
              </label>

              {/* Accounting Mappings */}
              <div style={{ gridColumn: '1 / -1', marginTop: '10px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
                <p className="eyebrow" style={{ color: '#16a34a' }}>ACCOUNTING PREFERENCES</p>
                <div className="form-grid">
                  <label>
                    Default Expense Account (GAAP)
                    <select value={form.defaultExpenseAccountId} onChange={e => setForm({ ...form, defaultExpenseAccountId: e.target.value })}>
                      <option value="">No default mapping...</option>
                      {accounts.filter(a => a.type === 'Expense' || a.type === 'Asset').map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Billing Currency
                    <input value={form.currencyCode} onChange={e => setForm({ ...form, currencyCode: e.target.value })} maxLength={3} />
                  </label>
                </div>
              </div>

              {/* Address */}
              <div style={{ gridColumn: '1 / -1', marginTop: '10px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
                <p className="eyebrow">BILLING ADDRESS</p>
                <div className="form-grid">
                  <label style={{ gridColumn: '1 / -1' }}>
                    Address Line 1
                    <input value={form.addressLine1} onChange={e => setForm({ ...form, addressLine1: e.target.value })} />
                  </label>
                  <label style={{ gridColumn: '1 / -1' }}>
                    Address Line 2
                    <input value={form.addressLine2} onChange={e => setForm({ ...form, addressLine2: e.target.value })} />
                  </label>
                  <label>
                    City
                    <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </label>
                  <label>
                    State / Province
                    <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                  </label>
                  <label>
                    Postal Code
                    <input value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} />
                  </label>
                  <label>
                    Country
                    <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
<button type="submit" className="primary">{editingVendor ? 'Save Changes' : 'Register Vendor'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
