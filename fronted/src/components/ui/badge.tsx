import * as React from "react"

import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"

const badgeVariants = {
  base: "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-2xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3!",
  variant: {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive/10 text-destructive",
    outline: "border-border text-foreground",
    ghost: "hover:bg-muted hover:text-muted-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  } as Record<BadgeVariant, string>,
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants.base, badgeVariants.variant[variant], className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }