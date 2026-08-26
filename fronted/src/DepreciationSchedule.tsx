import { useEffect, useMemo } from 'react'
import { Calendar, Building2, TrendingDown, Download } from 'lucide-react'
import { useAssetsInventoryStore } from './stores'

import { money } from './lib/currency';
import { EmptyState } from './components/ui/empty-state';

export default function DepreciationSchedule({ activeEntityId }: { activeEntityId: string }) {
  const assets = useAssetsInventoryStore((s) => s.fixedAssets as any[])
  const loading = useAssetsInventoryStore((s) => s.loading)
  const fetchFixedAssets = useAssetsInventoryStore((s) => s.fetchFixedAssets)

  useEffect(() => { fetchFixedAssets(activeEntityId) }, [activeEntityId])

  const months = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() + i)
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }), [])

  const activeAssets = assets.filter((a: any) => a.status === 0 || a.status === 'Active')

  const monthlyDepr = (a: any) => {
    const cost = a.purchasePrice || a.cost || 0
    const salvage = a.salvageValue || 0
    const life = a.usefulLifeYears || 3
    return Math.round(((cost - salvage) / life) / 12 * 100) / 100
  }

  const totalCost = activeAssets.reduce((s: number, a: any) => s + (a.purchasePrice || a.cost || 0), 0)
  const totalAccum = activeAssets.reduce((s: number, a: any) => s + (a.accumulatedDepreciation || 0), 0)
  const totalNBV = totalCost - totalAccum

  const handleExport = () => {
    const headers = ['Asset', 'Tag', 'Cost', 'Salvage', 'Life (Yrs)', 'Accum. Depr.', 'NBV', ...months, 'Total']
    const rows = activeAssets.map((a: any) => {
      const cost = a.purchasePrice || a.cost || 0
      const salvage = a.salvageValue || 0
      const life = a.usefulLifeYears || 3
      const accum = a.accumulatedDepreciation || 0
      const nbv = cost - accum
      const monthly = monthlyDepr(a)
      const remaining = (cost - salvage) - accum
      const monthAmounts = months.map((_, i) => {
        const used = monthly * i
        return Math.min(monthly, Math.max(0, remaining - used))
      })
      const total = monthAmounts.reduce((s, v) => s + v, 0)
      return [a.name, a.assetTag, cost, salvage, life, accum, nbv, ...monthAmounts, total]
    })
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `depreciation-schedule-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-teal-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-teal-500 to-emerald-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Calendar className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Depreciation Schedule</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400"><span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">12-month straight-line depreciation forecast for all active assets</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] text-gray-500 font-medium">Total Cost</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{money(totalCost)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-orange-600" />
            <span className="text-[10px] text-gray-500 font-medium">Accum. Depreciation</span>
          </div>
          <p className="text-xl font-bold text-orange-600">{money(totalAccum)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] text-gray-500 font-medium">Net Book Value</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">{money(totalNBV)}</p>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-teal-500/[0.05] dark:bg-teal-400/[0.07] text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 sticky left-0 bg-teal-50 dark:bg-teal-950/40 z-10">Asset</th>
              <th className="py-3 px-4 text-right">Cost</th>
              <th className="py-3 px-4 text-right">Accum. Depr.</th>
              <th className="py-3 px-4 text-right">NBV</th>
              {months.map(m => <th key={m} className="py-3 px-3 text-right whitespace-nowrap">{m}</th>)}
              <th className="py-3 px-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activeAssets.map((a: any) => {
              const cost = a.purchasePrice || a.cost || 0
              const accum = a.accumulatedDepreciation || 0
              const nbv = cost - accum
              const monthly = monthlyDepr(a)
              const remaining = (cost - (a.salvageValue || 0)) - accum
              const monthAmounts = months.map((_, i) => {
                const used = monthly * i
                return Math.min(monthly, Math.max(0, remaining - used))
              })
              const total = monthAmounts.reduce((s, v) => s + v, 0)
              return (
                <tr key={a.id} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4 font-medium text-gray-900 sticky left-0 bg-white z-10">
                    {a.name}
                    <span className="ml-2 text-[10px] text-gray-400 font-mono">{a.assetTag}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">{money(cost)}</td>
                  <td className="py-3 px-4 text-right text-orange-600">{money(accum)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-blue-600">{money(nbv)}</td>
                  {monthAmounts.map((amt, i) => (
                    <td key={i} className={`py-3 px-3 text-right text-xs ${amt > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                      {amt > 0 ? money(amt) : '—'}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">{money(total)}</td>
                </tr>
              )
            })}
            {!loading && activeAssets.length === 0 && (
              <tr><td colSpan={17}><EmptyState icon={Building2} title="No active assets to schedule" hint="Capitalize fixed assets to build the 12-month depreciation forecast." /></td></tr>
            )}
          </tbody>
          {activeAssets.length > 0 && (
            <tfoot className="bg-gray-50 font-semibold border-t border-gray-200">
              <tr>
                <td className="py-3 px-4">Total</td>
                <td className="py-3 px-4 text-right">{money(totalCost)}</td>
                <td className="py-3 px-4 text-right text-orange-600">{money(totalAccum)}</td>
                <td className="py-3 px-4 text-right text-blue-600">{money(totalNBV)}</td>
                {months.map((_, i) => {
                  const total = activeAssets.reduce((s: number, a: any) => {
                    const cost = a.purchasePrice || a.cost || 0
                    const accum = a.accumulatedDepreciation || 0
                    const remaining = (cost - (a.salvageValue || 0)) - accum
                    const monthly = monthlyDepr(a)
                    const used = monthly * i
                    return s + Math.min(monthly, Math.max(0, remaining - used))
                  }, 0)
                  return <td key={i} className="py-3 px-3 text-right text-xs text-orange-700">{total > 0 ? money(total) : '—'}</td>
                })}
                <td className="py-3 px-4 text-right">{money(activeAssets.reduce((s: number, a: any) => {
                  const cost = a.purchasePrice || a.cost || 0
                  const accum = a.accumulatedDepreciation || 0
                  const remaining = (cost - (a.salvageValue || 0)) - accum
                  return s + Math.min(monthlyDepr(a) * 12, remaining)
                }, 0))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
