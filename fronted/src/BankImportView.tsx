import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import type { Entity } from './EntitySettings';

export const BankImportView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <UploadCloud className="w-4 h-4 text-emerald-600" /> Banking & Payments
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Bank Statement Import</h1>
          <p className="text-xs text-slate-500">Upload electronic bank statement files (CSV, OFX, QBO, MT940) for {currentEntity?.name || 'Active Entity'}.</p>
        </div>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-200">
          <CardTitle className="text-base font-bold text-slate-900">Upload Electronic Bank Statement</CardTitle>
          <CardDescription className="text-xs text-slate-500">Import statement files to automatically match with general ledger entries during reconciliation.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-12 text-center bg-slate-50/50 transition-colors">
            <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800 mb-1">Drag & Drop Bank Statement File Here</h4>
            <p className="text-xs text-slate-500 mb-4">Supports CSV, OFX, QBO, MT940, and Excel statement formats</p>
            <Button
              size="sm"
              onClick={() => alert('Statement import file parser initialized. Select your statement file.')}
              className="bg-[#143e2b] text-white hover:bg-[#0f3222] h-9 text-xs font-semibold px-4"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Select Statement File
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
