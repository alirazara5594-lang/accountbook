import { useState } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  RefreshCw,
  Calendar,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { useCompanyStore } from '../stores';
import {
  useFinancialData,
  type AccountLike,
  type JournalLike,
} from './useFinancialData';
import {
  KpiStrip,
  PerformancePanel,
  CashFlowPanel,
  ProfitLossPanel,
  EquationPanel,
  AttentionPanel,
  ReceivablesPanel,
  PayablesPanel,
  InventoryPanel,
  TransactionsPanel,
  SalesPanel,
  PurchasePanel,
  TopExpensesPanel,
  ProfitabilityPanel,
  ControlBar,
  QuickAdd,
} from './sections';
import { currentFiscalYear } from './format';

export interface FinancialOverviewProps {
  accounts: AccountLike[];
  entries: JournalLike[];
  setPage: (page: string) => void;
  activeEntityId?: string;
}

const selectCls =
  'h-7 text-[11px] font-semibold border border-slate-200 rounded-lg bg-white text-slate-600 px-2 outline-none cursor-pointer hover:border-slate-300';

export function FinancialOverview({ accounts, entries, setPage, activeEntityId }: FinancialOverviewProps) {
  const entities = useCompanyStore((s) => s.entities);

  const [fyYear, setFyYear] = useState<number>(() => currentFiscalYear());
  const [range, setRange] = useState<'This FY' | 'Last FY' | '2 FYs Back'>('This FY');

  const data = useFinancialData(accounts, entries, activeEntityId, fyYear);

  const handleRange = (r: 'This FY' | 'Last FY' | '2 FYs Back') => {
    setRange(r);
    setFyYear(currentFiscalYear() - (r === 'This FY' ? 0 : r === 'Last FY' ? 1 : 2));
  };

  const activeEntity = entities.find((e) => e.id === activeEntityId);

  return (
    <div className="w-full font-sans space-y-3">
      {/* ── Header ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight leading-tight truncate" style={{ color: '#2fb8a6' }}>Financial Overview</h1>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[9px] font-black text-emerald-700">
                  <ShieldCheck className="w-2.5 h-2.5" /> LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Executive dashboard · {activeEntity?.name || 'All entities'} · updated {data.asOf}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={data.refresh} className="inline-flex items-center gap-1 h-7 px-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`w-3.5 h-3.5 ${data.loading ? 'animate-spin text-blue-600' : ''}`} /> Refresh
            </button>
            <button className="h-7 px-2 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-700">Customize</button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <Calendar className="w-3 h-3" /> Period
            <select value={range} onChange={(e) => handleRange(e.target.value as 'This FY' | 'Last FY' | '2 FYs Back')} className={selectCls}>
              <option>This FY</option>
              <option>Last FY</option>
              <option>2 FYs Back</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            FY {fyYear}
            <span className="inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700">
              <Layers className="w-3 h-3 text-indigo-500" /> Jul {fyYear - 1} – Jun {fyYear}
            </span>
          </label>

          <div className="flex-1" />
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
            <ChevronDown className="w-3 h-3" /> Consolidated view
          </span>
        </div>
      </div>

      {data.loading && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing live data…
        </div>
      )}

      {/* ── KPI Cards ── */}
      <KpiStrip data={data} currency="USD" />

      {/* ── Row 1: Performance + Cash flow ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <PerformancePanel data={data} currency="USD" />
        <CashFlowPanel data={data} currency="USD" />
      </div>

      {/* ── Row 2: P&L + Equation + Attention ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <ProfitLossPanel data={data} currency="USD" />
        <EquationPanel data={data} currency="USD" />
        <AttentionPanel data={data} setPage={setPage} />
      </div>

      {/* ── Row 3: Receivables + Payables + Inventory ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <ReceivablesPanel data={data} currency="USD" setPage={setPage} />
        <PayablesPanel data={data} currency="USD" setPage={setPage} />
        <InventoryPanel data={data} currency="USD" setPage={setPage} />
      </div>

      {/* ── Row 4: Transactions + Sales + Purchase ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <TransactionsPanel data={data} currency="USD" />
        <SalesPanel data={data} currency="USD" setPage={setPage} />
        <PurchasePanel data={data} currency="USD" setPage={setPage} />
      </div>

      {/* ── Row 5: Top expenses + Profitability + Control bar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <TopExpensesPanel data={data} currency="USD" setPage={setPage} />
        <ProfitabilityPanel data={data} />
        <ControlBar data={data} setPage={setPage} />
      </div>

      <QuickAdd setPage={setPage} />
    </div>
  );
}

export default FinancialOverview;
