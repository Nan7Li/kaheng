import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[15px] font-semibold tracking-tight transition-[transform,opacity,background-color,color,box-shadow] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.96]",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-fg shadow-[0_6px_16px_rgba(0,122,255,0.28)] hover:opacity-90",
        secondary: "bg-surface text-accent shadow-[var(--shadow-card)] hover:bg-surface-2",
        outline: "bg-surface-2 text-fg hover:bg-border",
        ghost: "text-accent hover:bg-accent/8",
        gain: "bg-gain text-accent-fg",
        danger: "bg-loss text-accent-fg",
      },
      size: {
        default: "h-12 rounded-full px-5",
        sm: "h-9 rounded-full px-3.5 text-[13px]",
        lg: "h-14 rounded-full px-6 text-base",
        icon: "size-11 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
