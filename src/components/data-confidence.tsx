import { ArrowUpRight, BadgeCheck, CircleAlert } from "lucide-react";
import type { UCard } from "@/data/cards";
import { cn } from "@/lib/utils";

function ageDays(value?: string): number | null {
  if (!value) return null;
  const time = new Date(`${value}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.floor((Date.now() - time) / 86_400_000);
}

export function VerificationBadge({ card, compact = false }: { card: UCard; compact?: boolean }) {
  const age = ageDays(card.verifiedAt);
  const stale = age !== null && age > 120;
  const label =
    card.verification === "official"
      ? stale
        ? "官方来源 · 待复核"
        : `官方已核${card.verifiedAt ? ` · ${card.verifiedAt.slice(5)}` : ""}`
      : card.verification === "partial"
        ? `部分官方已核${card.verifiedAt ? ` · ${card.verifiedAt.slice(5)}` : ""}`
        : card.verification === "secondary"
          ? "二手来源"
          : "未核验";
  const trusted = card.verification === "official" && !stale;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        trusted ? "bg-gain-dim text-gain" : "bg-warn-dim text-warn",
        compact && "px-1.5",
      )}
    >
      {trusted ? <BadgeCheck className="size-3" /> : <CircleAlert className="size-3" />}
      {label}
    </span>
  );
}

export function SourcePanel({ card }: { card: UCard }) {
  const sources = card.sourceUrls ?? [];
  return (
    <div className="px-4 py-3">
      <VerificationBadge card={card} />
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {sources.length
          ? `核验日期 ${card.verifiedAt ?? "未记录"}。地区、账户等级和 App 实际入口仍可能改变结果。`
          : "尚未补齐官方出处，这组数字只适合作为检索线索。"}
      </p>
      {sources.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {sources.map((url, index) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-[13px] text-accent pressable"
              >
                官方来源 {index + 1}
                <ArrowUpRight className="size-3" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
