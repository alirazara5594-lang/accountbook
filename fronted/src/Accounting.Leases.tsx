import { useEffect, useState } from 'react';
import { leasesApi, type LeaseAgreement, type LeaseScheduleResponse } from './api/modules/leases.api';
import { Button } from '@/components/ui/button';
import { Plus, FileSignature } from 'lucide-react';
import { StatusChip } from '@/components/ui/status-chip';
import { EmptyState, TableSkeleton } from '@/components/ui/empty-state';
import { money } from '@/lib/currency';

interface LeaseProps {
  activeEntityId: string;
}

interface LeaseForm {
  leaseNumber: string;
  counterparty: string;
  propertyDescription: string;
  type: 'FinanceLease' | 'OperatingLease';
  initialValue: number;
  monthlyRent: number;
  annualEscalationRate: number;
  startDate: string;
  endDate: string;
  termMonths: number;
}

const BLANK_FORM: LeaseForm = {
  leaseNumber: '',
  counterparty: '',
  propertyDescription: '',
  type: 'OperatingLease',
  initialValue: 0,
  monthlyRent: 0,
  annualEscalationRate: 0,
  startDate: '',
  endDate: '',
  termMonths: 12,
};

export const LeaseAccounting: React.FC<LeaseProps> = ({ activeEntityId }) => {
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LeaseForm>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedLease, setSelectedLease] = useState<LeaseAgreement | null>(null);
  const [schedule, setSchedule] = useState<LeaseScheduleResponse | null>(null);

  const fetchLeases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leasesApi.getLeases(activeEntityId);
      setLeases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load leases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeases();
  }, [activeEntityId]);

  const fmt = (n?: number) => n != null ? money(n) : '—';

  const saveLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaseNumber || !form.counterparty) {
      setError('Lease number and counterparty are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await leasesApi.createLease({
        ...form,
        startDate: form.startDate || new Date().toISOString().split('T')[0],
        endDate: form.endDate || new Date().toISOString().split('T')[0],
        companyId: activeEntityId,
      });
      setForm(BLANK_FORM);
      setShowForm(false);
      setSuccess('Lease agreement created successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchLeases();
    } catch (err: any) {
      setError(err.message || 'Failed to create lease');
    } finally {
      setSaving(false);
    }
  };

  const postAccrual = async (leaseId: string) => {
    try {
      await leasesApi.postMonthlyAccrual(leaseId);
      setSuccess('Monthly accrual posted to general ledger');
      setTimeout(() => setSuccess(null), 3000);
      fetchLeases();
    } catch (err: any) {
      setError(err.message || 'Failed to post accrual');
    }
  };

  const viewSchedule = async (lease: LeaseAgreement) => {
    setSelectedLease(lease);
    setLoading(true);
    try {
      const data = await leasesApi.getSchedule(lease.id, 24);
      setSchedule(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-teal-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-teal-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center"><FileSignature className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Lease Accounting</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400"><span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Finance &amp; operating lease liabilities, ROU assets, and accrual posting under IFRS 16 / ASC 842.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowForm(true)}
              className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> New Lease
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {success}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-200">
          <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Total Leases</div>
          <div className="text-lg font-bold mt-0.5">{leases.length}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200">
          <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Finance Leases</div>
          <div className="text-lg font-bold text-blue-600 mt-0.5">{leases.filter(l => l.type === 'FinanceLease').length}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200">
          <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Operating Leases</div>
          <div className="text-lg font-bold text-violet-600 mt-0.5">{leases.filter(l => l.type === 'OperatingLease').length}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200">
          <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Total Liability</div>
          <div className="text-lg font-bold text-teal-600 mt-0.5">{fmt(leases.reduce((sum, l) => sum + l.balanceSheetLiability, 0))}</div>
        </div>
      </div>

      {/* Leases Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Lease Agreements</h2>
          <p className="text-sm text-gray-500">{leases.length} active lease agreements</p>
        </div>
        {loading && <TableSkeleton rows={6} />}
        {!loading && leases.length === 0 && (
          <EmptyState icon={FileSignature} title="No lease agreements found" hint="Create a lease agreement to schedule payments and post monthly accruals." />
        )}
        {!loading && leases.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left font-medium bg-teal-500/[0.05] dark:bg-teal-400/[0.07]">
                  <th className="pb-3">Lease #</th>
                  <th className="pb-3">Counterparty</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Property</th>
                  <th className="pb-3 text-right">Monthly Rent</th>
                  <th className="pb-3 text-right">Liability</th>
                  <th className="pb-3 text-right">ROU Asset</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((lease) => (
                  <tr key={lease.id} className="border-b">
                    <td className="py-3 font-mono text-xs">{lease.leaseNumber}</td>
                    <td className="py-3">{lease.counterparty}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lease.type === 'FinanceLease'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-violet-50 text-violet-700'
                      }`}>
                        {lease.type === 'FinanceLease' ? 'Finance Lease' : 'Operating Lease'}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-600 max-w-[200px] truncate">
                      {lease.propertyDescription}
                    </td>
                    <td className="py-3 text-right">{fmt(lease.monthlyRent)}</td>
                    <td className="py-3 text-right">{fmt(lease.balanceSheetLiability)}</td>
                    <td className="py-3 text-right">{fmt(lease.rightOfUseAssetValue - lease.accumulatedDepreciation)}</td>
                    <td className="py-3">
                      <StatusChip status={lease.isActive ? 'Active' : 'Inactive'} />
                    </td>
                    <td className="py-3 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => viewSchedule(lease)}
                      >
                        Schedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          if (window.confirm(`Post accrual for ${lease.leaseNumber}?`)) {
                            postAccrual(lease.id);
                          }
                        }}
                      >
                        Accrue
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {selectedLease && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold">Lease Schedule: {selectedLease.leaseNumber} — {selectedLease.counterparty}</h3>
                <p className="text-sm text-gray-500">{selectedLease.propertyDescription} ({selectedLease.type === 'FinanceLease' ? 'Finance Lease' : 'Operating Lease'})</p>
              </div>
              <button onClick={() => setSelectedLease(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              {schedule && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded"><div className="text-xs text-gray-500">Present Value</div><div className="font-bold">{fmt(schedule.presentValue)}</div></div>
                    <div className="bg-gray-50 p-3 rounded"><div className="text-xs text-gray-500">Total Payments</div><div className="font-bold">{fmt(schedule.totalPayments)}</div></div>
                    <div className="bg-gray-50 p-3 rounded"><div className="text-xs text-gray-500">Total Interest</div><div className="font-bold">{fmt(schedule.totalInterest)}</div></div>
                    <div className="bg-gray-50 p-3 rounded"><div className="text-xs text-gray-500">Periods</div><div className="font-bold">{schedule.schedule.length}</div></div>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-2 text-left">Period</th>
                        <th className="pb-2 text-left">Date</th>
                        <th className="pb-2 text-right">Opening Liability</th>
                        <th className="pb-2 text-right">Interest</th>
                        <th className="pb-2 text-right">Principal</th>
                        <th className="pb-2 text-right">Closing Liability</th>
                        <th className="pb-2 text-right">Depreciation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.schedule.map((item) => (
                        <tr key={item.period} className="border-b">
                          <td className="py-2">{item.period}</td>
                          <td className="py-2">{item.date}</td>
                          <td className="py-2 text-right">{fmt(item.openingLiability)}</td>
                          <td className="py-2 text-right">{fmt(item.interestExpense)}</td>
                          <td className="py-2 text-right">{fmt(item.principalPayment)}</td>
                          <td className="py-2 text-right">{fmt(item.closingLiability)}</td>
                          <td className="py-2 text-right">{fmt(item.depreciationExpense)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Lease Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold">New Lease Agreement</h3>
                <p className="text-sm text-gray-500">Create a new lease for property, equipment, or other assets under IFRS 16/ASC 842.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={saveLease} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Lease Details</h4>
                  <label className="block text-sm mb-1">* Lease Number</label>
                  <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={form.leaseNumber} onChange={e => setForm(f => ({ ...f, leaseNumber: e.target.value }))}
                    placeholder="e.g. LEASE-2024-001" required />
                  
                  <label className="block text-sm mb-1 mt-3">* Counterparty (Landlord)</label>
                  <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={form.counterparty} onChange={e => setForm(f => ({ ...f, counterparty: e.target.value }))}
                    placeholder="Company or individual name" required />
                  
                  <label className="block text-sm mb-1 mt-3">Property Description</label>
                  <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={form.propertyDescription} onChange={e => setForm(f => ({ ...f, propertyDescription: e.target.value }))}
                    placeholder="e.g. Office space, 3rd floor" />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Lease Terms</h4>
                  <label className="block text-sm mb-1">Lease Type</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                    <option value="FinanceLease">Finance Lease (IFRS 16 / ASC 842)</option>
                    <option value="OperatingLease">Operating Lease (Straight-line)</option>
                  </select>
                  
                  <label className="block text-sm mb-1 mt-3">* Start Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
                  
                  <label className="block text-sm mb-1 mt-3">* End Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required />
                  
                  <label className="block text-sm mb-1 mt-3">Term (Months)</label>
                  <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={form.termMonths} onChange={e => setForm(f => ({ ...f, termMonths: parseInt(e.target.value) || 12 }))}
                    min={1} />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Financials</h4>
                  <label className="block text-sm mb-1">* Monthly Rent</label>
                  <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={form.monthlyRent} onChange={e => setForm(f => ({ ...f, monthlyRent: parseFloat(e.target.value) || 0 }))}
                    min={0} step={0.01} required />
                  
                  <label className="block text-sm mb-1 mt-3">Annual Escalation Rate (%)</label>
                  <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={form.annualEscalationRate} onChange={e => setForm(f => ({ ...f, annualEscalationRate: parseFloat(e.target.value) || 0 }))}
                    min={0} max={100} step={0.01} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Create Lease'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};