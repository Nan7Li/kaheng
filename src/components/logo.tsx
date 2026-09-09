import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-7", className)}
      aria-hidden="true"
      fill="none"
    >
      <rect x="3" y="14" width="26" height="1.2" fill="currentColor" />
      <path d="M8 14 L8 10 L16 7 L24 10 L24 14" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 15.2 L8 22 L16 25 L24 22 L24 15.2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 text-fg", className)}>
      <Mark />
      <span className="font-serif text-lg tracking-tight">卡衡</span>
    </span>
  );
}
