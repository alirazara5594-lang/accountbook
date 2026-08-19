import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Search, Bell, Plus, ChevronDown, LogOut, Coins, X, FileText, Receipt,
  Building2, Users, Wallet, CalendarDays, Boxes, ClipboardList, Landmark,
  Globe, BarChart3, Check, Palette,
} from 'lucide-react';
import { NAVIGATION } from '../navigation';
import type { UserData } from '../Login';
import { useSalesStore, useProcurementStore } from '../stores';
import { getActiveCurrency } from '../lib/currency';
import ThemeSwitcher, { getThemeFamily, getDisplayMode, resolveThemeId } from './ThemeSwitcher';

const M = {
  border: 'var(--color-border)',
  text: 'var(--color-text)',
  muted: 'var(--color-text-muted)',
  accent: 'var(--color-primary)',
  bg: 'var(--color-surface)',
  hover: 'var(--color-surface-muted)',
  sidebar: 'var(--color-sidebar-bg)',
};

interface Props {
  currentUser: UserData;
  entities: any[];
  activeEntityId: string;
  onSelectEntity: (id: string) => void;
  page: string;
  setPage: (p: string) => void;
  accounts: any[];
  notify: (m: string) => void;
  onLogout: () => void;
  theme: string;
  onThemeChange: (id: string) => void;
}

type SearchHit = { label: string; sub: string; icon: ReactNode; action: () => void };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TopHeader(props: Props) {
  const { currentUser, entities, activeEntityId, onSelectEntity, page, setPage, accounts, notify, onLogout, theme, onThemeChange } = props;

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [themeComboOpen, setThemeComboOpen] = useState(false);
  const [entityOpen, setEntityOpen] = useState(false);
  const [period, setPeriod] = useState<{ m: number; y: number }>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ams_period') || '');
      if (saved && typeof saved.m === 'number' && typeof saved.y === 'number') return saved;
    } catch { /* ignore */ }
    const d = new Date();
    return { m: d.getMonth(), y: d.getFullYear() };
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const themeComboRef = useRef<HTMLDivElement>(null);
  const entityRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('ams_period', JSON.stringify(period));
  }, [period]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setActionsOpen(false);
      if (themeComboRef.current && !themeComboRef.current.contains(e.target as Node)) setThemeComboOpen(false);
      if (entityRef.current && !entityRef.current.contains(e.target as Node)) setEntityOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setActionsOpen(false);
        setEntityOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const currency = getActiveCurrency();
  const activeEntity = entities.find(x => x.id === activeEntityId);

  const pageHits = useMemo(() => {
    const out: { label: string; sub: string; key: string }[] = [];
    NAVIGATION.forEach(g => {
      out.push({ label: g.name, sub: 'Module summary', key: `${g.name}.Summary` });
      g.items.forEach(i => out.push({ label: i, sub: g.name, key: `${g.name}.${i}` }));
    });
    return out;
  }, []);

  const results = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits: SearchHit[] = [];
    pageHits.filter(p => (p.label + ' ' + p.sub).toLowerCase().includes(q)).slice(0, 6).forEach(p => {
      hits.push({ label: p.label, sub: p.sub, icon: <Globe size={14} />, action: () => setPage(p.key) });
    });
    accounts.filter(a => (String(a.code) + ' ' + String(a.name)).toLowerCase().includes(q)).slice(0, 5).forEach(a => {
      hits.push({ label: a.name, sub: `Account · ${a.code}`, icon: <Landmark size={14} />, action: () => setPage('Accounting.Chart of Accounts') });
    });
    entities.filter(e => (String(e.name) + ' ' + String(e.code)).toLowerCase().includes(q)).slice(0, 3).forEach(e => {
      hits.push({ label: e.name, sub: `${e.country} · ${e.currencyCode || 'PKR'}`, icon: <Building2 size={14} />, action: () => { onSelectEntity(e.id); notify(`Switched to ${e.name}`); } });
    });
    return hits;
  }, [query, pageHits, accounts, entities, onSelectEntity, notify, setPage]);

  const invoices = useSalesStore(s => s.invoices);
  const bills = useProcurementStore(s => s.bills);

  const overdueInvoices = invoices.filter(i => {
    const due = (i.amountDue ?? (i.totalAmount - (i.paidAmount || 0))) || 0;
    return due > 0 && i.dueDate && new Date(i.dueDate).getTime() < Date.now();
  });
  const unpaidBills = bills.filter(b => ((b.totalAmount || 0) - (b.paidAmount || 0)) > 0);
  const inactiveAccounts = accounts.filter(a => String(a.status || 'Active') !== 'Active');
  const notifCount = overdueInvoices.length + unpaidBills.length + inactiveAccounts.length;

  const alerts: { icon: ReactNode; label: string; sub: string; page: string }[] = [];
  if (overdueInvoices.length) alerts.push({ icon: <Receipt size={14} />, label: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''}`, sub: 'Needs collection action', page: 'Sales & Customers.Customer Aging' });
  if (unpaidBills.length) alerts.push({ icon: <FileText size={14} />, label: `${unpaidBills.length} unpaid bill${unpaidBills.length > 1 ? 's' : ''}`, sub: 'Pending vendor payments', page: 'Procurement.Payables Aging' });
  if (inactiveAccounts.length) alerts.push({ icon: <Landmark size={14} />, label: `${inactiveAccounts.length} inactive account${inactiveAccounts.length > 1 ? 's' : ''}`, sub: 'Check chart of accounts', page: 'Accounting.Chart of Accounts' });

  const quickActions: { icon: ReactNode; label: string; action: () => void }[] = [
    { icon: <ClipboardList size={15} />, label: 'New Journal Entry', action: () => { if (page === 'Accounting.Journal Entries') { document.getElementById('journal-form')?.scrollIntoView({ behavior: 'smooth' }); } else { setPage('Accounting.Journal Entries'); } } },
    { icon: <Receipt size={15} />, label: 'New Invoice', action: () => setPage('Sales & Customers.Sales Workspace') },
    { icon: <FileText size={15} />, label: 'New Vendor Bill', action: () => setPage('Procurement.Bills') },
    { icon: <Users size={15} />, label: 'New Customer', action: () => setPage('Sales & Customers.Customers') },
    { icon: <Building2 size={15} />, label: 'New Vendor', action: () => setPage('Procurement.Vendors') },
    { icon: <Boxes size={15} />, label: 'New Product / Service', action: () => setPage('Sales & Customers.Products & Services') },
    { icon: <BarChart3 size={15} />, label: 'Financial Reports', action: () => setPage('Accounting.Financial Reports') },
    { icon: <Wallet size={15} />, label: 'Bank Account', action: () => setPage('Banking & Payments.Bank Accounts') },
  ];

  const [groupName, itemName] = page.split('.');
  const groupLabel = NAVIGATION.find(g => g.name === groupName)?.label || groupName || 'Overview';

  const dropdownBase: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: 260,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
    zIndex: 60,
    overflow: 'hidden',
  };

  return (
    <header className="topbar" style={{ background: M.bg, borderBottom: '2px solid var(--color-sidebar-bg)', position: 'sticky', top: 0, zIndex: 2000, boxShadow: '0 2px 8px color-mix(in srgb, var(--color-sidebar-bg) 20%, transparent)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', minHeight: 54, maxWidth: 1450, margin: '0 auto', flexWrap: 'wrap', rowGap: 6 }}>
        {/* Working entity switcher + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div ref={entityRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setEntityOpen(o => !o)}
              title="Switch working entity"
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                background: M.hover, border: '1px solid ' + M.border, borderRadius: 9,
                padding: '5px 10px', cursor: 'pointer',
              }}
            >
              <span className="avatar small" style={{ width: 26, height: 26, fontSize: 10 }}>{activeEntity?.code?.[0] || activeEntity?.name?.[0] || 'E'}</span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                <strong style={{ fontSize: 12, color: M.text, whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeEntity?.name || 'Select entity'}</strong>
                <small style={{ fontSize: 10, color: M.muted }}>{activeEntity?.currencyCode || activeEntity?.functionalCurrency || 'PKR'} · {activeEntity?.country || '—'}</small>
              </span>
              <ChevronDown size={13} style={{ color: M.muted }} />
            </button>
            {entityOpen && (
              <div style={dropdownBase}>
                <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: M.muted, textTransform: 'uppercase' }}>Working entity</div>
                {entities.length === 0 ? (
                  <div style={{ padding: '18px 16px', fontSize: 12, color: M.muted, textAlign: 'center' }}>No entities yet</div>
                ) : (
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {entities.map(e => (
                      <button
                        key={e.id}
                        onClick={() => { onSelectEntity(e.id); notify(`Switched to ${e.name}`); setEntityOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', color: M.text, fontSize: 13, borderBottom: '1px solid ' + M.hover }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = M.hover)}
                        onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                      >
                        <span className="avatar small" style={{ width: 26, height: 26, fontSize: 10 }}>{e.code?.[0] || e.name?.[0] || 'E'}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
                          <span style={{ display: 'block', fontSize: 11, color: M.muted }}>{e.currencyCode || e.functionalCurrency || 'PKR'} · {e.country || '—'}{e.active ? '' : ' · Deactivated'}</span>
                        </span>
                        {e.id === activeEntityId && <Check size={15} style={{ color: M.accent, flexShrink: 0 }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ width: 1, height: 20, background: M.border }} />
          <div style={{ fontSize: 12, color: M.muted, whiteSpace: 'nowrap', fontWeight: 500, flexShrink: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: M.text, fontWeight: 600 }}>{groupLabel}</span>
            {itemName && itemName !== 'Summary' && itemName !== 'Dashboard' && <><span style={{ margin: '0 4px', color: M.muted }}>/</span><span>{itemName}</span></>}
          </div>
        </div>

        {/* Global search */}
        <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 220, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', border: `1px solid ${searchOpen ? M.accent : 'transparent'}`, borderRadius: 10, padding: '0 10px', height: 36 }}>
            <Search size={15} style={{ color: M.muted, flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search pages, accounts, companies…"
              style={{ border: 0, outline: 'none', background: 'transparent', flex: 1, fontSize: 13, color: M.text }}
            />
            {query && <button onClick={() => { setQuery(''); setSearchOpen(false); }} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, color: M.muted }}><X size={14} /></button>}
          </div>
          {searchOpen && (
            <div style={dropdownBase}>
              {results.length === 0 ? (
                <div style={{ padding: '18px 16px', fontSize: 12, color: M.muted, textAlign: 'center' }}>
                  {query ? 'No matches found' : 'Type to search pages, accounts or companies'}
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { r.action(); setSearchOpen(false); setQuery(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', color: M.text, fontSize: 13, borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget.style.background = M.hover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ color: M.accent, display: 'flex' }}>{r.icon}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
                        <span style={{ display: 'block', fontSize: 11, color: M.muted }}>{r.sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Currency badge */}
        <div title="Active currency" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-secondary)', border: '1px solid var(--color-secondary-hover)', borderRadius: 8, padding: '5px 10px', flexShrink: 0 }}>
          <Coins size={14} />
          {currency}
        </div>

        {/* Fiscal period */}
        <div title="Fiscal period" style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <CalendarDays size={14} style={{ color: M.muted }} />
          <select value={period.m} onChange={e => setPeriod(p => ({ ...p, m: Number(e.target.value) }))} style={{ border: '1px solid ' + M.border, borderRadius: 8, padding: '4px 6px', fontSize: 12, background: 'var(--color-surface)', color: M.text, cursor: 'pointer', outline: 'none' }}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select value={period.y} onChange={e => setPeriod(p => ({ ...p, y: Number(e.target.value) }))} style={{ border: '1px solid ' + M.border, borderRadius: 8, padding: '4px 6px', fontSize: 12, background: 'var(--color-surface)', color: M.text, cursor: 'pointer', outline: 'none' }}>
            {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Theme */}
        <div style={{ flexShrink: 0 }}>
          <ThemeSwitcher theme={theme} onSelect={onThemeChange} />
        </div>

        {/* Theme Combination */}
        <div ref={themeComboRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setThemeComboOpen(o => !o)} title="Theme combination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: 9, height: 30, width: 30, cursor: 'pointer', color: 'var(--color-text)' }}>
            <Palette size={14} style={{ color: 'var(--color-primary)' }} />
          </button>
          {themeComboOpen && (
            <div style={dropdownBase}>
              <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Theme Combination
              </div>
              {[
                { id: 'bp', name: 'Blue Purple', colors: ['#3b82f6', '#a855f7'] },
              ].map(f => {
                const active = getThemeFamily(theme) === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => { onThemeChange(resolveThemeId(f.id, getDisplayMode(theme))); setThemeComboOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      width: '100%',
                      padding: '9px 14px',
                      border: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 13,
                      color: 'var(--color-text)',
                      borderBottom: '1px solid var(--color-border-subtle)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      {f.colors.map((c, i) => (
                        <span key={i} style={{ width: 14, height: 14, borderRadius: 99, background: c }} />
                      ))}
                    </span>
                    <span style={{ flex: 1, fontWeight: active ? 700 : 600 }}>{f.name}</span>
                    {active && <Check size={14} style={{ color: 'var(--color-primary)' }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div ref={actionsRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setActionsOpen(o => !o)} title="Quick actions" style={{ display: 'flex', alignItems: 'center', gap: 4, background: M.accent, color: '#fff', border: 0, borderRadius: 9, padding: '5px 9px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            <Plus size={13} /> Quick
          </button>
          {actionsOpen && (
            <div style={dropdownBase}>
              <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: M.muted, textTransform: 'uppercase' }}>Create New</div>
              {quickActions.map((qa, i) => (
                <button key={i} onClick={() => { qa.action(); setActionsOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', color: M.text, fontSize: 13 }} onMouseEnter={e => (e.currentTarget.style.background = M.hover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ color: M.accent, display: 'flex' }}>{qa.icon}</span>{qa.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setNotifOpen(o => !o)} title="Notifications" style={{ position: 'relative', background: M.hover, border: 0, borderRadius: 9, width: 34, height: 34, cursor: 'pointer', color: M.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={16} />
            {notifCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#e11d48', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 99, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{notifCount}</span>}
          </button>
          {notifOpen && (
            <div style={dropdownBase}>
              <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: M.muted, textTransform: 'uppercase' }}>Alerts</div>
              {alerts.length === 0 ? (
                <div style={{ padding: '18px 16px', fontSize: 12, color: M.muted, textAlign: 'center' }}>All caught up 🎉</div>
              ) : (
                alerts.map((a, i) => (
                  <button key={i} onClick={() => { setPage(a.page); setNotifOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', color: M.text, fontSize: 13, borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => (e.currentTarget.style.background = M.hover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ color: '#e11d48', display: 'flex' }}>{a.icon}</span>
                    <span>
                      <span style={{ display: 'block', fontWeight: 600 }}>{a.label}</span>
                      <span style={{ display: 'block', fontSize: 11, color: M.muted }}>{a.sub}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* User profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div className="avatar small" style={{ width: 30, height: 30, fontSize: 11 }}>{currentUser?.avatar}</div>
            <div style={{ lineHeight: 1.15 }}>
              <strong style={{ display: 'block', fontSize: 12, color: M.text }}>{currentUser?.fullName}</strong>
              <small style={{ display: 'block', fontSize: 10, color: M.muted }}>{currentUser?.role}</small>
            </div>
          </div>
          <ChevronDown size={13} style={{ color: M.muted }} />
        </div>

        <button onClick={onLogout} title="Sign out" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 0, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: M.muted, flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = '#e11d48')} onMouseLeave={e => (e.currentTarget.style.color = M.muted)}>
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}