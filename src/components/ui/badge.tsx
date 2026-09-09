import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
  {
    variants: {
      tone: {
        default: "border-border bg-surface-2 text-muted",
        accent: "border-transparent bg-accent text-accent-fg",
        gain: "border-transparent bg-gain-dim text-gain",
        loss: "border-transparent bg-loss-dim text-loss",
        warn: "border-transparent bg-warn-dim text-warn",
        ghost: "border-border bg-transparent text-subtle",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
