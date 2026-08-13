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
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold"><Link2 className="w-4 h-4 text-indigo-600" /> Banking & Payments</div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Live Bank Feed Connections</h1>
          <p className="text-xs text-slate-500">Backend-driven bank feed status for {currentEntity?.name || 'Active Entity'}.</p>
        </div>
        <Button size="sm" onClick={() => fetchConnections(activeEntityId)} className="h-9 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700"><Zap className="w-4 h-4 mr-1.5" /> Refresh Connections</Button>
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
