import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#2e4530] bg-[#1a2b1c] px-3 py-2 text-sm text-[#e8ede8] placeholder:text-[#8a9e8a] focus:outline-none focus:ring-2 focus:ring-[#7cb87a] focus:ring-offset-1 focus:ring-offset-[#0f1710] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
