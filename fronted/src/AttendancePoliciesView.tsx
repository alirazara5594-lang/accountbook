import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import {
  Scale, Plus, Building2,
  Clock, AlertTriangle, Edit3, Trash2,
  Sliders, Check, X, Calendar, Factory, RefreshCw
} from 'lucide-react';

export interface AttendancePolicy {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  assignedBranch: string;
  assignedDepartments: string[];
  // Working Days & Schedule
  workingDays: string[];
  shiftStartTime: string;
  shiftEndTime: string;
  standardHoursPerDay: number;
  breakDurationMinutes: number;
  // Grace Period
  gracePeriodMinutes: number;
  // Multi-Tier Late Arrival Penalties
  tier1LateThreshold: number;
  tier1PenaltyType: 'Deduct 0.5 Day Pay' | 'Deduct 0.25 Day Pay' | 'Deduct 1.0 Full Day Pay' | 'Deduct from Leave Balance' | 'Warning Notice Only';
  tier2LateThreshold: number;
  tier2PenaltyType: 'Deduct 1.0 Full Day Pay' | 'Deduct 2.0 Days Pay' | 'Deduct 0.5 Day Pay' | 'Deduct from Leave Balance' | 'Formal Show Cause Notice';
  tier3LateThreshold: number;
  tier3PenaltyType: 'Deduct 1.0 Full Day Pay per Late' | 'Loss of Pay (LOP) + Disciplinary Review' | 'Salary Withheld';
  // Half-Day & Early Out Rules
  halfDayMinHours: number;
  earlyDepartureGraceMinutes: number;
  maxHalfDaysPerMonth: number;
  // Overtime Rules
  overtimeEligible: boolean;
  overtimeMinThresholdMinutes: number;
  weekdayOvertimeRate: number;
  weekendOvertimeRate: number;
  holidayOvertimeRate: number;
  overtimeRequiresApproval: boolean;
  maxMonthlyOvertimeHours: number;
  // Absenteeism / LOP
  lopMultiplier: number;
  consecutiveAbsenceAlertDays: number;
}

export const ALL_WEEKDAYS = [
  { key: 'Mon', label: 'Monday' },
  { key: 'Tue', label: 'Tuesday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' },
  { key: 'Fri', label: 'Friday' },
  { key: 'Sat', label: 'Saturday' },
  { key: 'Sun', label: 'Sunday (Off)' },
];

export const BRANCH_OPTIONS = [
  'Head Office',
  'Factory / Plant 1',
  'Warehouse & Logistics',
  'Regional Branch',
  'All Branches'
];

export const DEFAULT_POLICIES: AttendancePolicy[] = [
  {
    id: 'pol-1',
    name: 'Head Office Corporate Policy (5 Days)',
    description: 'Default attendance policy for Head Office staff. Monday to Friday 09:00 - 17:00 with 15-min grace and Tier 1 (3 lates = 0.5 day) / Tier 2 (5 lates = 1.0 Full Day Deduction).',
    isDefault: true,
    assignedBranch: 'Head Office',
    assignedDepartments: ['Executive', 'Finance', 'Human Resources', 'Sales & Marketing', 'Engineering / IT'],
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    shiftStartTime: '09:00',
    shiftEndTime: '17:00',
    standardHoursPerDay: 8.0,
    breakDurationMinutes: 60,
    gracePeriodMinutes: 15,
    tier1LateThreshold: 3,
    tier1PenaltyType: 'Deduct 0.5 Day Pay',
    tier2LateThreshold: 5,
    tier2PenaltyType: 'Deduct 1.0 Full Day Pay',
    tier3LateThreshold: 7,
    tier3PenaltyType: 'Deduct 1.0 Full Day Pay per Late',
    halfDayMinHours: 4.0,
    earlyDepartureGraceMinutes: 15,
    maxHalfDaysPerMonth: 2,
    overtimeEligible: true,
    overtimeMinThresholdMinutes: 30,
    weekdayOvertimeRate: 1.5,
    weekendOvertimeRate: 2.0,
    holidayOvertimeRate: 2.5,
    overtimeRequiresApproval: true,
    maxMonthlyOvertimeHours: 40,
    lopMultiplier: 1.0,
    consecutiveAbsenceAlertDays: 3,
  },
  {
    id: 'pol-2',
    name: 'Factory & Plant Shift Policy (6 Days)',
    description: 'Default attendance policy for Manufacturing Plant & Warehouse. Monday to Saturday 08:00 - 16:30 with strict 5-min grace and 2.0x weekend double-time.',
    isDefault: true,
    assignedBranch: 'Factory / Plant 1',
    assignedDepartments: ['Operations', 'Factory & Manufacturing', 'Warehouse & Logistics'],
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    shiftStartTime: '08:00',
    shiftEndTime: '16:30',
    standardHoursPerDay: 8.0,
    breakDurationMinutes: 30,
    gracePeriodMinutes: 5,
    tier1LateThreshold: 3,
    tier1PenaltyType: 'Deduct 0.5 Day Pay',
    tier2LateThreshold: 5,
    tier2PenaltyType: 'Deduct 1.0 Full Day Pay',
    tier3LateThreshold: 6,
    tier3PenaltyType: 'Loss of Pay (LOP) + Disciplinary Review',
    halfDayMinHours: 4.0,
    earlyDepartureGraceMinutes: 5,
    maxHalfDaysPerMonth: 1,
    overtimeEligible: true,
    overtimeMinThresholdMinutes: 15,
    weekdayOvertimeRate: 1.5,
    weekendOvertimeRate: 2.0,
    holidayOvertimeRate: 2.5,
    overtimeRequiresApproval: false,
    maxMonthlyOvertimeHours: 60,
    lopMultiplier: 1.0,
    consecutiveAbsenceAlertDays: 2,
  },
];

// Helper to sanitize any policy object
function sanitizePolicy(p: any, idx: number): AttendancePolicy {
  const fallback = DEFAULT_POLICIES[idx % DEFAULT_POLICIES.length] || DEFAULT_POLICIES[0];
  return {
    id: p?.id || fallback.id,
    name: p?.name || fallback.name,
    description: p?.description || fallback.description,
    isDefault: p?.isDefault ?? fallback.isDefault,
    assignedBranch: p?.assignedBranch || fallback.assignedBranch,
    assignedDepartments: Array.isArray(p?.assignedDepartments) ? p.assignedDepartments : fallback.assignedDepartments,
    workingDays: Array.isArray(p?.workingDays) && p.workingDays.length > 0 ? p.workingDays : fallback.workingDays,
    shiftStartTime: p?.shiftStartTime || fallback.shiftStartTime,
    shiftEndTime: p?.shiftEndTime || fallback.shiftEndTime,
    standardHoursPerDay: Number(p?.standardHoursPerDay) || fallback.standardHoursPerDay,
    breakDurationMinutes: Number(p?.breakDurationMinutes) || fallback.breakDurationMinutes,
    gracePeriodMinutes: Number(p?.gracePeriodMinutes) ?? fallback.gracePeriodMinutes,
    tier1LateThreshold: Number(p?.tier1LateThreshold) || fallback.tier1LateThreshold,
    tier1PenaltyType: p?.tier1PenaltyType || fallback.tier1PenaltyType,
    tier2LateThreshold: Number(p?.tier2LateThreshold) || fallback.tier2LateThreshold,
    tier2PenaltyType: p?.tier2PenaltyType || fallback.tier2PenaltyType,
    tier3LateThreshold: Number(p?.tier3LateThreshold) || fallback.tier3LateThreshold,
    tier3PenaltyType: p?.tier3PenaltyType || fallback.tier3PenaltyType,
    halfDayMinHours: Number(p?.halfDayMinHours) || fallback.halfDayMinHours,
    earlyDepartureGraceMinutes: Number(p?.earlyDepartureGraceMinutes) || fallback.earlyDepartureGraceMinutes,
    maxHalfDaysPerMonth: Number(p?.maxHalfDaysPerMonth) || fallback.maxHalfDaysPerMonth,
    overtimeEligible: p?.overtimeEligible ?? fallback.overtimeEligible,
    overtimeMinThresholdMinutes: Number(p?.overtimeMinThresholdMinutes) ?? fallback.overtimeMinThresholdMinutes,
    weekdayOvertimeRate: Number(p?.weekdayOvertimeRate) || fallback.weekdayOvertimeRate,
    weekendOvertimeRate: Number(p?.weekendOvertimeRate) || fallback.weekendOvertimeRate,
    holidayOvertimeRate: Number(p?.holidayOvertimeRate) || fallback.holidayOvertimeRate,
    overtimeRequiresApproval: p?.overtimeRequiresApproval ?? fallback.overtimeRequiresApproval,
    maxMonthlyOvertimeHours: Number(p?.maxMonthlyOvertimeHours) || fallback.maxMonthlyOvertimeHours,
    lopMultiplier: Number(p?.lopMultiplier) || fallback.lopMultiplier,
    consecutiveAbsenceAlertDays: Number(p?.consecutiveAbsenceAlertDays) || fallback.consecutiveAbsenceAlertDays,
  };
}

export default function AttendancePoliciesView() {
  const [policies, setPolicies] = useState<AttendancePolicy[]>(() => {
    try {
      const saved = localStorage.getItem('ab_attendance_policies');
      if (!saved) return DEFAULT_POLICIES;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_POLICIES;
      return parsed.map((p, idx) => sanitizePolicy(p, idx));
    } catch {
      return DEFAULT_POLICIES;
    }
  });

  const [editingPolicy, setEditingPolicy] = useState<AttendancePolicy | null>(null);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState('All');

  // Policy Simulator Test
  const [simClockIn, setSimClockIn] = useState('09:20');
  const [simClockOut, setSimClockOut] = useState('18:30');
  const [simAccumulatedLates, setSimAccumulatedLates] = useState<number>(5);
  const [selectedSimPolicyId, setSelectedSimPolicyId] = useState<string>(() => policies[0]?.id || 'pol-1');

  const savePoliciesToStorage = (updated: AttendancePolicy[]) => {
    setPolicies(updated);
    localStorage.setItem('ab_attendance_policies', JSON.stringify(updated));
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset attendance policies to standard company defaults (Head Office 5-Day & Factory 6-Day)?')) {
      savePoliciesToStorage(DEFAULT_POLICIES);
      setSelectedSimPolicyId(DEFAULT_POLICIES[0].id);
    }
  };

  const filteredPolicies = useMemo(() => {
    if (branchFilter === 'All') return policies;
    return policies.filter(p => (p.assignedBranch || 'Head Office') === branchFilter || p.assignedBranch === 'All Branches');
  }, [policies, branchFilter]);

  const simResult = useMemo(() => {
    const pol = policies.find(p => p.id === selectedSimPolicyId) || policies[0] || DEFAULT_POLICIES[0];
    if (!pol) return null;

    const [shInH, shInM] = (pol.shiftStartTime || '09:00').split(':').map(Number);
    const [actInH, actInM] = (simClockIn || '09:00').split(':').map(Number);
    const shiftInMin = (shInH || 9) * 60 + (shInM || 0);
    const actInMin = (actInH || 9) * 60 + (actInM || 0);
    const lateMin = Math.max(0, actInMin - shiftInMin);
    const isLate = lateMin > (pol.gracePeriodMinutes ?? 15);

    const [shOutH, shOutM] = (pol.shiftEndTime || '17:00').split(':').map(Number);
    const [actOutH, actOutM] = (simClockOut || '17:00').split(':').map(Number);
    const shiftOutMin = (shOutH || 17) * 60 + (shOutM || 0);
    const actOutMin = (actOutH || 17) * 60 + (actOutM || 0);
    const workedHours = Math.max(0, (actOutMin - actInMin) / 60);

    const isHalfDay = workedHours < (pol.halfDayMinHours ?? 4) && workedHours > 2;
    const isAbsent = workedHours <= 2;

    const otMin = Math.max(0, actOutMin - shiftOutMin);
    const otHours = otMin >= (pol.overtimeMinThresholdMinutes ?? 30) ? Math.round((otMin / 60) * 10) / 10 : 0;
    const otPayMultiplier = pol.weekdayOvertimeRate ?? 1.5;

    let latePenaltyApplied = 'No Penalty (Within Grace)';
    if (isLate) {
      if (simAccumulatedLates >= (pol.tier2LateThreshold || 5)) {
        latePenaltyApplied = `🔴 Tier 2 Triggered (${simAccumulatedLates} Lates): ${pol.tier2PenaltyType || 'Deduct 1.0 Full Day Pay'}`;
      } else if (simAccumulatedLates >= (pol.tier1LateThreshold || 3)) {
        latePenaltyApplied = `🟠 Tier 1 Triggered (${simAccumulatedLates} Lates): ${pol.tier1PenaltyType || 'Deduct 0.5 Day Pay'}`;
      } else {
        latePenaltyApplied = `🟡 Late Count ${simAccumulatedLates} (Warning threshold is ${pol.tier1LateThreshold || 3} lates)`;
      }
    }

    const workingDaysList = Array.isArray(pol.workingDays) ? pol.workingDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    return {
      policyName: pol.name || 'Standard Policy',
      branch: pol.assignedBranch || 'Head Office',
      workingDaysText: `${workingDaysList.length} Working Days (${workingDaysList.join(', ')})`,
      shift: `${pol.shiftStartTime || '09:00'} - ${pol.shiftEndTime || '17:00'}`,
      gracePeriod: `${pol.gracePeriodMinutes ?? 15} mins`,
      isLate,
      lateMinutes: lateMin,
      latePenaltyApplied,
      isHalfDay,
      isAbsent,
      workedHours: workedHours.toFixed(1),
      otHours,
      otPayMultiplier,
      status: isAbsent ? 'Absent' : isHalfDay ? 'Half Day' : isLate ? 'Late Arrival' : 'Present (On Time)',
    };
  }, [selectedSimPolicyId, simClockIn, simClockOut, simAccumulatedLates, policies]);

  const handleSavePolicy = (e: FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;

    const safeEditing = sanitizePolicy(editingPolicy, 0);

    if (safeEditing.isDefault) {
      policies.forEach(p => {
        if (p.assignedBranch === safeEditing.assignedBranch && p.id !== safeEditing.id) {
          p.isDefault = false;
        }
      });
    }

    const exists = policies.find(p => p.id === safeEditing.id);
    let updated: AttendancePolicy[];
    if (exists) {
      updated = policies.map(p => p.id === safeEditing.id ? safeEditing : p);
    } else {
      updated = [...policies, safeEditing];
    }

    savePoliciesToStorage(updated);
    setPolicyModalOpen(false);
    setEditingPolicy(null);
  };

  const handleDeletePolicy = (id: string) => {
    if (policies.length <= 1) {
      alert('You must keep at least one active attendance policy.');
      return;
    }
    const updated = policies.filter(p => p.id !== id);
    savePoliciesToStorage(updated);
  };

  const toggleWorkingDay = (dayKey: string) => {
    if (!editingPolicy) return;
    const current = editingPolicy.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    let next: string[];
    if (current.includes(dayKey)) {
      if (current.length === 1) return;
      next = current.filter(d => d !== dayKey);
    } else {
      next = [...current, dayKey];
    }
    setEditingPolicy({ ...editingPolicy, workingDays: next });
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black tracking-tight text-[var(--color-text-strong)] flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 border border-teal-500/20 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            Attendance & Shift Policies (Multi-Branch Support)
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Configure independent default policies for **Head Office (5-Day)** and **Factory / Plant (6-Day)** simultaneously.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetToDefaults}
            title="Reset Policies to Defaults"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <RefreshCw className="w-4 h-4 text-teal-600" /> Reset Defaults
          </button>

          <button
            onClick={() => {
              setEditingPolicy({
                id: `pol-${Date.now()}`,
                name: 'New Location Attendance Policy',
                description: 'Shift hours, grace periods, and late salary deductions for this facility.',
                isDefault: true,
                assignedBranch: 'Head Office',
                assignedDepartments: ['Operations'],
                workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                shiftStartTime: '09:00',
                shiftEndTime: '17:00',
                standardHoursPerDay: 8.0,
                breakDurationMinutes: 60,
                gracePeriodMinutes: 15,
                tier1LateThreshold: 3,
                tier1PenaltyType: 'Deduct 0.5 Day Pay',
                tier2LateThreshold: 5,
                tier2PenaltyType: 'Deduct 1.0 Full Day Pay',
                tier3LateThreshold: 7,
                tier3PenaltyType: 'Deduct 1.0 Full Day Pay per Late',
                halfDayMinHours: 4.0,
                earlyDepartureGraceMinutes: 15,
                maxHalfDaysPerMonth: 2,
                overtimeEligible: true,
                overtimeMinThresholdMinutes: 30,
                weekdayOvertimeRate: 1.5,
                weekendOvertimeRate: 2.0,
                holidayOvertimeRate: 2.5,
                overtimeRequiresApproval: true,
                maxMonthlyOvertimeHours: 40,
                lopMultiplier: 1.0,
                consecutiveAbsenceAlertDays: 3,
              });
              setPolicyModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Create Policy
          </button>
        </div>
      </div>

      {/* Multi-Location Guide Callout */}
      <div className="p-4 rounded-2xl border border-teal-500/20 bg-teal-500/5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-teal-600 text-white font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[var(--color-text-strong)]">Multi-Location Attendance Architecture</h3>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              You can set <strong>both</strong> Head Office and Factory as active defaults for their respective locations. Employees assigned to Head Office follow the 5-day corporate policy, while Factory employees follow the 6-day manufacturing shift.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-[var(--color-text-muted)]">Filter Location:</span>
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className="px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs font-semibold outline-none text-[var(--color-text-strong)]"
          >
            <option value="All">All Locations ({policies.length})</option>
            {BRANCH_OPTIONS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Policy Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPolicies.map(pol => {
          const branch = pol.assignedBranch || 'Head Office';
          const workingDays = Array.isArray(pol.workingDays) ? pol.workingDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
          const departments = Array.isArray(pol.assignedDepartments) ? pol.assignedDepartments : ['Operations'];

          return (
            <div key={pol.id} className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-[var(--color-text-strong)]">{pol.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 text-[10.5px] font-bold flex items-center gap-1">
                        {branch.includes('Factory') ? <Factory className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        {branch}
                      </span>
                      {pol.isDefault && (
                        <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 border border-teal-500/20 text-[10px] font-bold">
                          Default for {branch}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{pol.description}</p>
                  </div>
                </div>

                <div className="p-3 bg-[var(--color-surface-muted)] rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-[var(--color-border)]/60 pb-1.5">
                    <span className="text-[var(--color-text-muted)] flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" /> Working Days:
                    </span>
                    <span className="font-bold text-teal-700 dark:text-teal-300">
                      {workingDays.length === 5 ? '5 Days (Mon–Fri)' : workingDays.length === 6 ? '6 Days (Mon–Sat)' : `${workingDays.length} Days/wk`}
                      <span className="text-[10px] text-[var(--color-text-muted)] ml-1">({workingDays.join(', ')})</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-muted)]">Shift Timings:</span>
                    <span className="font-mono font-bold text-[var(--color-text-strong)]">{pol.shiftStartTime || '09:00'} to {pol.shiftEndTime || '17:00'} ({pol.standardHoursPerDay || 8} hrs)</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-muted)]">Grace Period:</span>
                    <span className="font-mono font-bold text-emerald-600">{pol.gracePeriodMinutes ?? 15} Minutes</span>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-[var(--color-border)]/60">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[var(--color-text-muted)] font-semibold">Tier 1 ({pol.tier1LateThreshold || 3} Lates):</span>
                      <span className="font-semibold text-amber-600">{pol.tier1PenaltyType || 'Deduct 0.5 Day Pay'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[var(--color-text-muted)] font-semibold">Tier 2 ({pol.tier2LateThreshold || 5} Lates):</span>
                      <span className="font-bold text-rose-600">{pol.tier2PenaltyType || 'Deduct 1.0 Full Day Pay'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-[var(--color-border)]/60">
                    <span className="text-[var(--color-text-muted)]">Half-Day Threshold:</span>
                    <span className="font-mono font-semibold text-amber-600">Min {pol.halfDayMinHours || 4} hrs worked</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-muted)]">Overtime Rates:</span>
                    <span className="font-mono font-bold text-purple-600">Weekday {pol.weekdayOvertimeRate || 1.5}x · Weekend {pol.weekendOvertimeRate || 2.0}x</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Assigned Departments:</span>
                  <div className="flex flex-wrap gap-1">
                    {departments.map((dept: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-md text-[10.5px] font-semibold text-[var(--color-text)]">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Active for {branch}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingPolicy({ ...pol });
                      setPolicyModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                    title="Edit Policy"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                  </button>
                  <button
                    onClick={() => handleDeletePolicy(pol.id)}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-rose-600"
                    title="Delete Policy"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator */}
      <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" /> Interactive Policy Diagnostic Simulator
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Test sample clock-in / clock-out punch times and accumulated late counts against any location policy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-[var(--color-text-strong)]">Select Location Policy</label>
            <select
              value={selectedSimPolicyId}
              onChange={e => setSelectedSimPolicyId(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold"
            >
              {policies.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.assignedBranch || 'Head Office'})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[var(--color-text-strong)]">Sample Clock In Punch</label>
            <input
              type="time"
              value={simClockIn}
              onChange={e => setSimClockIn(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[var(--color-text-strong)]">Sample Clock Out Punch</label>
            <input
              type="time"
              value={simClockOut}
              onChange={e => setSimClockOut(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[var(--color-text-strong)]">Employee's Monthly Lates Count</label>
            <input
              type="number"
              min="0"
              max="15"
              value={simAccumulatedLates}
              onChange={e => setSimAccumulatedLates(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono font-bold text-rose-600"
            />
          </div>
        </div>

        {simResult && (
          <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10.5px] uppercase font-bold text-[var(--color-text-muted)] block">Calculated Status ({simResult.branch})</span>
              <span className={`font-bold text-sm ${simResult.isLate ? 'text-amber-600' : 'text-emerald-600'}`}>
                {simResult.status}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">{simResult.workingDaysText}</span>
            </div>

            <div>
              <span className="text-[10.5px] uppercase font-bold text-[var(--color-text-muted)] block">Late Arrival & Penalty</span>
              <span className="font-bold text-[11px] text-[var(--color-text-strong)] block">
                {simResult.latePenaltyApplied}
              </span>
            </div>

            <div>
              <span className="text-[10.5px] uppercase font-bold text-[var(--color-text-muted)] block">Total Hours Worked</span>
              <span className="font-mono font-bold text-blue-600">{simResult.workedHours} Hours</span>
            </div>

            <div>
              <span className="text-[10.5px] uppercase font-bold text-[var(--color-text-muted)] block">Overtime Credited</span>
              <span className="font-mono font-bold text-purple-600">
                {simResult.otHours > 0 ? `+${simResult.otHours}h @ ${simResult.otPayMultiplier}x rate` : '0h (Under threshold)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CREATE / EDIT ATTENDANCE POLICY */}
      {policyModalOpen && editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-text-strong)]">
                    {editingPolicy.id ? 'Edit Location Policy' : 'Create Location Policy'}
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Configure weekly working schedule, location binding, and multi-tier salary deductions</p>
                </div>
              </div>
              <button onClick={() => setPolicyModalOpen(false)} className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="p-6 space-y-6 text-xs overflow-y-auto">
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-[var(--color-text-strong)] border-b border-[var(--color-border)] pb-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-600" /> 1. Policy Identity & Location Assignment
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Policy Name *</label>
                    <input
                      required
                      type="text"
                      value={editingPolicy.name}
                      onChange={e => setEditingPolicy({ ...editingPolicy, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Assigned Facility / Branch *</label>
                    <select
                      value={editingPolicy.assignedBranch || 'Head Office'}
                      onChange={e => setEditingPolicy({ ...editingPolicy, assignedBranch: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold"
                    >
                      {BRANCH_OPTIONS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Policy Description</label>
                    <input
                      type="text"
                      value={editingPolicy.description || ''}
                      onChange={e => setEditingPolicy({ ...editingPolicy, description: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Default Status</label>
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDefaultPolicy"
                        checked={editingPolicy.isDefault}
                        onChange={e => setEditingPolicy({ ...editingPolicy, isDefault: e.target.checked })}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                      <label htmlFor="isDefaultPolicy" className="text-[11.5px] font-semibold text-[var(--color-text)]">
                        Set as Default Policy for {editingPolicy.assignedBranch || 'Head Office'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Days */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-1">
                  <h4 className="font-bold text-xs text-[var(--color-text-strong)] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" /> 2. Weekly Working Days Schedule & Days Off
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingPolicy({ ...editingPolicy, workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] })}
                      className="px-2.5 py-1 text-[10.5px] font-bold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-teal-600"
                    >
                      5-Day (Mon–Fri)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPolicy({ ...editingPolicy, workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] })}
                      className="px-2.5 py-1 text-[10.5px] font-bold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-indigo-600"
                    >
                      6-Day (Mon–Sat)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-[var(--color-text-strong)]">
                    Select Active Working Days ({(editingPolicy.workingDays || []).length} Days Selected):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {ALL_WEEKDAYS.map(day => {
                      const active = (editingPolicy.workingDays || []).includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleWorkingDay(day.key)}
                          className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            active
                              ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                              : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-teal-500'
                          }`}
                        >
                          <span className="font-bold text-xs">{day.key}</span>
                          <span className="text-[9.5px] uppercase opacity-90">{active ? 'Working Day' : 'Day Off'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Shift Start Time</label>
                    <input
                      type="time"
                      value={editingPolicy.shiftStartTime || '09:00'}
                      onChange={e => setEditingPolicy({ ...editingPolicy, shiftStartTime: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Shift End Time</label>
                    <input
                      type="time"
                      value={editingPolicy.shiftEndTime || '17:00'}
                      onChange={e => setEditingPolicy({ ...editingPolicy, shiftEndTime: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Grace Period (Mins)</label>
                    <input
                      type="number"
                      value={editingPolicy.gracePeriodMinutes ?? 15}
                      onChange={e => setEditingPolicy({ ...editingPolicy, gracePeriodMinutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono font-bold text-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Standard Daily Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editingPolicy.standardHoursPerDay || 8}
                      onChange={e => setEditingPolicy({ ...editingPolicy, standardHoursPerDay: parseFloat(e.target.value) || 8 })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Late Penalties */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-[var(--color-text-strong)] border-b border-[var(--color-border)] pb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> 3. Multi-Tier Late Arrival Penalties & Salary Deductions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block text-xs">
                      Tier 1: Initial Late Threshold
                    </span>
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)] text-[11px]">Number of Late Marks</label>
                      <input
                        type="number"
                        min="1"
                        value={editingPolicy.tier1LateThreshold || 3}
                        onChange={e => setEditingPolicy({ ...editingPolicy, tier1LateThreshold: parseInt(e.target.value) || 3 })}
                        className="w-full px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)] text-[11px]">Penalty Action</label>
                      <select
                        value={editingPolicy.tier1PenaltyType || 'Deduct 0.5 Day Pay'}
                        onChange={e => setEditingPolicy({ ...editingPolicy, tier1PenaltyType: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg outline-none"
                      >
                        <option value="Deduct 0.5 Day Pay">Deduct 0.5 Day Salary (Half-Day Deduction)</option>
                        <option value="Deduct 0.25 Day Pay">Deduct 0.25 Day Salary</option>
                        <option value="Deduct from Leave Balance">Deduct 1 Casual Leave</option>
                        <option value="Warning Notice Only">First Warning Notice</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
                    <span className="font-bold text-rose-800 dark:text-rose-300 block text-xs">
                      Tier 2: Escalated Late Threshold (Full Day Deduction)
                    </span>
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)] text-[11px]">Number of Late Marks</label>
                      <input
                        type="number"
                        min="2"
                        value={editingPolicy.tier2LateThreshold || 5}
                        onChange={e => setEditingPolicy({ ...editingPolicy, tier2LateThreshold: parseInt(e.target.value) || 5 })}
                        className="w-full px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg outline-none font-mono font-bold text-rose-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)] text-[11px]">Penalty Action</label>
                      <select
                        value={editingPolicy.tier2PenaltyType || 'Deduct 1.0 Full Day Pay'}
                        onChange={e => setEditingPolicy({ ...editingPolicy, tier2PenaltyType: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg outline-none font-semibold text-rose-700"
                      >
                        <option value="Deduct 1.0 Full Day Pay">Deduct 1.0 FULL DAY SALARY</option>
                        <option value="Deduct 2.0 Days Pay">Deduct 2.0 Days Salary</option>
                        <option value="Deduct 0.5 Day Pay">Deduct 0.5 Day Salary</option>
                        <option value="Formal Show Cause Notice">Show Cause & Disciplinary Notice</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Min Worked Hours for Half-Day</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editingPolicy.halfDayMinHours || 4}
                      onChange={e => setEditingPolicy({ ...editingPolicy, halfDayMinHours: parseFloat(e.target.value) || 4 })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Early Departure Grace (Mins)</label>
                    <input
                      type="number"
                      value={editingPolicy.earlyDepartureGraceMinutes ?? 15}
                      onChange={e => setEditingPolicy({ ...editingPolicy, earlyDepartureGraceMinutes: parseInt(e.target.value) || 15 })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Overtime */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-[var(--color-text-strong)] border-b border-[var(--color-border)] pb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" /> 4. Overtime (OT) Multipliers & Rates
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">OT Min Threshold (Mins)</label>
                    <input
                      type="number"
                      value={editingPolicy.overtimeMinThresholdMinutes ?? 30}
                      onChange={e => setEditingPolicy({ ...editingPolicy, overtimeMinThresholdMinutes: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Weekday OT Rate</label>
                    <input
                      type="number"
                      step="0.25"
                      value={editingPolicy.weekdayOvertimeRate || 1.5}
                      onChange={e => setEditingPolicy({ ...editingPolicy, weekdayOvertimeRate: parseFloat(e.target.value) || 1.5 })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Weekend OT Rate</label>
                    <input
                      type="number"
                      step="0.25"
                      value={editingPolicy.weekendOvertimeRate || 2.0}
                      onChange={e => setEditingPolicy({ ...editingPolicy, weekendOvertimeRate: parseFloat(e.target.value) || 2.0 })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Holiday OT Rate</label>
                    <input
                      type="number"
                      step="0.25"
                      value={editingPolicy.holidayOvertimeRate || 2.5}
                      onChange={e => setEditingPolicy({ ...editingPolicy, holidayOvertimeRate: parseFloat(e.target.value) || 2.5 })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-purple-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setPolicyModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Policy Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
