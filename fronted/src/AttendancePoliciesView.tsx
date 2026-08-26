import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import {
  Scale, Plus, Building2,
  Clock, AlertTriangle, Edit3, Trash2,
  Sliders, Check, X, Calendar, Factory, RefreshCw,
  ShieldCheck, Moon, Sun, CalendarRange
} from 'lucide-react';

export interface AttendancePolicy {
  id: string;
  code: string;
  name: string;
  description: string;
  isDefault: boolean;
  assignedBranch: string;
  assignedDepartments: string[];
  employmentTypes: string[];
  effectiveDate: string;
  
  // 1. Shift Schedule & Timings
  shiftType: 'Fixed Shift' | 'Rotational Shift' | 'Split Shift' | 'Night Shift';
  workingDays: string[];
  shiftStartTime: string;
  shiftEndTime: string;
  standardHoursPerDay: number;
  coreHoursStart: string;
  coreHoursEnd: string;
  breakDurationMinutes: number;
  breakType: 'Paid Break' | 'Unpaid Break';
  minWorkHoursBeforeBreak: number;
  
  // 2. Attendance & Payroll Cutoff Cycle
  cutoffType: 'Calendar Month (1st to 30/31st)' | '21st to 20th' | '26th to 25th' | '16th to 15th' | 'Custom Monthly Cutoff' | 'Bi-Weekly' | 'Weekly';
  cutoffStartDay: number; // e.g. 21, 26, 1, 16
  cutoffEndDay: number;   // e.g. 20, 25, 30, 15
  attendanceLockDay: number; // e.g. 22
  salaryDisbursementDay: number; // e.g. 28, 1
  salaryDisbursementMonthOffset: 'Current Month' | 'Next Month';

  // 3. Grace Periods & Buffer Windows
  gracePeriodMinutes: number;
  earlyDepartureGraceMinutes: number;
  earlyClockInAllowedMinutes: number;
  maxMonthlyGraceCumulativeMinutes: number;
  
  // 4. Multi-Tier Late Arrival Penalty Matrix
  tier1LateThreshold: number;
  tier1PenaltyType: 'Deduct 0.5 Day Pay' | 'Deduct 0.25 Day Pay' | 'Deduct 1.0 Full Day Pay' | 'Deduct from Leave Balance' | 'Warning Notice Only';
  tier2LateThreshold: number;
  tier2PenaltyType: 'Deduct 1.0 Full Day Pay' | 'Deduct 2.0 Days Pay' | 'Deduct 0.5 Day Pay' | 'Formal Show Cause Notice';
  tier3LateThreshold: number;
  tier3PenaltyType: 'Deduct 1.0 Full Day Pay per Late' | 'Loss of Pay (LOP) + Disciplinary Review' | 'Salary Withheld';
  cumulativeLateMinutesDeductionThreshold: number;
  latePenaltyResetPeriod: 'Monthly Reset' | 'Quarterly Reset';
  
  // 5. Half-Day & Early Out Rules
  halfDayMinHours: number;
  fullDayMinHours: number;
  lessThanMinHoursTreatedAs: 'Unpaid Absent (LOP)' | 'Half Day' | 'Warning';
  maxHalfDaysPerMonth: number;
  earlyDeparturePenalty: 'Mark as Half-Day' | 'Deduct 0.5 Day Pay' | 'Deduct 0.25 Day Pay' | 'Warning Notice';
  allowedShortLeaveSlipsPerMonth: number;
  maxHoursPerShortLeave: number;
  
  // 6. Overtime Multipliers & Shift Allowances
  overtimeEligible: boolean;
  overtimeMinThresholdMinutes: number;
  weekdayOvertimeRate: number;
  weekendOvertimeRate: number;
  holidayOvertimeRate: number;
  nightShiftAllowancePercentage: number;
  overtimeRequiresApproval: boolean;
  maxMonthlyOvertimeHours: number;
  
  // 7. Absenteeism, LOP & Sandwich Rules
  lopMultiplier: number;
  enableSandwichRule: boolean;
  consecutiveAbsenceAlertDays: number;
  autoConvertAbsentToPaidLeave: boolean;
  
  // 8. Hardware & Verification
  allowedPunchMethods: string[];
  autoClockOutAtMidnight: boolean;
  punchTrackingMode: 'First In / Last Out' | 'Every In & Out (Break Tracking)';
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

export const ALL_DEPARTMENTS = [
  'Executive & Board',
  'Finance & Accounts',
  'Human Resources',
  'Sales & Marketing',
  'Engineering / IT',
  'Operations',
  'Factory & Manufacturing',
  'Warehouse & Logistics',
  'Quality Assurance',
  'Security & Facility'
];

export const EMPLOYMENT_TYPES_LIST = [
  'Full-Time Permanent',
  'Probationary',
  'Contractual / Fixed Term',
  'Part-Time',
  'Interns'
];

export const DEFAULT_POLICIES: AttendancePolicy[] = [
  {
    id: 'pol-1',
    code: 'POL-HQ-CORP',
    name: 'Head Office Corporate Policy (5 Days)',
    description: 'Standard Monday to Friday corporate office schedule with 26th to 25th cutoff cycle, 15-min grace period, Tier 1 (3 lates = 0.5 day) / Tier 2 (5 lates = 1.0 Full Day Deduction).',
    isDefault: true,
    assignedBranch: 'Head Office',
    assignedDepartments: ['Executive & Board', 'Finance & Accounts', 'Human Resources', 'Sales & Marketing', 'Engineering / IT'],
    employmentTypes: ['Full-Time Permanent', 'Probationary', 'Contractual / Fixed Term'],
    effectiveDate: '2026-01-01',
    shiftType: 'Fixed Shift',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    shiftStartTime: '09:00',
    shiftEndTime: '17:00',
    standardHoursPerDay: 8.0,
    coreHoursStart: '10:00',
    coreHoursEnd: '15:00',
    breakDurationMinutes: 60,
    breakType: 'Paid Break',
    minWorkHoursBeforeBreak: 4.0,
    cutoffType: '26th to 25th',
    cutoffStartDay: 26,
    cutoffEndDay: 25,
    attendanceLockDay: 27,
    salaryDisbursementDay: 1,
    salaryDisbursementMonthOffset: 'Next Month',
    gracePeriodMinutes: 15,
    earlyDepartureGraceMinutes: 15,
    earlyClockInAllowedMinutes: 30,
    maxMonthlyGraceCumulativeMinutes: 60,
    tier1LateThreshold: 3,
    tier1PenaltyType: 'Deduct 0.5 Day Pay',
    tier2LateThreshold: 5,
    tier2PenaltyType: 'Deduct 1.0 Full Day Pay',
    tier3LateThreshold: 7,
    tier3PenaltyType: 'Deduct 1.0 Full Day Pay per Late',
    cumulativeLateMinutesDeductionThreshold: 120,
    latePenaltyResetPeriod: 'Monthly Reset',
    halfDayMinHours: 4.0,
    fullDayMinHours: 6.5,
    lessThanMinHoursTreatedAs: 'Unpaid Absent (LOP)',
    maxHalfDaysPerMonth: 2,
    earlyDeparturePenalty: 'Deduct 0.5 Day Pay',
    allowedShortLeaveSlipsPerMonth: 2,
    maxHoursPerShortLeave: 2.0,
    overtimeEligible: true,
    overtimeMinThresholdMinutes: 30,
    weekdayOvertimeRate: 1.5,
    weekendOvertimeRate: 2.0,
    holidayOvertimeRate: 2.5,
    nightShiftAllowancePercentage: 10,
    overtimeRequiresApproval: true,
    maxMonthlyOvertimeHours: 40,
    lopMultiplier: 1.0,
    enableSandwichRule: false,
    consecutiveAbsenceAlertDays: 3,
    autoConvertAbsentToPaidLeave: true,
    allowedPunchMethods: ['Biometric Machine (Face/Fingerprint)', 'Mobile App with GPS Geofencing', 'Web Kiosk'],
    autoClockOutAtMidnight: true,
    punchTrackingMode: 'First In / Last Out',
  },
  {
    id: 'pol-2',
    code: 'POL-PLANT-MFG',
    name: 'Factory & Plant Shift Policy (6 Days)',
    description: 'Strict Monday to Saturday manufacturing floor policy with 21st to 20th cutoff cycle (for OT verification), 5-min grace tolerance, Tier 1 (3 lates = 0.5 day) / Tier 2 (5 lates = 1.0 Full Day), 2.0x weekend double-time.',
    isDefault: true,
    assignedBranch: 'Factory / Plant 1',
    assignedDepartments: ['Operations', 'Factory & Manufacturing', 'Warehouse & Logistics', 'Quality Assurance', 'Security & Facility'],
    employmentTypes: ['Full-Time Permanent', 'Contractual / Fixed Term', 'Probationary'],
    effectiveDate: '2026-01-01',
    shiftType: 'Fixed Shift',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    shiftStartTime: '08:00',
    shiftEndTime: '16:30',
    standardHoursPerDay: 8.0,
    coreHoursStart: '08:30',
    coreHoursEnd: '16:00',
    breakDurationMinutes: 30,
    breakType: 'Unpaid Break',
    minWorkHoursBeforeBreak: 4.0,
    cutoffType: '21st to 20th',
    cutoffStartDay: 21,
    cutoffEndDay: 20,
    attendanceLockDay: 22,
    salaryDisbursementDay: 28,
    salaryDisbursementMonthOffset: 'Current Month',
    gracePeriodMinutes: 5,
    earlyDepartureGraceMinutes: 5,
    earlyClockInAllowedMinutes: 15,
    maxMonthlyGraceCumulativeMinutes: 30,
    tier1LateThreshold: 3,
    tier1PenaltyType: 'Deduct 0.5 Day Pay',
    tier2LateThreshold: 5,
    tier2PenaltyType: 'Deduct 1.0 Full Day Pay',
    tier3LateThreshold: 6,
    tier3PenaltyType: 'Loss of Pay (LOP) + Disciplinary Review',
    cumulativeLateMinutesDeductionThreshold: 60,
    latePenaltyResetPeriod: 'Monthly Reset',
    halfDayMinHours: 4.0,
    fullDayMinHours: 7.0,
    lessThanMinHoursTreatedAs: 'Unpaid Absent (LOP)',
    maxHalfDaysPerMonth: 1,
    earlyDeparturePenalty: 'Mark as Half-Day',
    allowedShortLeaveSlipsPerMonth: 1,
    maxHoursPerShortLeave: 1.5,
    overtimeEligible: true,
    overtimeMinThresholdMinutes: 15,
    weekdayOvertimeRate: 1.5,
    weekendOvertimeRate: 2.0,
    holidayOvertimeRate: 2.5,
    nightShiftAllowancePercentage: 20,
    overtimeRequiresApproval: false,
    maxMonthlyOvertimeHours: 60,
    lopMultiplier: 1.0,
    enableSandwichRule: true,
    consecutiveAbsenceAlertDays: 2,
    autoConvertAbsentToPaidLeave: false,
    allowedPunchMethods: ['Biometric Machine (Face/Fingerprint)'],
    autoClockOutAtMidnight: true,
    punchTrackingMode: 'Every In & Out (Break Tracking)',
  },
];

function sanitizePolicy(p: any, idx: number): AttendancePolicy {
  const fallback = DEFAULT_POLICIES[idx % DEFAULT_POLICIES.length] || DEFAULT_POLICIES[0];
  return {
    id: p?.id || fallback.id,
    code: p?.code || fallback.code,
    name: p?.name || fallback.name,
    description: p?.description || fallback.description,
    isDefault: p?.isDefault ?? fallback.isDefault,
    assignedBranch: p?.assignedBranch || fallback.assignedBranch,
    assignedDepartments: Array.isArray(p?.assignedDepartments) && p.assignedDepartments.length > 0 ? p.assignedDepartments : fallback.assignedDepartments,
    employmentTypes: Array.isArray(p?.employmentTypes) && p.employmentTypes.length > 0 ? p.employmentTypes : fallback.employmentTypes,
    effectiveDate: p?.effectiveDate || fallback.effectiveDate,
    shiftType: p?.shiftType || fallback.shiftType,
    workingDays: Array.isArray(p?.workingDays) && p.workingDays.length > 0 ? p.workingDays : fallback.workingDays,
    shiftStartTime: p?.shiftStartTime || fallback.shiftStartTime,
    shiftEndTime: p?.shiftEndTime || fallback.shiftEndTime,
    standardHoursPerDay: Number(p?.standardHoursPerDay) || fallback.standardHoursPerDay,
    coreHoursStart: p?.coreHoursStart || fallback.coreHoursStart,
    coreHoursEnd: p?.coreHoursEnd || fallback.coreHoursEnd,
    breakDurationMinutes: Number(p?.breakDurationMinutes) || fallback.breakDurationMinutes,
    breakType: p?.breakType || fallback.breakType,
    minWorkHoursBeforeBreak: Number(p?.minWorkHoursBeforeBreak) || fallback.minWorkHoursBeforeBreak,
    cutoffType: p?.cutoffType || fallback.cutoffType,
    cutoffStartDay: Number(p?.cutoffStartDay) || fallback.cutoffStartDay,
    cutoffEndDay: Number(p?.cutoffEndDay) || fallback.cutoffEndDay,
    attendanceLockDay: Number(p?.attendanceLockDay) || fallback.attendanceLockDay,
    salaryDisbursementDay: Number(p?.salaryDisbursementDay) || fallback.salaryDisbursementDay,
    salaryDisbursementMonthOffset: p?.salaryDisbursementMonthOffset || fallback.salaryDisbursementMonthOffset,
    gracePeriodMinutes: Number(p?.gracePeriodMinutes) ?? fallback.gracePeriodMinutes,
    earlyDepartureGraceMinutes: Number(p?.earlyDepartureGraceMinutes) ?? fallback.earlyDepartureGraceMinutes,
    earlyClockInAllowedMinutes: Number(p?.earlyClockInAllowedMinutes) ?? fallback.earlyClockInAllowedMinutes,
    maxMonthlyGraceCumulativeMinutes: Number(p?.maxMonthlyGraceCumulativeMinutes) ?? fallback.maxMonthlyGraceCumulativeMinutes,
    tier1LateThreshold: Number(p?.tier1LateThreshold) || fallback.tier1LateThreshold,
    tier1PenaltyType: p?.tier1PenaltyType || fallback.tier1PenaltyType,
    tier2LateThreshold: Number(p?.tier2LateThreshold) || fallback.tier2LateThreshold,
    tier2PenaltyType: p?.tier2PenaltyType || fallback.tier2PenaltyType,
    tier3LateThreshold: Number(p?.tier3LateThreshold) || fallback.tier3LateThreshold,
    tier3PenaltyType: p?.tier3PenaltyType || fallback.tier3PenaltyType,
    cumulativeLateMinutesDeductionThreshold: Number(p?.cumulativeLateMinutesDeductionThreshold) || fallback.cumulativeLateMinutesDeductionThreshold,
    latePenaltyResetPeriod: p?.latePenaltyResetPeriod || fallback.latePenaltyResetPeriod,
    halfDayMinHours: Number(p?.halfDayMinHours) || fallback.halfDayMinHours,
    fullDayMinHours: Number(p?.fullDayMinHours) || fallback.fullDayMinHours,
    lessThanMinHoursTreatedAs: p?.lessThanMinHoursTreatedAs || fallback.lessThanMinHoursTreatedAs,
    maxHalfDaysPerMonth: Number(p?.maxHalfDaysPerMonth) || fallback.maxHalfDaysPerMonth,
    earlyDeparturePenalty: p?.earlyDeparturePenalty || fallback.earlyDeparturePenalty,
    allowedShortLeaveSlipsPerMonth: Number(p?.allowedShortLeaveSlipsPerMonth) || fallback.allowedShortLeaveSlipsPerMonth,
    maxHoursPerShortLeave: Number(p?.maxHoursPerShortLeave) || fallback.maxHoursPerShortLeave,
    overtimeEligible: p?.overtimeEligible ?? fallback.overtimeEligible,
    overtimeMinThresholdMinutes: Number(p?.overtimeMinThresholdMinutes) ?? fallback.overtimeMinThresholdMinutes,
    weekdayOvertimeRate: Number(p?.weekdayOvertimeRate) || fallback.weekdayOvertimeRate,
    weekendOvertimeRate: Number(p?.weekendOvertimeRate) || fallback.weekendOvertimeRate,
    holidayOvertimeRate: Number(p?.holidayOvertimeRate) || fallback.holidayOvertimeRate,
    nightShiftAllowancePercentage: Number(p?.nightShiftAllowancePercentage) ?? fallback.nightShiftAllowancePercentage,
    overtimeRequiresApproval: p?.overtimeRequiresApproval ?? fallback.overtimeRequiresApproval,
    maxMonthlyOvertimeHours: Number(p?.maxMonthlyOvertimeHours) || fallback.maxMonthlyOvertimeHours,
    lopMultiplier: Number(p?.lopMultiplier) || fallback.lopMultiplier,
    enableSandwichRule: p?.enableSandwichRule ?? fallback.enableSandwichRule,
    consecutiveAbsenceAlertDays: Number(p?.consecutiveAbsenceAlertDays) || fallback.consecutiveAbsenceAlertDays,
    autoConvertAbsentToPaidLeave: p?.autoConvertAbsentToPaidLeave ?? fallback.autoConvertAbsentToPaidLeave,
    allowedPunchMethods: Array.isArray(p?.allowedPunchMethods) && p.allowedPunchMethods.length > 0 ? p.allowedPunchMethods : fallback.allowedPunchMethods,
    autoClockOutAtMidnight: p?.autoClockOutAtMidnight ?? fallback.autoClockOutAtMidnight,
    punchTrackingMode: p?.punchTrackingMode || fallback.punchTrackingMode,
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
  const [modalActiveTab, setModalActiveTab] = useState<'schedule' | 'cutoff' | 'grace' | 'late' | 'halfday' | 'overtime' | 'leave_punch'>('schedule');
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
    const cutoffText = pol.cutoffType === 'Calendar Month (1st to 30/31st)' ? '1st to 30/31st' : `${pol.cutoffStartDay}th to ${pol.cutoffEndDay}th`;

    return {
      policyName: pol.name || 'Standard Policy',
      code: pol.code || 'POL',
      branch: pol.assignedBranch || 'Head Office',
      workingDaysText: `${workingDaysList.length} Working Days (${workingDaysList.join(', ')})`,
      cutoffText: `Cutoff: ${cutoffText} (Pay: Day ${pol.salaryDisbursementDay || 1})`,
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

  const toggleDepartment = (dept: string) => {
    if (!editingPolicy) return;
    const current = editingPolicy.assignedDepartments || [];
    const next = current.includes(dept) ? current.filter(d => d !== dept) : [...current, dept];
    setEditingPolicy({ ...editingPolicy, assignedDepartments: next });
  };

  const toggleEmploymentType = (empType: string) => {
    if (!editingPolicy) return;
    const current = editingPolicy.employmentTypes || [];
    const next = current.includes(empType) ? current.filter(t => t !== empType) : [...current, empType];
    setEditingPolicy({ ...editingPolicy, employmentTypes: next });
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
              <div className="absolute inset-0 flex items-center justify-center"><Scale className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Comprehensive Attendance, Shift &amp; Deduction Policies</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400"><span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Configure custom attendance cutoff cycles (21st–20th, 26th–25th, or 1st–30th), shift hours, multi-tier late salary deductions, overtime multipliers, and hardware punch rules.</p>
            </div>
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
                code: `POL-${Math.floor(100 + Math.random() * 900)}`,
                name: 'New Custom Attendance Policy',
                description: 'Custom attendance cutoff dates, shift timings, grace periods, multi-tier deductions, and overtime rules.',
                isDefault: true,
                assignedBranch: 'Head Office',
                assignedDepartments: ['Operations', 'Finance & Accounts'],
                employmentTypes: ['Full-Time Permanent', 'Probationary'],
                effectiveDate: '2026-01-01',
                shiftType: 'Fixed Shift',
                workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                shiftStartTime: '09:00',
                shiftEndTime: '17:00',
                standardHoursPerDay: 8.0,
                coreHoursStart: '10:00',
                coreHoursEnd: '15:00',
                breakDurationMinutes: 60,
                breakType: 'Paid Break',
                minWorkHoursBeforeBreak: 4.0,
                cutoffType: '26th to 25th',
                cutoffStartDay: 26,
                cutoffEndDay: 25,
                attendanceLockDay: 27,
                salaryDisbursementDay: 1,
                salaryDisbursementMonthOffset: 'Next Month',
                gracePeriodMinutes: 15,
                earlyDepartureGraceMinutes: 15,
                earlyClockInAllowedMinutes: 30,
                maxMonthlyGraceCumulativeMinutes: 60,
                tier1LateThreshold: 3,
                tier1PenaltyType: 'Deduct 0.5 Day Pay',
                tier2LateThreshold: 5,
                tier2PenaltyType: 'Deduct 1.0 Full Day Pay',
                tier3LateThreshold: 7,
                tier3PenaltyType: 'Deduct 1.0 Full Day Pay per Late',
                cumulativeLateMinutesDeductionThreshold: 120,
                latePenaltyResetPeriod: 'Monthly Reset',
                halfDayMinHours: 4.0,
                fullDayMinHours: 6.5,
                lessThanMinHoursTreatedAs: 'Unpaid Absent (LOP)',
                maxHalfDaysPerMonth: 2,
                earlyDeparturePenalty: 'Deduct 0.5 Day Pay',
                allowedShortLeaveSlipsPerMonth: 2,
                maxHoursPerShortLeave: 2.0,
                overtimeEligible: true,
                overtimeMinThresholdMinutes: 30,
                weekdayOvertimeRate: 1.5,
                weekendOvertimeRate: 2.0,
                holidayOvertimeRate: 2.5,
                nightShiftAllowancePercentage: 10,
                overtimeRequiresApproval: true,
                maxMonthlyOvertimeHours: 40,
                lopMultiplier: 1.0,
                enableSandwichRule: false,
                consecutiveAbsenceAlertDays: 3,
                autoConvertAbsentToPaidLeave: true,
                allowedPunchMethods: ['Biometric Machine (Face/Fingerprint)', 'Mobile App with GPS Geofencing'],
                autoClockOutAtMidnight: true,
                punchTrackingMode: 'First In / Last Out',
              });
              setModalActiveTab('schedule');
              setPolicyModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Create Detailed Policy
          </button>
          </div>
        </div>
      </div>

      {/* Multi-Location Guide Callout */}
      <div className="p-4 rounded-2xl border border-teal-500/20 bg-teal-500/5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-teal-600 text-white font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[var(--color-text-strong)]">Multi-Facility Cutoff & Shift Architecture</h3>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              Head Office (e.g. <strong>26th to 25th</strong> cutoff) and Factory (e.g. <strong>21st to 20th</strong> cutoff) can have different monthly cutoff dates for overtime and wage calculations.
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
          const cutoffText = pol.cutoffType === 'Calendar Month (1st to 30/31st)' ? '1st to 30th/31st (Calendar Month)' : `Day ${pol.cutoffStartDay} to Day ${pol.cutoffEndDay}`;

          return (
            <div key={pol.id} className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                        {pol.code || 'POL'}
                      </span>
                      <h3 className="font-bold text-sm text-[var(--color-text-strong)]">{pol.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 text-[10.5px] font-bold flex items-center gap-1">
                        {branch.includes('Factory') ? <Factory className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        {branch}
                      </span>
                      {pol.isDefault && (
                        <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 border border-teal-500/20 text-[10px] font-bold">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{pol.description}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-[var(--color-surface-muted)] rounded-xl space-y-2 text-xs">
                  {/* Attendance & Payroll Cutoff Cycle Display */}
                  <div className="flex justify-between items-center bg-teal-500/10 dark:bg-teal-950/40 p-2 rounded-lg border border-teal-500/20">
                    <span className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                      <CalendarRange className="w-3.5 h-3.5" /> Payroll Cutoff Cycle:
                    </span>
                    <span className="font-mono font-black text-teal-900 dark:text-teal-200">
                      {cutoffText}
                    </span>
                  </div>

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
                    <span className="text-[var(--color-text-muted)]">Shift Timings & Hours:</span>
                    <span className="font-mono font-bold text-[var(--color-text-strong)]">{pol.shiftStartTime || '09:00'} to {pol.shiftEndTime || '17:00'} ({pol.standardHoursPerDay || 8} hrs/day)</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-muted)]">Grace Period:</span>
                    <span className="font-mono font-bold text-emerald-600">{pol.gracePeriodMinutes ?? 15} Mins (Early out: {pol.earlyDepartureGraceMinutes ?? 15}m)</span>
                  </div>

                  {/* Multi-Tier Late Penalties */}
                  <div className="space-y-1 pt-1 border-t border-[var(--color-border)]/60">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[var(--color-text-muted)] font-semibold">Tier 1 Penalty ({pol.tier1LateThreshold || 3} Lates):</span>
                      <span className="font-semibold text-amber-600">{pol.tier1PenaltyType || 'Deduct 0.5 Day Pay'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[var(--color-text-muted)] font-semibold">Tier 2 Penalty ({pol.tier2LateThreshold || 5} Lates):</span>
                      <span className="font-bold text-rose-600">{pol.tier2PenaltyType || 'Deduct 1.0 Full Day Pay'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-[var(--color-border)]/60">
                    <span className="text-[var(--color-text-muted)]">Salary Disbursement Day:</span>
                    <span className="font-mono font-bold text-blue-600">
                      Day {pol.salaryDisbursementDay || 1} ({pol.salaryDisbursementMonthOffset || 'Current Month'})
                    </span>
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
                      setModalActiveTab('cutoff');
                      setPolicyModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                    title="Edit Detailed Policy"
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
              Test sample clock-in / clock-out punch times, cutoff dates, and accumulated late counts against any location policy.
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
              <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">{simResult.cutoffText}</span>
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

      {/* ULTRA-DETAILED MODAL: CREATE / EDIT ATTENDANCE POLICY */}
      {policyModalOpen && editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in max-h-[92vh] flex flex-col">
            {/* Modal Top Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[var(--color-text-strong)]">
                      {editingPolicy.id ? 'Edit Attendance Policy & Cutoff Cycles' : 'Create Attendance Policy'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-mono text-[10px] font-bold">
                      {editingPolicy.code || 'NEW-POL'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Configure cutoff dates (1st–30th, 21st–20th, 26th–25th, 16th–15th), shift timings, buffer tolerances, and salary deductions</p>
                </div>
              </div>
              <button onClick={() => setPolicyModalOpen(false)} className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Section Navigation Tabs */}
            <div className="flex items-center gap-1 px-4 pt-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setModalActiveTab('schedule')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  modalActiveTab === 'schedule'
                    ? 'border-teal-600 text-teal-600 bg-[var(--color-surface)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> 1. Shift & Schedule
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('cutoff')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  modalActiveTab === 'cutoff'
                    ? 'border-teal-600 text-teal-600 bg-[var(--color-surface)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5 text-teal-600" /> 2. Attendance & Payroll Cutoff Cycle
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('grace')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  modalActiveTab === 'grace'
                    ? 'border-teal-600 text-teal-600 bg-[var(--color-surface)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> 3. Grace & Buffer Times
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('late')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  modalActiveTab === 'late'
                    ? 'border-teal-600 text-teal-600 bg-[var(--color-surface)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> 4. Multi-Tier Late Penalties
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('halfday')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  modalActiveTab === 'halfday'
                    ? 'border-teal-600 text-teal-600 bg-[var(--color-surface)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> 5. Half-Day & Early Out
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('overtime')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  modalActiveTab === 'overtime'
                    ? 'border-teal-600 text-teal-600 bg-[var(--color-surface)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-purple-500" /> 6. Overtime Multipliers
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('leave_punch')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  modalActiveTab === 'leave_punch'
                    ? 'border-teal-600 text-teal-600 bg-[var(--color-surface)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> 7. Absenteeism & Punch Rules
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="p-6 space-y-6 text-xs overflow-y-auto flex-1">
              {/* TAB 1: SHIFT SCHEDULE & WORKING DAYS */}
              {modalActiveTab === 'schedule' && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-[var(--color-text-strong)] border-b border-[var(--color-border)] pb-1 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-teal-600" /> Policy Identification & Scope
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Policy Code *</label>
                        <input
                          required
                          type="text"
                          value={editingPolicy.code}
                          onChange={e => setEditingPolicy({ ...editingPolicy, code: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                        />
                      </div>

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
                          value={editingPolicy.assignedBranch}
                          onChange={e => setEditingPolicy({ ...editingPolicy, assignedBranch: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold"
                        >
                          {BRANCH_OPTIONS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Policy Description</label>
                        <input
                          type="text"
                          value={editingPolicy.description}
                          onChange={e => setEditingPolicy({ ...editingPolicy, description: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Default Status for Location</label>
                        <div className="pt-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isDefaultPolicy"
                            checked={editingPolicy.isDefault}
                            onChange={e => setEditingPolicy({ ...editingPolicy, isDefault: e.target.checked })}
                            className="w-4 h-4 text-teal-600 rounded"
                          />
                          <label htmlFor="isDefaultPolicy" className="text-[11.5px] font-semibold text-[var(--color-text)]">
                            Set as Active Default
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shift Timings & Core Hours */}
                  <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
                    <h4 className="font-bold text-xs text-[var(--color-text-strong)] flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-teal-600" /> Shift Hours, Type & Working Days
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Shift Model</label>
                        <select
                          value={editingPolicy.shiftType}
                          onChange={e => setEditingPolicy({ ...editingPolicy, shiftType: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none"
                        >
                          <option value="Fixed Shift">Fixed Standard Shift</option>
                          <option value="Rotational Shift">Rotational Shift</option>
                          <option value="Split Shift">Split Shift</option>
                          <option value="Night Shift">Night / Graveyard Shift</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Shift Start Time</label>
                        <input
                          type="time"
                          value={editingPolicy.shiftStartTime}
                          onChange={e => setEditingPolicy({ ...editingPolicy, shiftStartTime: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Shift End Time</label>
                        <input
                          type="time"
                          value={editingPolicy.shiftEndTime}
                          onChange={e => setEditingPolicy({ ...editingPolicy, shiftEndTime: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Daily Target Hours</label>
                        <input
                          type="number"
                          step="0.5"
                          value={editingPolicy.standardHoursPerDay}
                          onChange={e => setEditingPolicy({ ...editingPolicy, standardHoursPerDay: parseFloat(e.target.value) || 8 })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-teal-600"
                        />
                      </div>
                    </div>

                    {/* Working Days Selector */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-[var(--color-text-strong)]">
                          Active Working Days ({(editingPolicy.workingDays || []).length} Days Selected):
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingPolicy({ ...editingPolicy, workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] })}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-teal-600"
                          >
                            5-Day (Mon–Fri)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPolicy({ ...editingPolicy, workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] })}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-indigo-600"
                          >
                            6-Day (Mon–Sat)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                        {ALL_WEEKDAYS.map(day => {
                          const active = (editingPolicy.workingDays || []).includes(day.key);
                          return (
                            <button
                              key={day.key}
                              type="button"
                              onClick={() => toggleWorkingDay(day.key)}
                              className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                                active
                                  ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                                  : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-teal-500'
                              }`}
                            >
                              <span className="font-bold text-xs">{day.key}</span>
                              <span className="text-[9px] uppercase opacity-90">{active ? 'Working Day' : 'Day Off'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Department Assignment */}
                    <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                      <label className="font-semibold text-[var(--color-text-strong)]">Assigned Departments:</label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_DEPARTMENTS.map(dept => {
                          const active = (editingPolicy.assignedDepartments || []).includes(dept);
                          return (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => toggleDepartment(dept)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                                active
                                  ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30'
                                  : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-teal-500'
                              }`}
                            >
                              {active ? '✓ ' : '+ '}{dept}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Employment Types Assignment */}
                    <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                      <label className="font-semibold text-[var(--color-text-strong)]">Assigned Employment Types:</label>
                      <div className="flex flex-wrap gap-1.5">
                        {EMPLOYMENT_TYPES_LIST.map(empType => {
                          const active = (editingPolicy.employmentTypes || []).includes(empType);
                          return (
                            <button
                              key={empType}
                              type="button"
                              onClick={() => toggleEmploymentType(empType)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                                active
                                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                                  : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-indigo-500'
                              }`}
                            >
                              {active ? '✓ ' : '+ '}{empType}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ATTENDANCE & PAYROLL CUTOFF CYCLE */}
              {modalActiveTab === 'cutoff' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
                    <div>
                      <h4 className="font-bold text-xs text-[var(--color-text-strong)] flex items-center gap-1.5">
                        <CalendarRange className="w-4 h-4 text-teal-600" /> Attendance & Monthly Payroll Cutoff Cycle
                      </h4>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        Configure which date range of attendance is fetched when running monthly payroll (e.g. 21st–20th, 26th–25th, or 1st–30th).
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-[var(--color-text-strong)] text-xs">
                          Cutoff Frequency Model *
                        </label>
                        <select
                          value={editingPolicy.cutoffType}
                          onChange={e => setEditingPolicy({ ...editingPolicy, cutoffType: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none font-semibold text-teal-700 dark:text-teal-300"
                        >
                          <option value="Custom Monthly Cutoff">Monthly Cutoff (Specify Start & End Days Below)</option>
                          <option value="Bi-Weekly">Bi-Weekly / 14-Day Cycle</option>
                          <option value="Weekly">Weekly Cycle</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-[var(--color-text-strong)] text-xs">
                          Attendance Lock Date (Biometric freeze for HR verification)
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[var(--color-text-muted)] font-semibold">Day:</span>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={editingPolicy.attendanceLockDay}
                            onChange={e => setEditingPolicy({ ...editingPolicy, attendanceLockDay: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Manual Cutoff Days */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border)]/60">
                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">
                          Attendance Cycle Start Day (of Previous Month) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={editingPolicy.cutoffStartDay}
                          onChange={e => setEditingPolicy({ ...editingPolicy, cutoffStartDay: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-teal-600"
                        />
                        <p className="text-[10px] text-[var(--color-text-muted)]">
                          e.g. Day <strong>{editingPolicy.cutoffStartDay}</strong> of prior month (e.g. 21st Jan).
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">
                          Attendance Cycle End Day (of Current Month) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={editingPolicy.cutoffEndDay}
                          onChange={e => setEditingPolicy({ ...editingPolicy, cutoffEndDay: parseInt(e.target.value) || 30 })}
                          className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-teal-600"
                        />
                        <p className="text-[10px] text-[var(--color-text-muted)]">
                          e.g. Day <strong>{editingPolicy.cutoffEndDay}</strong> of current month (e.g. 20th Feb).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Salary Disbursement Settings */}
                  <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] space-y-3">
                    <h5 className="font-bold text-xs text-[var(--color-text-strong)]">
                      Salary Payrun & Payslip Disbursement Schedule
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">
                          Salary Pay Date (Day of Month)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={editingPolicy.salaryDisbursementDay}
                          onChange={e => setEditingPolicy({ ...editingPolicy, salaryDisbursementDay: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-blue-600"
                        />
                        <p className="text-[10px] text-[var(--color-text-muted)]">
                          When bank transfer / payslips are generated (e.g. Day 28 or Day 1).
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">
                          Disbursement Month Offset
                        </label>
                        <select
                          value={editingPolicy.salaryDisbursementMonthOffset}
                          onChange={e => setEditingPolicy({ ...editingPolicy, salaryDisbursementMonthOffset: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none font-semibold"
                        >
                          <option value="Current Month">Same Month as Cutoff (e.g. 28th of Feb)</option>
                          <option value="Next Month">1st / 5th of Next Month (e.g. 1st of March)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GRACE PERIODS & BUFFER TIMES */}
              {modalActiveTab === 'grace' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-[var(--color-text-strong)] border-b border-[var(--color-border)] pb-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-600" /> Grace Tolerances & Clock-In Buffers
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] space-y-2">
                      <label className="font-bold text-[var(--color-text-strong)] block">
                        Clock-In Grace Period (Minutes) *
                      </label>
                      <input
                        type="number"
                        value={editingPolicy.gracePeriodMinutes}
                        onChange={e => setEditingPolicy({ ...editingPolicy, gracePeriodMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-emerald-600 text-sm"
                      />
                      <p className="text-[10.5px] text-[var(--color-text-muted)]">
                        Employees punching in within this buffer after shift start will NOT be marked late. (e.g. 15 mins for 09:00 shift allows up to 09:15).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] space-y-2">
                      <label className="font-bold text-[var(--color-text-strong)] block">
                        Early Departure Grace Period (Minutes) *
                      </label>
                      <input
                        type="number"
                        value={editingPolicy.earlyDepartureGraceMinutes}
                        onChange={e => setEditingPolicy({ ...editingPolicy, earlyDepartureGraceMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-amber-600 text-sm"
                      />
                      <p className="text-[10.5px] text-[var(--color-text-muted)]">
                        Allowed early checkout tolerance before flagging an unauthorized early departure.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] space-y-2">
                      <label className="font-bold text-[var(--color-text-strong)] block">
                        Early Clock-In Allowance Window (Minutes)
                      </label>
                      <input
                        type="number"
                        value={editingPolicy.earlyClockInAllowedMinutes}
                        onChange={e => setEditingPolicy({ ...editingPolicy, earlyClockInAllowedMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                      />
                      <p className="text-[10.5px] text-[var(--color-text-muted)]">
                        Employees may punch in up to this many minutes prior to shift start without counting toward unapproved overtime.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] space-y-2">
                      <label className="font-bold text-[var(--color-text-strong)] block">
                        Cumulative Monthly Grace Cap (Minutes)
                      </label>
                      <input
                        type="number"
                        value={editingPolicy.maxMonthlyGraceCumulativeMinutes}
                        onChange={e => setEditingPolicy({ ...editingPolicy, maxMonthlyGraceCumulativeMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none font-mono text-purple-600 font-bold"
                      />
                      <p className="text-[10.5px] text-[var(--color-text-muted)]">
                        Maximum total grace minutes allowed across an entire month before grace is automatically disabled.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: MULTI-TIER LATE ARRIVAL PENALTY ENGINE */}
              {modalActiveTab === 'late' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-[var(--color-text-strong)] border-b border-[var(--color-border)] pb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Multi-Tier Late Arrival Penalties & Salary Deductions
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Tier 1 */}
                    <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                      <span className="font-bold text-amber-800 dark:text-amber-300 block text-xs">
                        Tier 1: Initial Late Threshold
                      </span>
                      <div className="space-y-1">
                        <label className="font-semibold text-[11px]">Threshold (Number of Lates)</label>
                        <input
                          type="number"
                          min="1"
                          value={editingPolicy.tier1LateThreshold}
                          onChange={e => setEditingPolicy({ ...editingPolicy, tier1LateThreshold: parseInt(e.target.value) || 3 })}
                          className="w-full px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-[11px]">Statutory Penalty Action</label>
                        <select
                          value={editingPolicy.tier1PenaltyType}
                          onChange={e => setEditingPolicy({ ...editingPolicy, tier1PenaltyType: e.target.value as any })}
                          className="w-full px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg outline-none"
                        >
                          <option value="Deduct 0.5 Day Pay">Deduct 0.5 Day Salary (Half-Day)</option>
                          <option value="Deduct 0.25 Day Pay">Deduct 0.25 Day Salary</option>
                          <option value="Deduct from Leave Balance">Deduct 1 Casual Leave</option>
                          <option value="Warning Notice Only">First Formal Warning</option>
                        </select>
                      </div>
                    </div>

                    {/* Tier 2 */}
                    <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
                      <span className="font-bold text-rose-800 dark:text-rose-300 block text-xs">
                        Tier 2: Escalated Late Threshold
                      </span>
                      <div className="space-y-1">
                        <label className="font-semibold text-[11px]">Threshold (Number of Lates)</label>
                        <input
                          type="number"
                          min="2"
                          value={editingPolicy.tier2LateThreshold}
                          onChange={e => setEditingPolicy({ ...editingPolicy, tier2LateThreshold: parseInt(e.target.value) || 5 })}
                          className="w-full px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg outline-none font-mono font-bold text-rose-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-[11px]">Statutory Penalty Action</label>
                        <select
                          value={editingPolicy.tier2PenaltyType}
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

                    {/* Tier 3 */}
                    <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                      <span className="font-bold text-purple-800 dark:text-purple-300 block text-xs">
                        Tier 3: Habitual Late Threshold
                      </span>
                      <div className="space-y-1">
                        <label className="font-semibold text-[11px]">Threshold (Number of Lates)</label>
                        <input
                          type="number"
                          min="3"
                          value={editingPolicy.tier3LateThreshold}
                          onChange={e => setEditingPolicy({ ...editingPolicy, tier3LateThreshold: parseInt(e.target.value) || 7 })}
                          className="w-full px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg outline-none font-mono font-bold text-purple-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-[11px]">Statutory Penalty Action</label>
                        <select
                          value={editingPolicy.tier3PenaltyType}
                          onChange={e => setEditingPolicy({ ...editingPolicy, tier3PenaltyType: e.target.value as any })}
                          className="w-full px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg outline-none font-semibold text-purple-700"
                        >
                          <option value="Deduct 1.0 Full Day Pay per Late">Deduct 1.0 Full Day Pay Per Late</option>
                          <option value="Loss of Pay (LOP) + Disciplinary Review">Loss of Pay (LOP) + Suspension Review</option>
                          <option value="Salary Withheld">Withhold Salary Pending HR Clearance</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Cumulative Late Minutes Deduction Trigger (Mins)</label>
                      <input
                        type="number"
                        value={editingPolicy.cumulativeLateMinutesDeductionThreshold}
                        onChange={e => setEditingPolicy({ ...editingPolicy, cumulativeLateMinutesDeductionThreshold: parseInt(e.target.value) || 120 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                      />
                      <p className="text-[10.5px] text-[var(--color-text-muted)]">If total cumulative late minutes in the month exceed this number, 1 full day salary is deducted.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Late Penalty Counter Reset Cycle</label>
                      <select
                        value={editingPolicy.latePenaltyResetPeriod}
                        onChange={e => setEditingPolicy({ ...editingPolicy, latePenaltyResetPeriod: e.target.value as any })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none"
                      >
                        <option value="Monthly Reset">Monthly Reset (Resets to 0 on 1st of every month)</option>
                        <option value="Quarterly Reset">Quarterly Reset</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: HALF-DAY & EARLY OUT */}
              {modalActiveTab === 'halfday' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-[var(--color-text-strong)] border-b border-[var(--color-border)] pb-1 flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-teal-600" /> Half-Day Cutoffs, Permissions & Early Out Rules
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Min Worked Hours for Half-Day</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editingPolicy.halfDayMinHours}
                        onChange={e => setEditingPolicy({ ...editingPolicy, halfDayMinHours: parseFloat(e.target.value) || 4 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-amber-600"
                      />
                      <p className="text-[10.5px] text-[var(--color-text-muted)]">Working less than this is marked absent.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Min Worked Hours for Full-Day</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editingPolicy.fullDayMinHours}
                        onChange={e => setEditingPolicy({ ...editingPolicy, fullDayMinHours: parseFloat(e.target.value) || 6.5 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-emerald-600"
                      />
                      <p className="text-[10.5px] text-[var(--color-text-muted)]">Working between half-day and full-day triggers half-day pay.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Under Minimum Hours Treated As</label>
                      <select
                        value={editingPolicy.lessThanMinHoursTreatedAs}
                        onChange={e => setEditingPolicy({ ...editingPolicy, lessThanMinHoursTreatedAs: e.target.value as any })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none"
                      >
                        <option value="Unpaid Absent (LOP)">Unpaid Absent (Loss of Pay)</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Warning">Warning Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Allowed Half-Days Per Month</label>
                      <input
                        type="number"
                        value={editingPolicy.maxHalfDaysPerMonth}
                        onChange={e => setEditingPolicy({ ...editingPolicy, maxHalfDaysPerMonth: parseInt(e.target.value) || 2 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Allowed Monthly Short Leave Slips</label>
                      <input
                        type="number"
                        value={editingPolicy.allowedShortLeaveSlipsPerMonth}
                        onChange={e => setEditingPolicy({ ...editingPolicy, allowedShortLeaveSlipsPerMonth: parseInt(e.target.value) || 2 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Max Hours Per Short Leave Slip</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editingPolicy.maxHoursPerShortLeave}
                        onChange={e => setEditingPolicy({ ...editingPolicy, maxHoursPerShortLeave: parseFloat(e.target.value) || 2 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: OVERTIME & NIGHT ALLOWANCES */}
              {modalActiveTab === 'overtime' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-[var(--color-text-strong)] border-b border-[var(--color-border)] pb-1 flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-purple-600" /> Overtime Multipliers, Night Differentials & Approval Workflows
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">OT Eligibility</label>
                      <select
                        value={editingPolicy.overtimeEligible ? 'Yes' : 'No'}
                        onChange={e => setEditingPolicy({ ...editingPolicy, overtimeEligible: e.target.value === 'Yes' })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-semibold"
                      >
                        <option value="Yes">Eligible for Overtime</option>
                        <option value="No">Exempt / Salaried (No OT)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">OT Minimum Trigger (Mins)</label>
                      <input
                        type="number"
                        value={editingPolicy.overtimeMinThresholdMinutes}
                        onChange={e => setEditingPolicy({ ...editingPolicy, overtimeMinThresholdMinutes: parseInt(e.target.value) || 30 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Weekday OT Rate</label>
                      <input
                        type="number"
                        step="0.25"
                        value={editingPolicy.weekdayOvertimeRate}
                        onChange={e => setEditingPolicy({ ...editingPolicy, weekdayOvertimeRate: parseFloat(e.target.value) || 1.5 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-purple-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Weekend OT Rate</label>
                      <input
                        type="number"
                        step="0.25"
                        value={editingPolicy.weekendOvertimeRate}
                        onChange={e => setEditingPolicy({ ...editingPolicy, weekendOvertimeRate: parseFloat(e.target.value) || 2.0 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-purple-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Holiday OT Rate</label>
                      <input
                        type="number"
                        step="0.25"
                        value={editingPolicy.holidayOvertimeRate}
                        onChange={e => setEditingPolicy({ ...editingPolicy, holidayOvertimeRate: parseFloat(e.target.value) || 2.5 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-purple-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Night Shift Differential (%)</label>
                      <input
                        type="number"
                        value={editingPolicy.nightShiftAllowancePercentage}
                        onChange={e => setEditingPolicy({ ...editingPolicy, nightShiftAllowancePercentage: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono font-bold text-indigo-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Line Manager Approval</label>
                      <select
                        value={editingPolicy.overtimeRequiresApproval ? 'Yes' : 'No'}
                        onChange={e => setEditingPolicy({ ...editingPolicy, overtimeRequiresApproval: e.target.value === 'Yes' })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none"
                      >
                        <option value="Yes">Requires Manager Sign-Off</option>
                        <option value="No">Auto-Approved by Machine Punch</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Monthly Max OT Cap (Hours)</label>
                      <input
                        type="number"
                        value={editingPolicy.maxMonthlyOvertimeHours}
                        onChange={e => setEditingPolicy({ ...editingPolicy, maxMonthlyOvertimeHours: parseInt(e.target.value) || 40 })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: ABSENTEEISM, SANDWICH & HARDWARE PUNCH RULES */}
              {modalActiveTab === 'leave_punch' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-[var(--color-text-strong)] border-b border-[var(--color-border)] pb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" /> Absenteeism, Sandwich Rules & Hardware Punch Verification
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-[var(--color-text-strong)]">Enforce Sandwich Rule</span>
                        <input
                          type="checkbox"
                          checked={editingPolicy.enableSandwichRule}
                          onChange={e => setEditingPolicy({ ...editingPolicy, enableSandwichRule: e.target.checked })}
                          className="w-4 h-4 text-teal-600 rounded"
                        />
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        If employee is absent on Friday and following Monday, intervening Saturday/Sunday is deducted as Loss of Pay (LOP).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] space-y-2">
                      <label className="font-bold text-[11px] text-[var(--color-text-strong)] block">
                        Consecutive Absence Alert (Days)
                      </label>
                      <input
                        type="number"
                        value={editingPolicy.consecutiveAbsenceAlertDays}
                        onChange={e => setEditingPolicy({ ...editingPolicy, consecutiveAbsenceAlertDays: parseInt(e.target.value) || 3 })}
                        className="w-full px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg outline-none font-mono"
                      />
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        Triggers HR disciplinary escalation and show-cause notice.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-[var(--color-text-strong)]">Auto-Convert to Paid Leave</span>
                        <input
                          type="checkbox"
                          checked={editingPolicy.autoConvertAbsentToPaidLeave}
                          onChange={e => setEditingPolicy({ ...editingPolicy, autoConvertAbsentToPaidLeave: e.target.checked })}
                          className="w-4 h-4 text-teal-600 rounded"
                        />
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        Automatically deducts from casual leave balance if balance exists before triggering salary loss.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Punch Tracking & Log Mode</label>
                      <select
                        value={editingPolicy.punchTrackingMode}
                        onChange={e => setEditingPolicy({ ...editingPolicy, punchTrackingMode: e.target.value as any })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none"
                      >
                        <option value="First In / Last Out">First In / Last Out (Daily Summary)</option>
                        <option value="Every In & Out (Break Tracking)">Every In & Out (Logs every punch & break duration)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Midnight Auto-Checkout</label>
                      <select
                        value={editingPolicy.autoClockOutAtMidnight ? 'Yes' : 'No'}
                        onChange={e => setEditingPolicy({ ...editingPolicy, autoClockOutAtMidnight: e.target.value === 'Yes' })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none"
                      >
                        <option value="Yes">Auto Clock-Out at Shift End if punch is missing</option>
                        <option value="No">Flag as Incomplete Punch for Manager Resolution</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)] shrink-0">
                <div className="flex items-center gap-2">
                  {modalActiveTab !== 'schedule' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: Array<'schedule' | 'cutoff' | 'grace' | 'late' | 'halfday' | 'overtime' | 'leave_punch'> = ['schedule', 'cutoff', 'grace', 'late', 'halfday', 'overtime', 'leave_punch'];
                        const currIdx = tabs.indexOf(modalActiveTab);
                        if (currIdx > 0) setModalActiveTab(tabs[currIdx - 1]);
                      }}
                      className="px-3 py-1.5 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)]"
                    >
                      &larr; Previous Section
                    </button>
                  )}

                  {modalActiveTab !== 'leave_punch' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: Array<'schedule' | 'cutoff' | 'grace' | 'late' | 'halfday' | 'overtime' | 'leave_punch'> = ['schedule', 'cutoff', 'grace', 'late', 'halfday', 'overtime', 'leave_punch'];
                        const currIdx = tabs.indexOf(modalActiveTab);
                        if (currIdx < tabs.length - 1) setModalActiveTab(tabs[currIdx + 1]);
                      }}
                      className="px-3 py-1.5 bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 rounded-xl text-xs font-bold hover:bg-teal-500/20"
                    >
                      Next Section &rarr;
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPolicyModalOpen(false)}
                    className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Save Complete Policy
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
