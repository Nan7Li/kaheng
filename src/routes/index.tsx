import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { DeskControls } from "@/components/controls";
import { FeeStack } from "@/components/fee-stack";
import { Fade, Group, LargeTitle, Page } from "@/components/ios";
import { PlasticCard } from "@/components/plastic-card";
import { RankList } from "@/components/rank-list";
import { Button } from "@/components/ui/button";
import { DATA_AS_OF } from "@/data/cards";
import { METHOD_NOTES } from "@/data/events";
import { calcCard, formatUsd, matchesScene } from "@/lib/calc";
import { useCatalog } from "@/lib/catalog";
import { useDesk } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const spend = useDesk((s) => s.spend);
  const bill = useDesk((s) => s.bill);
  const tier = useDesk((s) => s.tier);
  const includePhysicalFee = useDesk((s) => s.includePhysicalFee);
  const scene = useDesk((s) => s.scene);
  const all = useCatalog((s) => s.cards);
  const input = { spend, bill, tier, includePhysicalFee };

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
      <LargeTitle eyebrow={`${DATA_AS_OF} · ${officiallyVerified} 张官方已核`}>对照</LargeTitle>
      <Fade>
        <p className="mb-5 max-w-md text-[17px] leading-relaxed text-muted">
          每刷一千美金，你到底赚还是亏。只把带出处的官方条款当成可信基线；未核验条目只作线索。
        </p>
      </Fade>

      <Fade>
        <div className="ios-card mb-6 rounded-[28px] p-4">
          <DeskControls />
        </div>
      </Fade>

      {leader && (
        <Fade>
          <div className="mb-6">
            <p className="mb-2 px-1 text-[13px] font-medium text-subtle">这一档第一</p>
            <Link to="/card/$slug" params={{ slug: leader.card.slug }} className="block">
              <PlasticCard card={leader.card} />
            </Link>
            <p className="mt-3 text-[20px] font-semibold tracking-tight">{leader.card.name}</p>
            <p className="mt-1 text-[14px] text-muted">{leader.card.summary}</p>
          </div>
        </Fade>
      )}

      <Fade>
        <p className="mb-2 px-1 text-[13px] font-medium text-subtle">净收益排行</p>
        <RankList cards={pool} input={input} limit={8} />
      </Fade>

      <Fade>
        <div className="mt-4 mb-6">
          <Button asChild variant="secondary" className="w-full">
            <Link to="/cards">
              全部 {all.filter((c) => c.status !== "shutdown").length} 张
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Fade>

      {leader && (
        <Group header="这一笔怎么拆">
          <div className="p-4">
            <FeeStack result={leader.result} />
          </div>
        </Group>
      )}

      <Fade>
        <div className="mb-6 grid grid-cols-3 gap-2">
          <Stat label="在运营" value={`${live.length}`} />
          <Stat
            label="头尾差"
            value={leader && loser ? formatUsd(leader.result.net - loser.result.net, 0) : "—"}
          />
          <Stat label="已停服" value={`${archive.length}`} />
        </div>
      </Fade>

      <Group header="怎么折">
        {METHOD_NOTES.map((n, i) => (
          <div key={n}>
            {i > 0 && <div className="ml-4 h-px bg-border" />}
            <p className="px-4 py-3 text-[14px] leading-relaxed text-muted">{n}</p>
          </div>
        ))}
      </Group>

      <Group>
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
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ios-card rounded-[20px] px-3 py-3">
      <p className="text-[11px] text-subtle">{label}</p>
      <p className="mt-1 font-mono text-[18px] tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
