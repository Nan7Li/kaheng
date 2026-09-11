import type { UCard } from "../data/cards.ts";
import { convert, type AssetCode, type PegPolicy, type RateTable, type SettlementCode } from "./rates.ts";

export interface CardMoney {
  settlement: SettlementCode;
  nativeAsset: AssetCode;
  peg: PegPolicy;
  pegRate?: number;
  fxFree: string[];
}

const OVERRIDES: Record<string, Partial<CardMoney>> = {
  mexc: { nativeAsset: "USDT", peg: "one-to-one" },
  pionex: { nativeAsset: "USDT", peg: "one-to-one" },
  "okx-eea": { settlement: "EUR", nativeAsset: "USDG" },
  "okx-sg": { settlement: "SGD", nativeAsset: "USDG" },
  okx: { nativeAsset: "USDG" },
  gnosis: { settlement: "EUR", nativeAsset: "EURe", peg: "one-to-one" },
  nexo: { settlement: "EUR" },
  wirex: { settlement: "EUR" },
  bitget: { fxFree: ["USD", "SGD"] },
  jupiter: { nativeAsset: "USDC" },
  etherfi: { nativeAsset: "USDC" },
  coinbase: { nativeAsset: "USDC" },
  solayer: { nativeAsset: "USDC" },
};

function inferNative(card: UCard): AssetCode {
  const assets = card.assets ?? [];
  if (assets.includes("USDG")) return "USDG";
  if (assets.includes("EURe")) return "EURe";
  if (assets.includes("USDC") && !assets.includes("USDT")) return "USDC";
  if (assets.includes("USDT")) return "USDT";
  if (assets.includes("USDC")) return "USDC";
  return "USDT";
}

function isSettlement(v: unknown): v is SettlementCode {
  return v === "USD" || v === "EUR" || v === "SGD" || v === "GBP";
}

function isAsset(v: unknown): v is AssetCode {
  return v === "USDT" || v === "USDC" || v === "USDG" || v === "EURe";
}

function isPeg(v: unknown): v is PegPolicy {
  return v === "market" || v === "one-to-one";
}

export function cardMoney(card: UCard): CardMoney {
  const o = OVERRIDES[card.slug] ?? {};
  const settlement = isSettlement(card.settlement) ? card.settlement : (o.settlement ?? "USD");
  const nativeAsset = isAsset(card.nativeAsset) ? card.nativeAsset : (o.nativeAsset ?? inferNative(card));
  const peg = isPeg(card.pegPolicy) ? card.pegPolicy : (o.peg ?? "market");
  const pegRate =
    typeof card.pegRate === "number" && Number.isFinite(card.pegRate) && card.pegRate > 0
      ? card.pegRate
      : undefined;
  const fxFree = Array.isArray(card.fxFree)
    ? card.fxFree
    : (o.fxFree ?? [settlement]);
  return { settlement, nativeAsset, peg, pegRate, fxFree };
}

export function pegLabel(card: UCard): string {
  const money = cardMoney(card);
  if (money.pegRate !== undefined) {
    return `1 ${money.settlement} = ${money.pegRate} ${money.nativeAsset}`;
  }
  return money.peg === "one-to-one" ? "官方 1:1" : "市价";
}

export function cardCnyRate(card: UCard, rates: RateTable): { amount: number; basis: string } {
  const money = cardMoney(card);
  if (money.pegRate !== undefined) {
    return {
      amount: convert(1, money.settlement, "CNY", rates) / money.pegRate,
      basis: "卡内锚定",
    };
  }
  if (money.peg === "one-to-one" && isPairedPeg(money.settlement, money.nativeAsset)) {
    return {
      amount: convert(1, money.settlement, "CNY", rates),
      basis: "官方 1:1",
    };
  }
  return { amount: convert(1, money.nativeAsset, "CNY", rates), basis: "实时市价" };
}

export function cardCnyLabel(card: UCard, rates: RateTable): string {
  const money = cardMoney(card);
  const rate = cardCnyRate(card, rates);
  return `1 ${money.nativeAsset} ≈ ¥${rate.amount.toFixed(2)}（${rate.basis}）`;
}

export function isPairedPeg(settlement: string, native: string): boolean {
  if (settlement === "USD" && (native === "USDT" || native === "USDC" || native === "USDG")) {
    return true;
  }
  if (settlement === "EUR" && native === "EURe") return true;
  return false;
}

