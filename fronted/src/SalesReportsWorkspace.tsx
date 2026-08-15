import { useEffect, useMemo } from 'react';
import { useReportsStore } from './stores/useReportsStore';
import { useSalesStore } from './stores';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, DollarSign, TrendingUp, TrendingDown, FileText, Download } from 'lucide-react';

type Props = { activeEntityId: string };

function SalesReportsWorkspace({ activeEntityId }: Props) {
  const { balanceSheet, fetchBalanceSheet } = useReportsStore();
  const invoices = useSalesStore((s) => s.invoices);
  const fetchInvoices = useSalesStore((s) => s.fetchInvoices);

  useEffect(() => {
    fetchBalanceSheet({ entityId: activeEntityId });
    fetchInvoices(activeEntityId);
  }, [activeEntityId]);

  const fmt = (n?: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

  // Compute sales metrics from invoices
  const metrics = useMemo(() => {
    const totalSales = invoices.reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const totalPaid = invoices.filter((i: any) => i.status === 2).reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const totalOutstanding = invoices.filter((i: any) => i.status !== 2 && i.status !== 3).reduce((s: number, i: any) => s + (i.amountDue || 0), 0);
    const totalDraft = invoices.filter((i: any) => i.status === 0).length;
    const totalInvoices = invoices.length;
    const avgInvoice = totalInvoices > 0 ? totalSales / totalInvoices : 0;
    const grossProfit = balanceSheet?.grossProfit || 0;
    const netIncome = balanceSheet?.netIncome || 0;
    const cogs = balanceSheet?.cogs || 0;
    const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    return { totalSales, totalPaid, totalOutstanding, totalDraft, totalInvoices, avgInvoice, grossProfit, netIncome, cogs, grossMargin };
  }, [invoices, balanceSheet]);

  // Monthly sales data for chart
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; sales: number; paid: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    invoices.forEach((inv: any) => {
      const d = inv.invoiceDate || inv.date || '';
      if (d) {
        const key = d.slice(0, 7);
        if (!months[key]) months[key] = { month: monthNames[parseInt(key.slice(5, 7)) - 1] || key, sales: 0, paid: 0 };
        months[key].sales += inv.totalAmount || 0;
        if (inv.status === 2) months[key].paid += inv.totalAmount || 0;
      }
    });

    return Object.values(months).slice(-6);
  }, [invoices]);

  // Status breakdown for pie chart
  const statusData = useMemo(() => {
    const statuses: Record<string, number> = { Draft: 0, Sent: 0, Paid: 0, Void: 0, 'Partially Paid': 0, Overdue: 0 };
    const labels = ['Draft', 'Sent', 'Paid', 'Void', 'Partly Paid', 'Overdue'];
    invoices.forEach((inv: any) => {
      const label = labels[inv.status] || 'Draft';
      statuses[label] = (statuses[label] || 0) + 1;
    });
    return Object.entries(statuses)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [invoices]);

  const COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#f97316'];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="text-lg">📊</span> Sales Reports
          </h1>
          <p className="text-gray-500 text-[10px] mt-0.5">Sales performance metrics, revenue analysis, and profitability insights.</p>
        </div>
        <button className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 shrink-0">
          <Download className="w-3.5 h-3.5" /> Export PDF
        </button>
      </div>

      {/* KPI Stats */}
      <section className="stats">
        <article>
          <span className="stat-icon blue"><DollarSign className="w-4 h-4" /></span>
          <div>
            <small>TOTAL REVENUE</small>
            <h2>{fmt(metrics.totalSales)}</h2>
            <p>Gross sales this period</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal"><TrendingUp className="w-4 h-4" /></span>
          <div>
            <small>GROSS PROFIT</small>
            <h2>{fmt(metrics.grossProfit)}</h2>
            <p>{metrics.grossMargin.toFixed(1)}% margin</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet"><FileText className="w-4 h-4" /></span>
          <div>
            <small>NET INCOME</small>
            <h2>{fmt(metrics.netIncome)}</h2>
            <p>After expenses</p>
          </div>
        </article>
        <article>
          <span className="stat-icon blue"><BarChart3 className="w-4 h-4" /></span>
          <div>
            <small>AVG INVOICE</small>
            <h2>{fmt(metrics.avgInvoice)}</h2>
            <p>{metrics.totalInvoices} invoices total</p>
          </div>
        </article>
      </section>

      {/* Secondary Stats */}
      <section className="stats">
        <article>
          <span className="stat-icon teal"><TrendingUp className="w-4 h-4" /></span>
          <div>
            <small>COLLECTED</small>
            <h2>{fmt(metrics.totalPaid)}</h2>
            <p>Paid invoices</p>
          </div>
        </article>
        <article>
          <span className="stat-icon blue"><DollarSign className="w-4 h-4" /></span>
          <div>
            <small>OUTSTANDING</small>
            <h2>{fmt(metrics.totalOutstanding)}</h2>
            <p>Amount due</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet"><FileText className="w-4 h-4" /></span>
          <div>
            <small>DRAFT INVOICES</small>
            <h2>{metrics.totalDraft}</h2>
            <p>Awaiting posting</p>
          </div>
        </article>
        <article>
          <span className="stat-icon blue"><TrendingDown className="w-4 h-4" /></span>
          <div>
            <small>COGS</small>
            <h2>{fmt(metrics.cogs)}</h2>
            <p>Cost of goods sold</p>
          </div>
        </article>
      </section>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Sales Chart */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-700 mb-3">Monthly Sales Trend</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => fmt(Number(value))} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Sales" />
                <Bar dataKey="paid" fill="#10b981" radius={[4, 4, 0, 0]} name="Paid" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-xs">No sales data available</div>
          )}
        </div>

        {/* Status Breakdown Chart */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-700 mb-3">Invoice Status Breakdown</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-xs">No invoices yet</div>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-700">Profitability Summary</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Metric</th>
              <th className="py-2.5 px-4 text-right">Amount</th>
              <th className="py-2.5 px-4 text-right">% of Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50/50">
              <td className="py-2.5 px-4 font-medium text-gray-900">Total Revenue</td>
              <td className="py-2.5 px-4 text-right font-bold text-blue-600">{fmt(metrics.totalSales)}</td>
              <td className="py-2.5 px-4 text-right text-gray-500">100%</td>
            </tr>
            <tr className="hover:bg-gray-50/50">
              <td className="py-2.5 px-4 font-medium text-gray-900">Cost of Goods Sold</td>
              <td className="py-2.5 px-4 text-right font-bold text-red-600">({fmt(metrics.cogs)})</td>
              <td className="py-2.5 px-4 text-right text-gray-500">{metrics.totalSales > 0 ? ((metrics.cogs / metrics.totalSales) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr className="hover:bg-gray-50/50 bg-gray-50/30">
              <td className="py-2.5 px-4 font-bold text-gray-900">Gross Profit</td>
              <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{fmt(metrics.grossProfit)}</td>
              <td className="py-2.5 px-4 text-right font-semibold text-emerald-600">{metrics.grossMargin.toFixed(1)}%</td>
            </tr>
            <tr className="hover:bg-gray-50/50">
              <td className="py-2.5 px-4 font-medium text-gray-900">Operating Expenses</td>
              <td className="py-2.5 px-4 text-right font-bold text-orange-600">({fmt((metrics.grossProfit || 0) - (metrics.netIncome || 0))})</td>
              <td className="py-2.5 px-4 text-right text-gray-500">{metrics.totalSales > 0 ? (((metrics.grossProfit - metrics.netIncome) / metrics.totalSales) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr className="hover:bg-gray-50/50 bg-gray-50/30">
              <td className="py-2.5 px-4 font-bold text-gray-900">Net Income</td>
              <td className="py-2.5 px-4 text-right font-bold text-violet-600">{fmt(metrics.netIncome)}</td>
              <td className="py-2.5 px-4 text-right font-semibold text-violet-600">{metrics.totalSales > 0 ? ((metrics.netIncome / metrics.totalSales) * 100).toFixed(1) : 0}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SalesReportsWorkspace;
