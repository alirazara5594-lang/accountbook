import { useRef } from 'react';
import { Input } from '@/components/ui/input';
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
    <div className="flex flex-wrap items-center gap-2">
      {setQuery && (
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={query || ''}
            onChange={e => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-9 bg-white border border-slate-200 rounded-lg text-xs"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      )}

      {children}

      {onRefresh && (
        <Button size="sm" variant="outline" onClick={onRefresh} className="h-9 px-3 gap-1.5 text-xs font-semibold">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      )}

      {canExport && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white h-9 px-3 gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 outline-none"
          >
            <Download className="w-4 h-4" /> Export
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44">
            <DropdownMenuLabel>Download as</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => downloadCSV(exportFileName || 'export', exportHeaders!, exportRows!)}
            >
              <FileText className="w-4 h-4" /> CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => downloadExcel(exportFileName || 'export', exportSheetName || 'Sheet1', exportHeaders!, exportRows!)}
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel (.xls)
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => downloadPDF(exportTitle || exportFileName || 'Report', exportSubtitle || '', exportHeaders!, exportRows!, exportTotals)}
            >
              <Printer className="w-4 h-4" /> PDF
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
            className="h-9 px-3 gap-1.5 text-xs font-semibold"
          >
            <UploadCloud className="w-4 h-4" /> {uploadLabel}
          </Button>
        </>
      )}
    </div>
  );
}