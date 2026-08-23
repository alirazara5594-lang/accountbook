import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Search, Bell, Plus, ChevronDown, LogOut, Coins, X, FileText, Receipt,
  Building2, Users, Wallet, CalendarDays, Boxes, ClipboardList, Landmark,
  Globe, BarChart3, Check, Sun, Moon, Key, MessageSquarePlus
} from 'lucide-react';
import { NAVIGATION } from '../navigation';
import type { UserData } from '../Login';
import { useSalesStore, useProcurementStore } from '../stores';
import { getActiveCurrency } from '../lib/currency';

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
  theme?: string;
  onThemeChange?: (id: string) => void;
  onOpenLicense?: () => void;
  onOpenFeedback?: () => void;
}

type SearchHit = { label: string; sub: string; icon: ReactNode; action: () => void };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TopHeader(props: Props) {
  const { currentUser, entities, activeEntityId, onSelectEntity, page, setPage, accounts, notify, onLogout, theme, onThemeChange, onOpenLicense, onOpenFeedback } = props;

  const isDark = theme ? theme.endsWith('-dark') : false;

  const toggleDisplayMode = () => {
    if (!onThemeChange) return;
    const nextTheme = isDark ? 'nd-light' : 'nd-dark';
    onThemeChange(nextTheme);
  };

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
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
    { icon: <ClipboardList size={14} />, label: 'New Journal Entry', action: () => { if (page === 'Accounting.Journal Entries') { document.getElementById('journal-form')?.scrollIntoView({ behavior: 'smooth' }); } else { setPage('Accounting.Journal Entries'); } } },
    { icon: <Receipt size={14} />, label: 'New Invoice', action: () => setPage('Sales & Customers.Sales Invoices') },
    { icon: <FileText size={14} />, label: 'New Vendor Bill', action: () => setPage('Procurement.Bills') },
    { icon: <Users size={14} />, label: 'New Customer', action: () => setPage('Sales & Customers.Customers') },
    { icon: <Building2 size={14} />, label: 'New Vendor', action: () => setPage('Procurement.Vendors') },
    { icon: <Boxes size={14} />, label: 'New Product / Service', action: () => setPage('Sales & Customers.Products & Services') },
    { icon: <BarChart3 size={14} />, label: 'Financial Reports', action: () => setPage('Accounting.Financial Reports') },
    { icon: <Wallet size={14} />, label: 'Bank Account', action: () => setPage('Banking & Payments.Bank Accounts') },
  ];

  const [groupName, itemName] = page.split('.');
  const groupLabel = NAVIGATION.find(g => g.name === groupName)?.label || groupName || 'Overview';

  const dropdownBase: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
    zIndex: 9999,
    overflow: 'hidden',
  };

  return (
    <header className="topbar" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 2000, boxShadow: 'var(--shadow-sm)' }}>
      {/* Strict 1-line flex container */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', height: 52, maxWidth: 1450, margin: '0 auto', flexWrap: 'nowrap', boxSizing: 'border-box', position: 'relative' }}>
        
        {/* Working entity switcher — moved slightly left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: -8 }}>
          <div ref={entityRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setEntityOpen(o => !o)}
              title="Switch working entity"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: 9,
                padding: '4px 10px', cursor: 'pointer', height: 34,
              }}
            >
              <span className="avatar small" style={{ width: 24, height: 24, fontSize: 10 }}>{activeEntity?.code?.[0] || activeEntity?.name?.[0] || 'E'}</span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                <strong style={{ fontSize: 12.5, color: 'var(--color-text)', whiteSpace: 'nowrap', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeEntity?.name || 'Select entity'}</strong>
                <small style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{activeEntity?.currencyCode || activeEntity?.functionalCurrency || 'PKR'}</small>
              </span>
              <ChevronDown size={13} style={{ color: 'var(--color-text-muted)' }} />
            </button>
            {entityOpen && (
              <div style={{ ...dropdownBase, left: 0, right: 'auto', minWidth: 260 }}>
                <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Working Entity</span>
                  <span style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 700 }}>{entities.length} total</span>
                </div>
                {entities.length === 0 ? (
                  <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    <p>No entities found</p>
                    <button
                      onClick={() => { setPage('Administration.Companies'); setEntityOpen(false); }}
                      style={{ marginTop: 8, padding: '4px 10px', background: 'var(--color-primary)', color: '#fff', border: 0, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add Company
                    </button>
                  </div>
                ) : (
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {entities.map(e => (
                      <button
                        key={e.id}
                        onClick={() => { onSelectEntity(e.id); notify(`Switched to ${e.name}`); setEntityOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', border: 0, background: e.id === activeEntityId ? 'var(--color-surface-muted)' : 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--color-text)', fontSize: 12.5, borderBottom: '1px solid var(--color-border-subtle)' }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--color-surface-muted)')}
                        onMouseLeave={ev => (ev.currentTarget.style.background = e.id === activeEntityId ? 'var(--color-surface-muted)' : 'transparent')}
                      >
                        <span className="avatar small" style={{ width: 24, height: 24, fontSize: 10 }}>{e.code?.[0] || e.name?.[0] || 'E'}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
                          <span style={{ display: 'block', fontSize: 10.5, color: 'var(--color-text-muted)' }}>{e.currencyCode || e.functionalCurrency || 'PKR'} · {e.country || '—'}</span>
                        </span>
                        {e.id === activeEntityId && <Check size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
                      </button>
                    ))}
                    <div style={{ padding: '6px 14px', borderTop: '1px solid var(--color-border)' }}>
                      <button
                        onClick={() => { setPage('Administration.Companies'); setEntityOpen(false); }}
                        style={{ width: '100%', textAlign: 'center', padding: '6px 0', background: 'transparent', border: 0, color: 'var(--color-primary)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ⚙️ Manage All Companies
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

          {/* Breadcrumb */}
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', fontWeight: 500, flexShrink: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{groupLabel}</span>
            {itemName && itemName !== 'Summary' && itemName !== 'Dashboard' && <><span style={{ margin: '0 4px', color: 'var(--color-text-muted)' }}>/</span><span>{itemName}</span></>}
          </div>
        </div>

        {/* Global search */}
        <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 220, marginLeft: 'auto', flexShrink: 1, minWidth: 120 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--color-surface-muted)', border: `1px solid ${searchOpen ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 9, padding: '0 10px', height: 34, transition: 'all 0.2s ease' }}>
            <Search size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search pages, accounts…"
              style={{ border: 0, outline: 'none', background: 'transparent', width: '100%', minWidth: 0, fontSize: 12.5, color: 'var(--color-text)' }}
            />
            {query && <button onClick={() => { setQuery(''); setSearchOpen(false); }} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text-muted)' }}><X size={13} /></button>}
          </div>
          {searchOpen && (
            <div style={{ ...dropdownBase, left: 'auto', right: 0, minWidth: 280 }}>
              {results.length === 0 ? (
                <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  {query ? 'No matches found' : 'Type to search pages, accounts or companies'}
                </div>
              ) : (
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { r.action(); setSearchOpen(false); setQuery(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--color-text)', fontSize: 12.5, borderBottom: '1px solid var(--color-border-subtle)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ color: 'var(--color-primary)', display: 'flex' }}>{r.icon}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
                        <span style={{ display: 'block', fontSize: 10.5, color: 'var(--color-text-muted)' }}>{r.sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action icons row — strictly in 1 line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          
          {/* Trial / License Status Pill */}
          <button
            type="button"
            onClick={onOpenLicense}
            title="View 90-Day Trial Status & License Details"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: '#b45309',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: 8,
              padding: '4px 9px',
              height: 32,
              flexShrink: 0,
              cursor: 'pointer'
            }}
          >
            <Key size={12} />
            <span>90-Day Trial</span>
          </button>

          {/* Feedback & Suggestion Button */}
          <button
            type="button"
            onClick={onOpenFeedback}
            title="Submit Pilot Customer Feedback & Feature Requests"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11.5,
              fontWeight: 700,
              color: 'var(--color-primary)',
              background: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '0 9px',
              height: 32,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <MessageSquarePlus size={13} />
            <span>Feedback</span>
          </button>

          {/* Currency badge */}
          <div title="Active currency" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-secondary)', border: '1px solid var(--color-secondary-hover)', borderRadius: 8, padding: '4px 8px', height: 32, flexShrink: 0, boxSizing: 'border-box' }}>
            <Coins size={13} />
            {currency}
          </div>

          {/* Fiscal period */}
          <div title="Fiscal period" style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <CalendarDays size={13} style={{ color: 'var(--color-text-muted)' }} />
            <select value={period.m} onChange={e => setPeriod(p => ({ ...p, m: Number(e.target.value) }))} style={{ border: '1px solid var(--color-border)', borderRadius: 7, padding: '3px 6px', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', outline: 'none', height: 32 }}>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={period.y} onChange={e => setPeriod(p => ({ ...p, y: Number(e.target.value) }))} style={{ border: '1px solid var(--color-border)', borderRadius: 7, padding: '3px 6px', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', outline: 'none', height: 32 }}>
              {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Quick actions */}
          <div ref={actionsRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setActionsOpen(o => !o)} title="Quick actions" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--color-primary)', color: '#fff', border: 0, borderRadius: 8, padding: '0 10px', height: 32, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              <Plus size={13} /> Quick
            </button>
            {actionsOpen && (
              <div style={{ ...dropdownBase, right: 0, left: 'auto', minWidth: 220 }}>
                <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Create New</div>
                {quickActions.map((qa, i) => (
                  <button key={i} onClick={() => { qa.action(); setActionsOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--color-text)', fontSize: 12.5 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ color: 'var(--color-primary)', display: 'flex' }}>{qa.icon}</span>{qa.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Display mode toggle (Light / Dark) */}
          <button
            onClick={toggleDisplayMode}
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: 'pointer',
              color: 'var(--color-text)',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isDark ? (
              <Sun size={15} style={{ color: '#f59e0b' }} />
            ) : (
              <Moon size={15} style={{ color: 'var(--color-primary)' }} />
            )}
          </button>

          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setNotifOpen(o => !o)} title="Notifications" style={{ position: 'relative', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={14} />
              {notifCount > 0 && <span style={{ position: 'absolute', top: -3, right: -3, background: '#f43f5e', color: '#fff', fontSize: 9, fontWeight: 800, borderRadius: 99, minWidth: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{notifCount}</span>}
            </button>
            {notifOpen && (
              <div style={{ ...dropdownBase, right: 0, left: 'auto', minWidth: 260 }}>
                <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Alerts</div>
                {alerts.length === 0 ? (
                  <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>All caught up 🎉</div>
                ) : (
                  alerts.map((a, i) => (
                    <button key={i} onClick={() => { setPage(a.page); setNotifOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--color-text)', fontSize: 12.5, borderBottom: '1px solid var(--color-border-subtle)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span style={{ color: '#f43f5e', display: 'flex' }}>{a.icon}</span>
                      <span>
                        <span style={{ display: 'block', fontWeight: 600 }}>{a.label}</span>
                        <span style={{ display: 'block', fontSize: 10.5, color: 'var(--color-text-muted)' }}>{a.sub}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div className="avatar small" style={{ width: 28, height: 28, fontSize: 11 }}>{currentUser?.avatar}</div>
              <div style={{ lineHeight: 1.15 }}>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{currentUser?.fullName}</strong>
                <small style={{ display: 'block', fontSize: 10, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{currentUser?.role}</small>
              </div>
            </div>
            <ChevronDown size={12} style={{ color: 'var(--color-text-muted)' }} />
          </div>

          {/* Logout */}
          <button onClick={onLogout} title="Sign out" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 0, borderRadius: 7, width: 28, height: 28, cursor: 'pointer', color: 'var(--color-text-muted)', flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}