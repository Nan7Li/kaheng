import {
  CATEGORY_LABEL,
  CUSTODY_LABEL,
  DATA_AS_OF,
  KYC_LABEL,
  SCENE_LABEL,
  STATUS_LABEL,
  type Scene,
  type UCard,
  CARDS,
} from "../data/cards.ts";
import { calcCard, formatPct, formatUsd, type Bill, type Tier } from "./calc.ts";

export const API_VERSION = "1.0.0";
export const SITE_URL = "https://card.stelloras.com";

const ALIASES: Record<string, string> = {
  plsama: "plasma",
  plasmaone: "plasma",
  "plasma-one": "plasma",
  "plasma one": "plasma",
  etherfi: "etherfi",
  "ether.fi": "etherfi",
  etherficash: "etherfi",
  "ether.fi cash": "etherfi",
  mexcglobal: "mexc",
  mexcapac: "mexc-apac",
  "mexc apac": "mexc-apac",
  okxcard: "okx",
  okxeea: "okx-eea",
  okxsg: "okx-sg",
  bybitcard: "bybit",
  bitgetwallet: "bitget",
  bitgetcard: "bitget",
  cryptocom: "cryptocom",
  "crypto.com": "cryptocom",
  cdc: "cryptocom",
  wildcard: "wildcard",
  野卡: "wildcard",
  gnosispay: "gnosis",
  kucoin: "kucard",
  kucoin卡: "kucard",
};

const NOISE =
  /(?:怎么样|怎么看|如何|介绍|资料|信息|费率|对比|好不好|靠谱吗|靠谱不|值得办吗|what(?:'s| is)?|how is|tell me about)/gi;

export function normalizeQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(NOISE, " ")
    .replace(/[^\p{L}\p{N}.+-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(s: string): string {
  return s.toLowerCase().replace(/[\s._-]+/g, "");
}

export function findCards(query: string, cards: UCard[] = CARDS): UCard[] {
  const raw = query.trim();
  if (!raw) return [];

  const rawLower = raw.toLowerCase();
  const rawCompact = compact(rawLower);
  const normalized = normalizeQuery(raw);
  const compactQ = compact(normalized || raw);
  if (!compactQ && !rawCompact) return [];

  const aliasSlug =
    ALIASES[rawLower] ??
    ALIASES[rawCompact] ??
    ALIASES[normalized] ??
    (compactQ ? ALIASES[compactQ] : undefined);
  if (aliasSlug) {
    const hit = cards.find((c) => c.slug === aliasSlug);
    if (hit) return [hit];
  }

  const exactSlug = cards.find((c) => c.slug === compactQ || c.slug === normalized);
  if (exactSlug) return [exactSlug];

  const scored = cards
    .map((card) => {
      const blob = compact(
        [card.slug, card.name, card.nameEn, card.issuer].filter(Boolean).join(" "),
      );
      let score = 0;
      if (card.slug === compactQ || compact(card.name) === compactQ || compact(card.nameEn) === compactQ) {
        score = 100;
      } else if (blob.includes(compactQ) || compactQ.includes(compact(card.slug))) {
        score = 80;
      } else if (compact(card.issuer) === compactQ) {
        score = 60;
      } else if (card.name.includes(raw) || card.nameEn.toLowerCase().includes(raw.toLowerCase())) {
        score = 50;
      }
      return { card, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return [];
  const best = scored[0]!.score;
  return scored.filter((x) => x.score >= best - 20).map((x) => x.card);
}

export function cardToSummary(card: UCard) {
  return {
    slug: card.slug,
    name: card.name,
    nameEn: card.nameEn,
    issuer: card.issuer,
    status: card.status,
    statusLabel: STATUS_LABEL[card.status],
    statusNote: card.statusNote,
    category: card.category,
    categoryLabel: CATEGORY_LABEL[card.category],
    network: card.network,
    form: card.form,
    custody: card.custody,
    custodyLabel: CUSTODY_LABEL[card.custody],
    kyc: card.kyc,
    kycLabel: KYC_LABEL[card.kyc],
    kycNote: card.kycNote,
    regions: card.regions,
    applePay: card.applePay,
    googlePay: card.googlePay,
    assets: card.assets,
    scenes: card.scenes,
    sceneLabels: card.scenes.map((s: Scene) => SCENE_LABEL[s]),
    risk: card.risk,
    riskNote: card.riskNote,
    fees: {
      openingFeeUsd: card.openingFeeUsd,
      physicalFeeUsd: card.physicalFeeUsd,
      annualFeeUsd: card.annualFeeUsd,
      monthlyFeeUsd: card.monthlyFeeUsd,
      topupFeePct: card.topupFeePct,
      cryptoConversionFeePct: card.cryptoConversionFeePct ?? 0,
      spendFeePct: card.spendFeePct,
      promoSpendFeePct: card.promoSpendFeePct,
      promoUntil: card.promoUntil,
      fxFeePct: card.fxFeePct,
    },
    cashback: {
      pct: card.cashbackPct,
      pctHigh: card.cashbackPctHigh,
      amountCapUsd: card.cashbackAmountCapUsd,
      amountCapHighUsd: card.cashbackAmountCapHighUsd,
      spendCapUsd: card.cashbackSpendCapUsd,
      note: card.cashbackNote,
    },
    levels: card.levels ?? [],
    summary: card.summary,
    bestFor: card.bestFor,
    pros: card.pros,
    cons: card.cons,
    url: card.url,
    sourceUrls: card.sourceUrls ?? [],
    verification: card.verification,
    verifiedAt: card.verifiedAt,
    updatedAt: card.updatedAt,
    page: `${SITE_URL}/card/${card.slug}`,
  };
}

export function formatCardText(
  card: UCard,
  opts?: { spend?: number; bill?: Bill; tier?: Tier },
): string {
  const spend = opts?.spend ?? 1000;
  const bill = opts?.bill ?? "usd";
  const tier = opts?.tier ?? "entry";
  const result = calcCard(card, { spend, bill, tier, includePhysicalFee: false });
  const lines = [
    `${card.name}（${card.nameEn}）`,
    `状态：${STATUS_LABEL[card.status]} · 核验：${card.verification ?? "unverified"} · 更新：${card.updatedAt}`,
    `网络 / 形态：${card.network} / ${card.form}`,
    `托管 / KYC：${CUSTODY_LABEL[card.custody]} / ${KYC_LABEL[card.kyc]}`,
    card.statusNote ? `说明：${card.statusNote}` : "",
    `开卡 $${card.openingFeeUsd} · 年费 $${card.annualFeeUsd} · 月费 $${card.monthlyFeeUsd} · 实体卡 $${card.physicalFeeUsd}`,
    `充值 ${card.topupFeePct}% · 币种转换 ${card.cryptoConversionFeePct ?? 0}% · 消费 ${card.spendFeePct}% · FX ${card.fxFeePct}%`,
    card.promoUntil
      ? `活动消费费 ${card.promoSpendFeePct ?? card.spendFeePct}%（至 ${card.promoUntil}）`
      : "",
    `返现 ${card.cashbackPct}%–${card.cashbackPctHigh}%${card.cashbackNote ? `；${card.cashbackNote}` : ""}`,
    `场景：${card.scenes.map((s) => SCENE_LABEL[s]).join("、") || "—"} · Apple Pay ${card.applePay ? "是" : "否"} · Google Pay ${card.googlePay ? "是" : "否"}`,
    `风险 ${card.risk}/5${card.riskNote ? `；${card.riskNote}` : ""}`,
    `一句话：${card.summary}`,
    `适合：${card.bestFor}`,
    card.pros.length ? `优点：${card.pros.join("；")}` : "",
    card.cons.length ? `缺点：${card.cons.join("；")}` : "",
    `按月消费 $${spend}、${bill === "usd" ? "美元账单" : "本地货币账单"}、${tier === "boost" ? "进阶档" : "入门档"}估算：返现 ${formatUsd(result.cashback)}，费用 ${formatUsd(result.fees)}，净 ${formatUsd(result.net)}（${formatPct(result.netPct)}）`,
    `详情：${SITE_URL}/card/${card.slug}`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function apiMeta() {
  return {
    name: "卡衡 Kaheng U-card API",
    version: API_VERSION,
    dataAsOf: DATA_AS_OF,
    source: SITE_URL,
    license: "catalog data is provided for verification; fees change, check official pages",
    endpoints: {
      index: "/api",
      cards: "/api/cards",
      card: "/api/cards/:slug",
      lookup: "/api/lookup?q=",
      ask: "/api/ask?q=",
      telegram: "POST /api/telegram",
      openapi: "/api/openapi",
    },
  };
}

export function notFoundBody(query: string, suggestions: Array<{ slug: string; name: string }>) {
  return {
    ok: false,
    error: "card_not_found",
    query,
    message: `卡库里没有找到「${query}」。`,
    suggestions,
    catalog: `${SITE_URL}/cards`,
  };
}

export function catalogSuggestions(cards: UCard[] = CARDS) {
  return cards.map((c) => ({ slug: c.slug, name: c.name, nameEn: c.nameEn, status: c.status }));
}
