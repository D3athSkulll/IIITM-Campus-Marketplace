"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: neobrutalism — bold border, hard shadow, font, transition
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border-2 border-[var(--ink)] text-sm font-bold whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-50 transition-all duration-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary — yellow bg, hard shadow, translates on hover to "press" into shadow
        default:
          "bg-[var(--main)] text-[var(--main-foreground)] shadow-[4px_4px_0px_0px_var(--ink)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        // Outline — white bg, hard shadow
        outline:
          "bg-white text-[var(--ink)] shadow-[4px_4px_0px_0px_var(--ink)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        // Secondary — light gray bg
        secondary:
          "bg-[var(--secondary-bg)] text-[var(--ink)] shadow-[4px_4px_0px_0px_var(--ink)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none",
        // Ghost — no bg, no shadow, just text
        ghost:
          "border-transparent bg-transparent text-[var(--ink)] shadow-none hover:bg-[var(--secondary-bg)]",
        // Destructive — red
        destructive:
          "bg-red-500 text-white shadow-[4px_4px_0px_0px_var(--ink)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none",
        // Navy — campus brand dark
        navy:
          "bg-[var(--navy)] text-white shadow-[4px_4px_0px_0px_var(--ink)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none",
        // Link — text only
        link: "border-transparent bg-transparent text-[var(--navy)] underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
