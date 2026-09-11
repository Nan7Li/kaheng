import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { DeskControls } from "@/components/controls";
import { FeeStack } from "@/components/fee-stack";
import { Desk, Fade, Group, LargeTitle, Page } from "@/components/ios";
import { NetFigure } from "@/components/net-figure";
import { PlasticCard } from "@/components/plastic-card";
import { RankList } from "@/components/rank-list";
import { RateBoard } from "@/components/rate-board";
import { Button } from "@/components/ui/button";
import { DATA_AS_OF } from "@/data/cards";
import { METHOD_NOTES } from "@/data/events";
import { calcCard, formatUsd, matchesScene } from "@/lib/calc";
import { useCatalog } from "@/lib/catalog";
import { useCalcInput, useDesk } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const scene = useDesk((s) => s.scene);
  const all = useCatalog((s) => s.cards);
  const input = useCalcInput();

  const live = all.filter((c) => c.status === "active");
  const officiallyVerified = live.filter((c) => c.verification === "official").length;
  const archive = all.filter((c) => c.status === "shutdown");
  const pool = live.filter((c) => matchesScene(c, scene));
  const ranked = [...pool]
    .map((c) => ({ card: c, result: calcCard(c, input) }))
    .sort((a, b) => b.result.net - a.result.net);
  const leader = ranked[0];
  const loser = ranked[ranked.length - 1];

  return (
    <Page>
      <LargeTitle
        eyebrow={`${DATA_AS_OF} · ${officiallyVerified} 张官方已核`}
        trailing={
          <div className="hidden gap-2 lg:flex">
            <Stat label="在运营" value={`${live.length}`} compact />
            <Stat
              label="头尾差"
              value={leader && loser ? formatUsd(leader.result.net - loser.result.net, 0) : "—"}
              compact
            />
            <Stat label="已停服" value={`${archive.length}`} compact />
          </div>
        }
      >
        对照
      </LargeTitle>
      <Fade>
        <p className="mb-5 max-w-xl text-[17px] leading-relaxed text-muted lg:mb-6">
          每刷一千美金，按账单货币和支付币的实时价折算。1 USDT 不等于 1 美元；欧元卡按欧元结算。
        </p>
      </Fade>

      <Desk
        rail={
          <Fade>
            <div className="mb-4 lg:mb-5">
              <RateBoard />
            </div>
            <div className="ios-card mb-6 rounded-[28px] p-4 lg:mb-0">
              <DeskControls />
            </div>
          </Fade>
        }
      >
        {leader && (
          <Fade>
            <div className="mb-6 lg:ios-card lg:rounded-[28px] lg:p-5">
              <p className="mb-2 px-1 text-[13px] font-medium text-subtle lg:px-0">这一档第一</p>
              <div className="lg:grid lg:grid-cols-[minmax(13rem,16.5rem)_minmax(0,1fr)] lg:items-center lg:gap-6 xl:grid-cols-[minmax(13rem,16.5rem)_minmax(0,1fr)_minmax(13rem,17rem)]">
                <Link to="/card/$slug" params={{ slug: leader.card.slug }} className="block">
                  <PlasticCard card={leader.card} />
                </Link>
                <div className="mt-3 lg:mt-0">
                  <p className="text-[20px] font-semibold tracking-tight">{leader.card.name}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted">{leader.card.summary}</p>
                  <div className="mt-3 hidden lg:block">
                    <p className="text-[12px] text-subtle">
                      {leader.result.levelName}
                      {leader.result.promoActive ? " · 活动消费费" : ""}
                    </p>
                    <NetFigure value={leader.result.net} size="lg" />
                  </div>
                </div>
                <div className="mt-4 hidden lg:col-span-2 lg:block xl:col-span-1 xl:mt-0">
                  <FeeStack result={leader.result} />
                </div>
              </div>
            </div>
          </Fade>
        )}

        <Fade>
          <p className="mb-2 px-1 text-[13px] font-medium text-subtle">净收益排行</p>
          <RankList cards={pool} input={input} limit={8} />
        </Fade>

        <Fade>
          <div className="mt-4 mb-6 lg:mt-3">
            <Button asChild variant="secondary" className="w-full lg:w-auto">
              <Link to="/cards">
                全部 {all.filter((c) => c.status !== "shutdown").length} 张
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Fade>

        {leader && (
          <Group header="这一笔怎么拆" className="lg:hidden">
            <div className="p-4">
              <FeeStack result={leader.result} />
            </div>
          </Group>
        )}

        <Fade>
          <div className="mb-6 grid grid-cols-3 gap-2 lg:hidden">
            <Stat label="在运营" value={`${live.length}`} />
            <Stat
              label="头尾差"
              value={leader && loser ? formatUsd(leader.result.net - loser.result.net, 0) : "—"}
            />
            <Stat label="已停服" value={`${archive.length}`} />
          </div>
        </Fade>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          <Group header="怎么折">
            {METHOD_NOTES.map((n, i) => (
              <div key={n}>
                {i > 0 && <div className="ml-4 h-px bg-border" />}
                <p className="px-4 py-3 text-[14px] leading-relaxed text-muted">{n}</p>
              </div>
            ))}
          </Group>

          <Group>
            <Link to="/posts" className="flex min-h-12 items-center justify-between px-4 pressable">
              <span className="text-[16px]">X 文章</span>
              <ArrowRight className="size-4 text-subtle" />
            </Link>
            <div className="ml-4 h-px bg-border" />
            <Link to="/bin" className="flex min-h-12 items-center justify-between px-4 pressable">
              <span className="text-[16px]">识别卡 BIN</span>
              <ArrowRight className="size-4 text-subtle" />
            </Link>
            <div className="ml-4 h-px bg-border" />
            <Link to="/admin" className="flex min-h-12 items-center justify-between px-4 pressable">
              <span className="text-[16px]">管理卡资料</span>
              <ArrowRight className="size-4 text-subtle" />
            </Link>
            <div className="ml-4 h-px bg-border" />
            <Link to="/risks" className="flex min-h-12 items-center justify-between px-4 pressable">
              <span className="text-[16px]">停服备忘</span>
              <ArrowRight className="size-4 text-subtle" />
            </Link>
          </Group>
        </div>
      </Desk>
    </Page>
  );
}

function Stat({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "ios-card min-w-[5.5rem] rounded-[16px] px-3 py-2" : "ios-card rounded-[20px] px-3 py-3"}>
      <p className="text-[11px] text-subtle">{label}</p>
      <p className="mt-0.5 font-mono text-[18px] tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
