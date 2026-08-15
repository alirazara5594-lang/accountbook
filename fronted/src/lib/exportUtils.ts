// Shared export & upload utilities for list views.
// CSV via Blob, Excel via HTML-table workbook (.xls), PDF via jsPDF.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportRow = (string | number | boolean | null | undefined)[];

const strip = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  return String(v);
};

const quote = (v: unknown): string => `"${strip(v).replace(/"/g, '""')}"`;

function triggerDownload(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function downloadCSV(filename: string, headers: string[], rows: ExportRow[]) {
  const csv = [headers, ...rows].map(r => r.map(quote).join(',')).join('\r\n');
  triggerDownload('\uFEFF' + csv, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/** Generates a real Excel-compatible .xls workbook from an HTML table. */
export function downloadExcel(filename: string, _sheetName: string, headers: string[], rows: ExportRow[]) {
  const esc = (v: unknown) => strip(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const head = headers.map(h => `<th style="background:#143e2b;color:#fff;font-weight:bold;border:1px solid #cbd5e1;padding:6px 10px;">${esc(h)}</th>`).join('');
  const body = rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #cbd5e1;padding:6px 10px;${typeof c === 'number' ? 'text-align:right;' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('');
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const base = filename.endsWith('.xls') ? filename.slice(0, -4) : filename;
  triggerDownload(html, `${base}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
}

/** Generates a real .pdf file and downloads it directly. */
export function downloadPDF(title: string, subtitle: string, headers: string[], rows: ExportRow[], totals?: { label: string; value: unknown }[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(18);
  doc.setTextColor(20, 62, 43);
  doc.text(title, 14, 16);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 14, 22);

  // Date
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);

  // Table
  const bodyRows = rows.map(r => r.map(c => (c === null || c === undefined) ? '' : String(c)));
  autoTable(doc, {
    startY: 30,
    head: [headers],
    body: bodyRows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [20, 62, 43], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: 14, right: 14 },
  });

  // Totals
  if (totals && totals.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || 30;
    let y = finalY + 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    totals.forEach(t => {
      doc.text(`${t.label}: ${strip(t.value)}`, 14, y);
      y += 5;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 8);
  }

  const base = title.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_').toLowerCase() || 'report';
  doc.save(`${base}.pdf`);
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  /** Parsed rows for CSV/TSV uploads. */
  rows?: ExportRow[];
  /** Raw text for CSV/TSV; metadata only for binary formats (xls, xlsx, pdf, images...). */
  text?: string;
}

/**
 * Reads a file of any type (pdf, xls/xlsx, csv, images, zip...).
 * CSV/TSV files are parsed into rows; other formats return their metadata.
 * The caller decides what to do with binary formats (e.g. POST as multipart).
 */
export function readUploadedFile(file: File): Promise<UploadedFile> {
  return new Promise((resolve) => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isTabular = ext === 'csv' || ext === 'tsv';
    if (!isTabular) {
      resolve({ name: file.name, size: file.size, type: file.type });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      const sep = ext === 'tsv' ? '\t' : ',';
      const rows = text
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .filter(l => l.trim().length > 0)
        .map(line => {
          const re = new RegExp(`${sep}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
          return line.split(re).map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
        });
      resolve({ name: file.name, size: file.size, type: file.type, rows, text });
    };
    reader.onerror = () => resolve({ name: file.name, size: file.size, type: file.type });
    reader.readAsText(file);
  });
}
