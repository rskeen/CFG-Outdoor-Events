import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const variants: Record<string, string> = {
  default: "bg-[#d4845a] hover:bg-[#c07040] text-white",
  outline: "border border-[#2e4530] text-[#e8ede8] hover:bg-[#243826]",
  ghost: "text-[#e8ede8] hover:bg-[#243826]",
  secondary: "bg-[#243826] text-[#e8ede8] hover:bg-[#2e4530]",
  destructive: "bg-red-600 hover:bg-red-700 text-white",
}

const sizes: Record<string, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-sm",
  lg: "h-12 px-8",
  icon: "h-10 w-10",
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#7cb87a] focus:ring-offset-2 focus:ring-offset-[#0f1710] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
