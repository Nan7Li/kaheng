import { createFileRoute, Link } from "@tanstack/react-router";
import { DeskControls } from "@/components/controls";
import { FeeStack } from "@/components/fee-stack";
import { Divider, Fade, Group, LargeTitle, Page } from "@/components/ios";
import { NetFigure } from "@/components/net-figure";
import { PlasticCard } from "@/components/plastic-card";
import { Button } from "@/components/ui/button";
import { CUSTODY_LABEL, KYC_LABEL, STATUS_LABEL, type UCard } from "@/data/cards";
import { calcCard } from "@/lib/calc";
import { useCatalog } from "@/lib/catalog";
import { useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({ component: ComparePage });

const ROWS: Array<{ label: string; render: (c: UCard) => string }> = [
  { label: "发行方", render: (c) => c.issuer || "—" },
  { label: "网络", render: (c) => (c.network ? c.network.toUpperCase() : "—") },
  {
    label: "形态",
    render: (c) =>
      c.form === "both" ? "虚拟 + 实体" : c.form === "virtual" ? "仅虚拟" : "实体为主",
  },
  { label: "托管", render: (c) => CUSTODY_LABEL[c.custody] ?? "—" },
  { label: "KYC", render: (c) => KYC_LABEL[c.kyc] ?? "—" },
  { label: "Apple Pay", render: (c) => (c.applePay ? "支持" : "不支持") },
  { label: "开卡费", render: (c) => `$${c.openingFeeUsd ?? 0}` },
  { label: "充值费", render: (c) => `${c.topupFeePct ?? 0}%` },
  { label: "消费费", render: (c) => `${c.spendFeePct ?? 0}%` },
  { label: "FX", render: (c) => `${c.fxFeePct ?? 0}%` },
  {
    label: "返现",
    render: (c) =>
      c.cashbackPct === c.cashbackPctHigh
        ? `${c.cashbackPct ?? 0}%`
        : `${c.cashbackPct ?? 0}%–${c.cashbackPctHigh ?? 0}%`,
  },
  { label: "风险", render: (c) => `${c.risk ?? "—"}/5` },
];

function ComparePage() {
  const selected = useDesk((s) => s.selected);
  const spend = useDesk((s) => s.spend);
  const bill = useDesk((s) => s.bill);
  const tier = useDesk((s) => s.tier);
  const toggle = useDesk((s) => s.toggleSelected);
  const cards = useCatalog((s) => s.cards);
  const input = { spend, bill, tier };
  const picked = selected
    .map((slug) => cards.find((c) => c.slug === slug))
    .filter((c): c is UCard => Boolean(c));

  if (picked.length === 0) {
    return (
      <Page>
        <LargeTitle eyebrow="比较">还没有放进比较栏的卡</LargeTitle>
        <Fade>
          <p className="mb-5 text-[15px] leading-relaxed text-muted">
            在对照或卡库里点比较，最多三张并排。改过的费率会跟过来。
          </p>
          <Button asChild className="w-full">
            <Link to="/cards">去选卡</Link>
          </Button>
        </Fade>
      </Page>
    );
  }

  return (
    <Page className="max-w-5xl">
      <LargeTitle eyebrow="同一口径">并排对照</LargeTitle>
      <Fade>
        <p className="mb-5 text-[15px] leading-relaxed text-muted">
          去掉某张，或回卡库再加。管理页改过的数字会立刻出现在这里。
        </p>
      </Fade>

      <Fade>
        <div className="ios-card mb-6 rounded-[28px] p-4">
          <DeskControls dense />
        </div>
      </Fade>

      <div
        className={cn(
          "mb-6 grid gap-3",
          picked.length === 1 && "grid-cols-1",
          picked.length === 2 && "grid-cols-1 sm:grid-cols-2",
          picked.length >= 3 && "grid-cols-1 sm:grid-cols-3",
        )}
      >
        {picked.map((card) => {
          const result = card.status === "shutdown" ? null : calcCard(card, input);
          return (
            <div key={card.slug} className="ios-card min-w-0 rounded-[22px] p-3">
              <PlasticCard card={card} compact />
              <div className="mt-3 flex items-start justify-between gap-2">
                <Link
                  to="/card/$slug"
                  params={{ slug: card.slug }}
                  className="min-w-0 truncate text-[16px] font-semibold"
                >
                  {card.name}
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(card.slug)}
                  className="shrink-0 text-[13px] text-accent pressable"
                >
                  移除
                </button>
              </div>
              <p className="mt-0.5 text-[12px] text-subtle">{STATUS_LABEL[card.status]}</p>
              {result ? (
                <div className="mt-3">
                  <NetFigure value={result.net} size="lg" />
                  <p className="mt-1 text-[12px] text-subtle">每月净收益</p>
                  <div className="mt-3">
                    <FeeStack result={result} />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[14px] text-loss">已停服，不计净收益。</p>
              )}
            </div>
          );
        })}
      </div>

      <Group header="条款对照">
        {ROWS.map((row, i) => (
          <div key={row.label}>
            {i > 0 && <Divider />}
            <div className="px-4 py-3">
              <p className="text-[12px] text-subtle">{row.label}</p>
              <div
                className="mt-1 grid gap-2"
                style={{ gridTemplateColumns: `repeat(${picked.length}, minmax(0, 1fr))` }}
              >
                {picked.map((c) => (
                  <p key={c.slug} className="truncate text-[15px] font-medium">
                    {row.render(c)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </Group>
    </Page>
  );
}
