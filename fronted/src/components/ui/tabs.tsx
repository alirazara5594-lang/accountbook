import * as React from "react"
import { createContext, useContext } from "react"

import { cn } from "@/lib/utils"

const TabsContext = createContext<{ value?: string; onValueChange?: (v: string) => void } | null>(null)

function Tabs({
  className,
  value,
  defaultValue,
  onValueChange,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const current = value ?? internal
  const setValue = (v: string) => {
    setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value: current, onValueChange: setValue }}>
      <div data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        "inline-flex w-fit items-center justify-center rounded-2xl bg-muted p-[3px] text-muted-foreground h-8",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  value,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = useContext(TabsContext)
  const active = ctx?.value === value
  return (
    <button
      type="button"
      data-slot="tabs-trigger"
      data-active={active || undefined}
      onClick={() => ctx?.onValueChange?.(value)}
      className={cn(
        "relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-2xl border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        active && "bg-background text-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({
  className,
  value,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const ctx = useContext(TabsContext)
  if (ctx?.value !== value) return null
  return (
    <div data-slot="tabs-content" className={cn("flex-1 text-sm outline-none", className)} {...props}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }