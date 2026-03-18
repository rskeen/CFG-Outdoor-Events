import { cn } from "@/lib/utils"

const variantStyles: Record<string, string> = {
  trail: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  ultra: "bg-green-900 text-white border border-green-800",
  ocr: "bg-orange-100 text-orange-800 border border-orange-200",
  adventure: "bg-red-100 text-red-800 border border-red-200",
  orienteering: "bg-teal-100 text-teal-800 border border-teal-200",
  mtb: "bg-amber-100 text-amber-900 border border-amber-200",
  gravel: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  other: "bg-stone-100 text-stone-700 border border-stone-200",
}

interface BadgeProps {
  variant?: string
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = "other", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
        variantStyles[variant] ?? variantStyles.other,
        className
      )}
    >
      {children}
    </span>
  )
}
