import * as React from "react"
import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-[#2e4530] bg-[#1a2b1c] px-3 py-2 text-sm text-[#e8ede8] placeholder:text-[#8a9e8a] focus:outline-none focus:ring-2 focus:ring-[#7cb87a] focus:ring-offset-1 focus:ring-offset-[#0f1710] disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
