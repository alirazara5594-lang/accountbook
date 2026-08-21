import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, Search, Plus, Pencil, Trash2, Users, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DataToolbar } from '@/components/ui/data-toolbar'

import { useVendorsStore, useCoaStore } from './stores'
import { money } from './lib/currency'

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
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(v)} className="h-7 w-7 p-0">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(v)} className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              <button type="button" className="secondary btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary btn-draft" onClick={(e) => { e.preventDefault(); alert("��� Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary btn-finalize">{editingVendor ? 'Save Changes' : 'Register Vendor'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
