import * as React from "react"

import { cn } from "@/lib/utils"

const tones = {
  teal: {
    wrapper: "border-teal-200/70 bg-teal-50/60",
    accent: "bg-teal-500",
    chip: "bg-teal-100 text-teal-700",
    heading: "text-teal-900",
  },
  blue: {
    wrapper: "border-blue-200/70 bg-blue-50/60",
    accent: "bg-blue-500",
    chip: "bg-blue-100 text-blue-700",
    heading: "text-blue-900",
  },
  amber: {
    wrapper: "border-amber-200/70 bg-amber-50/60",
    accent: "bg-amber-500",
    chip: "bg-amber-100 text-amber-700",
    heading: "text-amber-900",
  },
  violet: {
    wrapper: "border-violet-200/70 bg-violet-50/60",
    accent: "bg-violet-500",
    chip: "bg-violet-100 text-violet-700",
    heading: "text-violet-900",
  },
  emerald: {
    wrapper: "border-emerald-200/70 bg-emerald-50/60",
    accent: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-700",
    heading: "text-emerald-900",
  },
  indigo: {
    wrapper: "border-indigo-200/70 bg-indigo-50/60",
    accent: "bg-indigo-500",
    chip: "bg-indigo-100 text-indigo-700",
    heading: "text-indigo-900",
  },
  cyan: {
    wrapper: "border-cyan-200/70 bg-cyan-50/60",
    accent: "bg-cyan-500",
    chip: "bg-cyan-100 text-cyan-700",
    heading: "text-cyan-900",
  },
  rose: {
    wrapper: "border-rose-200/70 bg-rose-50/60",
    accent: "bg-rose-500",
    chip: "bg-rose-100 text-rose-700",
    heading: "text-rose-900",
  },
  slate: {
    wrapper: "border-slate-200/70 bg-slate-50/60",
    accent: "bg-slate-400",
    chip: "bg-slate-100 text-slate-600",
    heading: "text-slate-800",
  },
} as const

export type FormTone = keyof typeof tones

interface FormSectionProps extends React.ComponentProps<"div"> {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  tone?: FormTone
  columns?: 2 | 3 | 4 | 6
}

function FormSection({
  icon: Icon,
  title,
  description,
  tone = "slate",
  columns = 3,
  className,
  children,
  ...props
}: FormSectionProps) {
  const t = tones[tone]
  const cols: Record<number, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  }
  return (
    <section
      data-slot="form-section"
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm",
        t.wrapper,
        className
      )}
      {...props}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", t.accent)} />
      <header className="mb-4 flex items-center gap-3">
        {Icon && (
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", t.chip)}>
            <Icon className="size-4" />
          </span>
        )}
        <div>
          <h4 className={cn("text-sm font-semibold", t.heading)}>{title}</h4>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </header>
      <div className={cn("grid gap-x-4 gap-y-3.5", cols[columns])}>{children}</div>
    </section>
  )
}

export { FormSection }