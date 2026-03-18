import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const variants: Record<string, string> = {
  default: "bg-[#C4602A] hover:bg-[#a84e22] text-white",
  outline: "border border-[#D6D0C8] text-[#1C1C1A] hover:bg-[#EDE9E2]",
  ghost: "text-[#1C1C1A] hover:bg-[#EDE9E2]",
  secondary: "bg-[#EDE9E2] text-[#1C1C1A] hover:bg-[#D6D0C8]",
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
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E5B3A] focus:ring-offset-2 focus:ring-offset-[#F7F4EF] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
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
