import * as React from "react"
import { createContext, useContext } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"

const DialogContext = createContext<{ open: boolean; onOpenChange: (open: boolean) => void }>({
  open: false,
  onOpenChange: () => {},
})

function Dialog({
  open = false,
  onOpenChange = () => {},
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  const value = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange])
  if (!open) return null
  return (
    <DialogContext.Provider value={value}>
      {createPortal(
        <div data-slot="dialog" className="relative z-50">
          <div
            data-slot="dialog-overlay"
            className="fixed inset-0 isolate bg-black/30 supports-backdrop-filter:backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          {children}
        </div>,
        document.body
      )}
    </DialogContext.Provider>
  )
}

function DialogTrigger({
  children,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; children: React.ReactNode }) {
  const { onOpenChange } = useContext(DialogContext)
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        onOpenChange(true)
      },
    })
  }
  return (
    <button type="button" onClick={() => onOpenChange(true)} {...props}>
      {children}
    </button>
  )
}

function DialogClose({
  children,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; children?: React.ReactNode }) {
  const { onOpenChange } = useContext(DialogContext)
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        onOpenChange(false)
      },
    })
  }
  return (
    <button type="button" onClick={() => onOpenChange(false)} {...props}>
      {children}
    </button>
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
}: React.HTMLAttributes<HTMLDivElement> & { showCloseButton?: boolean }) {
  const { onOpenChange } = useContext(DialogContext)
  return (
    <div
      data-slot="dialog-content"
      className={cn(
        "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-3xl bg-popover p-6 text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/5 outline-none sm:max-w-md",
        className
      )}
    >
      {children}
      {showCloseButton && (
        <button
          type="button"
          data-slot="dialog-close"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-muted"
        >
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-1.5", className)} {...props} />
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 data-slot="dialog-title" className={cn("font-heading text-base leading-none font-medium", className)} {...props} />
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function DialogOverlay({ className }: { className?: string }) {
  void className
  return null
}

function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}