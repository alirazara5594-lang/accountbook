import React, { useState, useEffect } from 'react';
import { accountingApi, type PeriodCloseRecord } from './api/modules/accounting.api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Lock, Unlock, CalendarClock } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { Entity } from './EntitySettings';

interface PeriodClosingViewProps {
  activeEntityId: string;
  entities: Entity[];
}

export const PeriodClosingView: React.FC<PeriodClosingViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [periods, setPeriods] = useState<PeriodCloseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    periodName: '',
    periodEndDate: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (activeEntityId) params.companyId = activeEntityId;
      const data = await accountingApi.getPeriodCloses(params);
      setPeriods(data || []);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load periods.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeEntityId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.periodName.trim()) { setFormError('Period name is required.'); return; }
    setSaving(true);
    try {
      await accountingApi.createPeriodClose({
        periodName: form.periodName.trim(),
        periodEndDate: form.periodEndDate || undefined,
        note: form.note || undefined,
        companyId: activeEntityId || undefined,
      });
      setIsModalOpen(false);
      setForm({ periodName: '', periodEndDate: new Date().toISOString().slice(0, 10), note: '' });
      await load();
    } catch (err: any) {
      setFormError(err?.data?.error || err?.message || 'Failed to create period.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (p: PeriodCloseRecord) => {
    const by = (window.prompt('Enter your name (for audit record)') || '').trim();
    if (!by) return;
    setActingId(p.id);
    try {
      await accountingApi.closePeriod(p.id, by, `Closed via Period Closing`);
      await load();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Failed to close period.');
    } finally {
      setActingId(null);
    }
  };

  const handleReopen = async (p: PeriodCloseRecord) => {
    if (!window.confirm(`Reopen period "${p.periodName}"? This records an audit event.`)) return;
    setActingId(p.id);
    try {
      await accountingApi.reopenPeriod(p.id);
      await load();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Failed to reopen period.');
    } finally {
      setActingId(null);
    }
  };

  const filtered = React.useMemo(() => {
    if (!query.trim()) return periods;
    const q = query.toLowerCase();
    return periods.filter(p =>
      p.periodName.toLowerCase().includes(q) ||
      (p.note || '').toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  }, [periods, query]);

  const exportHeaders = ['Period', 'End Date', 'Note', 'Status', 'Closed At', 'Closed By'];
  const exportRows = filtered.map(p => [p.periodName, p.periodEndDate, p.note, p.status, p.closedAt, p.closedBy]);

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <CalendarClock className="w-4 h-4 text-indigo-600" /> Accounting & Finance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Period Closing</h1>
          <p className="text-xs text-slate-500">
            Close accounting periods for {currentEntity?.name || 'Active Entity'} to lock books and prevent
            postings into prior periods (IAS 1 cut-off, IFRS going-concern period review).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataToolbar
            query={query}
            setQuery={setQuery}
            searchPlaceholder="Search period, note, status..."
            exportFileName="period-closing"
            exportSheetName="Period Closing"
            exportTitle="Period Closing"
            exportSubtitle={`Accounting periods for ${currentEntity?.name || 'Active Entity'}.`}
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            onRefresh={load}
          />
          <Button size="sm" onClick={() => setIsModalOpen(true)} className="h-9 px-4 gap-1.5 text-xs font-semibold text-white bg-[#143e2b] hover:bg-[#0f3222]">
            <Plus className="w-4 h-4" /> Open New Period
          </Button>
        </div>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading accounting periods…</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">PERIOD</TableHead>
              <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider">END DATE</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">NOTE</TableHead>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATUS</TableHead>
              <TableHead className="w-36 text-[11px] font-bold text-slate-500 uppercase tracking-wider">CLOSED AT</TableHead>
              <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">CLOSED BY</TableHead>
              <TableHead className="w-32 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {periods.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  No accounting periods defined yet. Use "Open New Period" to begin the close cycle.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(p => (
              <TableRow key={p.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3.5 pl-4 text-xs font-bold text-slate-800">{p.periodName}</TableCell>
                <TableCell className="py-3.5 font-mono text-xs text-slate-600">{p.periodEndDate || '—'}</TableCell>
                <TableCell className="py-3.5 text-xs text-slate-600">{p.note || '—'}</TableCell>
                <TableCell className="py-3.5">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${p.status === 'Closed' ? 'bg-rose-50 text-rose-700 border-rose-200' : p.status === 'Reopened' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {p.status}
                  </span>
                </TableCell>
                <TableCell className="py-3.5 font-mono text-xs text-slate-600">{p.closedAt ? p.closedAt.slice(0, 10) : '—'}</TableCell>
                <TableCell className="py-3.5 text-xs text-slate-600">{p.closedBy || '—'}</TableCell>
                <TableCell className="py-3.5 pr-4">
                  <div className="flex items-center justify-end gap-1.5">
                    {p.status === 'Closed' ? (
                      <Button size="sm" variant="outline" disabled={actingId === p.id} onClick={() => handleReopen(p)} className="h-8 px-2.5 text-[11px] gap-1.5">
                        <Unlock className="w-3.5 h-3.5" /> Reopen
                      </Button>
                    ) : (
                      <Button size="sm" disabled={actingId === p.id} onClick={() => handleClose(p)} className="h-8 px-2.5 text-[11px] gap-1.5 bg-[#143e2b] hover:bg-[#0f3222]">
                        <Lock className="w-3.5 h-3.5" /> Close Period
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreate}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">PERIOD CLOSING</p>
                <h2>Open New Accounting Period</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="form-grid">
              {formError && <p className="error" style={{ gridColumn: '1 / -1', color: '#c25c5c', fontSize: 13, marginBottom: 10 }}>{formError}</p>}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Period Name</label>
                <Input required placeholder="e.g. FY2026-Q3 or August 2026" value={form.periodName} onChange={e => setForm({ ...form, periodName: e.target.value })} className="h-9 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Period End Date</label>
                <Input required type="date" value={form.periodEndDate} onChange={e => setForm({ ...form, periodEndDate: e.target.value })} className="h-9 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Note (optional)</label>
                <Input type="text" placeholder="e.g. Standard month-end close" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="h-9 text-xs" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : 'Open Period'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};