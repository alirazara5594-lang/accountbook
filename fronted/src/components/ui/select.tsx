import * as React from "react"

import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  children?: React.ReactNode
}

function collectOptions(node: React.ReactNode): { value: string; label: React.ReactNode }[] {
  const out: { value: string; label: React.ReactNode }[] = []
  const walk = (n: React.ReactNode) => {
    if (!React.isValidElement(n)) return
    const el = n as React.ReactElement<any>
    if (el.type === SelectItem) {
      out.push({ value: String(el.props.value), label: el.props.children })
      return
    }
    if (el.props?.children != null) {
      React.Children.forEach(el.props.children, walk)
    }
  }
  React.Children.forEach(node, walk)
  return out
}

function Select({
  value,
  defaultValue,
  onValueChange,
  className,
  placeholder,
  disabled,
  children,
}: SelectProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const current = value ?? internal
  const options = collectOptions(children)

  return (
    <select
      data-slot="select"
      value={current}
      disabled={disabled}
      onChange={(e) => {
        const v = e.target.value
        setInternal(v)
        onValueChange?.(v)
      }}
      className={cn(
        "flex h-8 w-fit items-center justify-between gap-1.5 rounded-2xl border border-transparent bg-input/50 px-3 py-0 text-sm whitespace-nowrap transition-[color,box-shadow] duration-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function SelectTrigger({ className, children }: { className?: string; children?: React.ReactNode }) {
  void children
  return <span className={className} data-slot="select-trigger" />
}

function SelectValue({ placeholder }: { placeholder?: string; children?: React.ReactNode }) {
  void placeholder
  return null
}

function SelectContent({ className, children }: { className?: string; children?: React.ReactNode }) {
  void className
  return <>{children}</>
}

function SelectItem({
  value,
  className,
  children,
  disabled,
}: {
  value: string
  className?: string
  children?: React.ReactNode
  disabled?: boolean
}) {
  void value
  void className
  void disabled
  return <>{children}</>
}

function SelectGroup({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function SelectLabel({ children }: { children?: React.ReactNode }) {
  void children
  return null
}

function SelectSeparator() {
  return null
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}