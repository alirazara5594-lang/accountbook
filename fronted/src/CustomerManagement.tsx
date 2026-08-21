import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Search, ShieldAlert, UserCheck, Users, CreditCard, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DataToolbar } from '@/components/ui/data-toolbar'
import type { Entity } from './EntitySettings'
import { useCustomersStore } from './stores'
import { useFormDraft } from './hooks/useFormDraft'

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

import { money } from './lib/currency';

export default function CustomerManagement({
  entities,
  activeEntityId,
  notify
}: {
  entities: Entity[]
  activeEntityId: string
  notify: (msg: string) => void
}) {
  const customers = useCustomersStore((s) => s.customers as Customer[])
  const loading = useCustomersStore((s) => s.loading)
  const fetchCustomers = useCustomersStore((s) => s.fetchCustomers)
  const fetchNextNumber = useCustomersStore((s) => s.fetchNextNumber)
  const saveCustomerStore = useCustomersStore((s) => s.saveCustomer)
  const toggleCustomerStatusStore = useCustomersStore((s) => s.toggleCustomerStatus)
  const deleteCustomerStore = useCustomersStore((s) => s.deleteCustomer)

  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState<CustomerForm>(blankForm())
  const { saveDraft, clearDraft } = useFormDraft('customer', form, setForm, modalOpen)

  useEffect(() => {
    fetchCustomers()
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

  const exportHeaders = ['Number', 'Name', 'Email', 'Phone', 'City', 'Country', 'Currency', 'Credit Limit', 'Payment Terms', 'Status']
  const exportRows = filteredCustomers.map(c => [
    c.customerNumber, c.name, c.email || '', c.phone || '', c.city || '', c.country || '',
    c.currencyCode, c.creditLimit, c.paymentTermsDays, c.status,
  ])

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
    const num = await fetchNextNumber()
    if (num) newForm.customerNumber = num
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

    try {
      await saveCustomerStore(payload, editingCustomer ? editingCustomer.id : undefined)
      clearDraft()
      notify(editingCustomer ? 'Customer updated successfully.' : 'Customer created successfully.')
      setModalOpen(false)
    } catch (err: any) {
      notify(err.message || 'Error saving customer.')
    }
  }

  const handleStatusChange = async (customer: Customer, _newStatus: CustomerStatus) => {
    try {
      await toggleCustomerStatusStore(customer)
      notify(`Customer ${customer.name} status updated.`)
    } catch (err: any) {
      notify(err.message || 'Status change failed.')
    }
  }

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"?`)) return
    try {
      await deleteCustomerStore(customer.id)
      notify(`Customer ${customer.name} deleted.`)
    } catch (err: any) {
      notify(err.message || 'Could not delete customer.')
    }
  }

  const companyMap = useMemo(() => {
    const map = new Map<string, Entity>()
    entities.forEach(e => map.set(e.id, e))
    return map
  }, [entities])

  const exportHeaders = ['Customer #', 'Name', 'Email', 'Phone', 'City', 'Currency', 'Credit Limit', 'Terms (Days)', 'Status'];
  const exportRows = filteredCustomers.map(c => [
    c.customerNumber, c.name, c.email || '', c.phone || '', c.city || '', c.currencyCode, c.creditLimit, c.paymentTermsDays, c.status
  ]);

  return (
    <div className="space-y-6">
      {/* Submodule Heading Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight flex items-center gap-2">
            <span className="text-lg">👥</span> Customer Management
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">Manage customer records, credit terms, contact directories, and trade receivables.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DataToolbar
            query={search}
            setQuery={setSearch}
            searchPlaceholder="Search customer #, name..."
            exportFileName="customer-directory"
            exportSheetName="Customers"
            exportTitle="Customer Directory"
            exportSubtitle="Customer accounts, credit limits, and contact records."
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            onRefresh={fetchCustomers}
          />
          <button onClick={() => { setForm(blankForm()); setEditingCustomer(null); setModalOpen(true); }} className="primary h-9 px-4 rounded-xl text-xs font-semibold whitespace-nowrap">
            ＋ Add Customer
          </button>
        </div>
      </div>

      {/* Header Stats */}
      <section className="stats">
        <article>
          <span className="stat-icon blue">
            <Users className="w-4 h-4" />
          </span>
          <div>
            <small>TOTAL CUSTOMERS</small>
            <h2>{stats.total}</h2>
            <p>{stats.activeCount} active in group</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal">
            <CreditCard className="w-4 h-4" />
          </span>
          <div>
            <small>TOTAL CREDIT LIMIT</small>
            <h2>{money(stats.totalCreditLimit)}</h2>
            <p>Allocated credit exposure</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet">
            <UserCheck className="w-4 h-4" />
          </span>
          <div>
            <small>AVG PAYMENT TERMS</small>
            <h2>{stats.avgTerms} Days</h2>
            <p>Net payment period</p>
          </div>
        </article>
      </section>

      {/* Customer Management Filters */}
      <div className="customer-toolbar">
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

          <DataToolbar
            exportFileName="customers"
            exportSheetName="Customers"
            exportTitle="Customers"
            exportSubtitle={`Customer master list (${filteredCustomers.length} records).`}
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Credit Limit', value: stats.totalCreditLimit }]}
            onRefresh={() => fetchCustomers()}
          />

          <button className="primary" onClick={openCreateModal}>
            ＋ New Customer
          </button>
        </div>
      </div>


      {/* Customer Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50">
          <p className="text-xs font-semibold text-slate-700">{filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No customers found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Number</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Name</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Company</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Email</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Phone</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Location</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Credit Limit</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-600">Terms</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-600">Status</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => {
                  const comp = customer.companyId ? companyMap.get(customer.companyId) : null
                  return (
                    <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2 font-mono font-semibold text-slate-700">{customer.customerNumber}</td>
                      <td className="px-3 py-2 font-semibold text-slate-900">{customer.name}</td>
                      <td className="px-3 py-2 text-slate-600">{comp ? comp.name : '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{customer.email || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{customer.phone || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{[customer.city, customer.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">{money(customer.creditLimit, customer.currencyCode)}</td>
                      <td className="px-3 py-2 text-center text-slate-600">Net {customer.paymentTermsDays}d</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          customer.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                          customer.status === 'Blocked' ? 'bg-rose-50 text-rose-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>{customer.status}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(customer)} className="h-7 w-7 p-0">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(customer)} className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          {customer.status !== 'Active' && (
                            <Button variant="ghost" size="sm" onClick={() => handleStatusChange(customer, 'Active')} className="h-7 w-7 p-0" title="Activate">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            </Button>
                          )}
                          {customer.status !== 'Blocked' && (
                            <Button variant="ghost" size="sm" onClick={() => handleStatusChange(customer, 'Blocked')} className="h-7 w-7 p-0" title="Block">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            </Button>
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

      {/* Modal Form */}
      {modalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleSave}>
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
              <label style={{ gridColumn: '1 / -1' }}>
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

              <label style={{ gridColumn: '1 / -1' }}>
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
              <button type="button" className="secondary btn-cancel" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="secondary btn-draft" onClick={(e) => { e.preventDefault(); saveDraft(); notify('��� Customer draft saved locally.'); }}>Save Draft</button>
              <button type="submit" className="primary btn-finalize">
                {editingCustomer ? 'Finalize & Save Changes' : 'Finalize & Create Customer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
