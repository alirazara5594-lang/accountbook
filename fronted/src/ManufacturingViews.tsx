import { useEffect } from 'react';
import { useManufacturingStore } from './stores';
import { ModuleSummaryLayout, SummaryPanel } from '@/components/module-summary-layout';
import { ManufacturingWorkspace } from './ManufacturingWorkspace';
import { ClipboardList, Factory, Package, TrendingUp, AlertTriangle, Wallet, Layers } from 'lucide-react';

const money = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);

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
    <ModuleSummaryLayout
      title="Manufacturing & Production"
      description="BOM recipes, work orders, WIP material issues, and IAS 2 job costing"
      stats={[
        { icon: ClipboardList, label: 'BOM Recipes', value: boms.length, tone: 'teal' },
        { icon: Factory, label: 'Work Orders', value: workOrders.length, tone: 'blue' },
        { icon: Package, label: 'In Progress', value: inProgress, tone: 'amber' },
        { icon: TrendingUp, label: 'Completed Runs', value: completed, tone: 'green' },
      ]}
    >
      <SummaryPanel icon={Layers} title="Production Pipeline">
        <div className="grid grid-cols-2 gap-3">
          <div className="border rounded-lg p-3 text-center"><p className="text-2xl font-semibold">{workOrders.length}</p><p className="text-xs text-muted-foreground">Total Orders</p></div>
          <div className="border rounded-lg p-3 text-center"><p className="text-2xl font-semibold">{inProgress}</p><p className="text-xs text-muted-foreground">Active WIP</p></div>
          <div className="border rounded-lg p-3 text-center"><p className="text-2xl font-semibold">{boms.reduce((s, b) => s + (b.lines?.length || 0), 0)}</p><p className="text-xs text-muted-foreground">Recipe Lines</p></div>
          <div className="border rounded-lg p-3 text-center"><p className="text-2xl font-semibold">{new Set(boms.map(b => b.finishedProductName)).size}</p><p className="text-xs text-muted-foreground">Finished Goods</p></div>
        </div>
      </SummaryPanel>
      <SummaryPanel icon={Wallet} title="Cost Position">
        <div className="space-y-2">
          <div className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"><span className="text-muted-foreground">WIP Balance (IAS 2)</span><span className="font-mono font-medium">{money(wipValue)}</span></div>
          <div className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"><span className="text-muted-foreground">Total Material Cost</span><span className="font-mono font-medium">{money(totalMaterial)}</span></div>
          <div className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"><span className="text-muted-foreground">Completed Units</span><span className="font-mono font-medium">{workOrders.reduce((s, w) => s + (w.quantityProduced || 0), 0)}</span></div>
          {workOrders.some(w => String(w.status) === 'InProgress' || String(w.status) === '2') && <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2"><AlertTriangle className="h-4 w-4" /> {inProgress} work order(s) awaiting production completion.</div>}
        </div>
      </SummaryPanel>
    </ModuleSummaryLayout>
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