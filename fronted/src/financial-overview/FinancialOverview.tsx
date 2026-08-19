import { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  Filter,
  RefreshCw,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
  CreditCard,
  Wallet,
  X,
  Check,
} from 'lucide-react';
import { useFinancialData, type AccountLike, type JournalLike } from './useFinancialData';
import {
  HeroKPI,
  ExecutiveHealthBar,
  RevenueExpensesTrendChart,
  CashFlowCompact,
  AccountingEquationBar,
  ExecutiveRatioMatrix,
  AgingSection,
  CommercialConcentration,
  ExpenseDistributionCard,
  ExecutiveRiskAlerts,
  LiveActivityAuditFeed,
  CompanySnapshot,
  QuickAdd,
} from './sections';
import { currentFiscalYear, money, type CurrencyCode } from './format';
import { getActiveCurrency } from '../lib/currency';

export interface FinancialOverviewProps {
  accounts: AccountLike[];
  entries: JournalLike[];
  setPage: (page: string) => void;
  activeEntityId?: string;
}

const PERIOD_OPTIONS = ['This FY', 'Last FY', '2 FYs Back'] as const;
const VIEWS = ['Consolidated Group', 'Single Entity View', 'Branch Breakdown'] as const;

export function FinancialOverview({ accounts, entries, setPage, activeEntityId }: FinancialOverviewProps) {
  const [fyYear, setFyYear] = useState<number>(() => currentFiscalYear());
  const [period, setPeriod] = useState<'This FY' | 'Last FY' | '2 FYs Back'>('This FY');
  const [view, setView] = useState<'Consolidated Group' | 'Single Entity View' | 'Branch Breakdown'>('Consolidated Group');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const data = useFinancialData(accounts, entries, activeEntityId, fyYear);
  const currency = getActiveCurrency() as CurrencyCode;

  const handlePeriod = (p: 'This FY' | 'Last FY' | '2 FYs Back') => {
    setPeriod(p);
    setFyYear(currentFiscalYear() - (p === 'This FY' ? 0 : p === 'Last FY' ? 1 : 2));
    setPeriodOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 6 Perfect Hero KPI cards
  const kpis = [
    {
      label: 'Total Revenue',
      value: money(data.revenue, currency),
      delta: data.kpiDeltas.revenue,
      icon: DollarSign,
      iconColor: '#10b981',
    },
    {
      label: 'Total Expenses',
      value: money(data.revenue - data.netProfit, currency),
      delta: null,
      icon: TrendingDown,
      iconColor: '#ef4444',
    },
    {
      label: 'Net Profit',
      value: money(data.netProfit, currency),
      delta: data.kpiDeltas.netProfit,
      icon: TrendingUp,
      iconColor: '#3b82f6',
    },
    {
      label: 'Accounts Receivable',
      value: money(data.arTotal, currency),
      delta: null,
      icon: Users,
      iconColor: '#f97316',
    },
    {
      label: 'Accounts Payable',
      value: money(data.apTotal, currency),
      delta: null,
      icon: CreditCard,
      iconColor: '#8b5cf6',
    },
    {
      label: 'Cash & Bank Balance',
      value: money(data.cashBank, currency),
      delta: data.kpiDeltas.cashBank,
      icon: Wallet,
      iconColor: '#14b8a6',
    },
  ];

  return (
    <div className="w-full font-sans space-y-4 pb-12">
      {/* ── Dashboard Executive Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground tracking-tight">Executive Financial Command</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Audited
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Director-level operational analytics, liquidity ratios & balance integrity
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div ref={periodRef} className="relative">
            <button
              onClick={() => {
                setPeriodOpen(!periodOpen);
                setFilterOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-xl text-xs font-bold text-foreground bg-surface hover:bg-muted/50 transition-colors shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {period}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {periodOpen && (
              <div className="absolute right-0 mt-1.5 bg-surface border border-border rounded-xl shadow-xl w-52 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  Fiscal Period
                </div>
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeriod(p)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted flex items-center justify-between transition-colors"
                  >
                    {p}
                    {period === p && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Filter */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => {
                setFilterOpen(!filterOpen);
                setPeriodOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-xl text-xs font-bold text-foreground bg-surface hover:bg-muted/50 transition-colors shadow-2xs"
            >
              <Filter className="w-3.5 h-3.5 text-primary" />
              {view}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-1.5 bg-surface border border-border rounded-xl shadow-xl w-60 z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Scope & Currency
                  </span>
                  <button onClick={() => setFilterOpen(false)}>
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">View Scope</label>
                  <div className="space-y-1">
                    {VIEWS.map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setView(v);
                          setFilterOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-foreground rounded-lg hover:bg-muted flex items-center justify-between transition-colors"
                      >
                        {v}
                        {view === v && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Active Currency</label>
                  <div className="px-2.5 py-1.5 text-xs font-bold text-foreground bg-muted/60 rounded-lg border border-border/80">
                    {currency}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {data.loading && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50/80 border border-blue-200 text-xs font-bold text-blue-800 shadow-2xs">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Recalculating real-time financial position…
        </div>
      )}

      {/* ═══ 1. HERO KPI METRICS (Uniform 90px height cards) ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {kpis.map((kpi) => (
          <HeroKPI
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            icon={kpi.icon}
            color={kpi.iconColor}
          />
        ))}
      </div>

      {/* ═══ 2. EXECUTIVE HEALTH & RUNWAY COMMAND ═══ */}
      <ExecutiveHealthBar data={data} currency={currency} />

      {/* ═══ 3. PRIMARY FINANCIAL TRAJECTORY & CASH FLOW ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 h-full">
          <RevenueExpensesTrendChart data={data} currency={currency} />
        </div>
        <div className="h-full">
          <CashFlowAndLiquidityDonut data={data} currency={currency} />
        </div>
      </div>

      {/* ═══ 4. ACCOUNTING EQUATION & BALANCE INTEGRITY ═══ */}
      <AccountingEquationBar data={data} currency={currency} />

      {/* ═══ 5. EXECUTIVE FINANCIAL RATIOS MATRIX ═══ */}
      <ExecutiveRatioMatrix data={data} />

      {/* ═══ 6. WORKING CAPITAL & CREDIT AGING ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AgingSection
          title="Receivables Aging & Credit Risk"
          subtitle="Customer invoice aging by overdue maturity buckets"
          avgDays={data.avgDaysOutstanding}
          aging={data.arAging}
          overdueAmount={data.arOverdue}
          currency={currency}
        />
        <AgingSection
          title="Payables Aging & Vendor Exposure"
          subtitle="Supplier liabilities and scheduled payment obligations"
          avgDays={data.avgDaysPayable}
          aging={data.apAging}
          overdueAmount={data.apOverdue}
          currency={currency}
        />
      </div>

      {/* ═══ 7. COMMERCIAL CONCENTRATION & COST BREAKDOWN ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <CommercialConcentration data={data} currency={currency} />
        </div>
        <div>
          <ExpenseDistributionCard data={data} currency={currency} />
        </div>
      </div>

      {/* ═══ 8. RISK RADAR & LIVE FINANCIAL STREAM ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ExecutiveRiskAlerts alerts={data.alerts} setPage={setPage} />
        <LiveActivityAuditFeed txns={data.recentTxns} currency={currency} setPage={setPage} />
      </div>

      {/* ═══ 9. ENTERPRISE VITAL SIGNS ═══ */}
      <CompanySnapshot data={data} />

      {/* ── Footer ── */}
      <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/60">
        <span>Consolidated in reporting currency: <strong className="text-foreground">{currency}</strong></span>
        <div className="flex items-center gap-4">
          <span>Audited ledger snapshot: <strong className="text-foreground">{data.asOf}</strong></span>
          <button
            onClick={data.refresh}
            className="flex items-center gap-1.5 font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${data.loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Quick Speed Dial */}
      <QuickAdd setPage={setPage} />
    </div>
  );
}

export default FinancialOverview;
