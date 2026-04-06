import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Neobrutalism Badge — bold border, high contrast, no rounded pill
const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 border-2 border-[var(--ink)] px-2 py-0.5 text-xs font-bold whitespace-nowrap rounded-sm",
  {
    variants: {
      variant: {
        default: "bg-[var(--main)] text-[var(--main-foreground)]",
        secondary: "bg-[var(--secondary-bg)] text-[var(--ink)]",
        destructive: "bg-red-500 text-white",
        outline: "bg-white text-[var(--ink)]",
        success: "bg-green-400 text-[var(--ink)]",
        navy: "bg-[var(--navy)] text-white",
        ghost: "border-transparent bg-transparent text-[var(--ink)]",
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
