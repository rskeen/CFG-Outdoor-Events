import { cn } from "@/lib/utils"

const variantStyles: Record<string, string> = {
  trail: "bg-green-400 text-green-950",
  ultra: "bg-green-800 text-white",
  ocr: "bg-orange-500 text-white",
  adventure: "bg-red-500 text-white",
  orienteering: "bg-teal-500 text-white",
  mtb: "bg-yellow-900 text-white",
  gravel: "bg-amber-600 text-white",
  other: "bg-gray-500 text-white",
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
