import React, { useState, useEffect, useMemo } from 'react';
import { accountingApi, type AuditTrailItem } from './api/modules/accounting.api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, ScrollText } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { Entity } from './EntitySettings';

interface AuditTrailViewProps {
  activeEntityId: string;
  entities: Entity[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [items, setItems] = useState<AuditTrailItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [limit, setLimit] = useState(200);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit };
      if (activeEntityId) params.companyId = activeEntityId;
      const data = await accountingApi.getAuditTrail(params);
      setItems(data || []);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeEntityId, limit]);

  const entitiesPresent = useMemo(() => ['All', ...new Set(items.map(i => i.entity))], [items]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (entityFilter !== 'All' && i.entity !== entityFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!i.entityName.toLowerCase().includes(q) && !i.detail.toLowerCase().includes(q) && !i.action.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, query, entityFilter]);

  const exportHeaders = ['Timestamp', 'Action', 'Entity', 'Entity Name', 'Detail', 'Company'];
  const exportRows = filtered.map(i => [i.at, i.action, i.entity, i.entityName, i.detail, i.companyId || '']);

  const formatTime = (at: string) => {
    const d = new Date(at);
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <ScrollText className="w-4 h-4 text-indigo-600" /> Accounting & Finance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Audit Trail</h1>
          <p className="text-xs text-slate-500">
            Immutable event log across the ERP for {currentEntity?.name || 'Active Entity'} — account changes,
            journal lifecycle events and system actions (IAS 8 / audit evidence requirements).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataToolbar
            exportFileName="audit-trail"
            exportSheetName="Audit Trail"
            exportTitle="Audit Trail"
            exportSubtitle={`Immutable event log for ${currentEntity?.name || 'Active Entity'} (IAS 8 / audit evidence).`}
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            onRefresh={load}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search action, entity, detail..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9 h-9 bg-white text-xs" />
        </div>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none">
          {entitiesPresent.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={String(limit)} onChange={e => setLimit(parseInt(e.target.value))} className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none">
          <option value="100">100 rows</option>
          <option value="200">200 rows</option>
          <option value="500">500 rows</option>
        </select>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading audit trail…</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-40 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">TIMESTAMP</TableHead>
              <TableHead className="w-36 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ACTION</TableHead>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ENTITY</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ENTITY NAME</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">DETAIL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {filtered.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-xs text-slate-400">
                  No audit events yet. Account edits and journal lifecycle actions will appear here.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((i, idx) => (
              <TableRow key={`${i.at}-${idx}`} className="hover:bg-slate-50/80">
                <TableCell className="py-3 pl-4 font-mono text-[11px] text-slate-500">{formatTime(i.at)}</TableCell>
                <TableCell className="py-3">
                  <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">{i.action}</span>
                </TableCell>
                <TableCell className="py-3 text-xs font-bold text-slate-800">{i.entity}</TableCell>
                <TableCell className="py-3 text-xs text-slate-700">{i.entityName}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{i.detail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};