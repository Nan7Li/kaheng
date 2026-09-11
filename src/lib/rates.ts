export type FiatCode =
  | "USD"
  | "EUR"
  | "TWD"
  | "HKD"
  | "SGD"
  | "JPY"
  | "GBP"
  | "KRW"
  | "CNY"
  | "AUD";

export type AssetCode = "USDT" | "USDC" | "USDG" | "EURe";
export type PegPolicy = "market" | "one-to-one";
export type SettlementCode = "USD" | "EUR" | "SGD" | "GBP";

export const FIAT_CODES: FiatCode[] = [
  "USD",
  "EUR",
  "TWD",
  "HKD",
  "SGD",
  "JPY",
  "GBP",
  "KRW",
  "CNY",
  "AUD",
];

export const ASSET_CODES: AssetCode[] = ["USDT", "USDC", "USDG"];

export const FIAT_LABEL: Record<FiatCode, string> = {
  USD: "USD 美元",
  EUR: "EUR 欧元",
  TWD: "TWD 台币",
  HKD: "HKD 港币",
  SGD: "SGD 新币",
  JPY: "JPY 日元",
  GBP: "GBP 英镑",
  KRW: "KRW 韩元",
  CNY: "CNY 人民币",
  AUD: "AUD 澳元",
};

export const FIAT_SHORT: Record<FiatCode, string> = {
  USD: "USD",
  EUR: "EUR",
  TWD: "TWD",
  HKD: "HKD",
  SGD: "SGD",
  JPY: "JPY",
  GBP: "GBP",
  KRW: "KRW",
  CNY: "CNY",
  AUD: "AUD",
};

export const ASSET_LABEL: Record<AssetCode, string> = {
  USDT: "USDT",
  USDC: "USDC",
  USDG: "USDG",
  EURe: "EURe",
};

export const SETTLEMENT_LABEL: Record<SettlementCode, string> = {
  USD: "美元结算",
  EUR: "欧元结算",
  SGD: "新币结算",
  GBP: "英镑结算",
};

export interface RateTable {
  usdPer: Record<string, number>;
  asOf: string;
  source: string;
}

/** 1 unit → USD. Stables are live OKX prints, not assumed 1. */
export const FALLBACK_RATES: RateTable = {
  asOf: "2026-09-11T00:02:31Z",
  source: "fallback",
  usdPer: {
    USD: 1,
    USDT: 0.9996,
    USDC: 0.999939864,
    USDG: 0.99979992,
    EUR: 1.161793447,
    EURe: 1.161793447,
    TWD: 0.03164518,
    HKD: 0.127531,
    SGD: 0.789213,
    JPY: 0.00648297,
    GBP: 1.351824,
    KRW: 0.00074346,
    CNY: 0.148632,
    AUD: 0.71699,
    CAD: 0.72335,
    CHF: 1.23082,
  },
};

export function usdPer(rates: RateTable, code: string): number {
  const v = rates.usdPer[code];
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 1;
}

export function toUsd(amount: number, code: string, rates: RateTable): number {
  return amount * usdPer(rates, code);
}

export function fromUsd(usd: number, code: string, rates: RateTable): number {
  return usd / usdPer(rates, code);
}

export function convert(amount: number, from: string, to: string, rates: RateTable): number {
  if (from === to) return amount;
  return fromUsd(toUsd(amount, from, rates), to, rates);
}

export function unitsPerUsd(code: string, rates: RateTable): number {
  return 1 / usdPer(rates, code);
}

export function isFiatCode(v: string): v is FiatCode {
  return (FIAT_CODES as string[]).includes(v);
}

export function isAssetCode(v: string): v is AssetCode {
  return v === "USDT" || v === "USDC" || v === "USDG" || v === "EURe";
}

export function formatFiatAmount(amount: number, code: FiatCode, digits = 0): string {
  const abs = Math.abs(amount);
  const body = abs.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const prefix =
    code === "USD"
      ? "$"
      : code === "EUR"
        ? "€"
        : code === "GBP"
          ? "£"
          : code === "JPY" || code === "CNY"
            ? "¥"
            : code === "KRW"
              ? "₩"
              : `${code} `;
  const local =
    code === "TWD" ? `NT$${body}` : code === "HKD" ? `HK$${body}` : code === "SGD" ? `S$${body}` : `${prefix}${body}`;
  return amount < -0.004 ? `−${local.replace(/^-/, "")}` : local;
}

export function formatAssetAmount(amount: number, asset: string, digits = 2): string {
  const body = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${body} ${asset}`;
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function readJson(url: string, ms = 4000): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function okxLast(instId: string): Promise<number | null> {
  const raw = await readJson(`https://www.okx.com/api/v5/market/ticker?instId=${instId}`);
  const last = (raw as { data?: Array<{ last?: string }> })?.data?.[0]?.last;
  return num(last);
}

export async function fetchRates(): Promise<RateTable> {
  const usdPerMap: Record<string, number> = { ...FALLBACK_RATES.usdPer };
  const sources: string[] = [];

  const [fiat, usdtUsd, usdcUsdt, usdgUsdt] = await Promise.allSettled([
    readJson("https://open.er-api.com/v6/latest/USD"),
    okxLast("USDT-USD"),
    okxLast("USDC-USDT"),
    okxLast("USDG-USDT"),
  ]);

  if (fiat.status === "fulfilled") {
    const rates = (fiat.value as { rates?: Record<string, number> })?.rates;
    if (rates) {
      for (const code of [...FIAT_CODES, "CAD", "CHF"] as string[]) {
        if (code === "USD") continue;
        const units = num(rates[code]);
        if (units) usdPerMap[code] = 1 / units;
      }
      sources.push("open.er-api.com");
    }
  }

  const usdt = usdtUsd.status === "fulfilled" ? usdtUsd.value : null;
  const usdc = usdcUsdt.status === "fulfilled" ? usdcUsdt.value : null;
  const usdg = usdgUsdt.status === "fulfilled" ? usdgUsdt.value : null;

  if (usdt) {
    usdPerMap.USDT = usdt;
    sources.push("OKX USDT-USD");
  }
  if (usdt && usdc) {
    usdPerMap.USDC = usdt * usdc;
    sources.push("OKX USDC-USDT");
  }
  if (usdt && usdg) {
    usdPerMap.USDG = usdt * usdg;
    sources.push("OKX USDG-USDT");
  }
  if (usdPerMap.EUR) usdPerMap.EURe = usdPerMap.EUR;

  return {
    usdPer: usdPerMap,
    asOf: new Date().toISOString(),
    source: sources.length ? sources.join(" · ") : "fallback",
  };
}

let cache: { at: number; rates: RateTable } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function getRates(): Promise<RateTable> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.rates;
  try {
    const rates = await fetchRates();
    cache = { at: now, rates };
    return rates;
  } catch {
    return cache?.rates ?? FALLBACK_RATES;
  }
}
