import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Building, Zap, RefreshCw } from 'lucide-react';
import type { Entity } from './EntitySettings';

export const BankConnectionView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Link2 className="w-4 h-4 text-indigo-600" /> Banking & Payments
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Live Bank Feed Connections</h1>
          <p className="text-xs text-slate-500">Secure automated Open Banking, Plaid, and Yodlee API connections for {currentEntity?.name || 'Active Entity'}.</p>
        </div>
        <Button size="sm" onClick={() => alert('Bank Connection Portal initialized. Select your banking provider.')} className="h-9 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700">
          <Zap className="w-4 h-4 mr-1.5" /> Connect Institution
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <Building className="w-6 h-6 text-emerald-600" />
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Connected</Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 mt-2">Habib Bank Limited (HBL)</CardTitle>
            <CardDescription className="text-xs text-slate-500">Corporate Open Banking Feed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="text-xs text-slate-600">
              <p><span className="font-semibold text-slate-800">Account:</span> 00012345678901</p>
              <p><span className="font-semibold text-slate-800">Last Sync:</span> Today at 02:15 AM</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => alert('Syncing HBL Bank Feed...')} className="w-full text-xs gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Sync Transactions Now
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <Building className="w-6 h-6 text-indigo-600" />
              <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">Connected</Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 mt-2">Standard Chartered USA</CardTitle>
            <CardDescription className="text-xs text-slate-500">Plaid Automated API Feed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="text-xs text-slate-600">
              <p><span className="font-semibold text-slate-800">Account:</span> SCB-USD-992144</p>
              <p><span className="font-semibold text-slate-800">Last Sync:</span> Today at 01:45 AM</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => alert('Syncing SCB Feed...')} className="w-full text-xs gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Sync Transactions Now
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-center">
          <Link2 className="w-8 h-8 text-slate-400 mb-2" />
          <h4 className="text-sm font-bold text-slate-800">Add Bank Integration</h4>
          <p className="text-xs text-slate-500 mb-4">Connect Meezan Bank, CitiBank, HSBC, or Dubai Islamic Bank.</p>
          <Button size="sm" onClick={() => alert('Opening Bank Connect Modal...')} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8">
            + Connect Bank Feed
          </Button>
        </Card>
      </div>
    </div>
  );
};
