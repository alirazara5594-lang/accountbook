import { useEffect, useMemo, useState } from 'react';
import { useSalesStore, useCustomersStore } from './stores';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, DollarSign, AlertTriangle, Clock, FileSpreadsheet, FileText, ArrowLeft, Search } from 'lucide-react';
import { downloadExcel } from './lib/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Props = { activeEntityId: string };

const BUCKETS = ['Current', '1-30', '31-60', '61-90', '90+'] as const;
const BUCKET_COLORS: Record<string, string> = {
  Current: '#10b981',
  '1-30': '#f59e0b',
  '31-60': '#f97316',
  '61-90': '#ef4444',
  '90+': '#dc2626',
};

function agingBucket(dueDate: string): string {
  if (!dueDate) return 'Current';
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.floor((now.getTime() - due.getTime()) / 86400000);
  if (diffDays <= 0) return 'Current';
  if (diffDays <= 30) return '1-30';
  if (diffDays <= 60) return '31-60';
  if (diffDays <= 90) return '61-90';
  return '90+';
}

function CustomerAgingWorkspace({ activeEntityId }: Props) {
  const invoices = useSalesStore((s) => s.invoices);
  const fetchInvoices = useSalesStore((s) => s.fetchInvoices);
  const fetchCustomers = useCustomersStore((s) => s.fetchCustomers);
  const [query, setQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices(activeEntityId);
    fetchCustomers(activeEntityId);
  }, [activeEntityId]);

  const fmt = (n?: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

  // Compute aging per customer
  const customerAging = useMemo(() => {
    const map: Record<string, {
      customerId: string;
      customerName: string;
      outstanding: number;
      buckets: Record<string, number>;
      oldestDays: number;
    }> = {};

    const openInvoices = invoices.filter((i: any) => i.status !== 2 && i.status !== 3 && (i.amountDue || 0) > 0);

    openInvoices.forEach((inv: any) => {
      const cid = inv.customerId || 'unknown';
      if (!map[cid]) {
        map[cid] = {
          customerId: cid,
          customerName: inv.customerName || cid,
          outstanding: 0,
          buckets: { Current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
          oldestDays: 0,
        };
      }
      const bucket = agingBucket(inv.dueDate);
      map[cid].outstanding += inv.amountDue || 0;
      map[cid].buckets[bucket] += inv.amountDue || 0;

      const now = new Date();
      const due = new Date(inv.dueDate || now);
      const days = Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86400000));
      if (days > map[cid].oldestDays) map[cid].oldestDays = days;
    });

    return Object.values(map).sort((a, b) => b.outstanding - a.outstanding);
  }, [invoices]);

  const filteredCustomerAging = useMemo(() => {
    if (!query.trim()) return customerAging;
    const q = query.toLowerCase();
    return customerAging.filter(c => c.customerName.toLowerCase().includes(q) || c.customerId.toLowerCase().includes(q));
  }, [customerAging, query]);

  // Selected customer details
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customerAging.find(c => c.customerId === selectedCustomerId) || null;
  }, [selectedCustomerId, customerAging]);

  const customerOpenInvoices = useMemo(() => {
    if (!selectedCustomerId) return [];
    const open = invoices.filter((i: any) =>
      i.customerId === selectedCustomerId &&
      i.status !== 2 &&
      i.status !== 3 &&
      (i.amountDue || 0) > 0
    );
    return open.map((inv: any) => {
      const bucket = agingBucket(inv.dueDate);
      const now = new Date();
      const due = new Date(inv.dueDate || now);
      const daysPastDue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86400000));
      return {
        ...inv,
        bucket,
        daysPastDue,
      };
    }).sort((a: any, b: any) => b.daysPastDue - a.daysPastDue);
  }, [selectedCustomerId, invoices]);

  // Summary stats
  const totalOutstanding = customerAging.reduce((s, c) => s + c.outstanding, 0);
  const totalCustomers = customerAging.length;
  const overdueAmount = customerAging.reduce((s, c) => s + c.buckets['1-30'] + c.buckets['31-60'] + c.buckets['61-90'] + c.buckets['90+'], 0);
  const criticalCount = customerAging.filter(c => c.buckets['90+'] > 0).length;

  // Bucket totals
  const bucketTotals = useMemo(() => {
    const totals: Record<string, number> = { Current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    customerAging.forEach(c => {
      BUCKETS.forEach(b => { totals[b] += c.buckets[b]; });
    });
    return totals;
  }, [customerAging]);

  // Chart data
  const chartData = BUCKETS.map(b => ({
    name: b === 'Current' ? 'Current' : b + ' Days',
    value: bucketTotals[b],
    fill: BUCKET_COLORS[b],
  }));

  // Download per customer PDF
  const downloadCustomerPDF = (c: typeof customerAging[0]) => {
    const customerInvs = invoices.filter((i: any) =>
      i.customerId === c.customerId &&
      i.status !== 2 &&
      i.status !== 3 &&
      (i.amountDue || 0) > 0
    );

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Header banner
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER AGING REPORT', margin, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Entity: ${activeEntityId}  |  Generated: ${new Date().toLocaleDateString()}`, margin, 22);

    // Customer Info Card
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Customer: ${c.customerName}`, margin, 36);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Outstanding: ${fmt(c.outstanding)}`, margin, 42);

    // Aging Buckets Summary Table
    const bucketHeaders = ['Current (Not Due)', '1 - 30 Days', '31 - 60 Days', '61 - 90 Days', '90+ Days (Critical)', 'Total Due'];
    const bucketRow = [
      fmt(c.buckets.Current),
      fmt(c.buckets['1-30']),
      fmt(c.buckets['31-60']),
      fmt(c.buckets['61-90']),
      fmt(c.buckets['90+']),
      fmt(c.outstanding),
    ];

    autoTable(doc, {
      startY: 47,
      head: [bucketHeaders],
      body: [bucketRow],
      styles: { fontSize: 8, cellPadding: 3, halign: 'right' },
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold', halign: 'right' },
      margin: { left: margin, right: margin },
    });

    // Invoices breakdown
    const invHeaders = ['Invoice #', 'Date', 'Due Date', 'Days Overdue', 'Aging Bucket', 'Total Amount', 'Paid', 'Amount Due'];
    const invRows = customerInvs.map((i: any) => {
      const b = agingBucket(i.dueDate);
      const now = new Date();
      const due = new Date(i.dueDate || now);
      const days = Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86400000));
      return [
        i.invoiceNumber || '-',
        i.invoiceDate || i.date || '-',
        i.dueDate || '-',
        days > 0 ? `${days} d` : '0 d',
        b === 'Current' ? 'Current' : `${b} Days`,
        fmt(i.totalAmount || 0),
        fmt(i.amountPaid || 0),
        fmt(i.amountDue || 0),
      ];
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 65;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Outstanding Invoices Breakdown', margin, finalY + 8);

    autoTable(doc, {
      startY: finalY + 12,
      head: [invHeaders],
      body: invRows.length ? invRows : [['No open invoices found', '', '', '', '', '', '', '']],
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });

    const safeName = c.customerName.replace(/[^a-zA-Z0-9-_]/g, '_');
    doc.save(`Aging_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Download per customer Excel
  const downloadCustomerExcel = (c: typeof customerAging[0]) => {
    const customerInvs = invoices.filter((i: any) =>
      i.customerId === c.customerId &&
      i.status !== 2 &&
      i.status !== 3 &&
      (i.amountDue || 0) > 0
    );

    const headers = ['Invoice Number', 'Invoice Date', 'Due Date', 'Days Overdue', 'Aging Bucket', 'Total Amount', 'Amount Paid', 'Amount Due'];
    const rows = customerInvs.map((i: any) => {
      const b = agingBucket(i.dueDate);
      const now = new Date();
      const due = new Date(i.dueDate || now);
      const days = Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86400000));
      return [
        i.invoiceNumber || '',
        i.invoiceDate || i.date || '',
        i.dueDate || '',
        days,
        b,
        i.totalAmount || 0,
        i.amountPaid || 0,
        i.amountDue || 0,
      ];
    });

    const safeName = c.customerName.replace(/[^a-zA-Z0-9-_]/g, '_');
    downloadExcel(`Aging_${safeName}_${new Date().toISOString().slice(0, 10)}`, 'Customer Aging', headers, rows);
  };

  // View specific customer detailed report
  if (selectedCustomer) {
    return (
      <div className="p-4 max-w-7xl mx-auto space-y-4">
        {/* Detail Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCustomerId(null)}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Back to all customers"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <span className="text-lg">👤</span> {selectedCustomer.customerName}
              </h1>
              <p className="text-gray-500 text-[10px] mt-0.5">Receivables Aging & Overdue Invoices Breakdown</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => downloadCustomerExcel(selectedCustomer)}
              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={() => downloadCustomerPDF(selectedCustomer)}
              className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {/* Customer Aging Bucket Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Due</p>
            <p className="text-base font-bold text-gray-900 mt-0.5">{fmt(selectedCustomer.outstanding)}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
            <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Current</p>
            <p className="text-base font-bold text-emerald-600 mt-0.5">{fmt(selectedCustomer.buckets.Current)}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">1-30 Days</p>
            <p className="text-base font-bold text-amber-600 mt-0.5">{fmt(selectedCustomer.buckets['1-30'])}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-orange-200 bg-orange-50/20 shadow-sm">
            <p className="text-[10px] font-semibold text-orange-700 uppercase tracking-wider">31-60 Days</p>
            <p className="text-base font-bold text-orange-600 mt-0.5">{fmt(selectedCustomer.buckets['31-60'])}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-red-200 bg-red-50/20 shadow-sm">
            <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">61-90 Days</p>
            <p className="text-base font-bold text-red-600 mt-0.5">{fmt(selectedCustomer.buckets['61-90'])}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-red-300 bg-red-100/30 shadow-sm">
            <p className="text-[10px] font-semibold text-red-800 uppercase tracking-wider">90+ Days</p>
            <p className="text-base font-bold text-red-700 mt-0.5">{fmt(selectedCustomer.buckets['90+'])}</p>
          </div>
        </div>

        {/* Customer Open Invoices Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700">Open Invoices ({customerOpenInvoices.length})</h3>
            <span className="text-[11px] text-gray-500">Sorted by overdue days</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4 text-center">Days Overdue</th>
                  <th className="py-2.5 px-4 text-center">Bucket</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                  <th className="py-2.5 px-4 text-right">Paid</th>
                  <th className="py-2.5 px-4 text-right">Amount Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customerOpenInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-400">
                      No open invoices found for this customer.
                    </td>
                  </tr>
                )}
                {customerOpenInvoices.map((inv: any) => (
                  <tr key={inv.id || inv.invoiceNumber} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-gray-900">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-4 text-gray-600">{inv.invoiceDate || inv.date}</td>
                    <td className="py-2.5 px-4 text-gray-600">{inv.dueDate}</td>
                    <td className="py-2.5 px-4 text-center font-medium text-gray-700">
                      {inv.daysPastDue > 0 ? (
                        <span className="text-red-600 font-semibold">{inv.daysPastDue} days</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">On time</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        inv.bucket === 'Current' ? 'bg-emerald-100 text-emerald-700' :
                        inv.bucket === '1-30' ? 'bg-amber-100 text-amber-700' :
                        inv.bucket === '31-60' ? 'bg-orange-100 text-orange-700' :
                        inv.bucket === '61-90' ? 'bg-red-100 text-red-700' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {inv.bucket === 'Current' ? 'Current' : `${inv.bucket} Days`}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-600">{fmt(inv.totalAmount)}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-600">{fmt(inv.amountPaid || 0)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-red-600">{fmt(inv.amountDue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // All Customers Aging View
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="text-lg">📊</span> Receivables Aging
          </h1>
          <p className="text-gray-500 text-[10px] mt-0.5">Outstanding customer balances by age bucket. Click any customer to view details & download individual PDF/Excel.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search customer..."
              className="h-8 pl-8 pr-2.5 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-700 outline-none w-44 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <section className="stats">
        <article>
          <span className="stat-icon blue"><DollarSign className="w-4 h-4" /></span>
          <div>
            <small>TOTAL OUTSTANDING</small>
            <h2>{fmt(totalOutstanding)}</h2>
            <p>Amount due from customers</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal"><Users className="w-4 h-4" /></span>
          <div>
            <small>CUSTOMERS WITH BALANCE</small>
            <h2>{totalCustomers}</h2>
            <p>Active receivables</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet"><AlertTriangle className="w-4 h-4" /></span>
          <div>
            <small>OVERDUE AMOUNT</small>
            <h2>{fmt(overdueAmount)}</h2>
            <p>Past due date</p>
          </div>
        </article>
        <article>
          <span className="stat-icon blue"><Clock className="w-4 h-4" /></span>
          <div>
            <small>CRITICAL (90+ DAYS)</small>
            <h2>{criticalCount}</h2>
            <p>Customers over 90 days</p>
          </div>
        </article>
      </section>

      {/* Aging Breakdown Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xs font-bold text-gray-700 mb-3">Aging Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" width={80} />
            <Tooltip formatter={(value) => fmt(Number(value))} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Aging Summary Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-700">Aging Summary by Bucket</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Age Range</th>
              <th className="py-2.5 px-4 text-right">Amount</th>
              <th className="py-2.5 px-4 text-right">% of Total</th>
              <th className="py-2.5 px-4">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {BUCKETS.map(b => (
              <tr key={b} className="hover:bg-gray-50/50">
                <td className="py-2.5 px-4 font-medium text-gray-900">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BUCKET_COLORS[b] }}></span>
                    {b === 'Current' ? 'Current (Not Due)' : b + ' Days'}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-gray-900">{fmt(bucketTotals[b])}</td>
                <td className="py-2.5 px-4 text-right text-gray-500">{totalOutstanding > 0 ? ((bucketTotals[b] / totalOutstanding) * 100).toFixed(1) : 0}%</td>
                <td className="py-2.5 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    b === 'Current' ? 'bg-emerald-100 text-emerald-700' :
                    b === '1-30' ? 'bg-amber-100 text-amber-700' :
                    b === '31-60' ? 'bg-orange-100 text-orange-700' :
                    b === '61-90' ? 'bg-red-100 text-red-700' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {b === 'Current' ? 'Low' : b === '1-30' ? 'Medium' : b === '31-60' ? 'High' : 'Critical'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-700">Customer Aging Details</h3>
          <span className="text-[11px] text-gray-400">Click any row or export action to download</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4 text-right">Outstanding</th>
                <th className="py-2.5 px-4 text-right">Current</th>
                <th className="py-2.5 px-4 text-right">1-30 Days</th>
                <th className="py-2.5 px-4 text-right">31-60 Days</th>
                <th className="py-2.5 px-4 text-right">61-90 Days</th>
                <th className="py-2.5 px-4 text-right">90+ Days</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomerAging.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📊</span>
                      <p className="text-sm font-semibold">No outstanding receivables found</p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredCustomerAging.map((c, idx) => {
                const worstBucket = c.buckets['90+'] > 0 ? '90+' :
                  c.buckets['61-90'] > 0 ? '61-90' :
                  c.buckets['31-60'] > 0 ? '31-60' :
                  c.buckets['1-30'] > 0 ? '1-30' : 'Current';
                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedCustomerId(c.customerId)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-4 font-semibold text-gray-900 group-hover:text-blue-600 flex items-center gap-1.5">
                      {c.customerName}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-gray-900">{fmt(c.outstanding)}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-600">{fmt(c.buckets.Current)}</td>
                    <td className="py-2.5 px-4 text-right text-amber-600">{fmt(c.buckets['1-30'])}</td>
                    <td className="py-2.5 px-4 text-right text-orange-600">{fmt(c.buckets['31-60'])}</td>
                    <td className="py-2.5 px-4 text-right text-red-600">{fmt(c.buckets['61-90'])}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-red-700">{fmt(c.buckets['90+'])}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        worstBucket === 'Current' ? 'bg-emerald-100 text-emerald-700' :
                        worstBucket === '1-30' ? 'bg-amber-100 text-amber-700' :
                        worstBucket === '31-60' ? 'bg-orange-100 text-orange-700' :
                        worstBucket === '61-90' ? 'bg-red-100 text-red-700' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {worstBucket === 'Current' ? 'Current' :
                         worstBucket === '1-30' ? 'Overdue' :
                         worstBucket === '31-60' ? 'Delinquent' :
                         worstBucket === '61-90' ? 'Severe' : 'Critical'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => downloadCustomerExcel(c)}
                          className="h-6 px-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 flex items-center gap-1 transition-colors"
                          title="Download Excel"
                        >
                          <FileSpreadsheet className="w-3 h-3" /> XLS
                        </button>
                        <button
                          onClick={() => downloadCustomerPDF(c)}
                          className="h-6 px-2 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1 transition-colors"
                          title="Download PDF"
                        >
                          <FileText className="w-3 h-3" /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CustomerAgingWorkspace;
