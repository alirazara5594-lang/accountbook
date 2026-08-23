import React, { useState, useEffect, useMemo } from 'react';
import { useCoaStore } from '../stores';
import {
  Save, RefreshCw, HelpCircle,
  TrendingUp, ShoppingCart, Package, Building2, Users, Globe,
} from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  isSystem?: boolean;
}

interface SystemAccountMappingProps {
  accounts: Account[];
  close: () => void;
  notify?: (msg: string) => void;
}

export const SystemAccountMapping: React.FC<SystemAccountMappingProps> = ({ accounts, close, notify }) => {
  const fetchMappings = useCoaStore(s => s.fetchMappings);
  const saveMapping = useCoaStore(s => s.saveMapping);

  const [activeCategory, setActiveCategory] = useState<'all' | 'sales' | 'purchases' | 'inventory' | 'assets' | 'payroll' | 'intercompany'>('all');
  const [saving, setSaving] = useState(false);

  const [mappings, setMappings] = useState<Record<string, string>>({
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
    employerContribExpenseAccountId: '',
    payrollPayableAccountId: '',
    payrollTaxPayableAccountId: '',
    eobiPayableAccountId: '',
    pensionPayableAccountId: '',
    allowanceAccountId: '',
    prepaidAccountId: '',
    deferredRevenueAccountId: '',
    salesReturnsAccountId: '',
    purchaseDiscountsAccountId: '',
    purchaseReturnsAccountId: '',
    fixedAssetAccountId: '',
    accumulatedDepreciationAccountId: '',
    depreciationExpenseAccountId: '',
    gainLossDisposalAccountId: '',
    rawMaterialsAccountId: '',
    workInProgressAccountId: '',
    finishedGoodsAccountId: '',
    directLaborAccountId: '',
    manufacturingOverheadAccountId: '',
    grniAccrualAccountId: '',
    rouAssetAccountId: '',
    leaseLiabilityAccountId: '',
    interestExpenseAccountId: '',
    icReceivableAccountId: '',
    icClearingAccountId: '',
    icAllocationExpenseId: '',
    overheadAllocationExpenseId: '',
    overheadAllocationPayableId: '',
  });

  useEffect(() => {
    const load = async () => {
      const activeMappings = await fetchMappings();
      const getAccId = (key: string, defaultCode: string) => {
        const found = activeMappings.find(m => m.mappingKey === key);
        if (found?.accountId) return found.accountId;
        const seed = accounts.find(a => a.code === defaultCode);
        return seed?.id || '';
      };

      setMappings({
        arAccountId: getAccId('Customer Receivables', '12000'),
        apAccountId: getAccId('Vendor Payables', '21100'),
        taxAccountId: getAccId('Taxes', '22000'),
        revenueAccountId: getAccId('Sales', '41100'),
        cogsAccountId: getAccId('Cost of Goods Sold', '51000'),
        discountAccountId: getAccId('Sales Discount', '41200'),
        purchasesAccountId: getAccId('Purchases', '61100'),
        whtReceivableAccountId: getAccId('WHT Receivable', '12200'),
        whtPayableAccountId: getAccId('WHT Payable', '22100'),
        inventoryAccountId: getAccId('Inventory', '13000'),
        // Payroll mappings aligned 1-to-1 with payroll run columns
        payrollExpenseAccountId: getAccId('Payroll Expense', '61200'),
        employerContribExpenseAccountId: getAccId('Employer Payroll Contributions Expense', '61250') || getAccId('Payroll Expense', '61200'),
        payrollPayableAccountId: getAccId('Accrued Salaries', '21300'),
        payrollTaxPayableAccountId: getAccId('Payroll Taxes Accrued', '21400'),
        eobiPayableAccountId: getAccId('EOBI & Social Security Accrued', '21500') || getAccId('Pension Fund Accrued', '21500'),
        pensionPayableAccountId: getAccId('Provident Fund Accrued', '21510') || getAccId('Pension Fund Accrued', '21500'),
        allowanceAccountId: getAccId('Allowance for Doubtful Accounts', '12100'),
        prepaidAccountId: getAccId('Prepaid Expenses', '14000'),
        deferredRevenueAccountId: getAccId('Deferred Revenue', '23000'),
        salesReturnsAccountId: getAccId('Sales Returns', '41300'),
        purchaseDiscountsAccountId: getAccId('Purchase Discounts', '51100'),
        purchaseReturnsAccountId: getAccId('Purchase Returns', '51200'),
        fixedAssetAccountId: getAccId('Fixed Assets', '15100'),
        accumulatedDepreciationAccountId: getAccId('Accumulated Depreciation', '15200'),
        depreciationExpenseAccountId: getAccId('Depreciation Expense', '61300'),
        gainLossDisposalAccountId: getAccId('Gain/Loss on Disposal', '51000'),
        rawMaterialsAccountId: getAccId('Raw Materials Inventory', '13000'),
        workInProgressAccountId: getAccId('Work in Progress', '13000'),
        finishedGoodsAccountId: getAccId('Finished Goods Inventory', '13000'),
        directLaborAccountId: getAccId('Direct Labor', '61200'),
        manufacturingOverheadAccountId: getAccId('Manufacturing Overhead', '61100'),
        grniAccrualAccountId: getAccId('GRNI Accrual', '21200'),
        rouAssetAccountId: getAccId('Right of Use Asset', '15110'),
        leaseLiabilityAccountId: getAccId('Lease Liability', '21600'),
        interestExpenseAccountId: getAccId('Interest Expense', '61400'),
        icReceivableAccountId: getAccId('Intercompany Receivable', '12300'),
        icClearingAccountId: getAccId('Intercompany Clearing', '21700'),
        icAllocationExpenseId: getAccId('Intercompany Allocations', '61500'),
        overheadAllocationExpenseId: getAccId('Overhead Allocation', '61600'),
        overheadAllocationPayableId: getAccId('Overhead Allocation Payable', '21800'),
      });
    };
    load();
  }, [accounts, fetchMappings]);

  // Account helper filters
  const assetAccounts = useMemo(() => accounts.filter(a => a.type === 'Asset'), [accounts]);
  const liabilityAccounts = useMemo(() => accounts.filter(a => a.type === 'Liability'), [accounts]);
  const revenueAccounts = useMemo(() => accounts.filter(a => a.type === 'Revenue'), [accounts]);
  const expenseAccounts = useMemo(() => accounts.filter(a => a.type === 'Expense'), [accounts]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const mappingList = [
        { key: 'Customer Receivables', id: mappings.arAccountId },
        { key: 'Vendor Payables', id: mappings.apAccountId },
        { key: 'Taxes', id: mappings.taxAccountId },
        { key: 'Sales', id: mappings.revenueAccountId },
        { key: 'Cost of Goods Sold', id: mappings.cogsAccountId },
        { key: 'Sales Discount', id: mappings.discountAccountId },
        { key: 'Purchases', id: mappings.purchasesAccountId },
        { key: 'WHT Receivable', id: mappings.whtReceivableAccountId },
        { key: 'WHT Payable', id: mappings.whtPayableAccountId },
        { key: 'Inventory', id: mappings.inventoryAccountId },
        // Payroll
        { key: 'Payroll Expense', id: mappings.payrollExpenseAccountId },
        { key: 'Employer Payroll Contributions Expense', id: mappings.employerContribExpenseAccountId },
        { key: 'Accrued Salaries', id: mappings.payrollPayableAccountId },
        { key: 'Payroll Taxes Accrued', id: mappings.payrollTaxPayableAccountId },
        { key: 'EOBI & Social Security Accrued', id: mappings.eobiPayableAccountId },
        { key: 'Provident Fund Accrued', id: mappings.pensionPayableAccountId },
        { key: 'Pension Fund Accrued', id: mappings.pensionPayableAccountId },
        // Others
        { key: 'Allowance for Doubtful Accounts', id: mappings.allowanceAccountId },
        { key: 'Prepaid Expenses', id: mappings.prepaidAccountId },
        { key: 'Deferred Revenue', id: mappings.deferredRevenueAccountId },
        { key: 'Sales Returns', id: mappings.salesReturnsAccountId },
        { key: 'Purchase Discounts', id: mappings.purchaseDiscountsAccountId },
        { key: 'Purchase Returns', id: mappings.purchaseReturnsAccountId },
        { key: 'Fixed Assets', id: mappings.fixedAssetAccountId },
        { key: 'Accumulated Depreciation', id: mappings.accumulatedDepreciationAccountId },
        { key: 'Depreciation Expense', id: mappings.depreciationExpenseAccountId },
        { key: 'Gain/Loss on Disposal', id: mappings.gainLossDisposalAccountId },
        { key: 'Raw Materials Inventory', id: mappings.rawMaterialsAccountId },
        { key: 'Work in Progress', id: mappings.workInProgressAccountId },
        { key: 'Finished Goods Inventory', id: mappings.finishedGoodsAccountId },
        { key: 'Direct Labor', id: mappings.directLaborAccountId },
        { key: 'Manufacturing Overhead', id: mappings.manufacturingOverheadAccountId },
        { key: 'GRNI Accrual', id: mappings.grniAccrualAccountId },
        { key: 'Right of Use Asset', id: mappings.rouAssetAccountId },
        { key: 'Lease Liability', id: mappings.leaseLiabilityAccountId },
        { key: 'Interest Expense', id: mappings.interestExpenseAccountId },
        { key: 'Intercompany Receivable', id: mappings.icReceivableAccountId },
        { key: 'Intercompany Clearing', id: mappings.icClearingAccountId },
        { key: 'Intercompany Allocations', id: mappings.icAllocationExpenseId },
        { key: 'Overhead Allocation', id: mappings.overheadAllocationExpenseId },
        { key: 'Overhead Allocation Payable', id: mappings.overheadAllocationPayableId },
      ];

      for (const item of mappingList) {
        if (item.id) {
          await saveMapping(item.key, item.id);
        }
      }

      notify?.('✓ System account posting mappings saved successfully');
    } catch (err: any) {
      notify?.(err.message || 'Error saving account mappings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all operational account mappings back to seeded system defaults?')) {
      const getSeed = (code: string) => accounts.find(a => a.code === code)?.id || '';
      setMappings({
        arAccountId: getSeed('12000'),
        apAccountId: getSeed('21100'),
        taxAccountId: getSeed('22000'),
        revenueAccountId: getSeed('41100'),
        cogsAccountId: getSeed('51000'),
        discountAccountId: getSeed('41200'),
        purchasesAccountId: getSeed('61100'),
        whtReceivableAccountId: getSeed('12200'),
        whtPayableAccountId: getSeed('22100'),
        inventoryAccountId: getSeed('13000'),
        payrollExpenseAccountId: getSeed('61200'),
        employerContribExpenseAccountId: getSeed('61250') || getSeed('61200'),
        payrollPayableAccountId: getSeed('21300'),
        payrollTaxPayableAccountId: getSeed('21400'),
        eobiPayableAccountId: getSeed('21500'),
        pensionPayableAccountId: getSeed('21510') || getSeed('21500'),
        allowanceAccountId: getSeed('12100'),
        prepaidAccountId: getSeed('14000'),
        deferredRevenueAccountId: getSeed('23000'),
        salesReturnsAccountId: getSeed('41300'),
        purchaseDiscountsAccountId: getSeed('51100'),
        purchaseReturnsAccountId: getSeed('51200'),
        fixedAssetAccountId: getSeed('15100'),
        accumulatedDepreciationAccountId: getSeed('15200'),
        depreciationExpenseAccountId: getSeed('61300'),
        gainLossDisposalAccountId: getSeed('51000'),
        rawMaterialsAccountId: getSeed('13000'),
        workInProgressAccountId: getSeed('13000'),
        finishedGoodsAccountId: getSeed('13000'),
        directLaborAccountId: getSeed('61200'),
        manufacturingOverheadAccountId: getSeed('61100'),
        grniAccrualAccountId: getSeed('21200'),
        rouAssetAccountId: getSeed('15110'),
        leaseLiabilityAccountId: getSeed('21600'),
        interestExpenseAccountId: getSeed('61400'),
        icReceivableAccountId: getSeed('12300'),
        icClearingAccountId: getSeed('21700'),
        icAllocationExpenseId: getSeed('61500'),
        overheadAllocationExpenseId: getSeed('61600'),
        overheadAllocationPayableId: getSeed('21800'),
      });
      notify?.('✓ Restored standard IAS/IFRS default account mappings');
    }
  };

  const configuredCount = Object.values(mappings).filter(Boolean).length;
  const totalCount = Object.keys(mappings).length;

  const renderField = (label: string, value: string, onChangeKey: string, accountList: Account[], hint: string) => {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="font-bold text-xs text-[var(--color-text-strong)]">{label}</label>
          <span className="text-[10px] text-[var(--color-text-muted)] font-mono">{hint}</span>
        </div>
        <select
          value={value}
          onChange={e => setMappings(prev => ({ ...prev, [onChangeKey]: e.target.value }))}
          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-xs text-[var(--color-text)] transition-colors focus:border-teal-500 font-mono"
        >
          <option value="">-- Select GL Posting Account --</option>
          {accountList.map(a => (
            <option key={a.id} value={a.id}>
              {a.code} — {a.name} ({a.type})
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-[1300px] mx-auto space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-strong)] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            System Chart of Accounts Mapping Engine
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Map operational ERP workflows (Sales, Bills, Inventory, Payroll, Taxes) to your General Ledger Accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)] flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving Mappings...' : 'Save COA Mapping'}
          </button>
        </div>
      </div>

      {/* Progress & Category Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-[var(--color-surface-muted)] p-3 rounded-2xl border border-[var(--color-border)]">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'payroll', label: 'Payroll & Taxes' },
            { id: 'sales', label: 'Sales & AR' },
            { id: 'purchases', label: 'Purchases & AP' },
            { id: 'inventory', label: 'Inventory & COGS' },
            { id: 'assets', label: 'Assets & Leases' },
            { id: 'intercompany', label: 'Intercompany' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id as any)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeCategory === c.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="text-xs font-semibold text-[var(--color-text-muted)]">
          Configured: <strong className="text-teal-600">{configuredCount}</strong> / {totalCount} Accounts
        </div>
      </div>

      {/* Grid of Modular Mappings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Payroll & Taxes */}
        {(activeCategory === 'all' || activeCategory === 'payroll') && (
          <div className="p-5 rounded-2xl border border-teal-500/30 bg-[var(--color-surface)] shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2.5">
              <Users className="w-4 h-4 text-teal-600" /> Payroll & Statutory Dissection (IAS 19 / IAS 12)
            </h3>
            {renderField('Gross Salaries & Allowances Expense (Debit)', mappings.payrollExpenseAccountId, 'payrollExpenseAccountId', expenseAccounts, 'Matches Gross Pay (Basic + Additions) | Code 61200')}
            {renderField('Employer Statutory Benefits Expense (Debit)', mappings.employerContribExpenseAccountId, 'employerContribExpenseAccountId', expenseAccounts, 'Matches Company Cost (EOBI 5% + PF Match / GOSI / FICA) | Code 61250')}
            {renderField('Net Salaries Payable Clearing (Credit)', mappings.payrollPayableAccountId, 'payrollPayableAccountId', liabilityAccounts, 'Matches Net Salary (Direct Bank Transfer) | Code 21300')}
            {renderField('Income Tax Withholding Payable (Credit)', mappings.payrollTaxPayableAccountId, 'payrollTaxPayableAccountId', liabilityAccounts, 'Matches Tax Withheld (FBR / PAYE / IRS) | Code 21400')}
            {renderField('EOBI & Social Security Payable (Credit)', mappings.eobiPayableAccountId, 'eobiPayableAccountId', liabilityAccounts, 'Matches EOBI 1% + 5% & Social Security | Code 21500')}
            {renderField('Provident Fund (PF) / Pension Payable (Credit)', mappings.pensionPayableAccountId, 'pensionPayableAccountId', liabilityAccounts, 'Matches PF Employee % + Employer Match | Code 21510')}
            {renderField('Sales Tax / VAT Payable', mappings.taxAccountId, 'taxAccountId', liabilityAccounts, 'VAT / Sales Tax Liability | Code 22000')}
          </div>
        )}

        {/* 2. Sales & Receivables */}
        {(activeCategory === 'all' || activeCategory === 'sales') && (
          <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2.5">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Sales & Commercial Receivables
            </h3>
            {renderField('Customer Receivables (AR)', mappings.arAccountId, 'arAccountId', assetAccounts, 'Code 12000')}
            {renderField('Operating Revenue / Sales', mappings.revenueAccountId, 'revenueAccountId', revenueAccounts, 'Code 41100')}
            {renderField('Sales Discounts', mappings.discountAccountId, 'discountAccountId', revenueAccounts, 'Code 41200')}
            {renderField('Sales Returns & Allowances', mappings.salesReturnsAccountId, 'salesReturnsAccountId', revenueAccounts, 'Code 41300')}
            {renderField('Allowance for Doubtful Accounts', mappings.allowanceAccountId, 'allowanceAccountId', assetAccounts, 'Code 12100')}
            {renderField('Deferred / Unearned Revenue', mappings.deferredRevenueAccountId, 'deferredRevenueAccountId', liabilityAccounts, 'Code 23000')}
          </div>
        )}

        {/* 3. Procurement & Payables */}
        {(activeCategory === 'all' || activeCategory === 'purchases') && (
          <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2.5">
              <ShoppingCart className="w-4 h-4 text-emerald-600" /> Procurement & Vendor Payables
            </h3>
            {renderField('Vendor Payables (AP)', mappings.apAccountId, 'apAccountId', liabilityAccounts, 'Code 21100')}
            {renderField('Purchases & Expense Clearing', mappings.purchasesAccountId, 'purchasesAccountId', expenseAccounts, 'Code 61100')}
            {renderField('Purchase Discounts Received', mappings.purchaseDiscountsAccountId, 'purchaseDiscountsAccountId', expenseAccounts, 'Code 51100')}
            {renderField('Purchase Returns', mappings.purchaseReturnsAccountId, 'purchaseReturnsAccountId', expenseAccounts, 'Code 51200')}
            {renderField('GRNI Accrual (Goods Received Not Invoiced)', mappings.grniAccrualAccountId, 'grniAccrualAccountId', liabilityAccounts, 'Code 21200')}
            {renderField('Prepaid Expenses (Asset)', mappings.prepaidAccountId, 'prepaidAccountId', assetAccounts, 'Code 14000')}
          </div>
        )}

        {/* 4. Inventory & Manufacturing */}
        {(activeCategory === 'all' || activeCategory === 'inventory') && (
          <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2.5">
              <Package className="w-4 h-4 text-purple-600" /> Inventory & Manufacturing (COGS)
            </h3>
            {renderField('Cost of Goods Sold (COGS)', mappings.cogsAccountId, 'cogsAccountId', expenseAccounts, 'Code 51000')}
            {renderField('Merchandise Inventory Asset', mappings.inventoryAccountId, 'inventoryAccountId', assetAccounts, 'Code 13000')}
            {renderField('Raw Materials Inventory', mappings.rawMaterialsAccountId, 'rawMaterialsAccountId', assetAccounts, 'Code 13000')}
            {renderField('Work in Progress (WIP)', mappings.workInProgressAccountId, 'workInProgressAccountId', assetAccounts, 'Code 13000')}
            {renderField('Finished Goods Inventory', mappings.finishedGoodsAccountId, 'finishedGoodsAccountId', assetAccounts, 'Code 13000')}
            {renderField('Direct Labor Expense', mappings.directLaborAccountId, 'directLaborAccountId', expenseAccounts, 'Code 61200')}
            {renderField('Manufacturing Overhead Allocation', mappings.manufacturingOverheadAccountId, 'manufacturingOverheadAccountId', expenseAccounts, 'Code 61100')}
          </div>
        )}

        {/* 5. Fixed Assets & Leases */}
        {(activeCategory === 'all' || activeCategory === 'assets') && (
          <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2.5">
              <Building2 className="w-4 h-4 text-amber-600" /> Fixed Assets & Leases (IFRS 16)
            </h3>
            {renderField('Property, Plant & Equipment (Cost)', mappings.fixedAssetAccountId, 'fixedAssetAccountId', assetAccounts, 'Code 15100')}
            {renderField('Accumulated Depreciation (Contra Asset)', mappings.accumulatedDepreciationAccountId, 'accumulatedDepreciationAccountId', assetAccounts, 'Code 15200')}
            {renderField('Depreciation Expense', mappings.depreciationExpenseAccountId, 'depreciationExpenseAccountId', expenseAccounts, 'Code 61300')}
            {renderField('Gain / Loss on Disposal', mappings.gainLossDisposalAccountId, 'gainLossDisposalAccountId', expenseAccounts, 'Code 51000')}
            {renderField('Right of Use (ROU) Asset', mappings.rouAssetAccountId, 'rouAssetAccountId', assetAccounts, 'Code 15110')}
            {renderField('Lease Liability (Present Value)', mappings.leaseLiabilityAccountId, 'leaseLiabilityAccountId', liabilityAccounts, 'Code 21600')}
            {renderField('Lease Interest Expense', mappings.interestExpenseAccountId, 'interestExpenseAccountId', expenseAccounts, 'Code 61400')}
          </div>
        )}

        {/* 6. Intercompany & Overhead */}
        {(activeCategory === 'all' || activeCategory === 'intercompany') && (
          <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2.5">
              <Globe className="w-4 h-4 text-indigo-600" /> Intercompany & Overhead Allocations
            </h3>
            {renderField('Intercompany Receivable (Parent/Subsidiary)', mappings.icReceivableAccountId, 'icReceivableAccountId', assetAccounts, 'Code 12300')}
            {renderField('Intercompany Clearing Ledger', mappings.icClearingAccountId, 'icClearingAccountId', liabilityAccounts, 'Code 21700')}
            {renderField('Intercompany Allocation Expense', mappings.icAllocationExpenseId, 'icAllocationExpenseId', expenseAccounts, 'Code 61500')}
            {renderField('Overhead Allocation Expense', mappings.overheadAllocationExpenseId, 'overheadAllocationExpenseId', expenseAccounts, 'Code 61600')}
            {renderField('Overhead Allocation Payable', mappings.overheadAllocationPayableId, 'overheadAllocationPayableId', liabilityAccounts, 'Code 21800')}
          </div>
        )}
      </div>

      {/* Sticky Bottom Save Action Bar */}
      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-teal-600 shrink-0" />
          <span>All transactions (Invoices, Bills, Payroll Runs, Transfers) automatically follow these mapped accounts.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={close}
            className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving Mappings...' : 'Save COA Mapping'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default SystemAccountMapping;
