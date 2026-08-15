import * as React from "react"

import { cn } from "@/lib/utils"

import { Label } from "@/components/ui/label"

interface FormFieldProps extends React.ComponentProps<"div"> {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}

function FormField({ label, required, hint, children, className, ...props }: FormFieldProps) {
  return (
    <div data-slot="form-field" className={cn("flex flex-col gap-1.5", className)} {...props}>
      <Label className="text-[13px] font-medium">
        {required && <span className="mr-0.5 text-destructive" aria-hidden>★</span>}
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export { FormField }