import * as React from "react"

import { cn } from "@/lib/utils"

type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link"

type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg"

const buttonVariants = {
  base: "group/button inline-flex shrink-0 items-center justify-center rounded-2xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    outline: "border-border bg-background hover:bg-muted hover:text-foreground",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
    ghost: "hover:bg-muted hover:text-foreground",
    destructive:
      "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
    link: "text-primary underline-offset-4 hover:underline",
  } as Record<ButtonVariant, string>,
  size: {
    default: "h-8 gap-1.5 px-3",
    xs: "h-6 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
    sm: "h-7 gap-1 px-3",
    lg: "h-9 gap-1.5 px-4",
    icon: "size-8",
    "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
    "icon-sm": "size-7",
    "icon-lg": "size-9",
  } as Record<ButtonSize, string>,
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

function Button({ className, variant = "default", size = "default", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(
        buttonVariants.base,
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        className
      )}
      {...props}
    />
  )
}

export { Button, buttonVariants }