import { useEffect } from 'react';
import { useManufacturingStore } from './stores';
import { ManufacturingWorkspace } from './ManufacturingWorkspace';
import { KpiCard, KpiGrid } from './components/ui/kpi-card';
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

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-orange-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-orange-400 to-red-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Factory className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Manufacturing & Production</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" /> Live Ledger
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">BOM recipes, work orders, WIP material issues, and IAS 2 job costing</p>
            </div>
          </div>
        </div>
      </div>

      <KpiGrid cols={4}>
        <KpiCard icon={ClipboardList} label="BOM Recipes" value={boms.length} desc="Bill of materials defined" tone="teal" />
        <KpiCard icon={Factory} label="Work Orders" value={workOrders.length} desc="Total production orders" tone="blue" />
        <KpiCard icon={Hammer} label="In Progress" value={inProgress} desc="Active WIP orders" tone="amber" />
        <KpiCard icon={CheckCircle2} label="Completed Runs" value={completed} desc="Finished production runs" tone="emerald" />
      </KpiGrid>

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