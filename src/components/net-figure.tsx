import { formatUsd } from "@/lib/calc";
import { cn } from "@/lib/utils";

export function NetFigure({
  value,
  className,
  size = "md",
}: {
  value: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const tone = value > 0.004 ? "text-gain" : value < -0.004 ? "text-loss" : "text-muted";
  return (
    <span
      className={cn(
        "inline-flex font-mono tabular-nums tracking-tight",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-2xl sm:text-3xl",
        tone,
        className,
      )}
    >
      {formatUsd(value)}
    </span>
  );
}
