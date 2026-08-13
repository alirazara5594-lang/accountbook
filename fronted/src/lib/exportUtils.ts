// Shared export & upload utilities for list views.
// Dependency-free: CSV via Blob, Excel via an HTML-table workbook (.xls)
// that Excel/Sheets open natively, and PDF via a print-optimised window.

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

/** Opens a print-optimised window; user picks "Save as PDF" in the print dialog. */
export function downloadPDF(title: string, subtitle: string, headers: string[], rows: ExportRow[], totals?: { label: string; value: unknown }[]) {
  const esc = (v: unknown) => strip(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const head = headers.map(h => `<th>${esc(h)}</th>`).join('');
  const body = rows.map(r => `<tr>${r.map(c => `<td${typeof c === 'number' ? ' class="num"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('');
  const totalRows = (totals || []).map(t => `<tr><td colspan="${Math.max(1, headers.length - 1)}" class="tot-label">${esc(t.label)}</td><td class="tot-value num">${esc(t.value)}</td></tr>`).join('');
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${esc(title)}</title><style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 28px; }
    h1 { font-size: 20px; margin: 0 0 2px; color: #143e2b; }
    p { font-size: 12px; color: #64748b; margin: 0 0 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #143e2b; color: #fff; text-align: left; padding: 7px 10px; }
    td { border: 1px solid #cbd5e1; padding: 6px 10px; }
    td.num, th { font-variant-numeric: tabular-nums; }
    td.num { text-align: right; }
    tfoot td { font-weight: 700; background: #f1f5f9; border-top: 2px solid #143e2b; }
    .tot-label { text-align: right; }
    .meta { display:flex; justify-content:space-between; font-size:11px; color:#64748b; margin-bottom:14px; }
    @media print { body { margin: 12mm; } }
  </style></head><body>
    <h1>${esc(title)}</h1><p>${esc(subtitle)}</p>
    <div class="meta"><span>Generated: ${new Date().toLocaleString()}</span><span>Zenabook</span></div>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody><tfoot>${totalRows}</tfoot></table>
    <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };<\/script>
  </body></html>`);
  w.document.close();
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