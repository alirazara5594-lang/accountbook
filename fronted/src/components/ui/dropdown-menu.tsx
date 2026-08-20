import * as React from "react"
import { createContext, useContext } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

const MenuContext = createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
  open: false,
  setOpen: () => {},
})

function DropdownMenu({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const value = React.useMemo(() => ({ open, setOpen }), [open])
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <MenuContext.Provider value={value}>
      <div ref={ref} data-slot="dropdown-menu" className="relative inline-block">
        {children}
      </div>
    </MenuContext.Provider>
  )
}

function DropdownMenuTrigger({
  render,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  render?: React.ReactElement
  children?: React.ReactNode
}) {
  const { open, setOpen } = useContext(MenuContext)
  const extra = { "aria-expanded": open, "data-slot": "dropdown-menu-trigger" }
  if (render) {
    const renderEl = render as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
    return React.cloneElement(renderEl, {
      ...extra,
      onClick: (e: React.MouseEvent) => {
        renderEl.props.onClick?.(e)
        setOpen(!open)
      },
    })
  }
  return (
    <button type="button" onClick={() => setOpen(!open)} {...extra} {...props}>
      {children}
    </button>
  )
}

function DropdownMenuContent({
  className,
  align = "start",
  children,
}: React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "end" | "center"
}) {
  const { open, setOpen } = useContext(MenuContext)
  if (!open) return null
  return createPortal(
    <div
      data-slot="dropdown-menu-content"
      onClick={() => setOpen(false)}
      className={cn(
        "absolute z-50 mt-1 min-w-32 overflow-x-hidden overflow-y-auto rounded-2xl bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/5 outline-none",
        align === "end" && "right-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "start" && "left-0",
        className
      )}
    >
      {children}
    </div>,
    document.body
  )
}

function DropdownMenuGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="dropdown-menu-group" className={className} {...props} />
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      data-slot="dropdown-menu-label"
      className={cn("px-2 py-1 text-xs text-muted-foreground", inset && "pl-7", className)}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <button
      type="button"
      data-slot="dropdown-menu-item"
      data-variant={variant}
      onClick={onClick}
      className={cn(
        "relative flex min-h-7 w-full cursor-default items-center gap-2 rounded-xl px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        inset && "pl-7",
        variant === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean
  inset?: boolean
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={!!checked}
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "relative flex min-h-7 w-full cursor-default items-center gap-2 rounded-xl py-1.5 pr-8 pl-2 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        inset && "pl-7",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex items-center justify-center text-xs">{checked ? "✓" : ""}</span>
      {children}
    </button>
  )
}

function DropdownMenuRadioGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="dropdown-menu-radio-group" className={className} {...props} />
}

function DropdownMenuRadioItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean
  inset?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!checked}
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex min-h-7 w-full cursor-default items-center gap-2 rounded-xl py-1.5 pr-8 pl-2 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        inset && "pl-7",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex items-center justify-center text-xs">{checked ? "✓" : ""}</span>
      {children}
    </button>
  )
}

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div data-slot="dropdown-menu-separator" className={cn("-mx-1 my-1 h-px bg-border/50", className)} />
}

function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="dropdown-menu-shortcut" className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />
}

function DropdownMenuPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DropdownMenuSub({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { inset?: boolean }) {
  return (
    <button
      type="button"
      data-slot="dropdown-menu-sub-trigger"
      className={cn(
        "flex min-h-7 w-full cursor-default items-center gap-2 rounded-xl px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
        inset && "pl-7",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <span className="ml-auto text-muted-foreground">›</span>
    </button>
  )
}

function DropdownMenuSubContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dropdown-menu-sub-content"
      className={cn("z-50 w-auto min-w-[96px] rounded-2xl bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/5", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}