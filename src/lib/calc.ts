import type { Scene, UCard } from "@/data/cards";

export type Tier = "entry" | "boost";
export type Bill = "usd" | "local";

export interface CalcInput {
  spend: number;
  bill: Bill;
  tier: Tier;
}

export interface CalcResult {
  cashback: number;
  topup: number;
  spendFee: number;
  fx: number;
  amortized: number;
  fees: number;
  net: number;
  netPct: number;
  spendFeePctUsed: number;
  cashbackPctUsed: number;
  promoActive: boolean;
}

function n(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function isPromoActive(card: UCard, now = new Date()): boolean {
  if (card.promoSpendFeePct === undefined || !card.promoUntil) return false;
  const t = new Date(`${card.promoUntil}T23:59:59.000Z`).getTime();
  return Number.isFinite(t) && now.getTime() <= t;
}

export function calcCard(card: UCard, input: CalcInput, now = new Date()): CalcResult {
  const spend = Math.max(0, n(input.spend));
  const promoActive = isPromoActive(card, now);
  const spendFeePctUsed = promoActive
    ? n(card.promoSpendFeePct ?? card.spendFeePct)
    : n(card.spendFeePct);
  const topupPct = n(card.topupFeePct);
  const fxPct = input.bill === "local" ? n(card.fxFeePct) : 0;

  const cashbackPctUsed = input.tier === "boost" ? n(card.cashbackPctHigh) : n(card.cashbackPct);
  const amountCap =
    input.tier === "boost" ? card.cashbackAmountCapHighUsd : card.cashbackAmountCapUsd;
  const spendCap = card.cashbackSpendCapUsd;

  const eligible = spendCap == null ? spend : Math.min(spend, n(spendCap));
  let cashback = (eligible * cashbackPctUsed) / 100;
  if (amountCap != null) cashback = Math.min(cashback, n(amountCap));

  const topup = (spend * topupPct) / 100;
  const spendFee = (spend * spendFeePctUsed) / 100;
  const fx = (spend * fxPct) / 100;
  const amortized = n(card.openingFeeUsd) / 12 + n(card.monthlyFeeUsd) + n(card.annualFeeUsd) / 12;
  const fees = topup + spendFee + fx + amortized;
  const net = cashback - fees;
  const netPct = spend === 0 ? 0 : (net / spend) * 100;

  return {
    cashback,
    topup,
    spendFee,
    fx,
    amortized,
    fees,
    net,
    netPct,
    spendFeePctUsed,
    cashbackPctUsed,
    promoActive,
  };
}

export function rankCards(cards: UCard[], input: CalcInput): Array<UCard & { result: CalcResult }> {
  return cards
    .filter((c) => c.status !== "shutdown")
    .map((c) => ({ ...c, result: calcCard(c, input) }))
    .sort((a, b) => b.result.net - a.result.net);
}

export function matchesScene(card: UCard, scene: Scene | "all"): boolean {
  if (scene === "all") return true;
  return Array.isArray(card.scenes) && card.scenes.includes(scene);
}

export function formatUsd(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "$—";
  const abs = Math.abs(n);
  const body = abs.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (n > 0.004) return `+$${body}`;
  if (n < -0.004) return `−$${body}`;
  return `$${body}`;
}

export function formatUsdPlain(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "$—";
  return `$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function formatPct(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—%";
  const body = Math.abs(n).toFixed(digits);
  if (n > 0.004) return `+${body}%`;
  if (n < -0.004) return `−${body}%`;
  return `${body}%`;
}

export const SPEND_PRESETS = [200, 500, 1000, 2000, 5000, 10000] as const;
