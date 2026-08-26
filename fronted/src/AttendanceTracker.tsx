import { useEffect, useState, useMemo } from 'react';
import { usePayrollStore } from './stores';
import {
  Clock, CheckCircle2, XCircle, AlertTriangle,
  Upload, FileSpreadsheet,
  FileText, Search, RefreshCw, X, Building2, Factory
} from 'lucide-react';
import { downloadCSV, downloadExcel } from './lib/exportUtils';
import { KpiCard, KpiGrid } from './components/ui/kpi-card';
import { StatusChip } from './components/ui/status-chip';
import { EmptyState } from './components/ui/empty-state';
import type { AttendancePolicy } from './AttendancePoliciesView';
import { DEFAULT_POLICIES } from './AttendancePoliciesView';

const today = () => new Date().toISOString().split('T')[0];

export default function AttendanceTracker() {
  const { attendanceRecords, employees, fetchAttendance, fetchEmployees, recordAttendance } = usePayrollStore();

  const [dateFilter, setDateFilter] = useState(today());
  const [empFilter, setEmpFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [query, setQuery] = useState('');

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Biometric Import State
  const [rawImportText, setRawImportText] = useState('');
  const [importBranch, setImportBranch] = useState('Head Office');
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  const policies = useMemo<AttendancePolicy[]>(() => {
    const saved = localStorage.getItem('ab_attendance_policies');
    return saved ? JSON.parse(saved) : DEFAULT_POLICIES;
  }, []);

  const getEmpBranch = (id: string) => {
    const e = employees.find(x => x.id === id);
    if (!e) return 'Head Office';
    const dept = ((e as any).department || (e as any).departmentId || '').toString().toLowerCase();
    if (dept.includes('factory') || dept.includes('operations') || dept.includes('warehouse') || dept.includes('mfg') || dept.includes('plant')) {
      return 'Factory / Plant 1';
    }
    return 'Head Office';
  };

  const filtered = useMemo(() => {
    return attendanceRecords.filter(r => {
      const matchDate = !dateFilter || r.date === dateFilter;
      const matchEmp = empFilter === 'All' || r.employeeId === empFilter;
      const matchStatus = statusFilter === 'All' || r.status === statusFilter;

      const empBranch = getEmpBranch(r.employeeId);
      const matchBranch = branchFilter === 'All' || empBranch === branchFilter || (r.notes || '').includes(branchFilter);

      const emp = employees.find(e => e.id === r.employeeId);
      const empName = emp ? `${emp.firstName} ${emp.lastName} ${emp.employeeNumber}`.toLowerCase() : '';
      const matchQ = !query || empName.includes(query.toLowerCase()) || (r.notes || '').toLowerCase().includes(query.toLowerCase());

      return matchDate && matchEmp && matchStatus && matchBranch && matchQ;
    });
  }, [attendanceRecords, dateFilter, empFilter, statusFilter, branchFilter, query, employees]);

  const getEmpName = (id: string) => {
    const e = employees.find(x => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : 'Employee';
  };

  const getEmpNumber = (id: string) => {
    return employees.find(x => x.id === id)?.employeeNumber || 'EMP';
  };

  // Shift & Attendance Analytics
  const todayRecords = useMemo(() => attendanceRecords.filter(r => r.date === dateFilter), [attendanceRecords, dateFilter]);
  const presentCount = todayRecords.filter(r => r.status === 'Present').length;
  const lateCount = todayRecords.filter(r => r.status === 'Late').length;
  const absentCount = todayRecords.filter(r => r.status === 'Absent').length;
  const totalOvertime = todayRecords.reduce((s, r) => s + (r.overtimeHours || 0), 0);

  // Process Biometric Machine Logs with Location Policy Binding
  const handleProcessBiometricLog = async () => {
    if (!rawImportText.trim()) return;

    setSaving(true);
    let success = 0;
    let failed = 0;

    const branchPolicy = policies.find(p => p.assignedBranch === importBranch && p.isDefault) ||
      policies.find(p => p.assignedBranch === importBranch) ||
      policies[0];

    const lines = rawImportText.trim().split('\n');

    for (const line of lines) {
      const parts = line.split(/[,\t;]+/).map(p => p.trim());
      if (parts.length >= 3) {
        const empCode = parts[0];
        const date = parts[1] || today();
        const clockIn = parts[2] || '09:00';
        const clockOut = parts[3] || '17:00';

        const emp = employees.find(e => e.employeeNumber === empCode || e.id === empCode || `${e.firstName} ${e.lastName}`.toLowerCase() === empCode.toLowerCase());

        if (emp) {
          const [shiftH, shiftM] = branchPolicy.shiftStartTime.split(':').map(Number);
          const [inH, inM] = clockIn.split(':').map(Number);
          const shiftInMinutes = shiftH * 60 + shiftM;
          const actualInMinutes = inH * 60 + inM;
          const diffMinutes = actualInMinutes - shiftInMinutes;

          const isLate = diffMinutes > branchPolicy.gracePeriodMinutes;

          const [shiftEndH, shiftEndM] = branchPolicy.shiftEndTime.split(':').map(Number);
          const [outH, outM] = clockOut.split(':').map(Number);
          const shiftEndMinutes = shiftEndH * 60 + shiftEndM;
          const actualOutMinutes = outH * 60 + outM;
          const otMinutes = Math.max(0, actualOutMinutes - shiftEndMinutes);

          const overtimeHours = otMinutes >= branchPolicy.overtimeMinThresholdMinutes
            ? Math.round((otMinutes / 60) * 10) / 10
            : 0;

          await recordAttendance({
            employeeId: emp.id,
            date,
            clockIn,
            clockOut,
            regularHours: branchPolicy.standardHoursPerDay,
            overtimeHours,
            nightHours: 0,
            status: isLate ? 'Late' : 'Present',
            notes: `Biometric Sync · Facility: ${importBranch} (${branchPolicy.name})`,
          });
          success++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    }

    setSaving(false);
    setImportResults({ success, failed });
    fetchAttendance();
  };

  // Export Attendance Register
  const handleExportCSV = () => {
    const headers = ['Employee Code', 'Employee Name', 'Facility / Branch', 'Date', 'Clock In', 'Clock Out', 'Regular Hours', 'Overtime Hours', 'Attendance Status', 'Notes / Device Ref'];
    const rows = filtered.map(r => [
      getEmpNumber(r.employeeId),
      getEmpName(r.employeeId),
      getEmpBranch(r.employeeId),
      r.date,
      r.clockIn || '—',
      r.clockOut || '—',
      r.regularHours || 0,
      r.overtimeHours || 0,
      r.status,
      r.notes || 'Biometric Cloud Terminal'
    ]);
    downloadCSV(`Attendance_Register_${dateFilter || 'All'}`, headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Employee Code', 'Employee Name', 'Facility / Branch', 'Date', 'Clock In', 'Clock Out', 'Regular Hours', 'Overtime Hours', 'Attendance Status', 'Notes / Device Ref'];
    const rows = filtered.map(r => [
      getEmpNumber(r.employeeId),
      getEmpName(r.employeeId),
      getEmpBranch(r.employeeId),
      r.date,
      r.clockIn || '—',
      r.clockOut || '—',
      r.regularHours || 0,
      r.overtimeHours || 0,
      r.status,
      r.notes || 'Biometric Cloud Terminal'
    ]);
    downloadExcel(`Attendance_Register_${dateFilter || 'All'}`, 'Attendance_Log', headers, rows);
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-amber-500 to-orange-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Clock className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Daily Biometric Attendance Register (Multi-Facility)</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400"><span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Real-time biometric punch logs from Head Office and Factory / Plant terminals, overtime calculations, and shift verification.</p>
            </div>
          </div>

          {/* Global Toolbar */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto">
          <button
            onClick={() => { fetchAttendance(); fetchEmployees(); }}
            title="Refresh Attendance"
            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-teal-600" />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <FileText className="w-4 h-4 text-blue-600" /> CSV
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Upload className="w-4 h-4" /> Import Biometric Logs
          </button>
          </div>
        </div>
      </div>

      {/* 4 Core Attendance KPI Tiles */}
      <KpiGrid cols={4}>
        <KpiCard icon={CheckCircle2} label="Present Today" value={<>{presentCount} / {employees.length}</>} desc="Workforce Across All Locations" tone="emerald" />
        <KpiCard icon={AlertTriangle} label="Late Arrivals" value={lateCount} desc="Arrived past location grace period" tone="amber" />
        <KpiCard icon={XCircle} label="Unexplained Absences" value={absentCount} desc="Flagged for salary deduction" tone="rose" />
        <KpiCard icon={Clock} label="Accumulated Overtime" value={`${totalOvertime} Hours`} desc="Calculated for monthly payrun" tone="purple" />
      </KpiGrid>

      {/* Control & Search Toolbar with Location / Branch Filter */}
      <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search attendance by employee name, code, or terminal reference..."
              className="w-full pl-11 pr-8 py-2.5 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none font-mono"
            />

            {/* Location / Branch Filter */}
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] font-semibold outline-none"
            >
              <option value="All">All Facilities / Branches</option>
              <option value="Head Office">🏢 Head Office</option>
              <option value="Factory / Plant 1">🏭 Factory / Plant 1</option>
              <option value="Warehouse & Logistics">📦 Warehouse</option>
            </select>

            <select
              value={empFilter}
              onChange={e => setEmpFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none"
            >
              <option value="All">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNumber})</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="HalfDay">Half Day</option>
              <option value="OnLeave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-amber-500/[0.05] dark:bg-amber-400/[0.07] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 pl-5">Employee & Code</th>
                <th className="p-3.5">Facility / Location</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Clock In (Machine)</th>
                <th className="p-3.5">Clock Out (Machine)</th>
                <th className="p-3.5 text-center">Regular Hours</th>
                <th className="p-3.5 text-center">Overtime</th>
                <th className="p-3.5 text-center">Attendance Status</th>
                <th className="p-3.5 pr-5">Device / Verification Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map(r => {
                const branch = getEmpBranch(r.employeeId);
                return (
                  <tr key={r.id} className="hover:bg-[var(--color-surface-muted)]/50 transition-colors">
                    <td className="p-3.5 pl-5">
                      <div className="font-bold text-[var(--color-text-strong)]">{getEmpName(r.employeeId)}</div>
                      <div className="font-mono text-[10.5px] text-[var(--color-text-muted)]">{getEmpNumber(r.employeeId)}</div>
                    </td>

                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                        {branch.includes('Factory') ? <Factory className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        {branch}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-[var(--color-text-strong)]">{r.date}</td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-mono font-semibold text-emerald-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{r.clockIn || '—'}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-mono font-semibold text-rose-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{r.clockOut || '—'}</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-center font-mono font-bold">{r.regularHours || 8}h</td>

                    <td className="p-3.5 text-center font-mono font-bold text-purple-600">
                      {r.overtimeHours && r.overtimeHours > 0 ? `+${r.overtimeHours}h OT` : '—'}
                    </td>

                    <td className="p-3.5 text-center">
                      <StatusChip status={r.status} label={r.status} hex={
                        r.status === 'Present' ? '#10b981' :
                        r.status === 'Late' ? '#f59e0b' :
                        r.status === 'Absent' ? '#f43f5e' : '#94a3b8'
                      } />
                    </td>

                    <td className="p-3.5 pr-5 text-[11px] text-[var(--color-text-muted)] font-mono">
                      {r.notes || 'Biometric Cloud Terminal'}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-0">
                    <EmptyState icon={Clock} title="No Attendance Records" hint="No attendance punch records found for this date and location filter." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: 1-CLICK BIOMETRIC LOG FILE / DATA IMPORT WITH FACILITY SELECTION */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-text-strong)]">Import Biometric Machine Punch Logs</h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Select the terminal location and upload punch records</p>
                </div>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Which Facility did these logs come from? *</label>
                <select
                  value={importBranch}
                  onChange={e => setImportBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold"
                >
                  <option value="Head Office">🏢 Head Office Terminal (Applies 5-Day Corporate Policy)</option>
                  <option value="Factory / Plant 1">🏭 Factory Plant 1 Terminal (Applies 6-Day Manufacturing Policy)</option>
                  <option value="Warehouse & Logistics">📦 Warehouse Terminal</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">
                  Paste Biometric Log Data (Format: EmployeeCode, Date, ClockIn, ClockOut)
                </label>
                <textarea
                  rows={5}
                  value={rawImportText}
                  onChange={e => setRawImportText(e.target.value)}
                  placeholder={`EMP-1001, 2026-08-23, 08:52, 17:15\nEMP-1002, 2026-08-23, 09:25, 17:00\nEMP-1003, 2026-08-23, 08:45, 18:30`}
                  className="w-full p-3 font-mono text-[11px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
                <p className="text-[10.5px] text-[var(--color-text-muted)]">
                  Accepts CSV, Tab-delimited ZKTeco `.dat` logs, or text exports from biometric terminals.
                </p>
              </div>

              {importResults && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                  <span>✓ Successfully processed <strong>{importResults.success}</strong> attendance punch records for <strong>{importBranch}</strong>.</span>
                  {importResults.failed > 0 && <span className="text-amber-700">({importResults.failed} unmatched lines)</span>}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessBiometricLog}
                  disabled={saving || !rawImportText.trim()}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> {saving ? 'Processing...' : `Import & Apply ${importBranch} Rules`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
