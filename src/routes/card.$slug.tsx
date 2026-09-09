import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, GitCompareArrows, Pencil } from "lucide-react";
import { FeeStack } from "@/components/fee-stack";
import { Fade, Group, LargeTitle, Page, Row } from "@/components/ios";
import { NetFigure } from "@/components/net-figure";
import { PlasticCard } from "@/components/plastic-card";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_LABEL,
  CUSTODY_LABEL,
  KYC_LABEL,
  SCENE_LABEL,
  STATUS_LABEL,
} from "@/data/cards";
import { calcCard } from "@/lib/calc";
import { useCard } from "@/lib/catalog";
import { useDesk } from "@/lib/store";

export const Route = createFileRoute("/card/$slug")({ component: CardDetail });

function CardDetail() {
  const { slug } = Route.useParams();
  const card = useCard(slug);
  const spend = useDesk((s) => s.spend);
  const bill = useDesk((s) => s.bill);
  const tier = useDesk((s) => s.tier);
  const selected = useDesk((s) => s.selected);
  const toggleSelected = useDesk((s) => s.toggleSelected);

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

  const result = card.status === "shutdown" ? null : calcCard(card, { spend, bill, tier });
  const facts: Array<[string, string]> = [
    ["卡组织", card.network ? card.network.toUpperCase() : "—"],
    ["形态", card.form === "both" ? "虚拟 + 实体" : card.form === "virtual" ? "仅虚拟" : "实体为主"],
    ["托管", CUSTODY_LABEL[card.custody] ?? "—"],
    ["KYC", KYC_LABEL[card.kyc] ?? "—"],
    ["类型", CATEGORY_LABEL[card.category] ?? "—"],
    ["Apple Pay", card.applePay ? "支持" : "不支持"],
    ["Google Pay", card.googlePay ? "支持" : "不支持"],
    ["开卡费", `$${card.openingFeeUsd ?? 0}`],
    ["充值费", `${card.topupFeePct ?? 0}%`],
    ["消费费", `${card.spendFeePct ?? 0}%`],
    ["FX", `${card.fxFeePct ?? 0}%`],
    ["入门返现", `${card.cashbackPct ?? 0}%`],
    ["进阶返现", `${card.cashbackPctHigh ?? 0}%`],
    ["风险", `${card.risk ?? "—"}/5`],
  ];

  return (
    <Page>
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
        <Group header="按当前口径">
          <div className="px-4 py-4">
            <p className="text-[12px] text-subtle">
              ${spend.toLocaleString()} · {bill === "usd" ? "美元" : "本地货币"} ·{" "}
              {tier === "entry" ? "入门档" : "进阶档"}
            </p>
            <div className="mt-1">
              <NetFigure value={result.net} size="lg" />
            </div>
            <div className="mt-4">
              <FeeStack result={result} />
            </div>
          </div>
        </Group>
      )}

      <Fade>
        <div className="mb-6 flex gap-2">
          <Button
            className="flex-1"
            variant={selected.includes(card.slug) ? "default" : "secondary"}
            onClick={() => toggleSelected(card.slug)}
          >
            <GitCompareArrows className="size-4" />
            {selected.includes(card.slug) ? "已在比较" : "加入比较"}
          </Button>
          <Button asChild variant="secondary" size="icon" aria-label="编辑">
            <Link to="/admin/$slug" params={{ slug: card.slug }}>
              <Pencil className="size-4" />
            </Link>
          </Button>
          {card.url && (
            <Button asChild variant="secondary" size="icon" aria-label="官网">
              <a href={card.url} target="_blank" rel="noreferrer noopener">
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
          )}
        </div>
      </Fade>

      <Group header="条款">
        {facts.map(([k, v], i) => (
          <div key={k}>
            {i > 0 && <div className="ml-4 h-px bg-border" />}
            <Row label={k}>
              <span className="text-[15px] text-muted">{v}</span>
            </Row>
          </div>
        ))}
      </Group>

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
    </Page>
  );
}
