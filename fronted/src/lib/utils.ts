export type ClassValue = string | number | false | null | undefined | ClassValue[]

function isClassValue(v: unknown): v is ClassValue {
  return v != null && v !== false
}

export function cn(...inputs: ClassValue[]) {
  const out: string[] = []
  const walk = (v: ClassValue) => {
    if (typeof v === "string" || typeof v === "number") {
      if (String(v).length) out.push(String(v))
    } else if (Array.isArray(v)) {
      v.forEach(walk)
    }
  }
  inputs.forEach((i) => {
    if (isClassValue(i)) walk(i)
  })
  return out.join(" ")
}