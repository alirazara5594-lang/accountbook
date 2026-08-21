import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Search, Download, FileText, FileSpreadsheet, Printer, UploadCloud, RefreshCw, X } from 'lucide-react';
import { downloadCSV, downloadExcel, downloadPDF, readUploadedFile, type ExportRow } from '@/lib/exportUtils';

export interface DataToolbarProps {
  title?: string;
  query?: string;
  setQuery?: (v: string) => void;
  searchPlaceholder?: string;
  exportFileName?: string;
  exportSheetName?: string;
  exportTitle?: string;
  exportSubtitle?: string;
  exportHeaders?: string[];
  exportRows?: ExportRow[];
  exportTotals?: { label: string; value: unknown }[];
  onUpload?: (file: File, parsed?: ExportRow[]) => void | Promise<void>;
  uploadAccept?: string;
  uploadLabel?: string;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

export function DataToolbar({
  query,
  setQuery,
  searchPlaceholder = 'Search…',
  exportFileName,
  exportSheetName,
  exportTitle,
  exportSubtitle,
  exportHeaders,
  exportRows,
  exportTotals,
  onUpload,
  uploadAccept,
  uploadLabel = 'Upload file',
  onRefresh,
  children,
}: DataToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canExport = !!exportFileName && !!exportHeaders && !!exportRows;
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUpload) return;
    const parsed = await readUploadedFile(file);
    await onUpload(file, parsed.rows || []);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {setQuery && (
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)] pointer-events-none z-10" />
          <input
            type="text"
            value={query || ''}
            onChange={e => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="!pl-9 pr-7 h-8 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-2xs"
            style={{ paddingLeft: '34px' }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      )}

      {children}

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] h-8 px-2.5 gap-1.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-strong)] transition-colors shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[var(--color-text-muted)]" /> Refresh
        </button>
      )}

      {canExport && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] h-8 px-2.5 gap-1.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-strong)] transition-colors shadow-2xs outline-none"
          >
            <Download className="w-3.5 h-3.5 text-[var(--color-text-muted)]" /> Export
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            <DropdownMenuLabel className="text-[10px]">Download as</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-[11px]"
              onClick={() => downloadCSV(exportFileName || 'export', exportHeaders!, exportRows!)}
            >
              <FileText className="w-3.5 h-3.5" /> CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-[11px]"
              onClick={() => downloadExcel(exportFileName || 'export', exportSheetName || 'Sheet1', exportHeaders!, exportRows!)}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xls)
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-[11px]"
              onClick={() => downloadPDF(exportTitle || exportFileName || 'Report', exportSubtitle || '', exportHeaders!, exportRows!, exportTotals)}
            >
              <Printer className="w-3.5 h-3.5" /> PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {onUpload && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept={uploadAccept}
            className="hidden"
            onChange={handleFile}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="h-7 px-2 gap-1 text-[11px] font-semibold"
          >
            <UploadCloud className="w-4 h-4" /> {uploadLabel}
          </Button>
        </>
      )}
    </div>
  );
}