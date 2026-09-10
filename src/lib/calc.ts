import type { CardLevel, Scene, UCard } from "@/data/cards";

export type Tier = "entry" | "boost";
export type Bill = "usd" | "local";

export interface CalcInput {
  spend: number;
  bill: Bill;
  tier: Tier;
  includePhysicalFee?: boolean;
  levelId?: string;
}

export interface EffectiveFees {
  openingFeeUsd: number;
  annualFeeUsd: number;
  monthlyFeeUsd: number;
  topupFeePct: number;
  spendFeePct: number;
  fxFeePct: number;
  cashbackPct: number;
  cashbackAmountCapUsd: number | null;
  cashbackSpendCapUsd: number | null;
}

export interface CalcResult {
  cashback: number;
  topup: number;
  conversion: number;
  spendFee: number;
  fx: number;
  amortized: number;
  fees: number;
  net: number;
  netPct: number;
  spendFeePctUsed: number;
  cashbackPctUsed: number;
  promoActive: boolean;
  levelId: string;
  levelName: string;
}

function n(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function inheritNum(level: number | undefined, base: number): number {
  return typeof level === "number" && Number.isFinite(level) ? level : n(base);
}

function inheritCap(
  level: number | null | undefined,
  base: number | null | undefined,
): number | null {
  if (level !== undefined) return level;
  return base ?? null;
}

export function resolveLevels(card: UCard): CardLevel[] {
  if (Array.isArray(card.levels) && card.levels.length > 0) return card.levels;
  const entry: CardLevel = {
    id: "entry",
    name: "入门档",
    cashbackPct: n(card.cashbackPct),
    cashbackAmountCapUsd: card.cashbackAmountCapUsd,
    cashbackSpendCapUsd: card.cashbackSpendCapUsd,
  };
  const same =
    n(card.cashbackPct) === n(card.cashbackPctHigh) &&
    (card.cashbackAmountCapUsd ?? null) === (card.cashbackAmountCapHighUsd ?? null);
  if (same) return [entry];
  return [
    entry,
    {
      id: "boost",
      name: "进阶档",
      cashbackPct: n(card.cashbackPctHigh),
      cashbackAmountCapUsd: card.cashbackAmountCapHighUsd,
      cashbackSpendCapUsd: card.cashbackSpendCapUsd,
    },
  ];
}

export function pickLevel(card: UCard, tier: Tier, levelId?: string): CardLevel {
  const levels = resolveLevels(card);
  if (levelId) {
    const found = levels.find((l) => l.id === levelId);
    if (found) return found;
  }
  if (tier === "boost") return levels[levels.length - 1] ?? levels[0]!;
  return levels[0]!;
}

export function effectiveFees(card: UCard, level: CardLevel): EffectiveFees {
  return {
    openingFeeUsd: inheritNum(level.openingFeeUsd, card.openingFeeUsd),
    annualFeeUsd: inheritNum(level.annualFeeUsd, card.annualFeeUsd),
    monthlyFeeUsd: inheritNum(level.monthlyFeeUsd, card.monthlyFeeUsd),
    topupFeePct: inheritNum(level.topupFeePct, card.topupFeePct),
    spendFeePct: inheritNum(level.spendFeePct, card.spendFeePct),
    fxFeePct: inheritNum(level.fxFeePct, card.fxFeePct),
    cashbackPct: inheritNum(level.cashbackPct, card.cashbackPct),
    cashbackAmountCapUsd: inheritCap(level.cashbackAmountCapUsd, card.cashbackAmountCapUsd),
    cashbackSpendCapUsd: inheritCap(level.cashbackSpendCapUsd, card.cashbackSpendCapUsd),
  };
}

export function feesVaryByLevel(card: UCard): boolean {
  const levels = resolveLevels(card);
  if (levels.length < 2) return false;
  const first = effectiveFees(card, levels[0]!);
  const keys = [
    "openingFeeUsd",
    "annualFeeUsd",
    "monthlyFeeUsd",
    "topupFeePct",
    "spendFeePct",
    "fxFeePct",
  ] as const;
  return levels.some((l) => {
    const f = effectiveFees(card, l);
    return keys.some((k) => f[k] !== first[k]);
  });
}

export function isPromoActive(card: UCard, now = new Date()): boolean {
  if (card.promoSpendFeePct === undefined || !card.promoUntil) return false;
  const t = new Date(`${card.promoUntil}T23:59:59.000Z`).getTime();
  return Number.isFinite(t) && now.getTime() <= t;
}

export function calcCard(card: UCard, input: CalcInput, now = new Date()): CalcResult {
  const spend = Math.max(0, n(input.spend));
  const level = pickLevel(card, input.tier, input.levelId);
  const fees = effectiveFees(card, level);
  const promoActive = isPromoActive(card, now);
  const spendFeePctUsed = promoActive
    ? n(card.promoSpendFeePct ?? fees.spendFeePct)
    : fees.spendFeePct;
  const topupPct = fees.topupFeePct;
  const conversionPct = n(card.cryptoConversionFeePct);
  const fxPct = input.bill === "local" ? fees.fxFeePct : 0;

  const cashbackPctUsed = fees.cashbackPct;
  const amountCap = fees.cashbackAmountCapUsd;
  const spendCap = fees.cashbackSpendCapUsd;

  const eligible = spendCap == null ? spend : Math.min(spend, n(spendCap));
  let cashback = (eligible * cashbackPctUsed) / 100;
  if (amountCap != null) cashback = Math.min(cashback, n(amountCap));

  const topup = (spend * topupPct) / 100;
  const conversion = (spend * conversionPct) / 100;
  const spendFee = (spend * spendFeePctUsed) / 100;
  const fx = (spend * fxPct) / 100;
  const includePhysicalFee = input.includePhysicalFee || card.form === "physical";
  const amortized =
    fees.openingFeeUsd / 12 +
    (includePhysicalFee ? n(card.physicalFeeUsd) / 12 : 0) +
    fees.monthlyFeeUsd +
    fees.annualFeeUsd / 12;
  const totalFees = topup + conversion + spendFee + fx + amortized;
  const net = cashback - totalFees;
  const netPct = spend === 0 ? 0 : (net / spend) * 100;

  return {
    cashback,
    topup,
    conversion,
    spendFee,
    fx,
    amortized,
    fees: totalFees,
    net,
    netPct,
    spendFeePctUsed,
    cashbackPctUsed,
    promoActive,
    levelId: level.id,
    levelName: level.name,
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
