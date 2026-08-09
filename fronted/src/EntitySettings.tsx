import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, CircleOff, Pencil, Plus, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const api = 'http://localhost:5124/api/v1'
export type EntityType = 'Parent' | 'Subsidiary' | 'Branch' | 'JointVenture' | 'Associate'
export type Entity = { id: string; name: string; code?: string; legalName?: string; type: EntityType; parentId?: string; country: string; currencyCode: string; taxAuthorityId?: string; active: boolean }
type Form = { name: string; code: string; legalName: string; type: EntityType; parentId: string; country: string; currencyCode: string; taxAuthorityId: string; state: string }
const blank = (): Form => ({ name: '', code: '', legalName: '', type: 'Subsidiary', parentId: '', country: 'United States', currencyCode: 'USD', taxAuthorityId: '', state: '' })

export default function EntitySettings({ entities, selectedId, select, reload, notify }: { entities: Entity[]; selectedId: string; select: (id: string) => void; reload: () => void; notify: (message: string) => void }) {
  const [form, setForm] = useState<Form>(blank)
  const [authorities, setAuthorities] = useState<any[]>([])
  
  useMemo(() => {
    fetch(`${api}/taxes/authorities`).then(r => r.json()).then(setAuthorities).catch(console.error)
  }, [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const active = entities.filter(entity => entity.active)
  const children = (parentId?: string) => entities.filter(entity => entity.parentId === parentId)
  const roots = useMemo(() => entities.filter(entity => !entity.parentId), [entities])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    const response = await fetch(editingId ? `${api}/companies/${editingId}` : `${api}/companies`, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, parentId: form.parentId || null, taxAuthorityId: form.taxAuthorityId || null }) })
    if (!response.ok) { notify((await response.json()).message || 'Could not save entity'); return }
    const entity = await response.json(); setForm(blank()); setEditingId(null); select(entity.id); reload(); notify(editingId ? 'Entity updated' : 'Entity created and selected')
  }
  const edit = (entity: Entity) => { 
    const auth = authorities.find(a => a.id === entity.taxAuthorityId)
    setEditingId(entity.id); 
    setForm({ name: entity.name, code: entity.code || '', legalName: entity.legalName || '', type: entity.type || 'Subsidiary', parentId: entity.parentId || '', country: entity.country || 'United States', currencyCode: entity.currencyCode || 'USD', taxAuthorityId: entity.taxAuthorityId || '', state: auth?.state || '' }); 
    document.getElementById('entity-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) 
  }
  const setStatus = async (entity: Entity) => { const response = await fetch(`${api}/companies/${entity.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !entity.active }) }); if (!response.ok) { notify((await response.json()).message || 'Could not update entity'); return }; if (!entity.active) select(entity.id); reload(); notify(`${entity.name} ${entity.active ? 'deactivated' : 'activated'}`) }
  const EntityCard = ({ entity, depth = 0 }: { entity: Entity; depth?: number }) => <div className="entity-node" style={{ marginLeft: depth * 22 }}><Card className={entity.id === selectedId ? 'ring-2 ring-primary' : entity.active ? '' : 'opacity-60'}><CardHeader className="pb-1"><div className="flex items-start justify-between gap-3"><div><CardTitle>{entity.name}</CardTitle><CardDescription>{entity.code || 'No code'} · {entity.country} · {entity.currencyCode}</CardDescription></div><span className={entity.active ? 'entity-status active' : 'entity-status'}>{entity.active ? 'Active' : 'Inactive'}</span></div></CardHeader><CardContent className="flex flex-wrap items-center gap-2"><span className="entity-type">{entity.type}</span>{entity.id === selectedId && <span className="entity-current">Current books</span>}<div className="ml-auto flex gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => { select(entity.id); notify(`${entity.name} is now the active entity`) }}>Use</Button><Button type="button" variant="outline" size="sm" onClick={() => edit(entity)}><Pencil /> Edit</Button><Button type="button" variant="ghost" size="sm" onClick={() => setStatus(entity)}>{entity.active ? <><CircleOff /> Deactivate</> : 'Activate'}</Button></div></CardContent></Card>{children(entity.id).map(child => <EntityCard key={child.id} entity={child} depth={depth + 1} />)}</div>
  const countries = Array.from(new Set(authorities.map(a => a.country).filter(Boolean)))
  const statesForCountry = Array.from(new Set(authorities.filter(a => a.country === form.country).map(a => a.state).filter(Boolean)))
  const authsForRegion = authorities.filter(a => a.country === form.country && (!form.state || a.state === form.state))

  return <><section className="entity-tabs"><button className="active"><Building2 /> Entity hierarchy</button><button disabled>Group consolidation</button><button disabled>Jurisdictions</button></section><section className="entity-summary"><span>{active.length} active entities · {roots.length} top-level · {entities.length - active.length} inactive</span><Button type="button" onClick={() => { setEditingId(null); setForm(blank()); document.getElementById('entity-form')?.scrollIntoView({ behavior: 'smooth' }) }}><Plus /> Add entity</Button></section><section className="entity-layout"><div className="entity-tree">{roots.length ? roots.map(entity => <EntityCard key={entity.id} entity={entity} />) : <div className="empty">Create your first entity to begin.</div>}</div><Card id="entity-form" className="entity-create"><CardHeader><p className="eyebrow">ENTITY SETTINGS</p><CardTitle>{editingId ? 'Edit entity' : 'Add entity'}</CardTitle><CardDescription>Each entity has its own accounting books, reporting currency, and place in the group hierarchy.</CardDescription></CardHeader><CardContent><form onSubmit={save} className="entity-form"><label>Entity name<input required value={form.name} placeholder="Acme Manufacturing" onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Entity code<input value={form.code} placeholder="ACMFG" onChange={e => setForm({ ...form, code: e.target.value })} /></label><label>Legal name<input value={form.legalName} placeholder="Acme Manufacturing Ltd." onChange={e => setForm({ ...form, legalName: e.target.value })} /></label><label>Entity type<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EntityType })}>{(['Parent','Subsidiary','Branch','JointVenture','Associate'] as EntityType[]).map(type => <option key={type}>{type}</option>)}</select></label><label>Parent entity<select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}><option value="">Independent / top-level</option>{active.filter(entity => entity.id !== editingId).map(entity => <option value={entity.id} key={entity.id}>{entity.name}</option>)}</select></label>
  <label>Country<select required value={form.country} onChange={e => setForm({ ...form, country: e.target.value, state: '', taxAuthorityId: '' })}><option value="" disabled>Select Country</option>{countries.map(c => <option key={c}>{c}</option>)}</select></label>
  {statesForCountry.length > 0 && <label>State/Province<select value={form.state} onChange={e => setForm({ ...form, state: e.target.value, taxAuthorityId: '' })}><option value="">Select State (Optional)</option>{statesForCountry.map(s => <option key={s}>{s}</option>)}</select></label>}
  {authsForRegion.length > 0 && <label>Tax Authority<select value={form.taxAuthorityId} onChange={e => setForm({ ...form, taxAuthorityId: e.target.value })}><option value="">Select Authority</option>{authsForRegion.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
  <label>Base currency<select value={form.currencyCode} onChange={e => setForm({ ...form, currencyCode: e.target.value })}>{['USD','PKR','GBP','EUR','AED','SAR'].map(currency => <option key={currency}>{currency}</option>)}</select></label><div className="entity-form-actions">{editingId && <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setForm(blank()) }}>Cancel</Button>}<Button type="submit"><Settings2 /> {editingId ? 'Save entity' : 'Create entity'}</Button></div></form></CardContent></Card></section></>
}
