import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, Mail, Phone, Search, ShieldAlert, UserCheck, UserX, Users, CreditCard, MapPin, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Entity } from './EntitySettings'

const api = 'http://localhost:5124/api/v1'

export type CustomerStatus = 'Active' | 'Inactive' | 'Blocked'

export type Customer = {
  id: string
  customerNumber: string
  name: string
  email?: string
  phone?: string
  taxId?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  currencyCode: string
  creditLimit: number
  paymentTermsDays: number
  companyId?: string
  status: CustomerStatus
  createdAt: string
  updatedAt: string
}

type CustomerForm = {
  customerNumber: string
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
  creditLimit: string
  paymentTermsDays: string
  companyId: string
}

const blankForm = (): CustomerForm => ({
  customerNumber: '',
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
  creditLimit: '0',
  paymentTermsDays: '30',
  companyId: ''
})

function money(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export default function CustomerManagement({
  entities,
  activeEntityId,
  notify
}: {
  entities: Entity[]
  activeEntityId: string
  notify: (msg: string) => void
}) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState<CustomerForm>(blankForm())

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${api}/customers`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      }
    } catch {
      notify('Failed to load customers from API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch =
        `${c.customerNumber} ${c.name} ${c.email || ''} ${c.phone || ''} ${c.city || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesCompany =
        companyFilter === 'all'
          ? true
          : companyFilter === 'unassigned'
          ? !c.companyId
          : c.companyId === companyFilter

      const matchesStatus = statusFilter === 'all' ? true : c.status === statusFilter

      return matchesSearch && matchesCompany && matchesStatus
    })
  }, [customers, search, companyFilter, statusFilter])

  const stats = useMemo(() => {
    const total = customers.length
    const activeCount = customers.filter(c => c.status === 'Active').length
    const totalCreditLimit = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0)
    const avgTerms = total > 0 ? Math.round(customers.reduce((sum, c) => sum + (c.paymentTermsDays || 30), 0) / total) : 30
    return { total, activeCount, totalCreditLimit, avgTerms }
  }, [customers])

  const openCreateModal = async () => {
    setEditingCustomer(null)
    const newForm = blankForm()
    if (activeEntityId) newForm.companyId = activeEntityId
    try {
      const res = await fetch(`${api}/customers/next-number`)
      if (res.ok) {
        const data = await res.json()
        newForm.customerNumber = data.customerNumber
      }
    } catch {
      // fallback
    }
    setForm(newForm)
    setModalOpen(true)
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setForm({
      customerNumber: customer.customerNumber,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      taxId: customer.taxId || '',
      addressLine1: customer.addressLine1 || '',
      addressLine2: customer.addressLine2 || '',
      city: customer.city || '',
      state: customer.state || '',
      postalCode: customer.postalCode || '',
      country: customer.country || 'United States',
      currencyCode: customer.currencyCode || 'USD',
      creditLimit: String(customer.creditLimit || 0),
      paymentTermsDays: String(customer.paymentTermsDays || 30),
      companyId: customer.companyId || ''
    })
    setModalOpen(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      notify('Customer name is required.')
      return
    }

    const payload = {
      customerNumber: form.customerNumber || null,
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
      currencyCode: form.currencyCode.trim() || 'USD',
      creditLimit: Number(form.creditLimit) || 0,
      paymentTermsDays: Number(form.paymentTermsDays) || 30,
      companyId: form.companyId || null
    }

    const url = editingCustomer ? `${api}/customers/${editingCustomer.id}` : `${api}/customers`
    const method = editingCustomer ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.json()
      notify(err.message || 'Error saving customer.')
      return
    }

    notify(editingCustomer ? 'Customer updated successfully.' : 'Customer created successfully.')
    setModalOpen(false)
    loadCustomers()
  }

  const handleStatusChange = async (customer: Customer, newStatus: CustomerStatus) => {
    const res = await fetch(`${api}/customers/${customer.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })

    if (!res.ok) {
      const err = await res.json()
      notify(err.message || 'Status change failed.')
      return
    }

    notify(`Customer ${customer.name} is now ${newStatus}.`)
    loadCustomers()
  }

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"?`)) return

    const res = await fetch(`${api}/customers/${customer.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      notify(err.message || 'Could not delete customer.')
      return
    }

    notify('Customer deleted.')
    loadCustomers()
  }

  const companyMap = useMemo(() => {
    const map = new Map<string, Entity>()
    entities.forEach(e => map.set(e.id, e))
    return map
  }, [entities])

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <section className="stats">
        <article>
          <span className="stat-icon blue">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <small>TOTAL CUSTOMERS</small>
            <h2>{stats.total}</h2>
            <p>{stats.activeCount} active in group</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal">
            <CreditCard className="w-5 h-5" />
          </span>
          <div>
            <small>TOTAL CREDIT LIMIT</small>
            <h2>{money(stats.totalCreditLimit)}</h2>
            <p>Allocated credit exposure</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet">
            <UserCheck className="w-5 h-5" />
          </span>
          <div>
            <small>AVG PAYMENT TERMS</small>
            <h2>{stats.avgTerms} Days</h2>
            <p>Net payment period</p>
          </div>
        </article>
      </section>

      {/* Customer Management Toolbar */}
      <div className="customer-toolbar">
        <div className="customer-search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer name, code, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')} title="Clear search">
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
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blocked">Blocked</option>
          </select>

          <button className="primary" onClick={openCreateModal}>
            ＋ New Customer
          </button>
        </div>
      </div>


      {/* Customer Cards List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl bg-card">
            No customers found matching your criteria.
          </div>
        ) : (
          filteredCustomers.map(customer => {
            const comp = customer.companyId ? companyMap.get(customer.companyId) : null
            return (
              <Card key={customer.id} className="relative flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {customer.customerNumber}
                      </span>
                      <CardTitle className="mt-1 text-base font-bold text-foreground">{customer.name}</CardTitle>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        customer.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : customer.status === 'Blocked'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {customer.status}
                    </span>
                  </div>
                  <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    {comp ? `${comp.name} (${comp.code || 'Entity'})` : 'Global / Group Customer'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2 text-xs text-muted-foreground pb-4">
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {(customer.city || customer.country) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{[customer.city, customer.state, customer.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t grid grid-cols-2 gap-2 text-foreground">
                    <div>
                      <small className="text-muted-foreground block text-[10px] uppercase font-semibold">Credit Limit</small>
                      <span className="font-semibold">{money(customer.creditLimit, customer.currencyCode)}</span>
                    </div>
                    <div>
                      <small className="text-muted-foreground block text-[10px] uppercase font-semibold">Payment Terms</small>
                      <span className="font-semibold">Net {customer.paymentTermsDays} Days</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(customer)}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(customer)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="flex gap-1">
                      {customer.status !== 'Active' && (
                        <Button variant="ghost" size="sm" onClick={() => handleStatusChange(customer, 'Active')} title="Activate">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </Button>
                      )}
                      {customer.status !== 'Inactive' && (
                        <Button variant="ghost" size="sm" onClick={() => handleStatusChange(customer, 'Inactive')} title="Deactivate">
                          <UserX className="w-3.5 h-3.5 text-amber-600" />
                        </Button>
                      )}
                      {customer.status !== 'Blocked' && (
                        <Button variant="ghost" size="sm" onClick={() => handleStatusChange(customer, 'Blocked')} title="Block Account">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="overlay">
          <form className="modal max-w-2xl" onSubmit={handleSave}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">SALES & CUSTOMERS</p>
                <h2>{editingCustomer ? 'Edit Customer' : 'Create New Customer'}</h2>
              </div>
              <button type="button" className="close" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="form-grid">
              <label>
                Customer Name *
                <input
                  required
                  placeholder="e.g. Global Tech Solutions"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </label>

              <label>
                Customer Number
                <input
                  placeholder="e.g. CUST-0001 (Auto-generated)"
                  value={form.customerNumber}
                  onChange={e => setForm({ ...form, customerNumber: e.target.value })}
                />
              </label>

              <label>
                Assigned Company Entity
                <select value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}>
                  <option value="">All / Group Customer (Global)</option>
                  {entities.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} {e.code ? `(${e.code})` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Tax ID / VAT Number
                <input
                  placeholder="e.g. US-987654321"
                  value={form.taxId}
                  onChange={e => setForm({ ...form, taxId: e.target.value })}
                />
              </label>

              <label>
                Email Address
                <input
                  type="email"
                  placeholder="billing@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </label>

              <label>
                Phone Number
                <input
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </label>

              <label>
                Credit Limit
                <input
                  type="number"
                  step="0.01"
                  placeholder="50000"
                  value={form.creditLimit}
                  onChange={e => setForm({ ...form, creditLimit: e.target.value })}
                />
              </label>

              <label>
                Payment Terms (Days)
                <input
                  type="number"
                  placeholder="30"
                  value={form.paymentTermsDays}
                  onChange={e => setForm({ ...form, paymentTermsDays: e.target.value })}
                />
              </label>

              <label>
                Currency
                <select value={form.currencyCode} onChange={e => setForm({ ...form, currencyCode: e.target.value })}>
                  {['USD', 'PKR', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD'].map(curr => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Country
                <input
                  placeholder="United States"
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                />
              </label>

              <label className="col-span-2">
                Address Line 1
                <input
                  placeholder="100 Main Street, Suite 400"
                  value={form.addressLine1}
                  onChange={e => setForm({ ...form, addressLine1: e.target.value })}
                />
              </label>

              <label>
                City
                <input
                  placeholder="San Francisco"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                />
              </label>

              <label>
                State / Region
                <input
                  placeholder="CA"
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                />
              </label>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                {editingCustomer ? 'Save Changes' : 'Create Customer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
