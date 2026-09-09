import type { UCard } from "@/data/cards";
import { cn } from "@/lib/utils";

export function PlasticCard({
  card,
  className,
  compact = false,
}: {
  card: UCard;
  className?: string;
  compact?: boolean;
}) {
  const last4 = (card.slug || "card")
    .replace(/[^a-z0-9]/g, "")
    .slice(-4)
    .padStart(4, "0")
    .toUpperCase();
  return (
    <div
      data-tint={card.tint}
      className={cn(
        "relative isolate overflow-hidden rounded-[22px]",
        "aspect-[1.586] w-full",
        className,
      )}
      style={{ background: "var(--card-face)", color: "var(--card-ink)" }}
    >
      <div className="card-glow pointer-events-none absolute -top-1/3 left-1/4 size-[140%] rounded-full opacity-70" />
      <div className="card-spec pointer-events-none absolute inset-0" />
      <div className="card-sheen pointer-events-none absolute inset-0" />
      <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold tracking-tight sm:text-[17px]">{card.name}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] opacity-60">
              {card.issuer}
            </p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
            {card.network}
          </span>
        </div>
        {!compact && (
          <div className="flex items-center gap-3">
            <span className="card-chip h-7 w-9 rounded-[6px]" />
            <p className="font-mono text-[13px] tracking-[0.28em] opacity-70">••••  {last4}</p>
          </div>
        )}
        <div className="flex items-end justify-between">
          <span className="text-[10px] tracking-widest uppercase opacity-55">
            {card.form === "both" ? "Virtual / Physical" : card.form}
          </span>
          <span className="font-mono text-[10px] opacity-55">{card.custody}</span>
        </div>
      </div>
    </div>
  );
}
