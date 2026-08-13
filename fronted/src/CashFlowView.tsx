import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { Entity } from './EntitySettings';

export const CashFlowView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);

  const exportHeaders = ['Cash Flow Activity Line Item', 'Amount (PKR)'];
  const exportRows: (string | number)[][] = [
    ['1. Cash Flows from Operating Activities', ''],
    ['Cash Received from Customers & Collections', 12400000],
    ['Cash Paid to Vendors, Suppliers & Operations', -7850000],
    ['2. Cash Flows from Investing & Financing Activities', ''],
    ['Capital Expenditure & Machinery Acquisition', -1200000],
    ['NET INCREASE IN LIQUID CASH & BANK RESERVES', 3350000],
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Banking & Payments
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Cash Flow Statements (IAS 7)</h1>
          <p className="text-xs text-slate-500">Operating, Investing, and Financing Cash Movements for {currentEntity?.name || 'Active Entity'}.</p>
        </div>
        <DataToolbar
          exportFileName="cash-flow-statement"
          exportSheetName="Cash Flow Statement"
          exportTitle="Cash Flow Statements (IAS 7)"
          exportSubtitle={`Direct method statement of cash flows for ${currentEntity?.name || 'Active Entity'} (IAS 7).`}
          exportHeaders={exportHeaders}
          exportRows={exportRows}
        />
      </div>

      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">Statement of Cash Flows</CardTitle>
          <CardDescription className="text-xs text-slate-500">Direct Method Statement of Cash Flows according to International Accounting Standards (IAS 7).</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-xs">CASH FLOW ACTIVITY LINE ITEM</TableHead>
                  <TableHead className="text-right font-bold text-xs">AMOUNT (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                <TableRow className="font-bold bg-slate-50/50">
                  <TableCell colSpan={2} className="text-xs text-slate-900">1. Cash Flows from Operating Activities</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6 text-xs text-slate-600">Cash Received from Customers & Collections</TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-emerald-600">+ 12,400,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6 text-xs text-slate-600">Cash Paid to Vendors, Suppliers & Operations</TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-rose-600">- 7,850,000</TableCell>
                </TableRow>
                <TableRow className="font-bold bg-slate-50/50">
                  <TableCell colSpan={2} className="text-xs text-slate-900">2. Cash Flows from Investing & Financing Activities</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6 text-xs text-slate-600">Capital Expenditure & Machinery Acquisition</TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-rose-600">- 1,200,000</TableCell>
                </TableRow>
                <TableRow className="font-bold bg-emerald-50 text-emerald-900">
                  <TableCell className="text-xs">NET INCREASE IN LIQUID CASH & BANK RESERVES</TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold">+ 3,350,000 PKR</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
