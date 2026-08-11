import React, { useState, useEffect } from 'react';
import { useCoaStore } from '../stores';
import { Lock, Save, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  isSystem: boolean;
}

interface SystemAccountMappingProps {
  accounts: Account[];
  close: () => void;
  notify: (msg: string) => void;
}

export const SystemAccountMapping: React.FC<SystemAccountMappingProps> = ({ accounts, close, notify }) => {
  const fetchMappings = useCoaStore(s => s.fetchMappings);
  const saveMapping = useCoaStore(s => s.saveMapping);

  const [mappings, setMappings] = useState({
    arAccountId: '',
    apAccountId: '',
    taxAccountId: '',
    revenueAccountId: '',
    cogsAccountId: '',
  });

  // Load mappings from store, fallback to seed accounts by code
  useEffect(() => {
    const load = async () => {
      const activeMappings = await fetchMappings();
      const arMap = activeMappings.find(m => m.mappingKey === 'Customer Receivables');
      const apMap = activeMappings.find(m => m.mappingKey === 'Vendor Payables');
      const taxMap = activeMappings.find(m => m.mappingKey === 'Taxes');
      const revMap = activeMappings.find(m => m.mappingKey === 'Sales');
      const cogsMap = activeMappings.find(m => m.mappingKey === 'Cost of Goods Sold');

      const arSeed = accounts.find(a => a.code === '12000');
      const apSeed = accounts.find(a => a.code === '21100');
      const taxSeed = accounts.find(a => a.code === '22000');
      const revSeed = accounts.find(a => a.code === '41100');
      const cogsSeed = accounts.find(a => a.code === '51000');

      setMappings({
        arAccountId: arMap?.accountId || arSeed?.id || '',
        apAccountId: apMap?.accountId || apSeed?.id || '',
        taxAccountId: taxMap?.accountId || taxSeed?.id || '',
        revenueAccountId: revMap?.accountId || revSeed?.id || '',
        cogsAccountId: cogsMap?.accountId || cogsSeed?.id || '',
      });
    };

    load();
  }, [accounts, fetchMappings]);

  const handleSave = async () => {
    try {
      // Save all mappings to the backend API
      if (mappings.arAccountId) await saveMapping('Customer Receivables', mappings.arAccountId);
      if (mappings.apAccountId) await saveMapping('Vendor Payables', mappings.apAccountId);
      if (mappings.taxAccountId) await saveMapping('Taxes', mappings.taxAccountId);
      if (mappings.revenueAccountId) await saveMapping('Sales', mappings.revenueAccountId);
      if (mappings.cogsAccountId) await saveMapping('Cost of Goods Sold', mappings.cogsAccountId);
      
      notify('✓ Centralized account mappings saved in the database!');
      close();
    } catch (err: any) {
      notify(err.message || 'Error saving account mappings');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset mappings back to seeded system defaults?')) {
      const arSeed = accounts.find(a => a.code === '12000');
      const apSeed = accounts.find(a => a.code === '21100');
      const taxSeed = accounts.find(a => a.code === '22000');
      const revSeed = accounts.find(a => a.code === '41100');
      const cogsSeed = accounts.find(a => a.code === '51000');

      setMappings({
        arAccountId: arSeed?.id || '',
        apAccountId: apSeed?.id || '',
        taxAccountId: taxSeed?.id || '',
        revenueAccountId: revSeed?.id || '',
        cogsAccountId: cogsSeed?.id || '',
      });
      notify('✓ Mappings reset to defaults.');
    }
  };

  // Filter accounts for dropdown lists
  const arAccounts = accounts.filter(a => a.type === 'Asset' || a.type === 'ContraAsset');
  const apAccounts = accounts.filter(a => a.type === 'Liability' || a.type === 'ContraLiability');
  const taxAccounts = accounts.filter(a => a.type === 'Liability');
  const revenueAccounts = accounts.filter(a => a.type === 'Revenue');
  const expenseAccounts = accounts.filter(a => a.type === 'Expense' || a.type === 'ContraExpense');

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={close} 
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              ⚙️ System Account Mapping Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure default accounts for automated posting flows (e.g. Sales Invoicing, Vendor Bills).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="h-9 px-3 gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          
          <button
            onClick={handleSave}
            className="h-9 px-4 gap-1.5 text-xs font-semibold text-white bg-[#143e2b] hover:bg-[#0f3222] rounded-lg shadow-sm transition-colors flex items-center"
          >
            <Save className="w-3.5 h-3.5" />
            Save Configurations
          </button>
        </div>
      </div>

      {/* Info Warning Alert */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }} className="p-4 flex gap-3.5 items-start">
        <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed space-y-1">
          <strong className="text-slate-800 font-bold block">Flexible Accounting Mappings:</strong>
          <p>
            By default, sales invoice posting debits the standard <strong>`12000 - Accounts Receivable`</strong> account. 
            If your business requires invoices to debit a custom account (e.g., <strong>`12100 - Customer Receivables`</strong>), 
            you can create it in the Chart of Accounts and select it below. The posting wizard will auto-fill your choice.
          </p>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Sales & Debits Configuration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <span>📈</span> Sales & Invoice Defaults
          </h3>
          
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Customer Receivables (Invoice Debit)
              </label>
              <select
                value={mappings.arAccountId}
                onChange={e => setMappings(prev => ({ ...prev, arAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Receivable Account --</option>
                {arAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                The account debited when posting invoices to track amount owed by customers.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Sales Revenue (Invoice Credit)
              </label>
              <select
                value={mappings.revenueAccountId}
                onChange={e => setMappings(prev => ({ ...prev, revenueAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Revenue Account --</option>
                {revenueAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                The credit destination account for non-tax line totals of posted sales invoices.
              </span>
            </div>
          </div>
        </div>

        {/* Procurement & Liabilities Configuration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <span>🛒</span> Bills & Vendor Liability Defaults
          </h3>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Vendor Payables (Bill Credit)
              </label>
              <select
                value={mappings.apAccountId}
                onChange={e => setMappings(prev => ({ ...prev, apAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Payable Account --</option>
                {apAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                The account credited when posting vendor bills to track supplier liabilities.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Cost of Goods Sold (COGS)
              </label>
              <select
                value={mappings.cogsAccountId}
                onChange={e => setMappings(prev => ({ ...prev, cogsAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Cost account --</option>
                {expenseAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Default cost offset account when matching physical inventory stock outputs.
              </span>
            </div>
          </div>
        </div>

        {/* Global Taxes Configuration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <span>🏛️</span> Tax & Compliance Defaults
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Tax Payable / VAT Account
              </label>
              <select
                value={mappings.taxAccountId}
                onChange={e => setMappings(prev => ({ ...prev, taxAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Tax Account --</option>
                {taxAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                The account used to record output taxes collected on customer sales or input tax credits.
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Dual Mapping Active
              </span>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                System accounts labeled with 🔒 are protected from structural change, but their mappings can be altered here to allow localization (e.g. VAT vs HST vs US Sales Tax Accounts).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
