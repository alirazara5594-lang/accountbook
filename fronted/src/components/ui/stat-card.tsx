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
  teal: { chip: "bg-teal-500/10 text-teal-600", value: "text-foreground" },
  green: { chip: "bg-green-500/10 text-green-600", value: "text-foreground" },
  red: { chip: "bg-red-500/10 text-red-600", value: "text-foreground" },
  amber: { chip: "bg-amber-500/10 text-amber-600", value: "text-foreground" },
  blue: { chip: "bg-blue-500/10 text-blue-600", value: "text-foreground" },
  violet: { chip: "bg-violet-500/10 text-violet-600", value: "text-foreground" },
  cyan: { chip: "bg-cyan-500/10 text-cyan-600", value: "text-foreground" },
} as const

function StatCard({ icon: Icon, label, value, tone = "teal", className, ...props }: StatCardProps) {
  const t = tones[tone]
  return (
    <Card className={cn("flex items-center gap-3 p-3", className)} {...props}>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", t.chip)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className={cn("truncate text-lg font-bold leading-tight", t.value)}>{value}</p>
        <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}

export { StatCard }