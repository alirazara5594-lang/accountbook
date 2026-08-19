import * as React from "react"

import { cn } from "@/lib/utils"

import { Card } from "@/components/ui/card"

interface StatCardProps extends React.ComponentProps<"div"> {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  tone?: "teal" | "green" | "red" | "amber" | "blue" | "violet" | "cyan"
}

const tones = {
  teal: { chip: "linear-gradient(135deg,#14b8a6,#2dd4bf)", value: "text-foreground" },
  green: { chip: "linear-gradient(135deg,#10b981,#34d399)", value: "text-foreground" },
  red: { chip: "linear-gradient(135deg,#ef4444,#f87171)", value: "text-foreground" },
  amber: { chip: "linear-gradient(135deg,#f59e0b,#fbbf24)", value: "text-foreground" },
  blue: { chip: "linear-gradient(135deg,#3b82f6,#60a5fa)", value: "text-foreground" },
  violet: { chip: "linear-gradient(135deg,#8b5cf6,#a78bfa)", value: "text-foreground" },
  cyan: { chip: "linear-gradient(135deg,#06b6d4,#22d3ee)", value: "text-foreground" },
} as const

function StatCard({ icon: Icon, label, value, tone = "teal", className, ...props }: StatCardProps) {
  const t = tones[tone]
  return (
    <Card
      className={cn(
        "group/stat flex min-h-[90px] flex-col justify-between gap-2 p-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-[8px] text-white shadow-sm"
          style={{ background: t.chip }}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className={cn("truncate text-lg font-extrabold leading-tight tracking-tight", t.value)}>{value}</p>
    </Card>
  )
}

export { StatCard }