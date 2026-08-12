import { useEffect, useState } from 'react';
import { useReportsStore } from './stores/useReportsStore';
import { useVendorsStore, useCoaStore } from './stores';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

type PayablesAgingProps = { activeEntityId: string };

function PayablesAgingWorkspace({ activeEntityId }: PayablesAgingProps) {
  const { incomeStatement, loading, error, fetchIncomeStatement } = useReportsStore();
  const vendors = useVendorsStore((s) => s.vendors);
  const companies = useCoaStore((s) => s.accounts as any[]);
  const { toast } = useToast();

  useEffect(() => {
    fetchIncomeStatement({ entityId: activeEntityId });
  }, [activeEntityId]);

  // Format currency safely
  const fmt = (n?: number) => (n != null ? n.toLocaleString() : '0.00');

  // aging buckets: Current, 30 days, 60 days, 90+ days
  const calculateAging = (outstanding: number) => {
    if (!outstanding) return { current: outstanding, '30': 0, '60': 0, '90': 0 };
    // Simplified aging - in real app would use invoice dates
    const total = outstanding;
    return {
      current: Math.round(total * 0.7),
      '30': Math.round(total * 0.2),
      '60': Math.round(total * 0.1),
      '90': total - Math.round(total * 0.7) - Math.round(total * 0.2) - Math.round(total * 0.1),
    };
  };

  return (
    <section className="workspace-card">
      <header className="workspace-header">
        <h2>Payables Aging</h2>
      </header>
      {loading && <p>Loading aging report…</p>}
      {error && <p className="error">{error}</p>}
      {incomeStatement && (
        <div>
          <div className="statistics-grid">
            <div className="stat-card">
              <h3>Total Vendors</h3>
              <h2>{incomeStatement?.totalVendors || 0}</h2>
            </div>
            <div className="stat-card">
              <h3>Total Payables</h3>
              <h2>${fmt(incomeStatement?.totalPayables)}</h2>
            </div>
          </div>

          <h4>Aging Breakdown</h4>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Age Range</th>
                <th>Amount</th>
                <th>% of Total</th>
                <th>Vendor Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Current (0-30 days)</td>
                <td>${fmt(incomeStatement?.currentAging?.current || 0)}</td>
                <td>{incomeStatement?.currentAging?.current ? Math.round((incomeStatement.currentAging.current / incomeStatement.totalPayables) * 100) || 0 : 0}%</td>
                <td>{incomeStatement?.vendorCount || 0}</td>
              </tr>
              <tr>
                <td>31-60 Days</td>
                <td>${fmt(incomeStatement?.currentAging?.['30'] || 0)}</td>
                <td>{incomeStatement?.currentAging?.['30'] ? Math.round((incomeStatement.currentAging['30'] / incomeStatement.totalPayables) * 100) || 0 : 0}%</td>
                <td>{incomeStatement?.vendorCount || 0}</td>
              </tr>
              <tr>
                <td>61-90 Days</td>
                <td>${fmt(incomeStatement?.currentAging?.['60'] || 0)}</td>
                <td>{incomeStatement?.currentAging?.['60'] ? Math.round((incomeStatement.currentAging['60'] / incomeStatement.totalPayables) * 100) || 0 : 0}%</td>
                <td>{incomeStatement?.vendorCount || 0}</td>
              </tr>
              <tr>
                <td>90+ Days</td>
                <td>${fmt(incomeStatement?.currentAging?.['90'] || 0)}</td>
                <td>{incomeStatement?.currentAging?.['90'] ? Math.round((incomeStatement.currentAging['90'] / incomeStatement.totalPayables) * 100) || 0 : 0}%</td>
                <td>{incomeStatement?.vendorCount || 0}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4">
            <h4>Vendor Details</h4>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Outstanding</th>
                  <th>Current</td>
                  <th>31-60 Days</th>
                  <th>61-90 Days</th>
                  <th>90+ Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v: any, idx: number) => (
                  <tr key={idx}>
                    <td>{v.name}</td>
                    <td>${fmt(v.outstandingBalance || 0)}</td>
                    <td>${fmt(v.currentAging?.current || 0)}</td>
                    <td>${fmt(v.currentAging?.['30'] || 0)}</td>
                    <td>${fmt(v.currentAging?.['60'] || 0)}</td>
                    <td>${fmt(v.currentAging?.['90'] || 0)}</td>
                    <td>
                      {v.outstandingBalance > 0 ? 'Outstanding' : 'Current'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default PayablesAgingWorkspace;