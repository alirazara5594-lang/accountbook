import { useEffect } from 'react';
import { useManufacturingStore } from './stores';
import { ManufacturingWorkspace } from './ManufacturingWorkspace';
import { ClipboardList, Factory, AlertTriangle, Wallet, Layers, Hammer, CheckCircle2 } from 'lucide-react';
import { money } from './lib/currency';

function useMfgData() {
  const store = useManufacturingStore();
  useEffect(() => { store.fetchAllManufacturing(); }, []);
  return store;
}

// ── Summary (module overview) ─────────────────────────────────────────────────
export function ManufacturingSummaryView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { boms, workOrders } = useMfgData();
  const inProgress = workOrders.filter(w => String(w.status) === 'InProgress' || String(w.status) === '2').length;
  const completed = workOrders.filter(w => String(w.status) === 'Completed' || String(w.status) === '3').length;
  const wipValue = workOrders.filter(w => String(w.status) === 'InProgress' || String(w.status) === '2').reduce((s, w) => s + (w.totalMaterialCost || 0), 0);
  const totalMaterial = workOrders.reduce((s, w) => s + (w.totalMaterialCost || 0), 0);

  const kpiList = [
    { label: 'BOM Recipes', value: boms.length, desc: 'Bill of materials defined', icon: ClipboardList, color: 'from-teal-500 to-emerald-500', bg: 'bg-teal-50 dark:bg-teal-950/30', textColor: 'text-teal-600 dark:text-teal-400' },
    { label: 'Work Orders', value: workOrders.length, desc: 'Total production orders', icon: Factory, color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400' },
    { label: 'In Progress', value: inProgress, desc: 'Active WIP orders', icon: Hammer, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400' },
    { label: 'Completed Runs', value: completed, desc: 'Finished production runs', icon: CheckCircle2, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50 dark:bg-green-950/30', textColor: 'text-green-600 dark:text-green-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Manufacturing & Production</h2>
        <p className="text-sm text-muted-foreground mt-1">BOM recipes, work orders, WIP material issues, and IAS 2 job costing</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiList.map((kpi) => (
          <div key={kpi.label} className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-lg font-semibold mt-1 ${kpi.textColor}`}>{kpi.value}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{kpi.desc}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white shadow-lg`}>
                <kpi.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${kpi.bg} opacity-50`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">Production Pipeline</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{workOrders.length}</p><p className="text-[10px] text-muted-foreground">Total Orders</p></div>
            <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{inProgress}</p><p className="text-[10px] text-muted-foreground">Active WIP</p></div>
            <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{boms.reduce((s, b) => s + (b.lines?.length || 0), 0)}</p><p className="text-[10px] text-muted-foreground">Recipe Lines</p></div>
            <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{new Set(boms.map(b => b.finishedProductName)).size}</p><p className="text-[10px] text-muted-foreground">Finished Goods</p></div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">Cost Position</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"><span className="text-muted-foreground">WIP Balance (IAS 2)</span><span className="font-mono font-medium">{money(wipValue)}</span></div>
            <div className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"><span className="text-muted-foreground">Total Material Cost</span><span className="font-mono font-medium">{money(totalMaterial)}</span></div>
            <div className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"><span className="text-muted-foreground">Completed Units</span><span className="font-mono font-medium">{workOrders.reduce((s, w) => s + (w.quantityProduced || 0), 0)}</span></div>
            {workOrders.some(w => String(w.status) === 'InProgress' || String(w.status) === '2') && <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2"><AlertTriangle className="h-4 w-4" /> {inProgress} work order(s) awaiting production completion.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dedicated sub-module views ────────────────────────────────────────────────
export function ManufacturingWorkspaceView({ activeEntityId, entities }: { activeEntityId?: string; entities?: any[] }) {
  return <ManufacturingWorkspace activeEntityId={activeEntityId || ''} entities={entities} initialTab="boms" />;
}

export function BillOfMaterialsView({ activeEntityId, entities }: { activeEntityId?: string; entities?: any[] }) {
  return <ManufacturingWorkspace activeEntityId={activeEntityId || ''} entities={entities} initialTab="boms" />;
}

export function WorkOrdersMfgView({ activeEntityId, entities }: { activeEntityId?: string; entities?: any[] }) {
  return <ManufacturingWorkspace activeEntityId={activeEntityId || ''} entities={entities} initialTab="orders" />;
}

export function JobCostingView({ activeEntityId, entities }: { activeEntityId?: string; entities?: any[] }) {
  return <ManufacturingWorkspace activeEntityId={activeEntityId || ''} entities={entities} initialTab="costing" />;
}