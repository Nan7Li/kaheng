import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Copy, GitCompareArrows, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FeeStack } from "@/components/fee-stack";
import { SourcePanel } from "@/components/data-confidence";
import { Chip, Desk, Fade, Group, LargeTitle, Page } from "@/components/ios";
import { NetFigure } from "@/components/net-figure";
import { PlasticCard } from "@/components/plastic-card";
import { Button } from "@/components/ui/button";
import { XPostList } from "@/components/x-post-card";
import {
  CATEGORY_LABEL,
  CUSTODY_LABEL,
  KYC_LABEL,
  SCENE_LABEL,
  STATUS_LABEL,
  formatBin,
} from "@/data/cards";
import { calcCard, effectiveFees, feesVaryByLevel, formatUsd, pickLevel, resolveLevels } from "@/lib/calc";
import { useCard } from "@/lib/catalog";
import { cardMoney } from "@/lib/money";
import { formatAssetAmount, SETTLEMENT_LABEL } from "@/lib/rates";
import { postsForCard, usePosts } from "@/lib/posts";
import { useCalcInput, useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/card/$slug")({ component: CardDetail });

function CardDetail() {
  const { slug } = Route.useParams();
  const card = useCard(slug);
  const input = useCalcInput();
  const spend = input.spend;
  const merchant = input.merchant;
  const asset = input.asset;
  const tier = input.tier;
  const includePhysicalFee = input.includePhysicalFee;
  const selected = useDesk((s) => s.selected);
  const toggleSelected = useDesk((s) => s.toggleSelected);
  const [levelId, setLevelId] = useState<string | null>(null);
  const posts = usePosts((s) => s.posts);
  const hydratePosts = usePosts((s) => s.hydrate);

  useEffect(() => {
    hydratePosts();
  }, [hydratePosts]);

  if (!card) {
    return (
      <Page>
        <LargeTitle>找不到这张卡</LargeTitle>
        <Fade>
          <Button asChild className="w-full">
            <Link to="/cards">回到卡库</Link>
          </Button>
        </Fade>
      </Page>
    );
  }

  const levels = resolveLevels(card);
  const activeId = levels.some((l) => l.id === levelId)
    ? (levelId as string)
    : pickLevel(card, tier).id;
  const active = levels.find((l) => l.id === activeId) ?? levels[0]!;
  const fees = effectiveFees(card, active);
  const result =
    card.status === "shutdown"
      ? null
      : calcCard(card, { ...input, levelId: activeId });
  const wearVaries = feesVaryByLevel(card);
  const inCompare = selected.includes(card.slug);
  const cardSlug = card.slug;
  const cardUrl = card.url;
  const money = cardMoney(card);
  const facts: Array<[string, string]> = [
    ["卡 BIN", formatBin(card)],
    ["卡组织", card.network ? card.network.toUpperCase() : "—"],
    ["形态", card.form === "both" ? "虚拟 + 实体" : card.form === "virtual" ? "仅虚拟" : "实体为主"],
    ["托管", CUSTODY_LABEL[card.custody] ?? "—"],
    ["KYC", KYC_LABEL[card.kyc] ?? "—"],
    ["类型", CATEGORY_LABEL[card.category] ?? "—"],
    ["Apple Pay", card.applePay ? "支持" : "不支持"],
    ["Google Pay", card.googlePay ? "支持" : "不支持"],
    ["结算币", SETTLEMENT_LABEL[money.settlement]],
    ["扣款币", money.nativeAsset],
    ["锚定", money.peg === "one-to-one" ? "官方 1:1" : "市价"],
    ["开卡费", `$${fees.openingFeeUsd}`],
    ["实体卡费", `$${card.physicalFeeUsd ?? 0}`],
    ["年费", `$${fees.annualFeeUsd}`],
    ["月费", `$${fees.monthlyFeeUsd}`],
    ["充值费", `${fees.topupFeePct}%`],
    ["币种转换", `${card.cryptoConversionFeePct ?? 0}%`],
    ["消费费", `${fees.spendFeePct}%`],
    ["FX", `${fees.fxFeePct}%`],
    ["返现", `${fees.cashbackPct}%`],
    ["风险", `${card.risk ?? "—"}/5`],
  ];

  function Actions({ className }: { className?: string }) {
    return (
      <Fade>
        <div className={cn("mb-6 flex gap-2", className)}>
          <Button
            className="flex-1"
            variant={inCompare ? "default" : "secondary"}
            onClick={() => toggleSelected(cardSlug)}
          >
            <GitCompareArrows className="size-4" />
            {inCompare ? "已在比较" : "加入比较"}
          </Button>
          <Button asChild variant="secondary" size="icon" aria-label="编辑">
            <Link to="/admin/$slug" params={{ slug: cardSlug }}>
              <Pencil className="size-4" />
            </Link>
          </Button>
          {cardUrl && (
            <Button asChild variant="secondary" size="icon" aria-label="官网">
              <a href={cardUrl} target="_blank" rel="noreferrer noopener">
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
          )}
        </div>
      </Fade>
    );
  }

  return (
    <Page>
      <Desk
        rail={
          <>
            <Fade>
              <p className="text-[15px] font-medium text-accent">
                <Link to="/cards">卡库</Link>
              </p>
            </Fade>
            <LargeTitle>{card.name}</LargeTitle>
            <Fade>
              <p className="mb-4 text-[15px] text-subtle">{card.nameEn}</p>
              <PlasticCard card={card} className="mb-4" />
              <p className="mb-4 text-[15px] leading-relaxed text-muted">{card.summary}</p>
            </Fade>
            {result && (
              <div className="mb-4 hidden lg:block">
                <p className="text-[12px] text-subtle">
                  ${spend.toLocaleString()} · {merchant} · {asset} · {active.name}
                  {result.promoActive ? " · 活动消费费" : ""}
                </p>
                <p className="text-[12px] text-subtle">
                  实扣 {formatAssetAmount(result.assetSpent, result.asset)} · {SETTLEMENT_LABEL[money.settlement]}
                </p>
                <div className="mt-1">
                  <NetFigure value={result.net} size="lg" />
                </div>
              </div>
            )}
            <Actions className="hidden lg:flex" />
          </>
        }
      >
        {levels.length > 1 && (
          <Group
            header="档位"
            footer={wearVaries ? "这一张卡换档不只改返现，消费费、FX、月费也会变。" : "这一张卡各档磨损相同，差别主要在返现和封顶。"}
          >
            <div className="flex flex-wrap gap-1.5 px-4 py-3">
              {levels.map((l) => (
                <Chip key={l.id} on={l.id === activeId} onClick={() => setLevelId(l.id)}>
                  {l.name}
                </Chip>
              ))}
            </div>
          </Group>
        )}

        {result && (
          <Group header="按当前口径">
            <div className="px-4 py-4">
              <p className="text-[12px] text-subtle lg:hidden">
                ${spend.toLocaleString()} · {merchant} · {asset} · {active.name}
                {result.promoActive ? " · 活动消费费" : ""}
              </p>
              <p className="text-[12px] text-subtle lg:hidden">
                实扣 {formatAssetAmount(result.assetSpent, result.asset)}
              </p>
              <div className="mt-1 lg:hidden">
                <NetFigure value={result.net} size="lg" />
              </div>
              <div className="mt-4 lg:mt-0">
                <FeeStack result={result} />
              </div>
            </div>
          </Group>
        )}

        {levels.length > 1 && card.status !== "shutdown" && (
          <Group header="各档对照" footer="同一消费额下，每一档自己的磨损和返现。">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-[13px]">
                <thead>
                  <tr className="text-[11px] text-subtle">
                    <th className="px-4 py-2 font-medium">档位</th>
                    <th className="px-2 py-2 font-medium">消费</th>
                    <th className="px-2 py-2 font-medium">FX</th>
                    <th className="px-2 py-2 font-medium">月/年</th>
                    <th className="px-2 py-2 font-medium">返现</th>
                    <th className="px-4 py-2 text-right font-medium">本月净</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((l) => {
                    const f = effectiveFees(card, l);
                    const r = calcCard(card, { ...input, levelId: l.id });
                    const on = l.id === activeId;
                    return (
                      <tr
                        key={l.id}
                        className={cn("cursor-pointer pressable", on && "bg-surface-2")}
                        onClick={() => setLevelId(l.id)}
                      >
                        <td className="px-4 py-2.5 font-medium">{l.name}</td>
                        <td className="px-2 py-2.5 tabular-nums text-muted">{f.spendFeePct}%</td>
                        <td className="px-2 py-2.5 tabular-nums text-muted">{f.fxFeePct}%</td>
                        <td className="px-2 py-2.5 tabular-nums text-muted">
                          {f.monthlyFeeUsd > 0
                            ? `$${f.monthlyFeeUsd}/月`
                            : f.annualFeeUsd > 0
                              ? `$${f.annualFeeUsd}/年`
                              : "—"}
                        </td>
                        <td className="px-2 py-2.5 tabular-nums text-muted">{f.cashbackPct}%</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={r.net >= 0 ? "text-gain" : "text-loss"}>{formatUsd(r.net)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Group>
        )}

        <Actions className="lg:hidden" />

        <Group header="条款">
          <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-y-0 lg:gap-px lg:bg-border xl:grid-cols-4">
            {facts.map(([k, v]) => (
              <div
                key={k}
                className="flex min-h-12 items-center justify-between gap-3 bg-surface px-4 py-2.5"
              >
                <span className="shrink-0 text-[13px] text-subtle">{k}</span>
                <span className="truncate text-[15px] text-fg">{v}</span>
              </div>
            ))}
          </div>
        </Group>

        <Group header="数据可信度">
          <SourcePanel card={card} />
        </Group>

        <Group
          header="邀请"
          footer="这里只放你自己填的码和链接。卡衡不抽成，也没有默认返佣。"
        >
          <InviteRow
            label="邀请码"
            value={card.inviteCode}
            empty="在管理页填自己的码"
          />
          <div className="ml-4 h-px bg-border" />
          <InviteRow
            label="邀请链接"
            value={card.inviteUrl}
            href={card.inviteUrl}
            empty="在管理页贴自己的链接"
          />
        </Group>

        <Group
          header="相关文章"
          footer="从「X 文章」页添加，把帖子挂到这张卡。"
        >
          <XPostList
            posts={postsForCard(posts, card.slug)}
            empty="还没有挂文章。去 X 文章页贴链接。"
          />
        </Group>

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6">
          <Group header="优点">
            {(card.pros?.length ? card.pros : ["—"]).map((p, i) => (
              <div key={p}>
                {i > 0 && <div className="ml-4 h-px bg-border" />}
                <p className="px-4 py-3 text-[15px] text-fg">{p}</p>
              </div>
            ))}
          </Group>
          <Group header="缺点">
            {(card.cons ?? []).map((p, i) => (
              <div key={p}>
                {i > 0 && <div className="ml-4 h-px bg-border" />}
                <p className="px-4 py-3 text-[15px] text-fg">{p}</p>
              </div>
            ))}
          </Group>
        </div>

        <Group header="备注" footer={`更新 ${card.updatedAt} · ${STATUS_LABEL[card.status] ?? card.status}`}>
          <p className="px-4 py-3 text-[14px] leading-relaxed text-muted">
            {card.cashbackNote}
            {card.statusNote ? ` ${card.statusNote}` : ""}
            {card.riskNote ? ` ${card.riskNote}` : ""}
          </p>
          {card.scenes && card.scenes.length > 0 && (
            <>
              <div className="ml-4 h-px bg-border" />
              <p className="px-4 py-3 text-[14px] text-muted">
                {card.scenes.map((s) => SCENE_LABEL[s] ?? s).join(" · ")}
              </p>
            </>
          )}
        </Group>
      </Desk>
    </Page>
  );
}

function InviteRow({
  label,
  value,
  href,
  empty,
}: {
  label: string;
  value?: string;
  href?: string;
  empty: string;
}) {
  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success("已复制");
    } catch {
      toast.error("复制失败");
    }
  }

  return (
    <div className="flex min-h-12 items-center gap-3 px-4 py-2.5">
      <span className="w-[5.5rem] shrink-0 text-[13px] text-subtle">{label}</span>
      {value ? (
        href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="min-w-0 flex-1 truncate text-[15px] text-accent"
          >
            {value}
          </a>
        ) : (
          <span className="min-w-0 flex-1 truncate font-mono text-[15px]">{value}</span>
        )
      ) : (
        <span className="min-w-0 flex-1 text-[15px] text-subtle">{empty}</span>
      )}
      {value && (
        <button type="button" onClick={() => void copy()} className="shrink-0 text-accent pressable" aria-label="复制">
          <Copy className="size-4" />
        </button>
      )}
    </div>
  );
}
