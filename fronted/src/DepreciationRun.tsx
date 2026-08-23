import { useState, useEffect } from 'react'
import { Play, CheckCircle2, AlertCircle, RefreshCw, Calendar, Building2, TrendingDown, Wallet } from 'lucide-react'
import { useAssetsInventoryStore } from './stores'
import type { DepreciationRunResult } from './api/modules/assetsInventory.api'

import { money } from './lib/currency';

export default function DepreciationRun({ activeEntityId }: { activeEntityId: string }) {
  const assets = useAssetsInventoryStore((s) => s.fixedAssets as any[])
  const loading = useAssetsInventoryStore((s) => s.loading)
  const fetchFixedAssets = useAssetsInventoryStore((s) => s.fetchFixedAssets)
  const runBatchDepreciation = useAssetsInventoryStore((s) => s.runBatchDepreciation)

  const [runDate, setRunDate] = useState(new Date().toISOString().slice(0, 10))
  const [results, setResults] = useState<DepreciationRunResult[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchFixedAssets(activeEntityId)
  }, [activeEntityId])

  const activeAssets = assets.filter((a: any) => a.status === 0 || a.status === 'Active' || a.status === 'Active')

  const totalCost = activeAssets.reduce((s: number, a: any) => s + (a.purchasePrice || a.cost || 0), 0)
  const totalAccumDepr = activeAssets.reduce((s: number, a: any) => s + (a.accumulatedDepreciation || 0), 0)
  const totalNBV = totalCost - totalAccumDepr

  const monthlyDepr = (a: any) => {
    const cost = a.purchasePrice || a.cost || 0
    const salvage = a.salvageValue || 0
    const life = a.usefulLifeYears || 3
    return Math.round(((cost - salvage) / life) / 12 * 100) / 100
  }

  const totalMonthlyDepr = activeAssets.reduce((s: number, a: any) => s + monthlyDepr(a), 0)

  const handleRun = async () => {
    setRunning(true)
    setError('')
    setSuccess('')
    setResults([])
    try {
      const res = await runBatchDepreciation(runDate)
      setResults(res.results || [])
      setSuccess(res.message || `Depreciation posted for ${res.results?.length || 0} assets.`)
    } catch (err: any) {
      setError(err.message || 'Failed to run depreciation')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-600" /> Depreciation Run
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Post monthly straight-line depreciation for all active fixed assets</p>
        </div>
      </div>



      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] text-gray-500 font-medium">Active Assets</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{activeAssets.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] text-gray-500 font-medium">Total Cost</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{money(totalCost)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-orange-600" />
            <span className="text-[10px] text-gray-500 font-medium">Accum. Depreciation</span>
          </div>
          <p className="text-xl font-bold text-orange-600">{money(totalAccumDepr)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] text-gray-500 font-medium">Net Book Value</span>
          </div>
          <p className="text-xl font-bold text-blue-600">{money(totalNBV)}</p>
        </div>
      </div>

      {/* Run Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <label className="text-xs font-semibold text-gray-600">As of Date</label>
          <input
            type="date"
            value={runDate}
            onChange={e => setRunDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500">
            Est. monthly depreciation: <span className="font-bold text-gray-900">{money(totalMonthlyDepr)}</span>
          </span>
          <button
            onClick={handleRun}
            disabled={running || activeAssets.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Running...' : 'Run Depreciation'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Depreciation Results</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Asset</th>
                <th className="py-2.5 px-4 text-right">Cost</th>
                <th className="py-2.5 px-4 text-right">Accum. Depr.</th>
                <th className="py-2.5 px-4 text-right">NBV</th>
                <th className="py-2.5 px-4 text-right">Monthly Depr.</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.map((r) => (
                <tr key={r.assetId} className="hover:bg-gray-50/60">
                  <td className="py-2.5 px-4">
                    <span className="font-medium text-gray-900">{r.assetName}</span>
                    <span className="ml-2 text-[10px] text-gray-400 font-mono">{r.assetTag}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-gray-700">{money(r.cost)}</td>
                  <td className="py-2.5 px-4 text-right text-orange-600">{money(r.accumulatedDepreciation)}</td>
                  <td className="py-2.5 px-4 text-right text-blue-600 font-semibold">{money(r.netBookValue)}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-gray-900">
                    {r.amountPosted > 0 ? money(r.amountPosted) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {r.status === 'Posted' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" /> Posted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                        {r.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="py-2.5 px-4">Total</td>
                <td className="py-2.5 px-4 text-right">{money(results.reduce((s, r) => s + r.cost, 0))}</td>
                <td className="py-2.5 px-4 text-right text-orange-600">{money(results.reduce((s, r) => s + r.accumulatedDepreciation, 0))}</td>
                <td className="py-2.5 px-4 text-right text-blue-600">{money(results.reduce((s, r) => s + r.netBookValue, 0))}</td>
                <td className="py-2.5 px-4 text-right">{money(results.reduce((s, r) => s + r.amountPosted, 0))}</td>
                <td className="py-2.5 px-4 text-center text-xs text-gray-500">{results.filter(r => r.status === 'Posted').length} posted</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Active Assets Preview */}
      {results.length === 0 && !loading && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Active Assets Preview</h3>
            <span className="text-xs text-gray-400">{activeAssets.length} assets</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Asset</th>
                <th className="py-2.5 px-4 text-right">Cost</th>
                <th className="py-2.5 px-4 text-right">Salvage</th>
                <th className="py-2.5 px-4 text-right">Life (Yrs)</th>
                <th className="py-2.5 px-4 text-right">Accum. Depr.</th>
                <th className="py-2.5 px-4 text-right">Est. Monthly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeAssets.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50/60">
                  <td className="py-2.5 px-4">
                    <span className="font-medium text-gray-900">{a.name}</span>
                    <span className="ml-2 text-[10px] text-gray-400 font-mono">{a.assetTag}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-gray-700">{money(a.purchasePrice || a.cost || 0)}</td>
                  <td className="py-2.5 px-4 text-right text-gray-500">{money(a.salvageValue || 0)}</td>
                  <td className="py-2.5 px-4 text-right text-gray-500">{a.usefulLifeYears || 3}</td>
                  <td className="py-2.5 px-4 text-right text-orange-600">{money(a.accumulatedDepreciation || 0)}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{money(monthlyDepr(a))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
