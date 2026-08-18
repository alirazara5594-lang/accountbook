import { Palette, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { THEMES } from '../themes';

export default function ThemeSwitcher({ theme, onSelect }: { theme: string; onSelect: (id: string) => void }) {
  const current = THEMES.find(t => t.id === theme) || THEMES[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title="Change theme"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white h-8 px-2 text-slate-600 hover:bg-slate-50 outline-none cursor-pointer"
      >
        <span
          className="inline-block h-3.5 w-3.5 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${current.primary} 50%, ${current.sidebar} 50%)`,
            boxShadow: '0 0 0 1px rgba(15,23,42,0.15)',
          }}
        />
        <Palette className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map(t => (
          <DropdownMenuItem key={t.id} onClick={() => onSelect(t.id)} className="gap-2.5 cursor-pointer">
            <span
              className="inline-block h-4 w-4 shrink-0 rounded-full"
              style={{ background: `linear-gradient(135deg, ${t.primary} 50%, ${t.sidebar} 50%)` }}
            />
            <span className="flex-1">{t.name}</span>
            {theme === t.id && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}