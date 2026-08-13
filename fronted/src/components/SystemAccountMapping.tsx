import React, { useState, useEffect } from 'react';
import { useCoaStore } from '../stores';
import { Save, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';

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
    discountAccountId: '',
    purchasesAccountId: '',
    whtReceivableAccountId: '',
    whtPayableAccountId: '',
    inventoryAccountId: '',
    payrollExpenseAccountId: '',
    payrollPayableAccountId: '',
    payrollTaxPayableAccountId: '',
    pensionPayableAccountId: '',
    
    // Contra and statutory mappings
    allowanceAccountId: '',
    prepaidAccountId: '',
    deferredRevenueAccountId: '',
    salesReturnsAccountId: '',
    purchaseDiscountsAccountId: '',
    purchaseReturnsAccountId: '',

    // Fixed asset mappings
    fixedAssetAccountId: '',
    accumulatedDepreciationAccountId: '',
    depreciationExpenseAccountId: '',
    gainLossDisposalAccountId: '',

    // Manufacturing mappings
    rawMaterialsAccountId: '',
    workInProgressAccountId: '',
    finishedGoodsAccountId: '',
    directLaborAccountId: '',
    manufacturingOverheadAccountId: '',
    grniAccrualAccountId: '',
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
      const discMap = activeMappings.find(m => m.mappingKey === 'Sales Discount');
      const purchasesMap = activeMappings.find(m => m.mappingKey === 'Purchases');
      const whtRecMap = activeMappings.find(m => m.mappingKey === 'WHT Receivable');
      const whtPayMap = activeMappings.find(m => m.mappingKey === 'WHT Payable');
      const invMap = activeMappings.find(m => m.mappingKey === 'Inventory');
      const payExpMap = activeMappings.find(m => m.mappingKey === 'Payroll Expense');
      const payAccMap = activeMappings.find(m => m.mappingKey === 'Accrued Salaries');
      const payTaxMap = activeMappings.find(m => m.mappingKey === 'Payroll Taxes Accrued');
      const penAccMap = activeMappings.find(m => m.mappingKey === 'Pension Fund Accrued');
      
      // New mappings
      const allowMap = activeMappings.find(m => m.mappingKey === 'Allowance for Doubtful Accounts');
      const prepMap = activeMappings.find(m => m.mappingKey === 'Prepaid Expenses');
      const defRevMap = activeMappings.find(m => m.mappingKey === 'Deferred Revenue');
      const salesRetMap = activeMappings.find(m => m.mappingKey === 'Sales Returns');
      const purDiscMap = activeMappings.find(m => m.mappingKey === 'Purchase Discounts');
      const purRetMap = activeMappings.find(m => m.mappingKey === 'Purchase Returns');

      // Fixed asset & manufacturing mappings
      const faMap = activeMappings.find(m => m.mappingKey === 'Fixed Assets');
      const accumDeprMap = activeMappings.find(m => m.mappingKey === 'Accumulated Depreciation');
      const deprExpMap = activeMappings.find(m => m.mappingKey === 'Depreciation Expense');
      const gainLossMap = activeMappings.find(m => m.mappingKey === 'Gain/Loss on Disposal');
      const rawMatMap = activeMappings.find(m => m.mappingKey === 'Raw Materials Inventory');
      const wipMap = activeMappings.find(m => m.mappingKey === 'Work in Progress');
      const fgMap = activeMappings.find(m => m.mappingKey === 'Finished Goods Inventory');
      const laborMap = activeMappings.find(m => m.mappingKey === 'Direct Labor');
      const overheadMap = activeMappings.find(m => m.mappingKey === 'Manufacturing Overhead');
      const grniMap = activeMappings.find(m => m.mappingKey === 'GRNI Accrual');

      const arSeed = accounts.find(a => a.code === '12000');
      const apSeed = accounts.find(a => a.code === '21100');
      const taxSeed = accounts.find(a => a.code === '22000');
      const revSeed = accounts.find(a => a.code === '41100');
      const cogsSeed = accounts.find(a => a.code === '51000');
      const discSeed = accounts.find(a => a.code === '41200');
      const purchasesSeed = accounts.find(a => a.code === '61100');
      const whtRecSeed = accounts.find(a => a.code === '12200');
      const whtPaySeed = accounts.find(a => a.code === '22100');
      const invSeed = accounts.find(a => a.code === '13000');
      const payExpSeed = accounts.find(a => a.code === '61200');
      const payAccSeed = accounts.find(a => a.code === '21300');
      const payTaxSeed = accounts.find(a => a.code === '21400');
      const penAccSeed = accounts.find(a => a.code === '21500');
      
      const allowSeed = accounts.find(a => a.code === '12100');
      const prepSeed = accounts.find(a => a.code === '14000');
      const defRevSeed = accounts.find(a => a.code === '23000');
      const salesRetSeed = accounts.find(a => a.code === '41300');
      const purDiscSeed = accounts.find(a => a.code === '51100');
      const purRetSeed = accounts.find(a => a.code === '51200');

      const faSeed = accounts.find(a => a.code === '15100');
      const accumDeprSeed = accounts.find(a => a.code === '15200');
      const deprExpSeed = accounts.find(a => a.code === '61300');
      const gainLossSeed = accounts.find(a => a.code === '51000');
      const rawMatSeed = accounts.find(a => a.code === '13000');
      const wipSeed = accounts.find(a => a.code === '13000');
      const fgSeed = accounts.find(a => a.code === '13000');
      const laborSeed = accounts.find(a => a.code === '61200');
      const overheadSeed = accounts.find(a => a.code === '61100');
      const grniSeed = accounts.find(a => a.code === '21200');

      setMappings({
        arAccountId: arMap?.accountId || arSeed?.id || '',
        apAccountId: apMap?.accountId || apSeed?.id || '',
        taxAccountId: taxMap?.accountId || taxSeed?.id || '',
        revenueAccountId: revMap?.accountId || revSeed?.id || '',
        cogsAccountId: cogsMap?.accountId || cogsSeed?.id || '',
        discountAccountId: discMap?.accountId || discSeed?.id || '',
        purchasesAccountId: purchasesMap?.accountId || purchasesSeed?.id || '',
        whtReceivableAccountId: whtRecMap?.accountId || whtRecSeed?.id || '',
        whtPayableAccountId: whtPayMap?.accountId || whtPaySeed?.id || '',
        inventoryAccountId: invMap?.accountId || invSeed?.id || '',
        payrollExpenseAccountId: payExpMap?.accountId || payExpSeed?.id || '',
        payrollPayableAccountId: payAccMap?.accountId || payAccSeed?.id || '',
        payrollTaxPayableAccountId: payTaxMap?.accountId || payTaxSeed?.id || '',
        pensionPayableAccountId: penAccMap?.accountId || penAccSeed?.id || '',
        
        allowanceAccountId: allowMap?.accountId || allowSeed?.id || '',
        prepaidAccountId: prepMap?.accountId || prepSeed?.id || '',
        deferredRevenueAccountId: defRevMap?.accountId || defRevSeed?.id || '',
        salesReturnsAccountId: salesRetMap?.accountId || salesRetSeed?.id || '',
        purchaseDiscountsAccountId: purDiscMap?.accountId || purDiscSeed?.id || '',
        purchaseReturnsAccountId: purRetMap?.accountId || purRetSeed?.id || '',

        fixedAssetAccountId: faMap?.accountId || faSeed?.id || '',
        accumulatedDepreciationAccountId: accumDeprMap?.accountId || accumDeprSeed?.id || '',
        depreciationExpenseAccountId: deprExpMap?.accountId || deprExpSeed?.id || '',
        gainLossDisposalAccountId: gainLossMap?.accountId || gainLossSeed?.id || '',

        rawMaterialsAccountId: rawMatMap?.accountId || rawMatSeed?.id || '',
        workInProgressAccountId: wipMap?.accountId || wipSeed?.id || '',
        finishedGoodsAccountId: fgMap?.accountId || fgSeed?.id || '',
        directLaborAccountId: laborMap?.accountId || laborSeed?.id || '',
        manufacturingOverheadAccountId: overheadMap?.accountId || overheadSeed?.id || '',
        grniAccrualAccountId: grniMap?.accountId || grniSeed?.id || '',
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
      if (mappings.discountAccountId) await saveMapping('Sales Discount', mappings.discountAccountId);
      if (mappings.purchasesAccountId) await saveMapping('Purchases', mappings.purchasesAccountId);
      if (mappings.whtReceivableAccountId) await saveMapping('WHT Receivable', mappings.whtReceivableAccountId);
      if (mappings.whtPayableAccountId) await saveMapping('WHT Payable', mappings.whtPayableAccountId);
      if (mappings.inventoryAccountId) await saveMapping('Inventory', mappings.inventoryAccountId);
      if (mappings.payrollExpenseAccountId) await saveMapping('Payroll Expense', mappings.payrollExpenseAccountId);
      if (mappings.payrollPayableAccountId) await saveMapping('Accrued Salaries', mappings.payrollPayableAccountId);
      if (mappings.payrollTaxPayableAccountId) await saveMapping('Payroll Taxes Accrued', mappings.payrollTaxPayableAccountId);
      if (mappings.pensionPayableAccountId) await saveMapping('Pension Fund Accrued', mappings.pensionPayableAccountId);

      if (mappings.allowanceAccountId) await saveMapping('Allowance for Doubtful Accounts', mappings.allowanceAccountId);
      if (mappings.prepaidAccountId) await saveMapping('Prepaid Expenses', mappings.prepaidAccountId);
      if (mappings.deferredRevenueAccountId) await saveMapping('Deferred Revenue', mappings.deferredRevenueAccountId);
      if (mappings.salesReturnsAccountId) await saveMapping('Sales Returns', mappings.salesReturnsAccountId);
      if (mappings.purchaseDiscountsAccountId) await saveMapping('Purchase Discounts', mappings.purchaseDiscountsAccountId);
      if (mappings.purchaseReturnsAccountId) await saveMapping('Purchase Returns', mappings.purchaseReturnsAccountId);

      if (mappings.fixedAssetAccountId) await saveMapping('Fixed Assets', mappings.fixedAssetAccountId);
      if (mappings.accumulatedDepreciationAccountId) await saveMapping('Accumulated Depreciation', mappings.accumulatedDepreciationAccountId);
      if (mappings.depreciationExpenseAccountId) await saveMapping('Depreciation Expense', mappings.depreciationExpenseAccountId);
      if (mappings.gainLossDisposalAccountId) await saveMapping('Gain/Loss on Disposal', mappings.gainLossDisposalAccountId);

      if (mappings.rawMaterialsAccountId) await saveMapping('Raw Materials Inventory', mappings.rawMaterialsAccountId);
      if (mappings.workInProgressAccountId) await saveMapping('Work in Progress', mappings.workInProgressAccountId);
      if (mappings.finishedGoodsAccountId) await saveMapping('Finished Goods Inventory', mappings.finishedGoodsAccountId);
      if (mappings.directLaborAccountId) await saveMapping('Direct Labor', mappings.directLaborAccountId);
      if (mappings.manufacturingOverheadAccountId) await saveMapping('Manufacturing Overhead', mappings.manufacturingOverheadAccountId);
      if (mappings.grniAccrualAccountId) await saveMapping('GRNI Accrual', mappings.grniAccrualAccountId);

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
      const discSeed = accounts.find(a => a.code === '41200');
      const purchasesSeed = accounts.find(a => a.code === '61100');
      const whtRecSeed = accounts.find(a => a.code === '12200');
      const whtPaySeed = accounts.find(a => a.code === '22100');
      const invSeed = accounts.find(a => a.code === '13000');
      const payExpSeed = accounts.find(a => a.code === '61200');
      const payAccSeed = accounts.find(a => a.code === '21300');
      const payTaxSeed = accounts.find(a => a.code === '21400');
      const penAccSeed = accounts.find(a => a.code === '21500');

      const allowSeed = accounts.find(a => a.code === '12100');
      const prepSeed = accounts.find(a => a.code === '14000');
      const defRevSeed = accounts.find(a => a.code === '23000');
      const salesRetSeed = accounts.find(a => a.code === '41300');
      const purDiscSeed = accounts.find(a => a.code === '51100');
      const purRetSeed = accounts.find(a => a.code === '51200');

      const faSeed = accounts.find(a => a.code === '15100');
      const accumDeprSeed = accounts.find(a => a.code === '15200');
      const deprExpSeed = accounts.find(a => a.code === '61300');
      const gainLossSeed = accounts.find(a => a.code === '51000');
      const rawMatSeed = accounts.find(a => a.code === '13000');
      const wipSeed = accounts.find(a => a.code === '13000');
      const fgSeed = accounts.find(a => a.code === '13000');
      const laborSeed = accounts.find(a => a.code === '61200');
      const overheadSeed = accounts.find(a => a.code === '61100');
      const grniSeed = accounts.find(a => a.code === '21200');

      setMappings({
        arAccountId: arSeed?.id || '',
        apAccountId: apSeed?.id || '',
        taxAccountId: taxSeed?.id || '',
        revenueAccountId: revSeed?.id || '',
        cogsAccountId: cogsSeed?.id || '',
        discountAccountId: discSeed?.id || '',
        purchasesAccountId: purchasesSeed?.id || '',
        whtReceivableAccountId: whtRecSeed?.id || '',
        whtPayableAccountId: whtPaySeed?.id || '',
        inventoryAccountId: invSeed?.id || '',
        payrollExpenseAccountId: payExpSeed?.id || '',
        payrollPayableAccountId: payAccSeed?.id || '',
        payrollTaxPayableAccountId: payTaxSeed?.id || '',
        pensionPayableAccountId: penAccSeed?.id || '',

        allowanceAccountId: allowSeed?.id || '',
        prepaidAccountId: prepSeed?.id || '',
        deferredRevenueAccountId: defRevSeed?.id || '',
        salesReturnsAccountId: salesRetSeed?.id || '',
        purchaseDiscountsAccountId: purDiscSeed?.id || '',
        purchaseReturnsAccountId: purRetSeed?.id || '',

        fixedAssetAccountId: faSeed?.id || '',
        accumulatedDepreciationAccountId: accumDeprSeed?.id || '',
        depreciationExpenseAccountId: deprExpSeed?.id || '',
        gainLossDisposalAccountId: gainLossSeed?.id || '',

        rawMaterialsAccountId: rawMatSeed?.id || '',
        workInProgressAccountId: wipSeed?.id || '',
        finishedGoodsAccountId: fgSeed?.id || '',
        directLaborAccountId: laborSeed?.id || '',
        manufacturingOverheadAccountId: overheadSeed?.id || '',
        grniAccrualAccountId: grniSeed?.id || '',
      });
      notify('✓ Mappings reset to defaults.');
    }
  };

  // Filter accounts for dropdown lists
  const arAccounts = accounts.filter(a => a.type === 'Asset' || a.type === 'ContraAsset');
  const apAccounts = accounts.filter(a => a.type === 'Liability' || a.type === 'ContraLiability');
  const taxAccounts = accounts.filter(a => a.type === 'Liability');
  const revenueAccounts = accounts.filter(a => a.type === 'Revenue' || a.type === 'ContraRevenue');
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
              Configure default accounts for automated posting flows (e.g. Sales Invoicing, Payroll, Taxes, Inventory).
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
            System default operations automap calculations to seeded posting accounts. For custom statutory policies, VAT brackets, or payroll benefits, you can create new ledgers in the Chart of Accounts and map them below.
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Allowance for Doubtful Accounts (Contra-Receivable)
              </label>
              <select
                value={mappings.allowanceAccountId}
                onChange={e => setMappings(prev => ({ ...prev, allowanceAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Allowance Account --</option>
                {arAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Sales Discount (Contra-Revenue)
              </label>
              <select
                value={mappings.discountAccountId}
                onChange={e => setMappings(prev => ({ ...prev, discountAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Discount Account --</option>
                {revenueAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sales Returns & Allowances (Contra-Revenue)
              </label>
              <select
                value={mappings.salesReturnsAccountId}
                onChange={e => setMappings(prev => ({ ...prev, salesReturnsAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Returns Account --</option>
                {revenueAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Purchases / Inventory Expense (Vendor Bill Debit)
              </label>
              <select
                value={mappings.purchasesAccountId}
                onChange={e => setMappings(prev => ({ ...prev, purchasesAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Purchases account --</option>
                {expenseAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Purchase Discounts (Contra-Expense)
              </label>
              <select
                value={mappings.purchaseDiscountsAccountId}
                onChange={e => setMappings(prev => ({ ...prev, purchaseDiscountsAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Purchase Discount --</option>
                {expenseAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Purchase Returns & Allowances (Contra-Expense)
              </label>
              <select
                value={mappings.purchaseReturnsAccountId}
                onChange={e => setMappings(prev => ({ ...prev, purchaseReturnsAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Purchase Returns --</option>
                {expenseAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inventory & Asset Configuration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <span>📦</span> Inventory & Asset Control
          </h3>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Inventory Asset Account
              </label>
              <select
                value={mappings.inventoryAccountId}
                onChange={e => setMappings(prev => ({ ...prev, inventoryAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Inventory Account --</option>
                {arAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Prepaid Expenses Account (Asset)
              </label>
              <select
                value={mappings.prepaidAccountId}
                onChange={e => setMappings(prev => ({ ...prev, prepaidAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Prepaid Account --</option>
                {arAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fixed Assets Account (Non-Current Asset)
              </label>
              <select
                value={mappings.fixedAssetAccountId}
                onChange={e => setMappings(prev => ({ ...prev, fixedAssetAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Fixed Assets Account --</option>
                {arAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Accumulated Depreciation (Contra-Asset)
              </label>
              <select
                value={mappings.accumulatedDepreciationAccountId}
                onChange={e => setMappings(prev => ({ ...prev, accumulatedDepreciationAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Accumulated Depreciation --</option>
                {arAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Depreciation Expense (P&L)
              </label>
              <select
                value={mappings.depreciationExpenseAccountId}
                onChange={e => setMappings(prev => ({ ...prev, depreciationExpenseAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Depreciation Expense --</option>
                {expenseAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Gain / Loss on Asset Disposal (P&L)
              </label>
              <select
                value={mappings.gainLossDisposalAccountId}
                onChange={e => setMappings(prev => ({ ...prev, gainLossDisposalAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Gain / Loss Account --</option>
                {expenseAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Manufacturing & Production Configuration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <span>🏭</span> Manufacturing & Work Orders
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Raw Materials Inventory (Asset)
              </label>
              <select
                value={mappings.rawMaterialsAccountId}
                onChange={e => setMappings(prev => ({ ...prev, rawMaterialsAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Raw Materials Account --</option>
                {arAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work in Progress (WIP) Inventory
              </label>
              <select
                value={mappings.workInProgressAccountId}
                onChange={e => setMappings(prev => ({ ...prev, workInProgressAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose WIP Account --</option>
                {arAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Finished Goods Inventory (Asset)
              </label>
              <select
                value={mappings.finishedGoodsAccountId}
                onChange={e => setMappings(prev => ({ ...prev, finishedGoodsAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Finished Goods Account --</option>
                {arAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Direct Labor (P&L)
              </label>
              <select
                value={mappings.directLaborAccountId}
                onChange={e => setMappings(prev => ({ ...prev, directLaborAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Direct Labor Account --</option>
                {expenseAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Manufacturing Overhead (P&L)
              </label>
              <select
                value={mappings.manufacturingOverheadAccountId}
                onChange={e => setMappings(prev => ({ ...prev, manufacturingOverheadAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Manufacturing Overhead Account --</option>
                {expenseAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                GRNI Accrual (Goods Received Not Invoiced)
              </label>
              <select
                value={mappings.grniAccrualAccountId}
                onChange={e => setMappings(prev => ({ ...prev, grniAccrualAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose GRNI Account --</option>
                {apAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Global Taxes & Withholding Tax (WHT) Configuration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <span>🏛️</span> Tax & Withholding (WHT) Defaults
          </h3>

          <div className="space-y-3.5">
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Withholding Tax (WHT) Receivable (Asset)
              </label>
              <select
                value={mappings.whtReceivableAccountId}
                onChange={e => setMappings(prev => ({ ...prev, whtReceivableAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose WHT Asset Account --</option>
                {arAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Withholding Tax (WHT) Payable (Liability)
              </label>
              <select
                value={mappings.whtPayableAccountId}
                onChange={e => setMappings(prev => ({ ...prev, whtPayableAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose WHT Liability Account --</option>
                {apAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Deferred Revenue Account (Liability)
              </label>
              <select
                value={mappings.deferredRevenueAccountId}
                onChange={e => setMappings(prev => ({ ...prev, deferredRevenueAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Deferred Revenue --</option>
                {apAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payroll & Statutory Liability Configuration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <span>👥</span> Payroll & Statutory Accruals
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Salaries & Wages Expense
              </label>
              <select
                value={mappings.payrollExpenseAccountId}
                onChange={e => setMappings(prev => ({ ...prev, payrollExpenseAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Payroll Expense Account --</option>
                {expenseAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Accrued Salaries Payable (Liability)
              </label>
              <select
                value={mappings.payrollPayableAccountId}
                onChange={e => setMappings(prev => ({ ...prev, payrollPayableAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Salary Payable Account --</option>
                {apAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payroll Tax Withholding Payable (Statutory)
              </label>
              <select
                value={mappings.payrollTaxPayableAccountId}
                onChange={e => setMappings(prev => ({ ...prev, payrollTaxPayableAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Payroll Tax Account --</option>
                {apAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pension / Provident Fund Payable (Retirement Accruals)
              </label>
              <select
                value={mappings.pensionPayableAccountId}
                onChange={e => setMappings(prev => ({ ...prev, pensionPayableAccountId: e.target.value }))}
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-slate-400 outline-none transition-colors"
              >
                <option value="">-- Choose Pension Account --</option>
                {apAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
