import * as React from "react"
import { cn } from "@/lib/utils"

// Neobrutalism Input — thick border, hard shadow, presses in on focus
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border-2 border-[#0a0a0a] bg-white px-3 py-2 text-sm",
        "shadow-[3px_3px_0px_0px_#0a0a0a] transition-all duration-100",
        "placeholder:text-[#888888] font-medium",
        "focus:outline-none focus:shadow-none focus:translate-x-[3px] focus:translate-y-[3px]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#e8e8e8]",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
}

export { Input }
