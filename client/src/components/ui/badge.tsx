import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Neobrutalism Badge — bold border, high contrast, no rounded pill
const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 border-2 border-[#0a0a0a] px-2 py-0.5 text-xs font-bold whitespace-nowrap rounded-sm",
  {
    variants: {
      variant: {
        default: "bg-[#f5c518] text-[#0a0a0a]",
        secondary: "bg-[#e8e8e8] text-[#0a0a0a]",
        destructive: "bg-red-500 text-white",
        outline: "bg-white text-[#0a0a0a]",
        success: "bg-green-400 text-[#0a0a0a]",
        navy: "bg-[#0a1628] text-white",
        ghost: "border-transparent bg-transparent text-[#0a0a0a]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
