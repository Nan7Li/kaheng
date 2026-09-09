import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-2xl px-4 pt-2 pb-36", className)}>{children}</div>
  );
}

export function Fade({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function LargeTitle({
  eyebrow,
  children,
  trailing,
}: {
  eyebrow?: string;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 pt-3">
      <div>
        {eyebrow && <p className="text-[13px] font-medium text-subtle">{eyebrow}</p>}
        <h1 className="text-[34px] leading-none tracking-tight">{children}</h1>
      </div>
      {trailing}
    </div>
  );
}

export function Group({
  header,
  footer,
  children,
  className,
}: {
  header?: string;
  footer?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-6", className)}>
      {header && (
        <p className="mb-1.5 px-4 text-[13px] font-medium tracking-wide text-subtle uppercase">
          {header}
        </p>
      )}
      <div className="ios-card overflow-hidden rounded-[22px]">{children}</div>
      {footer && <p className="mt-2 px-4 text-[12px] leading-relaxed text-subtle">{footer}</p>}
    </section>
  );
}

export function Row({
  label,
  hint,
  children,
  onClick,
  chevron,
  destructive,
}: {
  label: string;
  hint?: string;
  children?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  destructive?: boolean;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className={cn("text-[16px] leading-tight", destructive ? "text-loss" : "text-fg")}>
          {label}
        </p>
        {hint && <p className="mt-0.5 text-[12px] text-subtle">{hint}</p>}
      </div>
      {children}
      {chevron && <ChevronRight className="size-4 shrink-0 text-subtle/70" />}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left pressable"
      >
        {inner}
      </button>
    );
  }

  return <div className="flex min-h-12 items-center gap-3 px-4 py-2.5">{inner}</div>;
}

export function Divider() {
  return <div className="ml-4 h-px bg-border" />;
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  suffix,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "url";
  suffix?: string;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 px-4 py-2">
      <span className="w-[6.5rem] shrink-0 text-[15px] text-fg">{label}</span>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 min-w-0 flex-1 bg-transparent text-right text-[16px] text-fg outline-none placeholder:text-subtle"
      />
      {suffix && <span className="text-[13px] text-subtle">{suffix}</span>}
    </label>
  );
}

export function Area({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block px-4 py-3">
      <span className="text-[13px] text-subtle">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1.5 w-full resize-none bg-transparent text-[16px] leading-relaxed text-fg outline-none placeholder:text-subtle"
      />
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  id?: string;
}) {
  return (
    <div className="flex rounded-full bg-surface-2 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "h-8 flex-1 rounded-full px-2 text-[12px] font-semibold transition-colors duration-200",
            value === opt.value
              ? "bg-surface text-fg shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
              : "text-muted",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative isolate h-8 overflow-hidden rounded-full px-3 text-[13px] font-medium pressable",
        on ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
      )}
    >
      {children}
    </button>
  );
}
