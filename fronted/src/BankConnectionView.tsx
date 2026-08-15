import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Building, Zap, RefreshCw } from 'lucide-react';
import type { Entity } from './EntitySettings';
import { useBankingStore } from './stores';

export const BankConnectionView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const { connections, fetchConnections, syncConnection } = useBankingStore();

  useEffect(() => { fetchConnections(activeEntityId); }, [activeEntityId]);

  return (
    <div className="space-y-4 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-600" /> Live Bank Feed Connections
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Backend-driven bank feed status for {currentEntity?.name || 'Active Entity'}.</p>
        </div>
        <button onClick={() => fetchConnections(activeEntityId)}
          className="h-8 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" /> Refresh
        </button>
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
        {connections.length === 0 && <Card className="bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-center"><Link2 className="w-8 h-8 text-slate-400 mb-2" /><h4 className="text-sm font-bold text-slate-800">No Bank Accounts</h4><p className="text-xs text-slate-500">Create bank accounts first, then connection status will appear here.</p></Card>}
      </div>
    </div>
  );
};
