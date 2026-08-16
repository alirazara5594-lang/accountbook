import { useEffect, useMemo, useState } from 'react';
import {
  useSalesStore,
  useProcurementStore,
  useBankingStore,
  useAssetsInventoryStore,
  useCustomersStore,
  useVendorsStore,
  useProductsStore,
  usePayrollStore,
} from '../stores';
import {
  money,
  monthKey,
  fiscalMonths,
  fyStartDate,
  agingBucket,
  AGING_BUCKETS,
} from './format';

export interface AccountLike {
  code: string;
  name: string;
  type: string;
  openingBalance: number;
  status?: string;
}

export interface JournalLike {
  id: string;
  date?: string;
  reference?: string;
  status?: string;
}

export interface TxnRow {
  ref: string;
  party: string;
  date: string;
  amount: number;
  type: 'IN' | 'OUT';
  status: string;
  category: string;
}

export interface SliceDatum {
  name: string;
  value: number;
}

export interface SeriesPoint {
  label: string;
  revenue: number;
  expense: number;
  profit: number;
}

export interface AlertItem {
  id: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  page: string;
}

export interface FinancialData {
  loading: boolean;
  asOf: string;
  // KPI figures
  cashBank: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  arTotal: number;
  apTotal: number;
  inventoryValue: number;
  workingCapital: number;
  kpiDeltas: Record<string, number | null>;
  // Performance series (Jul-Jun for the selected FY)
  series: SeriesPoint[];
  salesMonthly: { label: string; amount: number }[];
  purchaseMonthly: { label: string; amount: number }[];
  // Cash flow
  cashOpening: number;
  cashInflows: number;
  cashOutflows: number;
  cashClosing: number;
  cashFlowSplit: { name: string; value: number }[];
  // Profit & loss
  pnl: { label: string; value: number; strong?: boolean; negative?: boolean }[];
  // Accounting equation
  equation: { assets: number; liabilities: number; equity: number; balanced: boolean; difference: number };
  // AR / AP
  arAging: SliceDatum[];
  apAging: SliceDatum[];
  topCustomers: { name: string; value: number }[];
  topVendors: { name: string; value: number }[];
  arOverdue: number;
  apOverdue: number;
  overdueCount: number;
  overdueBills: number;
  openInvoiceCount: number;
  unpaidBillCount: number;
  // Inventory
  stockValue: number;
  stockItems: number;
  lowStock: number;
  outOfStock: number;
  stockStatus: SliceDatum[];
  topCategories: { name: string; value: number }[];
  // Transactions
  recentTxns: TxnRow[];
  // Status breakdowns
  invoiceStatus: SliceDatum[];
  poStatus: SliceDatum[];
  // Expenses / profitability
  topExpenses: { name: string; value: number }[];
  profitability: {
    grossMargin: number;
    netMargin: number;
    operatingMargin: number;
    roe: number;
    currentRatio: number;
    quickRatio: number;
    equityRatio: number;
    debtToEquity: number;
  };
  avgDaysOutstanding: number;
  avgDaysPayable: number;
  // Alerts + controls
  alerts: AlertItem[];
  controls: {
    trialBalance: number;
    bankRecon: number;
    arRecon: number;
    apRecon: number;
    unpostedJournals: number;
    period: string;
  };
  counts: {
    customers: number;
    vendors: number;
    banks: number;
    products: number;
    employees: number;
    invoices: number;
    branches: number;
  };
}

interface BillLike {
  id: string;
  billNumber?: string;
  number?: string;
  vendorName?: string;
  date?: string;
  billDate?: string;
  dueDate?: string;
  status?: string;
  totalAmount?: number;
  total?: number;
  amountDue?: number;
}

interface OrderLike {
  id: string;
  status?: string;
}

const billAmount = (b: BillLike): number => b.totalAmount ?? b.total ?? 0;
const billDue = (b: BillLike): number =>
  b.amountDue ?? (b.status !== 'Paid' ? (b.totalAmount ?? b.total ?? 0) : 0);

export function useFinancialData(
  accounts: AccountLike[],
  entries: JournalLike[],
  activeEntityId?: string,
  fyYear: number = new Date().getFullYear(),
): FinancialData & { refresh: () => void } {
  const sales = useSalesStore();
  const procurement = useProcurementStore();
  const banking = useBankingStore();
  const inv = useAssetsInventoryStore();
  const { customers, fetchCustomers } = useCustomersStore();
  const { vendors, fetchVendors } = useVendorsStore();
  const { products, fetchProducts } = useProductsStore();
  const { employees, fetchAll: fetchPayroll } = usePayrollStore();

  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    Promise.all([
      sales.fetchAllSales(activeEntityId),
      procurement.fetchAllProcurement(activeEntityId),
      banking.fetchAllBanking(activeEntityId),
      inv.fetchAllAssetsInventory(activeEntityId),
      fetchCustomers(activeEntityId),
      fetchVendors(activeEntityId),
      fetchProducts(activeEntityId),
      fetchPayroll().catch(() => {}),
    ])
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntityId, tick]);

  const refresh = () => {
    setLoading(true);
    setTick((t) => t + 1);
  };

  const invoices = sales.invoices;
  const receipts = sales.receipts;
  const estimates = sales.estimates;
  const bills: BillLike[] = procurement.bills as BillLike[];
  const orders: OrderLike[] = procurement.orders as OrderLike[];
  const bankTx = banking.transactions;
  const bankAccounts = banking.bankAccounts;
  const cashAccounts = banking.cashAccounts;
  const reconciliations = banking.reconciliations;
  const stockLevels = inv.stockLevels;
  const warehouses = inv.warehouses;

  const data = useMemo<FinancialData>(() => {
    // ── COA aggregates ──
    const byType = (t: string[]) =>
      accounts.filter((a) => t.includes(a.type)).reduce((s, a) => s + (a.openingBalance || 0), 0);
    const totalRevenue = byType(['Revenue', 'ContraRevenue']);
    const totalExpense = byType(['Expense', 'ContraExpense']);
    const totalAssets = byType(['Asset']);
    const totalLiabilities = byType(['Liability']);
    const totalEquity = byType(['Equity']);
    const netIncome = totalRevenue - totalExpense;

    const cogs = accounts
      .filter((a) => a.type === 'Expense' && /cogs|cost of goods|cost of sales/i.test(a.name))
      .reduce((s, a) => s + (a.openingBalance || 0), 0);
    const depreciation = accounts
      .filter((a) => a.type === 'Expense' && /deprec/i.test(a.name))
      .reduce((s, a) => s + (a.openingBalance || 0), 0);
    const operatingExpense = Math.max(0, totalExpense - cogs - depreciation);
    const grossProfit = totalRevenue - cogs;
    const operatingProfit = grossProfit - operatingExpense;

    const bankTotal = bankAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);
    const cashTotal = cashAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);
    const cashBank = bankTotal + cashTotal;
    const workingCapital = totalAssets - totalLiabilities;

    // ── AR / AP ──
    const openInvoices = invoices.filter((i) => (i.amountDue || 0) > 0);
    const arAgingMap: Record<string, number> = {};
    AGING_BUCKETS.forEach((b) => (arAgingMap[b] = 0));
    openInvoices.forEach((i) => {
      arAgingMap[agingBucket(i.dueDate)] += i.amountDue || 0;
    });
    const arAging: SliceDatum[] = AGING_BUCKETS.map((b) => ({ name: b, value: arAgingMap[b] }));
    const arOverdue = arAgingMap['1-30'] + arAgingMap['31-60'] + arAgingMap['61-90'] + arAgingMap['90+'];
    const arTotal = arAgingMap['Current'] + arOverdue;
    const overdueCount = openInvoices.filter((i) => new Date(i.dueDate).getTime() < now).length;

    const unpaidBills = bills.filter((b) => billDue(b) > 0);
    const apAgingMap: Record<string, number> = {};
    AGING_BUCKETS.forEach((b) => (apAgingMap[b] = 0));
    unpaidBills.forEach((b) => {
      apAgingMap[agingBucket(b.dueDate)] += billDue(b);
    });
    const apAging: SliceDatum[] = AGING_BUCKETS.map((b) => ({ name: b, value: apAgingMap[b] }));
    const apOverdue = apAgingMap['1-30'] + apAgingMap['31-60'] + apAgingMap['61-90'] + apAgingMap['90+'];
    const apTotal = apAgingMap['Current'] + apOverdue;
    const overdueBills = unpaidBills.filter((b) => (b.dueDate ? new Date(b.dueDate).getTime() < now : false)).length;

    // ── Monthly series for the selected FY ──
    const fyStart = fyStartDate(fyYear);
    const inFy = (d?: string) => !d || d >= fyStart;
    const monthlyMap: Record<string, { revenue: number; expense: number }> = {};
    invoices.forEach((i) => {
      const k = monthKey(i.date);
      if (!k || !inFy(i.date)) return;
      monthlyMap[k] = monthlyMap[k] || { revenue: 0, expense: 0 };
      monthlyMap[k].revenue += i.totalAmount || 0;
    });
    bills.forEach((b) => {
      const k = monthKey(b.date || b.billDate || '');
      if (!k || !inFy(b.date || b.billDate)) return;
      monthlyMap[k] = monthlyMap[k] || { revenue: 0, expense: 0 };
      monthlyMap[k].expense += billAmount(b);
    });
    const series: SeriesPoint[] = fiscalMonths(fyYear).map((f) => ({
      label: f.short,
      revenue: monthlyMap[f.key]?.revenue || 0,
      expense: monthlyMap[f.key]?.expense || 0,
      profit: (monthlyMap[f.key]?.revenue || 0) - (monthlyMap[f.key]?.expense || 0),
    }));

    const salesMonthly = series.map((s) => ({ label: s.label, amount: s.revenue }));
    const purchaseMonthly = series.map((s) => ({ label: s.label, amount: s.expense }));

    const deltaFor = (key: 'revenue' | 'expense' | 'profit'): number | null => {
      const prev = series[series.length - 2]?.[key] || 0;
      const cur = series[series.length - 1]?.[key] || 0;
      if (prev <= 0) return null;
      return ((cur - prev) / prev) * 100;
    };

    // ── Cash flow ──
    const cashOpening =
      bankAccounts.reduce((s, a) => s + (a.openingBalance || 0), 0) +
      cashAccounts.reduce((s, a) => s + (a.openingBalance || 0), 0);
    const receiptTotal = receipts.filter((r) => inFy(r.date)).reduce((s, r) => s + (r.amount || 0), 0);
    const billTotal = bills.filter((b) => inFy(b.date || b.billDate)).reduce((s, b) => s + billAmount(b), 0);
    let bankIn = 0;
    let bankOut = 0;
    bankTx.forEach((t) => {
      if (!inFy(t.date)) return;
      const isDebit = /debit|outgoing|payment|withdraw|disbursed/i.test(t.type || '') || Number(t.amount) < 0;
      if (isDebit) bankOut += Math.abs(t.amount || 0);
      else bankIn += Math.abs(t.amount || 0);
    });
    const cashInflows = receiptTotal + bankIn;
    const cashOutflows = billTotal + bankOut;
    const cashClosing = cashOpening + cashInflows - cashOutflows;

    let investing = 0;
    let financing = 0;
    let operating = 0;
    bankTx.forEach((t) => {
      if (!inFy(t.date)) return;
      const d = (t.description || t.payee || '').toLowerCase();
      const amt = Math.abs(t.amount || 0);
      if (/(asset|equipment|property|invest|land|machin|furniture)/.test(d)) investing += amt;
      else if (/(loan|borrow|capital|financ|dividend|drawing|equity)/.test(d)) financing += amt;
      else operating += amt;
    });
    operating += receiptTotal;
    const cashFlowSplit: SliceDatum[] = [
      { name: 'Operating', value: operating },
      { name: 'Investing', value: investing },
      { name: 'Financing', value: financing },
    ];

    // ── Inventory ──
    const stockValue = stockLevels.reduce((s, l) => s + (l.quantityOnHand || 0) * (l.unitCost || 0), 0);
    const lowStock = stockLevels.filter(
      (l) => (l.quantityOnHand || 0) > 0 && (l.quantityOnHand || 0) <= (l.reorderPoint || 0),
    ).length;
    const outOfStock = stockLevels.filter((l) => (l.quantityOnHand || 0) <= 0).length;
    const inStock = Math.max(0, stockLevels.length - lowStock - outOfStock);
    const stockStatus: SliceDatum[] = [
      { name: 'In Stock', value: inStock },
      { name: 'Low Stock', value: lowStock },
      { name: 'Out of Stock', value: outOfStock },
    ];

    const prodCat: Record<string, string> = {};
    products.forEach((p) => {
      if (p.id) prodCat[p.id] = p.category || 'Uncategorized';
    });
    const catValue: Record<string, number> = {};
    stockLevels.forEach((l) => {
      const c = prodCat[l.productId] || 'Uncategorized';
      catValue[c] = (catValue[c] || 0) + (l.quantityOnHand || 0) * (l.unitCost || 0);
    });
    const topCategories = Object.entries(catValue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // ── Top customers / vendors ──
    const topCustomers = Object.entries(
      invoices.reduce<Record<string, number>>((acc, i) => {
        const n = i.customerName || 'Others';
        acc[n] = (acc[n] || 0) + (i.totalAmount || 0);
        return acc;
      }, {}),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topVendors = Object.entries(
      bills.reduce<Record<string, number>>((acc, b) => {
        const n = b.vendorName || 'Others';
        acc[n] = (acc[n] || 0) + billAmount(b);
        return acc;
      }, {}),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // ── Recent transactions ──
    const recentTxns: TxnRow[] = [
      ...invoices.map((i) => ({
        ref: i.invoiceNumber || i.id,
        party: i.customerName || 'Customer',
        date: i.date,
        amount: i.totalAmount || 0,
        type: 'IN' as const,
        status: (i.amountDue || 0) <= 0 ? 'Paid' : 'Open',
        category: 'Invoice',
      })),
      ...receipts.map((r) => ({
        ref: r.receiptNumber || r.id,
        party: r.customerName || 'Customer',
        date: r.date,
        amount: r.amount || 0,
        type: 'IN' as const,
        status: r.status || 'Received',
        category: 'Receipt',
      })),
      ...bills.map((b) => ({
        ref: b.billNumber || b.number || b.id,
        party: b.vendorName || 'Vendor',
        date: b.date || b.billDate || '',
        amount: billAmount(b),
        type: 'OUT' as const,
        status: b.status === 'Paid' ? 'Paid' : 'Due',
        category: 'Bill',
      })),
      ...bankTx.map((t) => ({
        ref: t.ref || t.id,
        party: t.payee || 'Bank',
        date: t.date,
        amount: Math.abs(t.amount || 0),
        type: (/debit/.test(t.type || '') || Number(t.amount) < 0 ? 'OUT' : 'IN') as 'IN' | 'OUT',
        status: t.reconciled ? 'Reconciled' : 'Unreconciled',
        category: 'Bank',
      })),
    ]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 8);

    // ── Status breakdowns ──
    const invoiceStatusMap: Record<string, number> = {};
    invoices.forEach((i) => {
      const s = i.status || 'Open';
      invoiceStatusMap[s] = (invoiceStatusMap[s] || 0) + 1;
    });
    const invoiceStatus: SliceDatum[] = Object.entries(invoiceStatusMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const poStatusMap: Record<string, number> = {};
    orders.forEach((o) => {
      const s = o.status || 'Draft';
      poStatusMap[s] = (poStatusMap[s] || 0) + 1;
    });
    const poStatus: SliceDatum[] = Object.entries(poStatusMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // ── Top expenses ──
    const topExpenses = accounts
      .filter((a) => a.type === 'Expense' || a.type === 'ContraExpense')
      .map((a) => ({ name: a.name, value: a.openingBalance || 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // ── Profitability ──
    const equity = totalEquity + netIncome;
    const profitability = {
      grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      netMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
      operatingMargin: totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0,
      roe: totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0,
      currentRatio: totalLiabilities > 0 ? totalAssets / totalLiabilities : 0,
      quickRatio: totalLiabilities > 0 ? (totalAssets - stockValue) / totalLiabilities : 0,
      equityRatio: totalAssets > 0 ? (equity / totalAssets) * 100 : 0,
      debtToEquity: equity > 0 ? totalLiabilities / equity : 0,
    };

    // ── Avg days for aging ──
    const agingMidpoints = [0, 15, 45, 75, 105];
    const arTotalVal = arAging.reduce((s, a) => s + a.value, 0);
    const avgDaysOutstanding = arTotalVal > 0
      ? arAging.reduce((s, a, i) => s + a.value * agingMidpoints[i], 0) / arTotalVal
      : 0;
    const apTotalVal = apAging.reduce((s, a) => s + a.value, 0);
    const avgDaysPayable = apTotalVal > 0
      ? apAging.reduce((s, a, i) => s + a.value * agingMidpoints[i], 0) / apTotalVal
      : 0;

    // ── Accounting equation ──
    const difference = totalAssets - (totalLiabilities + totalEquity + netIncome);
    const equation = {
      assets: totalAssets,
      liabilities: totalLiabilities,
      equity: totalEquity + netIncome,
      balanced: Math.abs(difference) < 0.01,
      difference,
    };

    // ── P&L rows ──
    const pnl = [
      { label: 'Revenue', value: totalRevenue, strong: true },
      { label: 'Cost of Goods Sold', value: cogs, negative: true },
      { label: 'Gross Profit', value: grossProfit, strong: true },
      { label: 'Operating Expenses', value: operatingExpense, negative: true },
      { label: 'Depreciation', value: depreciation, negative: true },
      { label: 'Operating Profit', value: operatingProfit, strong: true },
      { label: 'Net Profit', value: netIncome, strong: true },
    ];

    // ── Alerts ──
    const alerts: AlertItem[] = [];
    if (overdueCount > 0) {
      alerts.push({
        id: 'ar-overdue',
        title: `${overdueCount} Overdue Receivables`,
        detail: `${money(arOverdue)} past due — follow up with customers.`,
        severity: 'critical',
        page: 'Sales & Customers.Customer Aging',
      });
    }
    if (overdueBills > 0) {
      alerts.push({
        id: 'ap-overdue',
        title: `${overdueBills} Overdue Payables`,
        detail: `${money(apOverdue)} due to vendors.`,
        severity: 'warning',
        page: 'Procurement.Payables Aging',
      });
    }
    if (outOfStock > 0) {
      alerts.push({
        id: 'stock-out',
        title: `${outOfStock} Items Out of Stock`,
        detail: 'Reorder immediately to avoid stockouts.',
        severity: 'critical',
        page: 'Assets & Inventory.Assets & Inventory Workspace',
      });
    }
    if (lowStock > 0) {
      alerts.push({
        id: 'stock-low',
        title: `${lowStock} Items Below Reorder Point`,
        detail: 'Inventory levels are running low.',
        severity: 'warning',
        page: 'Assets & Inventory.Assets & Inventory Workspace',
      });
    }
    const unreconciled = bankTx.filter((t) => !t.reconciled).length;
    if (unreconciled > 0) {
      alerts.push({
        id: 'bank-recon',
        title: `${unreconciled} Unreconciled Bank Transactions`,
        detail: 'Run bank reconciliation to match statements.',
        severity: 'info',
        page: 'Banking & Payments.Bank Reconciliation',
      });
    }
    const unposted = entries.filter((e) => e.status && e.status !== 'Posted').length;
    if (unposted > 0) {
      alerts.push({
        id: 'journals',
        title: `${unposted} Unposted Journal Entries`,
        detail: 'Review and post pending journal entries.',
        severity: 'info',
        page: 'Accounting.Journal Entries',
      });
    }
    const drafts = estimates.filter((e) => e.status === 'Draft').length;
    if (drafts > 0) {
      alerts.push({
        id: 'estimates',
        title: `${drafts} Draft Estimates`,
        detail: 'Send outstanding estimates to customers.',
        severity: 'info',
        page: 'Sales & Customers.Estimates & Quotes',
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        id: 'clear',
        title: 'All Clear',
        detail: 'No critical issues require attention.',
        severity: 'success',
        page: '',
      });
    }

    // ── Controls ──
    const controls = {
      trialBalance: accounts.length,
      bankRecon: reconciliations.length || bankAccounts.length,
      arRecon: openInvoices.length,
      apRecon: unpaidBills.length,
      unpostedJournals: unposted,
      period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };

    const counts = {
      customers: customers.length,
      vendors: vendors.length,
      banks: bankAccounts.length,
      products: products.length,
      employees: employees.length,
      invoices: invoices.length,
      branches: warehouses.length,
    };

    return {
      loading,
      asOf: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      cashBank,
      revenue: totalRevenue,
      grossProfit,
      netProfit: netIncome,
      arTotal,
      apTotal,
      inventoryValue: stockValue,
      workingCapital,
      kpiDeltas: {
        cashBank: deltaFor('profit'),
        revenue: deltaFor('revenue'),
        grossProfit: null,
        netProfit: deltaFor('profit'),
        arTotal: null,
        apTotal: null,
        inventoryValue: null,
        workingCapital: null,
      },
      series,
      salesMonthly,
      purchaseMonthly,
      cashOpening,
      cashInflows,
      cashOutflows,
      cashClosing,
      cashFlowSplit,
      pnl,
      equation,
      arAging,
      apAging,
      topCustomers,
      topVendors,
      arOverdue,
      apOverdue,
      overdueCount,
      overdueBills,
      openInvoiceCount: openInvoices.length,
      unpaidBillCount: unpaidBills.length,
      stockValue,
      stockItems: new Set(stockLevels.map((l) => l.productId)).size,
      lowStock,
      outOfStock,
      stockStatus,
      topCategories,
      recentTxns,
      invoiceStatus,
      poStatus,
      topExpenses,
      profitability,
      avgDaysOutstanding: Math.round(avgDaysOutstanding),
      avgDaysPayable: Math.round(avgDaysPayable),
      alerts: alerts.slice(0, 7),
      controls,
      counts,
    };
  }, [
    accounts,
    entries,
    invoices,
    receipts,
    estimates,
    bills,
    orders,
    bankTx,
    bankAccounts,
    cashAccounts,
    reconciliations,
    stockLevels,
    warehouses,
    customers,
    vendors,
    products,
    employees,
    fyYear,
    loading,
    now,
  ]);

  return { ...data, refresh } as FinancialData & { refresh: () => void };
}

export type FinancialDataWithRefresh = ReturnType<typeof useFinancialData>;
