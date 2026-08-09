import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import type { Entity } from './EntitySettings';

export const BankReconciliationView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [selectedBank, setSelectedBank] = useState('Habib Bank Limited (HBL)');
  const [statementBalance, setStatementBalance] = useState('4500000');

  const formatCurrency = (val: number, currency = 'PKR') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <RefreshCw className="w-4 h-4 text-emerald-600" /> Banking & Payments
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Bank Statement Reconciliation Engine</h1>
          <p className="text-xs text-slate-500">Match General Ledger entries against bank statement records for {currentEntity?.name || 'Active Entity'}.</p>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Reconcile Bank Account</CardTitle>
              <CardDescription className="text-xs text-slate-500">IAS 7 Statement Audit & Cleared Lines Matching.</CardDescription>
            </div>
            <select
              value={selectedBank}
              onChange={e => setSelectedBank(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
            >
              <option value="Habib Bank Limited (HBL)">Habib Bank Limited (HBL)</option>
              <option value="Meezan Bank Limited">Meezan Bank Limited</option>
              <option value="Standard Chartered (USD)">Standard Chartered (USD)</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-xs font-medium text-slate-500">General Ledger Book Balance</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(4500000)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Bank Statement Balance</p>
              <Input
                type="number"
                value={statementBalance}
                onChange={e => setStatementBalance(e.target.value)}
                className="h-8 w-44 mt-1 font-mono text-xs font-bold text-slate-900 border-slate-300"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Unreconciled Difference</p>
              <p className={`text-lg font-bold ${Math.abs(4500000 - (parseFloat(statementBalance) || 0)) === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(4500000 - (parseFloat(statementBalance) || 0))}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={() => alert(`Statement Reconciliation completed for ${selectedBank}!`)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-9 px-4"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Complete Statement Reconciliation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
