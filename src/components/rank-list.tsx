import { Link } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";
import type { UCard } from "@/data/cards";
import { formatBin, STATUS_LABEL } from "@/data/cards";
import { calcCard, effectiveFees, feesVaryByLevel, pickLevel, type CalcInput } from "@/lib/calc";
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
  const mobileRows = limit ? rows.slice(0, limit) : rows;

  return (
    <>
      <ol className="ios-card overflow-hidden rounded-[22px] lg:hidden">
        {mobileRows.map((row, i) => (
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
                    {row.card.levels && row.card.levels.length > 0
                      ? `${row.result.levelName}${feesVaryByLevel(row.card) ? " · 磨损随档" : ""}`
                      : formatBin(row.card)}
                    {row.card.status === "restricted" ? ` · ${STATUS_LABEL.restricted}` : ""}
                    {row.result.settlement !== "USD" ? ` · ${row.result.settlement}` : ""}
                    {row.result.nativeAsset === "USDG" || row.result.nativeAsset === "EURe"
                      ? ` · ${row.result.nativeAsset}`
                      : ""}
                  </span>
                  <VerificationBadge card={row.card} compact />
                </div>
              </Link>
              <NetFigure value={row.result.net} />
              <CompareBtn
                on={selected.includes(row.card.slug)}
                onClick={() => toggleSelected(row.card.slug)}
              />
            </div>
          </li>
        ))}
      </ol>

      <div className="ios-card hidden overflow-hidden rounded-[22px] lg:block">
        <table className="kaheng-table">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>卡</th>
              <th>档位</th>
              <th>消费</th>
              <th>FX</th>
              <th>返现</th>
              <th className="text-right">净收益</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const fees = effectiveFees(row.card, pickLevel(row.card, input.tier, input.levelId));
              return (
                <tr key={row.card.slug}>
                  <td className="font-mono text-[12px] tabular-nums text-subtle">{i + 1}</td>
                  <td>
                    <Link
                      to="/card/$slug"
                      params={{ slug: row.card.slug }}
                      className="flex min-w-0 items-center gap-3 pressable"
                    >
                      <CardThumb card={row.card} className="size-9 shrink-0 rounded-[10px]" />
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium">{row.card.name}</span>
                        <span className="flex items-center gap-1.5 truncate text-[12px] text-subtle">
                          <span className="truncate">
                            {formatBin(row.card)}
                            {row.card.status === "restricted" ? ` · ${STATUS_LABEL.restricted}` : ""}
                            {row.result.settlement !== "USD" ? ` · ${row.result.settlement}` : ""}
                            {row.result.nativeAsset === "USDG" || row.result.nativeAsset === "EURe"
                              ? ` · ${row.result.nativeAsset}`
                              : ""}
                          </span>
                          <VerificationBadge card={row.card} compact />
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="text-[13px] text-muted">
                    {row.result.levelName}
                    {feesVaryByLevel(row.card) ? (
                      <span className="ml-1 text-[11px] text-subtle">随档</span>
                    ) : null}
                  </td>
                  <td className="font-mono text-[13px] tabular-nums text-muted">
                    {row.result.spendFeePctUsed}%
                  </td>
                  <td className="font-mono text-[13px] tabular-nums text-muted">
                    {fees.fxFeePct}%
                  </td>
                  <td className="font-mono text-[13px] tabular-nums text-muted">
                    {row.result.cashbackPctUsed}%
                  </td>
                  <td className="text-right">
                    <NetFigure value={row.result.net} />
                  </td>
                  <td className="text-right">
                    <CompareBtn
                      on={selected.includes(row.card.slug)}
                      onClick={() => toggleSelected(row.card.slug)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CompareBtn({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="加入比较"
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-full pressable",
        on ? "bg-accent text-accent-fg" : "bg-surface-2 text-subtle",
      )}
    >
      <GitCompareArrows className="size-4" />
    </button>
  );
}
