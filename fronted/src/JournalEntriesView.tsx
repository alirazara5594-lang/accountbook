import React, { useState } from 'react';
import { journalsApi } from './api/modules/journals.api';
import type { Account } from './api/modules/coa.api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle2, Zap, RefreshCw } from 'lucide-react';

interface Journal {
  id: string;
  date: string;
  reference: string;
  description: string;
  status?: string;
  lines: { accountId: string; debit: number; credit: number }[];
}

interface JournalEntriesViewProps {
  accounts: Account[];
  initialEntries: Journal[];
  onEntriesChange: (entries: Journal[]) => void;
}

const STATUS_STEPS: Record<string, number> = { Draft: 0, Submitted: 1, Approved: 2, Posted: 3 };

export const JournalEntriesView: React.FC<JournalEntriesViewProps> = ({ accounts, initialEntries, onEntriesChange }) => {
  const [journal, setJournal] = useState({
    date: new Date().toISOString().slice(0, 10),
    reference: '',
    description: '',
    lines: [{ accountId: '', debit: '', credit: '' }, { accountId: '', debit: '', credit: '' }],
  });
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const totals = journal.lines.reduce(
    (x, l) => ({ debit: x.debit + Number(l.debit || 0), credit: x.credit + Number(l.credit || 0) }),
    { debit: 0, credit: 0 }
  );

  const updateLine = (i: number, key: string, value: string) => {
    const lines = [...journal.lines];
    lines[i] = { ...lines[i], [key]: value };
    setJournal({ ...journal, lines });
  };

  const refresh = async () => {
    const data = await journalsApi.getJournalEntries();
    onEntriesChange(data as unknown as Journal[]);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (totals.debit !== totals.credit) { setError('Entry must balance (debits = credits).'); return; }
    if (!journal.reference || !journal.description) { setError('Reference and description are required.'); return; }
    if (journal.lines.some(l => !l.accountId || (Number(l.debit || 0) === 0 && Number(l.credit || 0) === 0))) {
      setError('Each line needs an account and a debit or credit amount.');
      return;
    }
    setSaving(true);
    try {
      await journalsApi.postJournalEntry({
        date: journal.date,
        reference: journal.reference,
        description: journal.description,
        lines: journal.lines.map(l => ({ accountId: l.accountId, debit: Number(l.debit || 0), credit: Number(l.credit || 0) })),
      });
      setJournal({ date: new Date().toISOString().slice(0, 10), reference: '', description: '', lines: [{ accountId: '', debit: '', credit: '' }, { accountId: '', debit: '', credit: '' }] });
      await refresh();
    } catch (err: any) {
      setError(err?.data?.message || err?.data?.error || err?.message || 'Failed to create journal entry.');
    } finally {
      setSaving(false);
    }
  };

  const lifecycle = async (id: string, action: 'submit' | 'approve' | 'post') => {
    setActingId(id);
    setError('');
    try {
      if (action === 'submit') await journalsApi.submit(id, 'Submitted for approval');
      if (action === 'approve') await journalsApi.approve(id, 'Approved by manager');
      if (action === 'post') await journalsApi.post(id, 'Posted to general ledger');
      await refresh();
    } catch (err: any) {
      setError(err?.data?.message || err?.data?.error || err?.message || 'Action failed.');
    } finally {
      setActingId(null);
    }
  };

  const statusColor = (status?: string) => {
    switch (status) {
      case 'Posted': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Approved': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Submitted': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={refresh} className="h-8 px-3 gap-1.5 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <form id="journal-form" className="panel entry-form" onSubmit={handlePost}>
        <div className="form-top">
          <label>Date<input type="date" value={journal.date} onChange={e => setJournal({ ...journal, date: e.target.value })} /></label>
          <label>Reference<input required placeholder="JE-0001" value={journal.reference} onChange={e => setJournal({ ...journal, reference: e.target.value })} /></label>
          <label className="wide">Description<input required placeholder="Describe this transaction" value={journal.description} onChange={e => setJournal({ ...journal, description: e.target.value })} /></label>
        </div>
        <div className="lines">
          {journal.lines.map((line, i) => (
            <div className="line" key={i}>
              <select required value={line.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)}>
                <option value="">Select account</option>
                {accounts.map(a => <option value={a.id} key={a.id}>{a.code} — {a.name}</option>)}
              </select>
              <input inputMode="decimal" placeholder="Debit" value={line.debit} onChange={e => updateLine(i, 'debit', e.target.value)} />
              <input inputMode="decimal" placeholder="Credit" value={line.credit} onChange={e => updateLine(i, 'credit', e.target.value)} />
              {journal.lines.length > 2 && (
                <button type="button" className="remove" onClick={() => setJournal({ ...journal, lines: journal.lines.filter((_, index) => index !== i) })}>×</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="text-button" onClick={() => setJournal({ ...journal, lines: [...journal.lines, { accountId: '', debit: '', credit: '' }] })}>＋ Add line</button>
        <div className="entry-footer">
          <div>
            <span>Debits <b>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.debit)}</b></span>
            <span>Credits <b>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.credit)}</b></span>
            {totals.debit !== totals.credit && <em>Entry must balance</em>}
          </div>
          <button className="primary" disabled={totals.debit !== totals.credit || saving}>{saving ? 'Posting…' : 'Post entry'}</button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">DATE</TableHead>
              <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider">REFERENCE</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">DESCRIPTION</TableHead>
              <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">LINES</TableHead>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATUS</TableHead>
              <TableHead className="w-64 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {initialEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-xs text-slate-400">
                  No journal entries yet. Create one above, then Submit → Approve → Post through the lifecycle.
                </TableCell>
              </TableRow>
            )}
            {initialEntries.map(e => {
              const step = STATUS_STEPS[e.status || 'Draft'] ?? 0;
              return (
                <TableRow key={e.id} className="hover:bg-slate-50/80">
                  <TableCell className="py-3 pl-4 font-mono text-xs text-slate-600">{e.date?.slice(0, 10)}</TableCell>
                  <TableCell className="py-3 font-mono text-xs font-bold text-slate-800">{e.reference}</TableCell>
                  <TableCell className="py-3 text-xs font-semibold text-slate-800">{e.description}</TableCell>
                  <TableCell className="py-3 font-mono text-xs text-slate-600">{e.lines.length}</TableCell>
                  <TableCell className="py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${statusColor(e.status)}`}>
                      {e.status || 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {step < 1 && (
                        <Button size="sm" variant="outline" disabled={actingId === e.id} onClick={() => lifecycle(e.id, 'submit')} className="h-7 px-2.5 text-[11px] gap-1">
                          <Send className="w-3 h-3" /> Submit
                        </Button>
                      )}
                      {step < 2 && step >= 1 && (
                        <Button size="sm" variant="outline" disabled={actingId === e.id} onClick={() => lifecycle(e.id, 'approve')} className="h-7 px-2.5 text-[11px] gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </Button>
                      )}
                      {step < 3 && step >= 1 && (
                        <Button size="sm" disabled={actingId === e.id} onClick={() => lifecycle(e.id, 'post')} className="h-7 px-2.5 text-[11px] gap-1 bg-[#143e2b] hover:bg-[#0f3222]">
                          <Zap className="w-3 h-3" /> Post
                        </Button>
                      )}
                      {step >= 3 && <span className="text-[11px] font-bold text-emerald-600">Posted to GL</span>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};