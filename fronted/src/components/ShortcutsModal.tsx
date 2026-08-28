import React from 'react';
import { Command, X, Search, FileText, ShoppingCart, ShoppingBag, Landmark, Key, Moon, Sparkles, HelpCircle } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Navigation' | 'Actions' | 'System';
  action?: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;

  const shortcuts: ShortcutItem[] = [
    { keys: ['Ctrl', 'K'], description: 'Focus Global Search & Page Finder', category: 'Navigation' },
    { keys: ['Ctrl', 'D'], description: 'Jump to Overview Dashboard', category: 'Navigation' },
    { keys: ['Ctrl', 'J'], description: 'Open General Journal Entries', category: 'Navigation' },
    { keys: ['Ctrl', 'I'], description: 'Open Sales & Invoices Workspace', category: 'Navigation' },
    { keys: ['Ctrl', 'B'], description: 'Open Purchasing & Bills', category: 'Navigation' },
    { keys: ['Ctrl', 'L'], description: 'Open License & Trial Manager', category: 'System' },
    { keys: ['Ctrl', '/'], description: 'Toggle Keyboard Shortcuts Modal', category: 'System' },
    { keys: ['?'], description: 'Show Keyboard Cheat Sheet', category: 'System' },
    { keys: ['Esc'], description: 'Close any open drawer / modal / dropdown', category: 'Actions' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[10000] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Keyboard Shortcuts & Fast Actions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Speed up your ERP bookkeeping & navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          <div className="space-y-2">
            {shortcuts.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                  {s.description}
                </span>
                <div className="flex items-center gap-1.5">
                  {s.keys.map((k, ki) => (
                    <kbd
                      key={ki}
                      className="px-2 py-1 rounded-md text-[11px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xs"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
            <span>
              <b>Tip:</b> Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 font-mono text-[10px]">Ctrl+K</kbd> anywhere in the application to immediately open the global fuzzy search.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
