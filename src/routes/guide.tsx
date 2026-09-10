import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Chip, Fade, Group, LargeTitle, Page } from "@/components/ios";
import { PlasticCard } from "@/components/plastic-card";
import { Badge } from "@/components/ui/badge";
import { type Scene, type UCard } from "@/data/cards";
import { calcCard, effectiveFees, pickLevel } from "@/lib/calc";
import { useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/guide")({ component: GuidePage });

type Q1 = Scene;
type Q2 = "low" | "mid" | "high";
type Q3 = "easy" | "ok" | "hard";
type Q4 = "fee" | "reward" | "custody";

function scoreCard(card: UCard, a: Q1, b: Q2, c: Q3, d: Q4): number {
  let s = 0;
  if (card.scenes?.includes(a)) s += 4;
  if (a === "apple" && card.applePay) s += 3;
  if (a === "daily" && card.regions?.includes("tw")) s += 2;
  const spend = b === "low" ? 300 : b === "mid" ? 1000 : 4000;
  const net = calcCard(card, {
    spend,
    bill: a === "daily" ? "local" : "usd",
    tier: d === "reward" ? "boost" : "entry",
  }).net;
  s += net / 8;
  if (c === "easy" && (card.kyc === "none" || card.kyc === "basic" || card.kyc === "passport")) s += 2;
  if (c === "hard" && card.kyc === "full") s -= 3;
  if (d === "fee") {
    const f = effectiveFees(card, pickLevel(card, "entry"));
    s += 4 - (f.topupFeePct + (card.cryptoConversionFeePct ?? 0) + f.spendFeePct + f.fxFeePct);
  }
  if (d === "reward") s += effectiveFees(card, pickLevel(card, "boost")).cashbackPct;
  if (d === "custody" && card.custody === "self-custody") s += 5;
  if (d === "custody" && card.custody === "hybrid") s += 2;
  if (
    !card.regions?.includes("tw") &&
    !card.regions?.includes("global") &&
    !card.regions?.includes("apac")
  )
    s -= 6;
  s -= card.risk ?? 0;
  return s;
}

function GuidePage() {
  const [q1, setQ1] = useState<Q1>("ai");
  const [q2, setQ2] = useState<Q2>("mid");
  const [q3, setQ3] = useState<Q3>("ok");
  const [q4, setQ4] = useState<Q4>("fee");
  const cards = useCatalog((s) => s.cards);

  const picks = useMemo(() => {
    const live = cards.filter((c) => c.status === "active");
    return live
      .map((card) => ({ card, score: scoreCard(card, q1, q2, q3, q4) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [cards, q1, q2, q3, q4]);

  return (
    <Page>
      <LargeTitle eyebrow="四个问题">先想清楚再办</LargeTitle>
      <Fade>
        <p className="mb-5 max-w-xl text-[15px] leading-relaxed text-muted">
          不是测评榜。把场景、额度和能做的 KYC 对上公开条款。管理页改过的卡也会参与推荐。
        </p>
      </Fade>

      <div className="lg:mb-6 lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-4">
        <Group header="主要用在哪？" className="lg:mb-0">
          <div className="flex flex-wrap gap-1.5 px-4 py-3">
            {(
              [
                ["ai", "AI / 订阅"],
                ["daily", "日常消费"],
                ["apple", "Apple 生态"],
                ["ads", "广告投放"],
                ["offramp", "把 U 花出去"],
              ] as const
            ).map(([k, label]) => (
              <Chip key={k} on={q1 === k} onClick={() => setQ1(k)}>
                {label}
              </Chip>
            ))}
          </div>
        </Group>

        <Group header="一个月大概刷多少？" className="lg:mb-0">
          <div className="flex flex-wrap gap-1.5 px-4 py-3">
            {(
              [
                ["low", "不到 $500"],
                ["mid", "大约 $1,000"],
                ["high", "$3,000 以上"],
              ] as const
            ).map(([k, label]) => (
              <Chip key={k} on={q2 === k} onClick={() => setQ2(k)}>
                {label}
              </Chip>
            ))}
          </div>
        </Group>

        <Group header="KYC 你能做到哪一步？" className="lg:mb-0">
          <div className="flex flex-wrap gap-1.5 px-4 py-3">
            {(
              [
                ["easy", "护照或基础信息"],
                ["ok", "身份证可以"],
                ["hard", "不想交地址证明"],
              ] as const
            ).map(([k, label]) => (
              <Chip key={k} on={q3 === k} onClick={() => setQ3(k)}>
                {label}
              </Chip>
            ))}
          </div>
        </Group>

        <Group header="更在意什么？" className="lg:mb-0">
          <div className="flex flex-wrap gap-1.5 px-4 py-3">
            {(
              [
                ["fee", "费率干净"],
                ["reward", "返现尽量高"],
                ["custody", "钱不要放交易所"],
              ] as const
            ).map(([k, label]) => (
              <Chip key={k} on={q4 === k} onClick={() => setQ4(k)}>
                {label}
              </Chip>
            ))}
          </div>
        </Group>
      </div>

      <p className="mb-2 px-1 text-[13px] font-medium text-subtle">这一组更合适</p>
      <ol className="mb-6 flex flex-col gap-3 lg:grid lg:grid-cols-3">
        {picks.map((p, i) => (
          <Fade key={p.card.slug}>
            <Link
              to="/card/$slug"
              params={{ slug: p.card.slug }}
              className="ios-card block rounded-[22px] p-3 pressable"
            >
              <div className="mb-3 flex items-center justify-between text-[12px] text-subtle">
                <span className="font-mono tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {i === 0 && <Badge tone="accent">首选</Badge>}
              </div>
              <PlasticCard card={p.card} compact />
              <p className="mt-3 text-[16px] font-medium">{p.card.name}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{p.card.summary}</p>
            </Link>
          </Fade>
        ))}
      </ol>

      <Group header="三条经验" className="lg:hidden">
        <Rule n="01" title="入门档才是你的档" body="广告 10% 通常绑 VVIP、锁仓或月封顶。按最低持续返现算。" />
        <div className="ml-4 h-px bg-border" />
        <Rule n="02" title="本地货币账单最伤" body="台币、港币消费会叠 FX。美元订阅用美元账单卡，日常另算。" />
        <div className="ml-4 h-px bg-border" />
        <Rule n="03" title="额度只放亏得起的" body="一年半停了十几家。订阅隔离，不要当主钱包。" />
      </Group>

      <div className="mb-6 hidden gap-4 lg:grid lg:grid-cols-3">
        <RuleCard n="01" title="入门档才是你的档" body="广告 10% 通常绑 VVIP、锁仓或月封顶。按最低持续返现算。" />
        <RuleCard n="02" title="本地货币账单最伤" body="台币、港币消费会叠 FX。美元订阅用美元账单卡，日常另算。" />
        <RuleCard n="03" title="额度只放亏得起的" body="一年半停了十几家。订阅隔离，不要当主钱包。" />
      </div>
    </Page>
  );
}

function Rule({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="px-4 py-3">
      <p className="font-mono text-[12px] text-subtle">{n}</p>
      <p className="mt-1 text-[16px] font-medium">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function RuleCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="ios-card rounded-[22px] px-5 py-4">
      <p className="font-mono text-[12px] text-subtle">{n}</p>
      <p className="mt-1 text-[16px] font-medium">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}
