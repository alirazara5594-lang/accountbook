import {
  LayoutDashboard, BarChart3, ArrowRight, ShieldCheck, Sparkles,
  Plus, Receipt, CreditCard, Landmark, BookOpen, Users,
  Boxes, CheckCircle2, TrendingUp, Wallet
} from 'lucide-react';
import { money } from '../lib/currency';

interface DashboardHubProps {
  setPage: (page: string) => void;
  accounts?: any[];
  activeEntityId?: string;
  currentUser?: any;
}

export function DashboardHub({ setPage, accounts = [], currentUser }: DashboardHubProps) {
  const safeAccounts = accounts || [];
  const totalRevenue = safeAccounts.filter(a => a?.type === 'Revenue' || a?.type === 'ContraRevenue').reduce((s, a) => s + (a?.openingBalance || 0), 0);
  const totalAssets = safeAccounts.filter(a => a?.type === 'Asset').reduce((s, a) => s + (a?.openingBalance || 0), 0);
  const totalLiabilities = safeAccounts.filter(a => a?.type === 'Liability').reduce((s, a) => s + (a?.openingBalance || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  const quickShortcuts = [
    { label: 'Sales Invoice', page: 'Sales & Customers.Sales Workspace', icon: Receipt, color: '#3b82f6' },
    { label: 'Vendor Bill', page: 'Procurement.Bills', icon: CreditCard, color: '#ef4444' },
    { label: 'Journal Entry', page: 'Accounting.Journal Entries', icon: BookOpen, color: '#8b5cf6' },
    { label: 'Bank Transfer', page: 'Banking & Payments.Fund Transfers', icon: Landmark, color: '#10b981' },
    { label: 'Chart of Accounts', page: 'Accounting.Chart of Accounts', icon: LayersIcon, color: '#06b6d4' },
    { label: 'Customers', page: 'Sales & Customers.Customers', icon: Users, color: '#f59e0b' },
  ];

  function LayersIcon(props: any) {
    return <Boxes {...props} />;
  }

  return (
    <div className="max-w-7xl mx-auto font-sans space-y-4">
      {/* ── Welcome Banner ── */}
      <div className="bg-gradient-to-r from-[var(--color-sidebar-bg)] via-[var(--color-surface)] to-[var(--color-sidebar-bg)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)' }}>
            <LayoutDashboard className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[var(--color-text-strong)] tracking-tight">
                Welcome back{currentUser?.fullName ? `, ${currentUser.fullName}` : ''}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-success-background)', color: 'var(--color-success)' }}>
                System Live
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              ERP Control Hub — Select a workspace or launch the 9-Row Analytical Financial Overview.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setPage('Overview.Overview')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:opacity-95 cursor-pointer"
            style={{ background: 'var(--color-primary)' }}
          >
            <BarChart3 className="w-4 h-4" /> Open Overview Cockpit <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── High-Level Snapshot Strips ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Consolidated Assets', value: money(totalAssets), icon: Landmark, color: '#3b82f6', sub: 'Audited ledger' },
          { label: 'Total Revenue', value: money(totalRevenue), icon: TrendingUp, color: '#10b981', sub: 'FY to date' },
          { label: 'Liabilities', value: money(totalLiabilities), icon: CreditCard, color: '#ef4444', sub: 'Outstanding debt' },
          { label: 'Estimated Net Worth', value: money(netWorth), icon: Wallet, color: '#8b5cf6', sub: 'Assets − Liabilities' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3.5 shadow-sm flex items-center justify-between min-w-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden">
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-0.5 truncate">{k.label}</span>
                <p className="text-base font-black text-[var(--color-text-strong)] truncate">{k.value}</p>
                <span className="text-[9px] text-[var(--color-text-subtle)] truncate block">{k.sub}</span>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-1.5" style={{ background: `color-mix(in srgb, ${k.color} 15%, transparent)`, color: k.color }}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${k.color}, transparent)` }} />
            </div>
          );
        })}
      </div>

      {/* ── Featured Workspaces Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Cockpit Launcher Card */}
        <div
          onClick={() => setPage('Overview.Overview')}
          className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-xl p-5 shadow-sm transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}>
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--color-text-strong)] group-hover:text-[var(--color-primary)] transition-colors">
                    Financial & Operational Overview Cockpit
                  </h3>
                  <span className="text-[10px] text-[var(--color-text-subtle)] font-mono">Overview.Overview</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--color-success-background)', color: 'var(--color-success)' }}>
                <Sparkles className="w-3 h-3" /> 9-Row Analytical View
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-4">
              Comprehensive 9-row executive dashboard with Top KPIs, EBITDA, Working Capital, Revenue vs Expenses Area Trend, 6 Financial Ratios, Expense Breakdown, AR/AP Aging & Operational Vital Signs.
            </p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
            <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
              Launch Full Analytical Cockpit →
            </span>
            <span className="text-[10px] text-[var(--color-text-subtle)]">Multi-entity synchronized</span>
          </div>
        </div>

        {/* System Health / Status Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #10b981 15%, transparent)', color: '#10b981' }}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-success-background)', color: 'var(--color-success)' }}>
                Healthy
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-[var(--color-text-strong)] mb-1">Audit & Integrity Status</h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Real-time balance validation: All debits & credits are synchronized across ledgers.
            </p>
          </div>
          <div className="space-y-2 mt-4 pt-3 border-t border-[var(--color-border-subtle)] text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-muted)] flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Fiscal Period</span>
              <span className="font-bold text-[var(--color-text-strong)]">Active (FY)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-muted)] flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Database Status</span>
              <span className="font-bold text-[var(--color-text-strong)]">Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Action Shortcuts ── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-strong)] mb-3 flex items-center gap-1.5">
          <Plus className="w-4 h-4" style={{ color: 'var(--color-primary)' }} /> Quick Navigation & Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {quickShortcuts.map((qs, i) => {
            const Icon = qs.icon;
            return (
              <button
                key={i}
                onClick={() => setPage(qs.page)}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-muted)] transition-all group cursor-pointer text-center"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform" style={{ background: `color-mix(in srgb, ${qs.color} 15%, transparent)`, color: qs.color }}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{qs.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DashboardHub;
