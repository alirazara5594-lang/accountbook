import { useEffect, useMemo, useState } from 'react';
import { useReportsStore } from './stores/useReportsStore';
import { useCustomersStore } from './stores';
import { salesApi, type Invoice } from './api/modules/sales.api';
import { useCustomerPaymentsStore } from './stores/useCustomerPaymentsStore';
import { Users, DollarSign, TrendingUp, FileText, Download, ArrowLeft, Receipt } from 'lucide-react';
import { money } from './lib/currency';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type Props = { activeEntityId: string };

interface StatementLine {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

function CustomerStatementsWorkspace({ activeEntityId }: Props) {
  const { incomeStatement, loading, fetchIncomeStatement } = useReportsStore();
  const customers = useCustomersStore((s) => s.customers as any[]);
  const { payments, fetchAll: fetchPayments } = useCustomerPaymentsStore();
  const [query, setQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchIncomeStatement({ entityId: activeEntityId });
    fetchPayments(activeEntityId);
  }, [activeEntityId]);

  useEffect(() => {
    if (selectedCustomer) {
      salesApi.getInvoices(activeEntityId).then(inv => {
        setInvoices(inv.filter(i => i.customerId === selectedCustomer.customerId));
      });
    }
  }, [selectedCustomer, activeEntityId]);

  const fmt = (n?: number) => money(n || 0);

  const balances = useMemo(() => incomeStatement?.customerBalances || [], [incomeStatement]);

  const filteredBalances = useMemo(() => {
    if (!query.trim()) return balances;
    const q = query.toLowerCase();
    return balances.filter((b: any) =>
      (b.customerName || b.customerId || '').toLowerCase().includes(q)
    );
  }, [balances, query]);

  const totalOutstanding = filteredBalances.reduce((s: number, b: any) => s + (b.outstandingBalance || 0), 0);
  const outstandingCount = filteredBalances.filter((b: any) => b.outstandingBalance > 0).length;
  const currentCount = filteredBalances.filter((b: any) => b.outstandingBalance <= 0).length;

  // Build statement lines for selected customer
  const statementLines = useMemo(() => {
    if (!selectedCustomer) return [];

    const lines: StatementLine[] = [];

    // Add invoices as debits
    invoices.forEach(inv => {
      if (inv.status !== 'Void') {
        lines.push({
          date: inv.date || '',
          description: `Invoice ${inv.invoiceNumber}`,
          reference: inv.invoiceNumber || '',
          debit: inv.totalAmount || 0,
          credit: 0,
          balance: 0,
        });
      }
    });

    // Add payments as credits
    payments
      .filter((p: any) => p.customerId === selectedCustomer.customerId)
      .forEach((p: any) => {
        lines.push({
          date: p.date || p.paymentDate || '',
          description: `Payment ${p.receiptNumber || ''}`,
          reference: p.receiptNumber || '',
          debit: 0,
          credit: p.amount || 0,
          balance: 0,
        });
      });

    // Sort by date
    lines.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate opening balance (transactions before dateFrom)
    let openingBal = 0;
    if (dateFrom) {
      lines.forEach(l => {
        if (l.date < dateFrom) {
          openingBal += l.debit - l.credit;
        }
      });
    }

    // Apply date filter
    const filtered = lines.filter(l => {
      if (dateFrom && l.date < dateFrom) return false;
      if (dateTo && l.date > dateTo) return false;
      return true;
    });

    // Calculate running balance starting from opening balance
    let runningBalance = openingBal;
    filtered.forEach(line => {
      runningBalance += line.debit - line.credit;
      line.balance = runningBalance;
    });

    return filtered;
  }, [selectedCustomer, invoices, payments, dateFrom, dateTo]);

  // Calculate opening balance (transactions before dateFrom)
  const openingBalance = useMemo(() => {
    if (!selectedCustomer || !dateFrom) return 0;
    let bal = 0;
    invoices.forEach(inv => {
      if (inv.status !== 'Void' && inv.date && inv.date < dateFrom) {
        bal += inv.totalAmount || 0;
      }
    });
    payments
      .filter((p: any) => p.customerId === selectedCustomer.customerId)
      .forEach((p: any) => {
        const pDate = p.date || p.paymentDate || '';
        if (pDate && pDate < dateFrom) {
          bal -= p.amount || 0;
        }
      });
    return bal;
  }, [selectedCustomer, invoices, payments, dateFrom]);

  const closingBalance = statementLines.length > 0 ? statementLines[statementLines.length - 1].balance : openingBalance;
  const totalDebits = statementLines.reduce((s, l) => s + l.debit, 0);
  const totalCredits = statementLines.reduce((s, l) => s + l.credit, 0);

  // PDF Download
  const downloadStatement = () => {
    if (!selectedCustomer) return;

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Colors
    const primaryBlue: [number, number, number] = [30, 64, 175];
    const lightGray: [number, number, number] = [243, 244, 246];
    const darkText: [number, number, number] = [31, 41, 55];
    const mediumGray: [number, number, number] = [107, 114, 128];

    // Header background
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER STATEMENT', margin, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, 18, { align: 'right' });

    // Customer Info Box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 42, pageWidth - 2 * margin, 25, 2, 2, 'F');

    doc.setTextColor(...darkText);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer:', margin + 5, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(selectedCustomer.customerName || selectedCustomer.customerId, margin + 30, 52);

    doc.setFont('helvetica', 'bold');
    doc.text('Statement Period:', margin + 5, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`${dateFrom || 'Beginning'} to ${dateTo}`, margin + 40, 60);

    // Summary Cards
    const cardY = 72;
    const cardWidth = (pageWidth - 2 * margin - 20) / 4;
    const cardHeight = 22;
    const cards = [
      { label: 'OPENING BALANCE', value: fmt(openingBalance), color: [107, 114, 128] },
      { label: 'TOTAL DEBITS', value: fmt(totalDebits), color: [220, 38, 38] },
      { label: 'TOTAL CREDITS', value: fmt(totalCredits), color: [5, 150, 105] },
      { label: 'CLOSING BALANCE', value: fmt(closingBalance), color: primaryBlue },
    ];

    cards.forEach((card, i) => {
      const x = margin + i * (cardWidth + 7);
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'F');

      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(card.label, x + 5, cardY + 8);

      doc.setTextColor(card.color[0], card.color[1], card.color[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + 5, cardY + 16);
    });

    // Transaction Table
    const tableStartY = cardY + cardHeight + 8;
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSACTION DETAILS', margin, tableStartY);

    if (statementLines.length > 0) {
      const headerRow = [
        { content: 'DATE', styles: { fontStyle: 'bold', textColor: [255, 255, 255] } },
        { content: 'DESCRIPTION', styles: { fontStyle: 'bold', textColor: [255, 255, 255] } },
        { content: 'REFERENCE', styles: { fontStyle: 'bold', textColor: [255, 255, 255] } },
        { content: 'DEBIT', styles: { fontStyle: 'bold', textColor: [255, 255, 255], halign: 'right' } },
        { content: 'CREDIT', styles: { fontStyle: 'bold', textColor: [255, 255, 255], halign: 'right' } },
        { content: 'BALANCE', styles: { fontStyle: 'bold', textColor: [255, 255, 255], halign: 'right' } },
      ];

      const bodyRows = statementLines.map((l) => [
        { content: l.date, styles: { textColor: darkText } },
        { content: l.description, styles: { textColor: darkText } },
        { content: l.reference, styles: { textColor: mediumGray, fontSize: 8 } },
        { content: l.debit > 0 ? fmt(l.debit) : '—', styles: { textColor: l.debit > 0 ? ([220, 38, 38] as [number, number, number]) : mediumGray, halign: 'right' as const } },
        { content: l.credit > 0 ? fmt(l.credit) : '—', styles: { textColor: l.credit > 0 ? ([5, 150, 105] as [number, number, number]) : mediumGray, halign: 'right' as const } },
        { content: fmt(l.balance), styles: { textColor: darkText, fontStyle: 'bold' as const, halign: 'right' as const } },
      ]);

      // Add totals row
      bodyRows.push([
        { content: '', styles: { textColor: darkText } },
        { content: '', styles: { textColor: darkText } },
        { content: 'TOTALS', styles: { fontStyle: 'bold' as const, textColor: darkText, halign: 'right' as const } },
        { content: fmt(totalDebits), styles: { fontStyle: 'bold' as const, textColor: [220, 38, 38] as [number, number, number], halign: 'right' as const } },
        { content: fmt(totalCredits), styles: { fontStyle: 'bold' as const, textColor: [5, 150, 105] as [number, number, number], halign: 'right' as const } },
        { content: fmt(closingBalance), styles: { fontStyle: 'bold' as const, textColor: primaryBlue, halign: 'right' as const } },
      ]);

      (doc as any).autoTable({
        startY: tableStartY + 5,
        head: [headerRow],
        body: bodyRows,
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: darkText,
        },
        headStyles: {
          fillColor: primaryBlue,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 55 },
          2: { cellWidth: 30 },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' },
          5: { cellWidth: 35, halign: 'right' },
        },
        margin: { left: margin, right: margin },
      });
    }

    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, finalY + 8, pageWidth - margin, finalY + 8);

    doc.setTextColor(...mediumGray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This statement is generated for your records.', margin, finalY + 14);
    doc.text('Thank you for your business!', pageWidth - margin, finalY + 14, { align: 'right' });

    // Save
    doc.save(`Statement-${selectedCustomer.customerName || selectedCustomer.customerId}-${dateTo}.pdf`);
  };

  // If customer is selected, show detailed statement view
  if (selectedCustomer) {
    return (
      <div className="p-4 max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <span className="text-lg">📄</span> {selectedCustomer.customerName || selectedCustomer.customerId}
              </h1>
              <p className="text-gray-500 text-[10px] mt-0.5">Customer account statement with debit/credit transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="h-8 px-2 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-700 outline-none"
              placeholder="From"
            />
            <span className="text-gray-400 text-[10px]">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="h-8 px-2 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-700 outline-none"
            />
            <button
              onClick={downloadStatement}
              className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Opening Balance</p>
            <p className="text-base font-bold text-gray-900 mt-0.5">{fmt(openingBalance)}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Debits</p>
            <p className="text-base font-bold text-blue-600 mt-0.5">{fmt(totalDebits)}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Credits</p>
            <p className="text-base font-bold text-emerald-600 mt-0.5">{fmt(totalCredits)}</p>
          </div>
          <div className={`p-3 rounded-xl border ${closingBalance > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Closing Balance</p>
            <p className={`text-base font-bold mt-0.5 ${closingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{fmt(closingBalance)}</p>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Reference</th>
                <th className="py-2.5 px-4 text-right">Debit</th>
                <th className="py-2.5 px-4 text-right">Credit</th>
                <th className="py-2.5 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statementLines.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📄</span>
                      <p className="text-sm font-semibold">No transactions in this period</p>
                    </div>
                  </td>
                </tr>
              )}
              {statementLines.map((line, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2.5 px-4 text-gray-600">{line.date}</td>
                  <td className="py-2.5 px-4 font-medium text-gray-900">{line.description}</td>
                  <td className="py-2.5 px-4 text-gray-500 text-[11px]">{line.reference}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-red-600">
                    {line.debit > 0 ? fmt(line.debit) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-emerald-600">
                    {line.credit > 0 ? fmt(line.credit) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-gray-900">{fmt(line.balance)}</td>
                </tr>
              ))}
            </tbody>
            {statementLines.length > 0 && (
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={3} className="py-2.5 px-4 font-bold text-gray-700">Totals</td>
                  <td className="py-2.5 px-4 text-right font-bold text-red-600">{fmt(totalDebits)}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{fmt(totalCredits)}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-gray-900">{fmt(closingBalance)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  }

  // Main customer list view
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="text-lg">📊</span> Customer Statements
          </h1>
          <p className="text-gray-500 text-[10px] mt-0.5">Select a customer to view their account statement with debit/credit transactions.</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search customer..."
              className="h-8 w-48 pl-7 pr-2 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-700 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="stats">
        <article>
          <span className="stat-icon blue"><Users className="w-4 h-4" /></span>
          <div>
            <small>TOTAL CUSTOMERS</small>
            <h2>{customers.length}</h2>
            <p>Registered customers</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal"><DollarSign className="w-4 h-4" /></span>
          <div>
            <small>TOTAL OUTSTANDING</small>
            <h2>{fmt(totalOutstanding)}</h2>
            <p>Amount due from customers</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet"><TrendingUp className="w-4 h-4" /></span>
          <div>
            <small>OUTSTANDING ACCOUNTS</small>
            <h2>{outstandingCount}</h2>
            <p>Customers with balance</p>
          </div>
        </article>
        <article>
          <span className="stat-icon blue"><FileText className="w-4 h-4" /></span>
          <div>
            <small>CURRENT ACCOUNTS</small>
            <h2>{currentCount}</h2>
            <p>Fully paid customers</p>
          </div>
        </article>
      </section>

      {/* Customer Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Customer</th>
              <th className="py-2.5 px-4 text-right">Outstanding Balance</th>
              <th className="py-2.5 px-4 text-center">Status</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">⏳</span>
                    <p className="text-sm font-semibold">Loading statements...</p>
                  </div>
                </td>
              </tr>
            )}
            {!loading && filteredBalances.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📊</span>
                    <p className="text-sm font-semibold">No customer balances found</p>
                  </div>
                </td>
              </tr>
            )}
            {!loading && filteredBalances.map((balance: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedCustomer(balance)}>
                <td className="py-2.5 px-4 font-medium text-gray-900">{balance.customerName || balance.customerId}</td>
                <td className="py-2.5 px-4 text-right font-bold text-gray-900">{fmt(balance.outstandingBalance)}</td>
                <td className="py-2.5 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    balance.outstandingBalance > 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {balance.outstandingBalance > 0 ? 'Outstanding' : 'Current'}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <button className="h-6 px-2 text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1 ml-auto">
                    <Receipt className="w-3 h-3" /> View Statement
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CustomerStatementsWorkspace;
