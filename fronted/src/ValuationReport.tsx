import { useEffect, useMemo } from 'react'
import { Package, Warehouse, Download, DollarSign } from 'lucide-react'
import { useAssetsInventoryStore } from './stores'

const money = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

export default function ValuationReport({ activeEntityId }: { activeEntityId: string }) {
  const levels = useAssetsInventoryStore((s) => s.stockLevels as any[])
  const loading = useAssetsInventoryStore((s) => s.loading)
  const fetchStockLevels = useAssetsInventoryStore((s) => s.fetchStockLevels)

  useEffect(() => { fetchStockLevels(activeEntityId) }, [activeEntityId])

  const byWarehouse = useMemo(() => {
    const map: Record<string, { name: string; items: any[]; total: number; totalQty: number }> = {}
    levels.forEach((l: any) => {
      const key = l.warehouseId || 'default'
      if (!map[key]) map[key] = { name: l.warehouseName || 'Warehouse', items: [], total: 0, totalQty: 0 }
      map[key].items.push(l)
      map[key].total += l.totalValue || 0
      map[key].totalQty += l.quantityOnHand || 0
    })
    return Object.values(map)
  }, [levels])

  const grandTotal = levels.reduce((s: number, l: any) => s + (l.totalValue || 0), 0)
  const grandTotalQty = levels.reduce((s: number, l: any) => s + (l.quantityOnHand || 0), 0)
  const totalProducts = new Set(levels.map((l: any) => l.productId)).size

  const handleExport = () => {
    const headers = ['Warehouse', 'Product', 'Code', 'Qty On Hand', 'Avg. Cost', 'Total Value']
    const rows: any[][] = []
    byWarehouse.forEach(wh => {
      wh.items.forEach((l: any) => {
        rows.push([wh.name, l.productName, l.productCode, l.quantityOnHand, l.movingAverageCost, l.totalValue])
      })
    })
    rows.push(['', '', '', grandTotalQty, '', grandTotal])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `valuation-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" /> Stock Valuation Report
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Inventory valuation by warehouse with moving average cost</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Grand Total Banner */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Grand Total Valuation</p>
            <p className="text-2xl font-bold text-blue-600">{money(grandTotal)}</p>
          </div>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Products</p>
            <p className="text-lg font-bold text-gray-900">{totalProducts}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total Qty</p>
            <p className="text-lg font-bold text-gray-900">{grandTotalQty.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Warehouses</p>
            <p className="text-lg font-bold text-gray-900">{byWarehouse.length}</p>
          </div>
        </div>
      </div>

      {/* Per-Warehouse Sections */}
      {byWarehouse.map(wh => (
        <div key={wh.name} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900 text-sm">{wh.name}</h3>
              <span className="text-[10px] text-gray-400 ml-1">{wh.items.length} products</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">Qty: <span className="font-bold text-gray-900">{wh.totalQty.toLocaleString()}</span></span>
              <span className="font-bold text-blue-600">{money(wh.total)}</span>
            </div>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4 text-right">Qty On Hand</th>
                <th className="py-2.5 px-4 text-right">Avg. Cost</th>
                <th className="py-2.5 px-4 text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {wh.items.map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50/60">
                  <td className="py-2.5 px-4 font-medium text-gray-900">{l.productName}</td>
                  <td className="py-2.5 px-4 font-mono text-xs text-gray-400">{l.productCode}</td>
                  <td className="py-2.5 px-4 text-right text-gray-700">{l.quantityOnHand}</td>
                  <td className="py-2.5 px-4 text-right text-gray-500">{money(l.movingAverageCost)}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-blue-700">{money(l.totalValue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold border-t border-gray-100">
              <tr>
                <td className="py-2 px-4" colSpan={2}>Warehouse Total</td>
                <td className="py-2 px-4 text-right">{wh.totalQty.toLocaleString()}</td>
                <td className="py-2 px-4 text-right text-gray-500">—</td>
                <td className="py-2 px-4 text-right text-blue-700">{money(wh.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}

      {!loading && byWarehouse.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-gray-400">
          No inventory data. Process a GRN to populate the valuation report.
        </div>
      )}
    </div>
  )
}
