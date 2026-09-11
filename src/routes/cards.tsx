import { createFileRoute, Link } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";
import { useMemo, useState } from "react";
import { BinLookup } from "@/components/bin-lookup";
import { DeskControls } from "@/components/controls";
import { Chip, Desk, Fade, Group, LargeTitle, Page } from "@/components/ios";
import { NetFigure } from "@/components/net-figure";
import { CardThumb } from "@/components/plastic-card";
import { VerificationBadge } from "@/components/data-confidence";
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  formatBin,
  resolveBin,
  type Category,
  type UCard,
} from "@/data/cards";
import { calcCard, effectiveFees, matchesScene, pickLevel } from "@/lib/calc";
import { useCatalog } from "@/lib/catalog";
import { useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cards")({ component: CardsPage });

type SortKey = "net" | "cashback" | "fees" | "risk" | "open";

function CardsPage() {
  const spend = useDesk((s) => s.spend);
  const bill = useDesk((s) => s.bill);
  const tier = useDesk((s) => s.tier);
  const includePhysicalFee = useDesk((s) => s.includePhysicalFee);
  const scene = useDesk((s) => s.scene);
  const selected = useDesk((s) => s.selected);
  const toggleSelected = useDesk((s) => s.toggleSelected);
  const all = useCatalog((s) => s.cards);

  const [status, setStatus] = useState<"live" | "restricted" | "all" | "archive">("live");
  const [category, setCategory] = useState<Category | "all">("all");
  const [apple, setApple] = useState(false);
  const [tw, setTw] = useState(false);
  const [usBin, setUsBin] = useState(false);
  const [hkBin, setHkBin] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sort, setSort] = useState<SortKey>("net");
  const [q, setQ] = useState("");

  const input = useMemo(
    () => ({ spend, bill, tier, includePhysicalFee }),
    [spend, bill, tier, includePhysicalFee],
  );
  const active = all.filter((c) => c.status !== "shutdown");
  const archive = all.filter((c) => c.status === "shutdown");

  const rows = useMemo(() => {
    let list: UCard[] =
      status === "archive"
        ? archive
        : status === "all"
          ? all
          : status === "restricted"
            ? active.filter((c) => c.status === "restricted")
            : active.filter((c) => c.status === "active");

    list = list.filter((c) => matchesScene(c, scene));
    if (category !== "all") list = list.filter((c) => c.category === category);
    if (apple) list = list.filter((c) => c.applePay);
    if (tw) list = list.filter((c) => c.regions?.includes("tw"));
    if (usBin)
      list = list.filter((c) => {
        const b = resolveBin(c).binCountry;
        return b === "us" || b === "pr";
      });
    if (hkBin) list = list.filter((c) => resolveBin(c).binCountry === "hk");
    if (verified) list = list.filter((c) => c.verification === "official");
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.nameEn.toLowerCase().includes(s) ||
          c.issuer.toLowerCase().includes(s) ||
          formatBin(c).toLowerCase().includes(s),
      );
    }

    const withResult = list.map((c) => ({
      card: c,
      result: c.status === "shutdown" ? null : calcCard(c, input),
    }));

    withResult.sort((a, b) => {
      if (sort === "risk") return b.card.risk - a.card.risk;
      if (sort === "open") {
        const aCost =
          effectiveFees(a.card, pickLevel(a.card, tier)).openingFeeUsd +
          (includePhysicalFee ? a.card.physicalFeeUsd : 0);
        const bCost =
          effectiveFees(b.card, pickLevel(b.card, tier)).openingFeeUsd +
          (includePhysicalFee ? b.card.physicalFeeUsd : 0);
        return aCost - bCost;
      }
      if (!a.result || !b.result) return a.result ? -1 : 1;
      if (sort === "cashback") return b.result.cashback - a.result.cashback;
      if (sort === "fees") return a.result.fees - b.result.fees;
      return b.result.net - a.result.net;
    });
    return withResult;
  }, [all, active, archive, status, category, apple, tw, usBin, hkBin, verified, q, scene, input, sort, includePhysicalFee, tier]);

  return (
    <Page>
      <LargeTitle eyebrow={`${rows.length} 张`}>卡库</LargeTitle>
      <Desk
        rail={
          <>
            <Fade>
              <div className="ios-card mb-4 rounded-[28px] p-4">
                <DeskControls dense />
              </div>
            </Fade>
            <Fade>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索卡名、发行方或 BIN"
                className="mb-3 h-12 w-full rounded-[16px] bg-surface px-4 text-[16px] text-fg shadow-[var(--shadow-card)] outline-none placeholder:text-subtle"
              />
            </Fade>
            <Group header="识别 BIN" footer="只填前 6–8 位。完整页在底部 BIN。" className="lg:mb-4">
              <BinLookup />
            </Group>
            <Fade>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(
                  [
                    ["live", "在运营"],
                    ["restricted", "受限"],
                    ["archive", "已停服"],
                    ["all", "全部"],
                  ] as const
                ).map(([k, label]) => (
                  <Chip key={k} on={status === k} onClick={() => setStatus(k)}>
                    {label}
                  </Chip>
                ))}
                <Chip on={apple} onClick={() => setApple((v) => !v)}>
                  Apple Pay
                </Chip>
                <Chip on={tw} onClick={() => setTw((v) => !v)}>
                  台湾可办
                </Chip>
                <Chip on={usBin} onClick={() => setUsBin((v) => !v)}>
                  美区 BIN
                </Chip>
                <Chip on={hkBin} onClick={() => setHkBin((v) => !v)}>
                  香港 BIN
                </Chip>
                <Chip on={verified} onClick={() => setVerified((v) => !v)}>
                  官方已核
                </Chip>
              </div>
              <div className="mb-4 flex flex-wrap gap-1.5 lg:mb-0">
                {(
                  [
                    ["all", "类型不限"],
                    ["exchange", CATEGORY_LABEL.exchange],
                    ["wallet", CATEGORY_LABEL.wallet],
                    ["defi", CATEGORY_LABEL.defi],
                    ["vcc", CATEGORY_LABEL.vcc],
                  ] as const
                ).map(([k, label]) => (
                  <Chip key={k} on={category === k} onClick={() => setCategory(k)}>
                    {label}
                  </Chip>
                ))}
                {(
                  [
                    ["net", "净收益"],
                    ["cashback", "返现"],
                    ["fees", "费用"],
                    ["open", "开卡费"],
                    ["risk", "风险"],
                  ] as const
                ).map(([k, label]) => (
                  <Chip key={k} on={sort === k} onClick={() => setSort(k)}>
                    {label}
                  </Chip>
                ))}
              </div>
            </Fade>
          </>
        }
      >
        <Fade>
          <div className="ios-card overflow-hidden rounded-[22px] lg:hidden">
            {rows.map(({ card, result }, i) => (
              <div key={card.slug}>
                {i > 0 && <div className="ml-14 h-px bg-border" />}
                <div className="flex items-center gap-2 py-2 pr-2 pl-3">
                  <CardThumb card={card} className="size-10 shrink-0 rounded-[12px]" />
                  <Link
                    to="/card/$slug"
                    params={{ slug: card.slug }}
                    className="min-w-0 flex-1 py-1 pressable"
                  >
                    <p className="truncate text-[16px] font-medium">{card.name}</p>
                    <div className="flex items-center gap-1.5 truncate text-[12px] text-subtle">
                      <span className="truncate">
                        {result?.levelName && card.levels && card.levels.length > 0
                          ? `${result.levelName} · `
                          : ""}
                        {formatBin(card)} · {STATUS_LABEL[card.status]}
                      </span>
                      <VerificationBadge card={card} compact />
                    </div>
                  </Link>
                  {result ? (
                    <NetFigure value={result.net} />
                  ) : (
                    <span className="text-[12px] text-loss">停服</span>
                  )}
                  <CompareBtn
                    on={selected.includes(card.slug)}
                    onClick={() => toggleSelected(card.slug)}
                  />
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="px-4 py-10 text-center text-[14px] text-muted">没有符合筛选的卡</p>
            )}
          </div>

          <div className="ios-card hidden overflow-hidden rounded-[22px] lg:block">
            <table className="kaheng-table">
              <thead>
                <tr>
                  <th>卡</th>
                  <th>类型</th>
                  <th>档位</th>
                  <th>消费 / FX</th>
                  <th>返现</th>
                  <th className="text-right">净收益</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ card, result }) => {
                  const fees = result
                    ? effectiveFees(card, pickLevel(card, tier, result.levelId))
                    : effectiveFees(card, pickLevel(card, tier));
                  return (
                    <tr key={card.slug}>
                      <td>
                        <Link
                          to="/card/$slug"
                          params={{ slug: card.slug }}
                          className="flex min-w-0 items-center gap-3 pressable"
                        >
                          <CardThumb card={card} className="size-10 shrink-0 rounded-[12px]" />
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-medium">{card.name}</span>
                            <span className="flex items-center gap-1.5 truncate text-[12px] text-subtle">
                              {formatBin(card)} · {STATUS_LABEL[card.status]}
                              <VerificationBadge card={card} compact />
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="text-[13px] text-muted">
                        {CATEGORY_LABEL[card.category]}
                      </td>
                      <td className="text-[13px] text-muted">{result?.levelName ?? "—"}</td>
                      <td className="font-mono text-[13px] tabular-nums text-muted">
                        {fees.spendFeePct}% / {fees.fxFeePct}%
                      </td>
                      <td className="font-mono text-[13px] tabular-nums text-muted">
                        {fees.cashbackPct}%
                      </td>
                      <td className="text-right">
                        {result ? (
                          <NetFigure value={result.net} />
                        ) : (
                          <span className="text-[12px] text-loss">停服</span>
                        )}
                      </td>
                      <td className="text-right">
                        <CompareBtn
                          on={selected.includes(card.slug)}
                          onClick={() => toggleSelected(card.slug)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="px-4 py-10 text-center text-[14px] text-muted">没有符合筛选的卡</p>
            )}
          </div>
        </Fade>
      </Desk>
    </Page>
  );
}

function CompareBtn({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="比较"
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
