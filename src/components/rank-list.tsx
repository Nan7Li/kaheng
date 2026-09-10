import { Link } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";
import type { UCard } from "@/data/cards";
import { formatBin, STATUS_LABEL } from "@/data/cards";
import { calcCard, type CalcInput } from "@/lib/calc";
import { useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";
import { NetFigure } from "@/components/net-figure";
import { CardThumb } from "@/components/plastic-card";
import { VerificationBadge } from "@/components/data-confidence";

export function RankList({
  cards,
  input,
  limit,
}: {
  cards: UCard[];
  input: CalcInput;
  limit?: number;
}) {
  const selected = useDesk((s) => s.selected);
  const toggleSelected = useDesk((s) => s.toggleSelected);

  const rows = cards
    .filter((c) => c.status !== "shutdown")
    .map((c) => ({ card: c, result: calcCard(c, input) }))
    .sort((a, b) => b.result.net - a.result.net);
  const shown = limit ? rows.slice(0, limit) : rows;

  return (
    <ol className="ios-card overflow-hidden rounded-[22px]">
      {shown.map((row, i) => (
        <li key={row.card.slug}>
          {i > 0 && <div className="ml-14 h-px bg-border" />}
          <div className="flex items-center gap-2 py-2 pr-2 pl-3">
            <span className="w-6 text-center font-mono text-[11px] tabular-nums text-subtle">
              {i + 1}
            </span>
            <CardThumb card={row.card} className="size-9 shrink-0 rounded-[10px]" />
            <Link
              to="/card/$slug"
              params={{ slug: row.card.slug }}
              className="min-w-0 flex-1 py-1.5 pressable"
            >
              <p className="truncate text-[16px] font-medium">{row.card.name}</p>
              <div className="flex items-center gap-1.5 truncate text-[12px] text-subtle">
                <span className="truncate">
                  {formatBin(row.card)}
                  {row.card.status === "restricted" ? ` · ${STATUS_LABEL.restricted}` : ""}
                </span>
                <VerificationBadge card={row.card} compact />
              </div>
            </Link>
            <NetFigure value={row.result.net} />
            <button
              type="button"
              aria-label="加入比较"
              onClick={() => toggleSelected(row.card.slug)}
              className={cn(
                "flex size-9 items-center justify-center rounded-full pressable",
                selected.includes(row.card.slug)
                  ? "bg-accent text-accent-fg"
                  : "bg-surface-2 text-subtle",
              )}
            >
              <GitCompareArrows className="size-4" />
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
