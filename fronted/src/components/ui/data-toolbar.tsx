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
    <div className="flex items-center gap-1.5">
      {setQuery && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={query || ''}
            onChange={e => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-7 h-7 w-48 bg-white border border-slate-200 rounded-lg text-[11px] placeholder:text-slate-400"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      )}

      {children}

      {onRefresh && (
        <Button size="sm" variant="outline" onClick={onRefresh} className="h-7 px-2 gap-1 text-[11px] font-semibold">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      )}

      {canExport && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white h-7 px-2 gap-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 outline-none"
          >
            <Download className="w-3.5 h-3.5" /> Export
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