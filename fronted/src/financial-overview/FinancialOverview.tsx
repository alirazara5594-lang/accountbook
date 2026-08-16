import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Filter, RefreshCw, DollarSign, TrendingDown, TrendingUp, Users, CreditCard, Wallet, X, Check } from 'lucide-react';
import { useFinancialData, type AccountLike, type JournalLike } from './useFinancialData';
import {
  KPICard,
  AccountingEquation,
  ProfitLossTrend,
  CashFlowSummary,
  AccountBalances,
  AgingCard,
  FinancialPositionBar,
  QuickAdd,
} from './sections';
import { currentFiscalYear, money, type CurrencyCode } from './format';
import { useCompanyStore } from '../stores/useCompanyStore';

export interface FinancialOverviewProps {
  accounts: AccountLike[];
  entries: JournalLike[];
  setPage: (page: string) => void;
  activeEntityId?: string;
}

const PERIOD_OPTIONS = ['This FY', 'Last FY', '2 FYs Back'] as const;
const VIEWS = ['Consolidated', 'Branch View', 'Department View'] as const;

export function FinancialOverview({ accounts, entries, setPage, activeEntityId }: FinancialOverviewProps) {
  const activeEntity = useCompanyStore((s) => s.entities.find(e => e.id === activeEntityId));
  const currency: CurrencyCode = (activeEntity?.functionalCurrency as CurrencyCode) || 'USD';
  const [fyYear, setFyYear] = useState<number>(() => currentFiscalYear());
  const [period, setPeriod] = useState<'This FY' | 'Last FY' | '2 FYs Back'>('This FY');
  const [view, setView] = useState<'Consolidated' | 'Branch View' | 'Department View'>('Consolidated');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const data = useFinancialData(accounts, entries, activeEntityId, fyYear);

  const handlePeriod = (p: 'This FY' | 'Last FY' | '2 FYs Back') => {
    setPeriod(p);
    setFyYear(currentFiscalYear() - (p === 'This FY' ? 0 : p === 'Last FY' ? 1 : 2));
    setPeriodOpen(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const kpis = [
    { label: 'Total Revenue', value: money(data.revenue, 'USD'), delta: data.kpiDeltas.revenue, icon: DollarSign, iconBg: '#dcfce7', iconColor: '#10b981' },
    { label: 'Total Expenses', value: money(data.revenue - data.netProfit, 'USD'), delta: null, icon: TrendingDown, iconBg: '#fee2e2', iconColor: '#ef4444' },
    { label: 'Net Profit', value: money(data.netProfit, 'USD'), delta: data.kpiDeltas.netProfit, icon: TrendingUp, iconBg: '#dbeafe', iconColor: '#3b82f6' },
    { label: 'Accounts Receivable', value: money(data.arTotal, 'USD'), delta: null, icon: Users, iconBg: '#ffedd5', iconColor: '#f97316' },
    { label: 'Accounts Payable', value: money(data.apTotal, 'USD'), delta: null, icon: CreditCard, iconBg: '#f3e8ff', iconColor: '#8b5cf6' },
    { label: 'Cash & Bank Balance', value: money(data.cashBank, 'USD'), delta: data.kpiDeltas.cashBank, icon: Wallet, iconBg: '#ccfbf1', iconColor: '#14b8a6' },
  ];

  return (
    <div className="w-full font-sans space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-sm text-gray-500">Real-time summary of your company's financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period dropdown */}
          <div ref={periodRef} className="relative">
            <button
              onClick={() => { setPeriodOpen(!periodOpen); setFilterOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <Calendar className="w-4 h-4" />
              {period}
              <ChevronDown className="w-4 h-4" />
            </button>
            {periodOpen && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl w-56 z-50 py-1">
                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wide text-gray-400 border-b border-gray-100">
                  Select Period
                </div>
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeriod(p)}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-800 flex items-center justify-between transition-colors"
                  >
                    {p}
                    {period === p && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter dropdown */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => { setFilterOpen(!filterOpen); setPeriodOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className="w-4 h-4" />
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl w-64 z-50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wide text-gray-400">Filters</span>
                  <button onClick={() => setFilterOpen(false)}>
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">View</label>
                  <div className="space-y-1">
                    {VIEWS.map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-800 flex items-center justify-between transition-colors"
                      >
                        {v}
                        {view === v && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Currency</label>
                  <div className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200">
                    USD
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {data.loading && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing live data…
        </div>
      )}

      {/* ── KPI Cards (6 cols) ── */}
      <div className="grid grid-cols-6 gap-2.5">
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* ── Accounting Equation (full width) ── */}
      <AccountingEquation data={data} currency={currency} />

      {/* ── Row: P&L Trend + Cash Flow + Account Balances ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <ProfitLossTrend data={data} currency={currency} />
        <CashFlowSummary data={data} currency={currency} />
        <AccountBalances data={data} currency={currency} />
      </div>

      {/* ── Row: Receivables Aging + Payables Aging ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AgingCard
          title="Receivables Aging"
          total={data.arTotal}
          avgDays={data.avgDaysOutstanding}
          avgLabel="Avg. Days Outstanding"
          aging={data.arAging}
          currency={currency}
        />
        <AgingCard
          title="Payables Aging"
          total={data.apTotal}
          avgDays={data.avgDaysPayable}
          avgLabel="Avg. Days Payable"
          aging={data.apAging}
          currency={currency}
        />
      </div>

      {/* ── Financial Position Summary Bar ── */}
      <FinancialPositionBar data={data} currency={currency} />

      {/* ── Footer ── */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 pb-4">
        <span>All amounts are in {currency}</span>
        <div className="flex items-center gap-3">
          <span>Last updated: {data.asOf}</span>
          <button onClick={data.refresh} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
            <RefreshCw className={`w-3.5 h-3.5 ${data.loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <QuickAdd setPage={setPage} />
    </div>
  );
}

export default FinancialOverview;
