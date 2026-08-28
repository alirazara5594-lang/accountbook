import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export type TimeframePeriod = 'all' | 'quarterly' | 'q1' | 'q2' | 'q3' | 'q4';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  className?: string;
  showControls?: boolean;
  selectedPeriod?: TimeframePeriod;
  onPeriodChange?: (period: TimeframePeriod) => void;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  onSettingsClick?: () => void;
  onNotificationClick?: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getModuleInitials(title: string): string {
  const t = title.toUpperCase();
  if (t.includes('ACCOUNTING') && (t.includes('FINANCE') || t.includes('OVERVIEW'))) return 'A&F';
  if (t.includes('SALES') && t.includes('CUSTOMER')) return 'S&C';
  if (t.includes('SALES')) return 'SLS';
  if (t.includes('PROCUREMENT') || t.includes('PURCHAS')) return 'PUR';
  if (t.includes('BANKING') || t.includes('PAYMENT')) return 'B&P';
  if (t.includes('ACCOUNTING')) return 'ACC';
  if (t.includes('ASSET') && t.includes('INVENTORY')) return 'A&I';
  if (t.includes('ASSET')) return 'AST';
  if (t.includes('MANUFACTURING') || t.includes('PRODUCTION')) return 'M&P';
  if (t.includes('PAYROLL') || t.includes('HR')) return 'PAY';
  if (t.includes('SURVEY') || t.includes('FIELD')) return 'FLD';
  if (t.includes('GOVERNMENT') || t.includes('COMPLIANCE') || t.includes('TAX')) return 'TAX';
  if (t.includes('PROJECT')) return 'PRJ';
  if (t.includes('ANALYTICS') || t.includes('AI')) return 'AI';
  if (t.includes('ADMIN')) return 'ADM';

  // Fallback: take first letters of meaningful words
  const words = title
    .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && !['AND', 'OF', 'THE', 'FOR', 'SUMMARY', 'OVERVIEW'].includes(w.toUpperCase()));
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (words[0]?.slice(0, 3) || 'ERP').toUpperCase();
}

export function DashboardHeader({
  title = 'Accounting & Finance ERP Overview',
  subtitle = 'Real-time financial performance & business insights',
  badge,
  className = '',
  showControls = false,
  selectedPeriod = 'quarterly',
  onPeriodChange,
  selectedDate,
  onDateChange,
}: DashboardHeaderProps) {
  const [internalDate, setInternalDate] = useState<string>(() => {
    return selectedDate || new Date().toISOString().split('T')[0];
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const activeDateStr = selectedDate || internalDate;
  const activeDateObj = useMemo(() => {
    const d = new Date(activeDateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? new Date() : d;
  }, [activeDateStr]);

  const [viewMonth, setViewMonth] = useState<number>(activeDateObj.getMonth());
  const [viewYear, setViewYear] = useState<number>(activeDateObj.getFullYear());

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    if (calendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [calendarOpen]);

  const formattedDate = activeDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleSelectDate = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const iso = `${year}-${mm}-${dd}`;
    setInternalDate(iso);
    onDateChange?.(iso);
    setCalendarOpen(false);
  };

  const setPreset = (type: 'today' | 'yesterday' | 'monthStart' | 'monthEnd') => {
    const now = new Date();
    let target = new Date();
    if (type === 'yesterday') {
      target.setDate(now.getDate() - 1);
    } else if (type === 'monthStart') {
      target = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (type === 'monthEnd') {
      target = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    const iso = target.toISOString().split('T')[0];
    setInternalDate(iso);
    setViewMonth(target.getMonth());
    setViewYear(target.getFullYear());
    onDateChange?.(iso);
    setCalendarOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Generate calendar days
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: { day: number; currentMonth: boolean; year: number; month: number; isSelected: boolean; isToday: boolean }[] = [];
    const todayIso = new Date().toISOString().split('T')[0];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const iso = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        currentMonth: false,
        year: prevY,
        month: prevM,
        isSelected: iso === activeDateStr,
        isToday: iso === todayIso,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        currentMonth: true,
        year: viewYear,
        month: viewMonth,
        isSelected: iso === activeDateStr,
        isToday: iso === todayIso,
      });
    }

    // Next month filler days to complete grid
    const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length);
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const iso = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        currentMonth: false,
        year: nextY,
        month: nextM,
        isSelected: iso === activeDateStr,
        isToday: iso === todayIso,
      });
    }

    return days;
  }, [viewYear, viewMonth, activeDateStr]);

  const periodLabels: Record<TimeframePeriod, string> = {
    all: 'Full Year (12M)',
    quarterly: 'Quarterly Overview',
    q1: 'Q1 (Jan – Mar)',
    q2: 'Q2 (Apr – Jun)',
    q3: 'Q3 (Jul – Sep)',
    q4: 'Q4 (Oct – Dec)',
  };

  const initials = getModuleInitials(title);

  // AMS Module DNA — each domain owns a signature hue.
  const MODULE_DNA: { match: string[]; hex: string }[] = [
    { match: ['SALES'], hex: '#6366f1' },
    { match: ['PROCUREMENT', 'PURCHAS'], hex: '#10b981' },
    { match: ['BANKING', 'PAYMENT'], hex: '#3b82f6' },
    { match: ['ASSET'], hex: '#14b8a6' },
    { match: ['MANUFACTURING', 'PRODUCTION'], hex: '#f97316' },
    { match: ['PAYROLL', 'HR'], hex: '#f59e0b' },
    { match: ['FIELD', 'SURVEY'], hex: '#84cc16' },
    { match: ['GOVERNMENT', 'COMPLIANCE', 'TAX'], hex: '#f43f5e' },
    { match: ['PROJECT'], hex: '#06b6d4' },
    { match: ['ADMIN'], hex: '#8b5cf6' },
    { match: ['ANALYTICS', 'AI'], hex: '#a855f7' },
    { match: ['ACCOUNTING', 'FINANCE'], hex: '#8b5cf6' },
  ];
  const tUpper = title.toUpperCase();
  const dnaHex = MODULE_DNA.find((m) => m.match.some((k) => tUpper.includes(k)))?.hex ?? '#6366f1';

  return (
    <div className={`col-span-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-6 py-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
      {/* Left — AMS Signature diamond monogram, title and subtitle */}
      <div className="flex items-center gap-4">
        <div className="relative h-11 w-11 shrink-0">
          <div
            className="absolute inset-[5px] rotate-45 rounded-[10px] shadow-lg"
            style={{ background: `linear-gradient(135deg, ${dnaHex}, color-mix(in srgb, ${dnaHex} 60%, #1e1b4b))` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-black tracking-tight text-white">{initials}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-[var(--color-text-strong)]">
              {title}
            </h1>
            {badge && (
              <span className="flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {subtitle} {showControls ? <>· <span className="font-semibold text-[var(--color-primary)]">{periodLabels[selectedPeriod]}</span></> : null}
          </p>
        </div>
      </div>

      {/* Right — Show controls ONLY if showControls is enabled (Dashboard Overview) */}
      {showControls && (
        <div className="flex items-center gap-3 self-end sm:self-center flex-wrap">
          {/* Interactive Calendar Popover Trigger */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => {
                setViewMonth(activeDateObj.getMonth());
                setViewYear(activeDateObj.getFullYear());
                setCalendarOpen(o => !o);
              }}
              title="Click to select any date"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                calendarOpen
                  ? 'bg-[var(--color-surface)] border-[var(--color-primary)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
                  : 'bg-[var(--color-surface-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-text)]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span className="text-xs font-semibold">{formattedDate}</span>
            </button>

            {/* Popover Calendar */}
            {calendarOpen && (
              <div
                className="absolute top-[calc(100%+8px)] right-0 z-50 w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150"
                style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 15px rgba(139,92,246,0.15)' }}
              >
                {/* Header: Month & Year Navigator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-xs text-[var(--color-text-strong)]">
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={prevMonth}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextMonth}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day-of-week header */}
                <div className="grid grid-cols-7 text-center text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarGrid.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectDate(item.year, item.month, item.day)}
                      className={`h-7 w-7 mx-auto rounded-lg text-[11px] font-bold flex items-center justify-center transition-all ${
                        item.isSelected
                          ? 'bg-[var(--color-primary)] text-white shadow-md scale-105'
                          : item.isToday
                          ? 'border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'
                          : item.currentMonth
                          ? 'text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]'
                          : 'text-[var(--color-text-muted)]/40 hover:bg-[var(--color-surface-muted)]/50'
                      }`}
                    >
                      {item.day}
                    </button>
                  ))}
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[9.5px]">
                  <button
                    onClick={() => setPreset('today')}
                    className="px-2 py-1 rounded-lg text-[var(--color-primary)] font-bold hover:bg-[var(--color-primary)]/10 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setPreset('yesterday')}
                    className="px-2 py-1 rounded-lg text-[var(--color-text-muted)] font-semibold hover:bg-[var(--color-surface-muted)] transition-colors"
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={() => setPreset('monthStart')}
                    className="px-2 py-1 rounded-lg text-[var(--color-text-muted)] font-semibold hover:bg-[var(--color-surface-muted)] transition-colors"
                  >
                    Month Start
                  </button>
                  <button
                    onClick={() => setPreset('monthEnd')}
                    className="px-2 py-1 rounded-lg text-[var(--color-text-muted)] font-semibold hover:bg-[var(--color-surface-muted)] transition-colors"
                  >
                    Month End
                  </button>
                </div>

                {/* Direct ISO Input */}
                <div className="pt-1">
                  <input
                    type="date"
                    value={activeDateStr}
                    onChange={(e) => {
                      if (e.target.value) {
                        setInternalDate(e.target.value);
                        onDateChange?.(e.target.value);
                        const d = new Date(e.target.value + 'T00:00:00');
                        if (!isNaN(d.getTime())) {
                          setViewMonth(d.getMonth());
                          setViewYear(d.getFullYear());
                        }
                        setCalendarOpen(false);
                      }
                    }}
                    className="w-full text-[10px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Interactive Quarterly / Period Filter */}
          <div className="flex items-center bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl p-1 gap-1">
            <div className="flex items-center gap-1.5 px-2 text-[10px] font-bold text-[var(--color-text-muted)] border-r border-[var(--color-border)] pr-2.5">
              <span>View:</span>
            </div>

            <div className="flex items-center gap-1">
              {(['quarterly', 'q1', 'q2', 'q3', 'q4', 'all'] as TimeframePeriod[]).map((p) => {
                const active = selectedPeriod === p;
                const shortLabel = p === 'quarterly' ? 'Quarterly' : p === 'all' ? 'Annual' : p.toUpperCase();
                return (
                  <button
                    key={p}
                    onClick={() => onPeriodChange?.(p)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      active
                        ? 'bg-[var(--color-primary)] text-white shadow-sm'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                    }`}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
