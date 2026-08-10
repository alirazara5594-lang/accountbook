import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useCompanyStore, useIntercompanyStore } from './stores'

type Company = { id: string; name: string; code?: string }
type Allocation = { id: string; name: string; sourceCompanyId: string; category: string; frequency: string; rate: number; quantity: number; status: string; recipients: { companyId: string; sharePercent: number }[] }
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

export default function Intercompany({ allocations, reload, notify }: { allocations: Allocation[]; reload: () => void; notify: (message: string) => void }) {
  const templates = [{ name: 'Shared office rent', category: 'Shared rent', frequency: 'Monthly' }, { name: 'Employee time recharge', category: 'Staff time', frequency: 'Hourly' }, { name: 'Management service fee', category: 'Management fee', frequency: 'Monthly' }, { name: 'IT and software recharge', category: 'Shared services', frequency: 'Monthly' }, { name: 'Equipment usage charge', category: 'Equipment transfer', frequency: 'Monthly' }]
  const empty = () => ({ name: '', sourceCompanyId: '', category: 'Shared rent', description: '', frequency: 'Monthly', rate: '0', quantity: '1', startDate: new Date().toISOString().slice(0, 10), endDate: '', recipients: [{ companyId: '', sharePercent: '100' }] })
  const [form, setForm] = useState<any>(empty)

  const companies = useCompanyStore((s) => s.entities as Company[])
  const fetchCompanies = useCompanyStore((s) => s.fetchCompanies)
  const createAllocationStore = useIntercompanyStore((s) => s.createAllocation)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const total = Number(form.rate || 0) * Number(form.quantity || 0)

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const recipients = form.recipients.map((r: any) => ({ companyId: r.companyId, sharePercent: Number(r.sharePercent) }))
    try {
      await createAllocationStore({ ...form, rate: Number(form.rate), quantity: Number(form.quantity), endDate: form.endDate || null, recipients })
      setForm(empty())
      notify('Intercompany allocation created')
      reload()
    } catch (err: any) {
      notify(err.message || 'Could not create allocation')
    }
  }

  const updateRecipient = (index: number, key: string, value: string) => { const recipients = [...form.recipients]; recipients[index] = { ...recipients[index], [key]: value }; setForm({ ...form, recipients }) }
  const companyName = (id: string) => companies.find(x => x.id === id)?.name ?? 'Unknown company'

  return <div className="intercompany"><section className="panel allocation-form"><div className="panel-head"><div><h3>New shared-cost allocation</h3><p>Allocate rent, staff time, equipment, and services across group companies.</p></div></div><form onSubmit={save}><div className="form-grid"><label>Allocation name<select required value={form.name} onChange={e => { const template = templates.find(x => x.name === e.target.value); setForm({ ...form, name: e.target.value, category: template?.category ?? form.category, frequency: template?.frequency ?? form.frequency }) }}><option value="">Select a common allocation</option>{templates.map(x => <option key={x.name}>{x.name}</option>)}</select></label><label>Borrowing / source company<select required value={form.sourceCompanyId} onChange={e => setForm({ ...form, sourceCompanyId: e.target.value })}><option value="">Select company</option>{companies.map(x => <option value={x.id} key={x.id}>{x.name}{x.code ? ` (${x.code})` : ''}</option>)}</select></label><label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{['Shared rent','Staff time','Equipment transfer','Management fee','Shared services','Other'].map(x => <option key={x}>{x}</option>)}</select></label><label>Billing frequency<select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>{['OneTime','Hourly','Weekly','Monthly','Quarterly','Yearly'].map(x => <option key={x}>{x}</option>)}</select></label><label>Rate<input required min="0" type="number" step="0.01" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></label><label>Quantity<input required min="0.01" type="number" step="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></label><label>Start date<input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></label><label>End date<input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></label></div><div className="recipient-head"><b>Recipient companies</b><span>Total charge: {money(total)}</span></div>{form.recipients.map((recipient: any, i: number) => <div className="recipient-row" key={i}><select required value={recipient.companyId} onChange={e => updateRecipient(i, 'companyId', e.target.value)}><option value="">Select company</option>{companies.filter(x => x.id !== form.sourceCompanyId).map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select><input required type="number" min="0.01" max="100" step="0.01" value={recipient.sharePercent} onChange={e => updateRecipient(i, 'sharePercent', e.target.value)} /><span>% · {money(total * Number(recipient.sharePercent || 0) / 100)}</span></div>)}<button type="button" className="text-button" onClick={() => setForm({ ...form, recipients: [...form.recipients, { companyId: '', sharePercent: '' }] })}>+ Add recipient</button><div className="modal-footer"><button className="primary">Create allocation</button></div></form></section><section className="panel allocation-list"><div className="panel-head"><div><h3>Active allocations</h3><p>Rate × quantity for each billing period.</p></div></div>{allocations.length ? allocations.map(a => <div className="allocation" key={a.id}><div><strong>{a.name}</strong><small>{companyName(a.sourceCompanyId)} · {a.category} · {a.frequency}</small></div><div><b>{money(a.rate * a.quantity)}</b><small>{a.status} · {a.recipients.map(x => `${companyName(x.companyId)} ${x.sharePercent}%`).join(' · ')}</small></div></div>) : <div className="empty">No allocations yet.</div>}</section></div>
}
