import { useState, type PointerEvent } from "react";
import { faceSrc, formatBin, type UCard } from "@/data/cards";
import { cn } from "@/lib/utils";

function tilt(el: HTMLElement, e: PointerEvent<HTMLElement>) {
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.transition = "transform 80ms linear";
  el.style.setProperty("--rx", `${(-y * 9).toFixed(2)}deg`);
  el.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
  el.style.setProperty("--lx", `${50 + x * 40}%`);
  el.style.setProperty("--ly", `${40 + y * 30}%`);
}

function untilt(el: HTMLElement) {
  el.style.transition = "transform 520ms cubic-bezier(0.16, 1, 0.3, 1)";
  el.style.setProperty("--rx", "0deg");
  el.style.setProperty("--ry", "0deg");
  el.style.setProperty("--lx", "50%");
  el.style.setProperty("--ly", "28%");
}

export function CardThumb({
  card,
  className,
}: {
  card: UCard;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = broken ? undefined : faceSrc(card);
  return (
    <span
      data-tint={card.tint}
      className={cn("relative isolate overflow-hidden bg-[var(--card-face)]", className)}
    >
      {src && (
        <img
          src={src}
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
    </span>
  );
}

export function PlasticCard({
  card,
  className,
  compact = false,
}: {
  card: UCard;
  className?: string;
  compact?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const src = broken ? undefined : faceSrc(card);
  const last4 = (card.slug || "card")
    .replace(/[^a-z0-9]/g, "")
    .slice(-4)
    .padStart(4, "0")
    .toUpperCase();
  const bin = formatBin(card);

  return (
    <div
      data-tint={card.tint}
      className={cn("plastic-card relative isolate overflow-hidden rounded-[22px]", "aspect-[1.586] w-full", className)}
      style={{ background: "var(--card-face)", color: "var(--card-ink)" }}
      onPointerMove={(e) => tilt(e.currentTarget, e)}
      onPointerLeave={(e) => untilt(e.currentTarget)}
    >
      {src && (
        <img
          src={src}
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
      <div className="card-glow pointer-events-none absolute -top-1/3 left-1/4 size-[140%] rounded-full opacity-70" />
      <div className="card-spec pointer-events-none absolute inset-0" />
      <div className="card-sheen pointer-events-none absolute inset-0" />
      <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold tracking-tight drop-shadow-sm sm:text-[17px]">{card.name}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] opacity-70">{card.issuer}</p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-80">
            {card.network}
          </span>
        </div>
        {!compact && (
          <div className="flex items-center gap-3">
            <span className="card-chip h-7 w-9 rounded-[6px]" />
            <p className="font-mono text-[13px] tracking-[0.28em] opacity-75">••••  {last4}</p>
          </div>
        )}
        <div className="flex items-end justify-between gap-3">
          <span className="max-w-[70%] text-[10px] leading-snug tracking-wide opacity-80">{bin}</span>
          <span className="font-mono text-[10px] opacity-60">{card.custody}</span>
        </div>
      </div>
    </div>
  );
}
