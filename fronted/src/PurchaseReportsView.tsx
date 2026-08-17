import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { BarChart3, Search } from 'lucide-react';
import type { Entity } from './EntitySettings';
import { reportsApi } from './api/modules/reports.api';
import { money as fmtMoney } from './lib/currency';

export const PurchaseReportsView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [report, setReport] = useState<any>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    reportsApi.getPurchaseReports({ companyId: activeEntityId }).then(setReport).catch(() => setReport(null));
  }, [activeEntityId]);

  const vendorSpend = report?.vendorSpend || [];
  const filtered = useMemo(() => vendorSpend.filter((v: any) => !query.trim() || v.vendorName.toLowerCase().includes(query.toLowerCase())), [vendorSpend, query]);
  const exportRows = filtered.map((v: any) => [v.vendorName, v.billCount, v.totalBilled, v.amountPaid, v.amountDue]);
  const money = (v: number) => fmtMoney(v);

  const cards = [
    ['Purchase Orders', report?.totalPurchaseOrders || 0, money(report?.purchaseOrderValue)],
    ['Vendor Bills', report?.totalBills || 0, money(report?.totalBilled)],
    ['Open Bills', report?.openBills || 0, money(report?.amountDue)],
    ['Payments', '', money(report?.vendorPayments)],
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800 p-2 md:p-6">
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" /> Purchase Reports
        </h1>
        <p className="text-[10px] text-slate-500 mt-0.5">Purchase orders, vendor bills, payments, and AP exposure for {currentEntity?.name || 'Active Entity'}.</p>
      </div>

      <section className="stats">
        {cards.map(([label, count, value]) => (
          <article key={label as string}>
            <span className="stat-icon blue"><span className="text-sm">📊</span></span>
            <div>
              <small>{(label as string).toUpperCase()}</small>
              <h2>{count}</h2>
              <p>{value}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="relative w-80"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input className="pl-9 h-9 text-xs" placeholder="Search vendors..." value={query} onChange={e => setQuery(e.target.value)} /></div>
        <DataToolbar exportFileName="purchase-reports" exportSheetName="Vendor Spend" exportTitle="Purchase Reports" exportHeaders={['Vendor', 'Bills', 'Total Billed', 'Paid', 'Due']} exportRows={exportRows} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <Table><TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead className="text-right">Bills</TableHead><TableHead className="text-right">Total Billed</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Due</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map((v: any) => <TableRow key={v.vendorId}><TableCell className="font-medium">{v.vendorName}</TableCell><TableCell className="text-right">{v.billCount}</TableCell><TableCell className="text-right font-mono">{money(v.totalBilled)}</TableCell><TableCell className="text-right font-mono">{money(v.amountPaid)}</TableCell><TableCell className="text-right font-mono">{money(v.amountDue)}</TableCell></TableRow>)}</TableBody></Table>
      </div>
    </div>
  );
};
