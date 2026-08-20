import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  tone?: string
  columns?: 2 | 3 | 4 | 6
}

const toneMap: Record<string, { color: string; bg: string }> = {
  teal: { color: "#0d9488", bg: "#ccfbf1" },
  blue: { color: "#2563eb", bg: "#dbeafe" },
  emerald: { color: "#059669", bg: "#d1fae5" },
  slate: { color: "#475569", bg: "#e2e8f0" },
  amber: { color: "#d97706", bg: "#fef3c7" },
  violet: { color: "#7c3aed", bg: "#ede9fe" },
  indigo: { color: "#4f46e5", bg: "#e0e7ff" },
  cyan: { color: "#0891b2", bg: "#cffafe" },
  rose: { color: "#e11d48", bg: "#ffe4e6" },
}

const gridCols: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
}

function FormSection({
  icon: Icon,
  title,
  description,
  tone = "teal",
  columns,
  className,
  children,
  ...props
}: FormSectionProps) {
  const t = toneMap[tone] ?? toneMap.teal
  return (
    <div
      className={cn("rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", className)}
      {...props}
    >
      <div className="mb-3 flex items-center gap-2.5">
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: t.bg, color: t.color }}>
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      <div className={cn("grid gap-3", columns && gridCols[columns])}>{children}</div>
    </div>
  )
}

export { FormSection }