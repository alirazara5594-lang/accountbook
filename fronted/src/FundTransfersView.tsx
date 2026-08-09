import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeftRight, Plus } from 'lucide-react';
import type { Entity } from './EntitySettings';

export const FundTransfersView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [transfers, setTransfers] = useState([
    { id: 'tf-1', date: '2026-08-07', reference: 'TRF-3301', sourceAccount: 'Habib Bank Limited (HBL)', targetAccount: 'Meezan Bank Limited', mode: 'RTGS Real-Time', amount: 250000, currency: 'PKR', status: 'Completed' },
    { id: 'tf-2', date: '2026-08-05', reference: 'TRF-3302', sourceAccount: 'Standard Chartered (USD)', targetAccount: 'Habib Bank Limited (HBL)', mode: 'Wire Transfer (FX)', amount: 10000, currency: 'USD', status: 'Completed' }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ sourceAccount: 'Habib Bank Limited (HBL)', targetAccount: 'Meezan Bank Limited', mode: 'RTGS Real-Time', amount: '', reference: `TRF-${Math.floor(1000 + Math.random() * 9000)}` });

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(val);
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) return;

    setTransfers(prev => [{
      id: `tf-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      reference: form.reference,
      sourceAccount: form.sourceAccount,
      targetAccount: form.targetAccount,
      mode: form.mode,
      amount: amt,
      currency: 'PKR',
      status: 'Completed'
    }, ...prev]);

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <ArrowLeftRight className="w-4 h-4 text-emerald-600" /> Banking & Payments
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Inter-Account Fund Transfers</h1>
          <p className="text-xs text-slate-500">Internal liquidity bank-to-bank and cash vault transfers for {currentEntity?.name || 'Active Entity'}.</p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="h-9 px-4 gap-1.5 text-xs font-semibold text-white bg-[#143e2b]">
          <Plus className="w-4 h-4" /> New Inter-Bank Transfer
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">DATE</TableHead>
              <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider">REFERENCE</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SOURCE ACCOUNT</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TARGET ACCOUNT</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TRANSFER MODE</TableHead>
              <TableHead className="w-36 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">AMOUNT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {transfers.map(t => (
              <TableRow key={t.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3.5 pl-4 font-mono text-xs text-slate-600">{t.date}</TableCell>
                <TableCell className="py-3.5 font-mono text-xs font-bold text-slate-800">{t.reference}</TableCell>
                <TableCell className="py-3.5 text-xs text-slate-700 font-medium">{t.sourceAccount}</TableCell>
                <TableCell className="py-3.5 text-xs text-slate-700 font-medium">{t.targetAccount}</TableCell>
                <TableCell className="py-3.5"><span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">{t.mode}</span></TableCell>
                <TableCell className="py-3.5 text-right font-mono text-xs font-bold text-slate-900 pr-4">{formatCurrency(t.amount, t.currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">New Inter-Account Transfer</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Source Account (Out)</label>
                <select value={form.sourceAccount} onChange={e => setForm({ ...form, sourceAccount: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs">
                  <option value="Habib Bank Limited (HBL)">Habib Bank Limited (HBL)</option>
                  <option value="Standard Chartered (USD)">Standard Chartered (USD)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Account (In)</label>
                <select value={form.targetAccount} onChange={e => setForm({ ...form, targetAccount: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs">
                  <option value="Meezan Bank Limited">Meezan Bank Limited</option>
                  <option value="Head Office Petty Cash Vault">Head Office Petty Cash Vault</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Transfer Mode</label>
                  <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs">
                    <option value="RTGS Real-Time">RTGS Real-Time</option>
                    <option value="Wire Transfer (FX)">Wire Transfer (FX)</option>
                    <option value="Internal Book Transfer">Internal Book Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amount</label>
                  <Input required type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="h-9 text-xs font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#143e2b] text-white">Execute Transfer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
