import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Building, Zap, RefreshCw } from 'lucide-react';
import type { Entity } from './EntitySettings';
import { useBankingStore } from './stores';
import { EmptyState } from '@/components/ui/empty-state';

export const BankConnectionView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const { connections, fetchConnections, syncConnection } = useBankingStore();

  useEffect(() => { fetchConnections(activeEntityId); }, [activeEntityId]);

  return (
    <div className="space-y-4 font-sans text-slate-800 p-2 md:p-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-blue-500 to-cyan-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Link2 className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Live Bank Feed Connections</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Backend-driven bank feed status for {currentEntity?.name || 'Active Entity'}.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => fetchConnections(activeEntityId)}
              className="h-8 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-lg whitespace-nowrap flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {connections.map(conn => (
          <Card key={conn.id} className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start"><Building className="w-6 h-6 text-emerald-600" /><Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">{conn.status}</Badge></div>
              <CardTitle className="text-base font-bold text-slate-900 mt-2">{conn.provider}</CardTitle>
              <CardDescription className="text-xs text-slate-500">{conn.feedType}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="text-xs text-slate-600"><p><span className="font-semibold text-slate-800">Account:</span> {conn.accountNumber}</p><p><span className="font-semibold text-slate-800">Last Sync:</span> {conn.updatedAt ? new Date(conn.updatedAt).toLocaleString() : 'Never'}</p></div>
              <Button variant="outline" size="sm" onClick={() => syncConnection(conn.id, activeEntityId)} className="w-full text-xs gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Sync Transactions Now</Button>
            </CardContent>
          </Card>
        ))}
        {connections.length === 0 && <Card className="bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col justify-center p-6"><EmptyState icon={Link2} title="No Bank Accounts" hint="Create bank accounts first, then connection status will appear here." /></Card>}
      </div>
    </div>
  );
};
