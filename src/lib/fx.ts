export const FX_QUOTE_DEFAULT = "TWD";
export const FX_CACHE_KEY = "kaheng-fx-usd-v1";
export const FX_TTL_MS = 60 * 60 * 1000;

export const ZERO_DECIMAL = new Set([
  "JPY",
  "KRW",
  "VND",
  "IDR",
  "CLP",
  "ISK",
]);

export interface FxCurrency {
  code: string;
  name: string;
}

/** Quote list: Taiwan first, then the bot’s basket plus nearby U-card billing currencies. */
export const FX_CURRENCIES: FxCurrency[] = [
  { code: "TWD", name: "新台币" },
  { code: "USD", name: "美元" },
  { code: "CNY", name: "人民币" },
  { code: "HKD", name: "港币" },
  { code: "SGD", name: "新加坡元" },
  { code: "EUR", name: "欧元" },
  { code: "GBP", name: "英镑" },
  { code: "JPY", name: "日元" },
  { code: "KRW", name: "韩元" },
  { code: "PHP", name: "菲律宾披索" },
  { code: "MYR", name: "马来西亚令吉" },
  { code: "THB", name: "泰铢" },
  { code: "VND", name: "越南盾" },
  { code: "IDR", name: "印尼盾" },
  { code: "INR", name: "印度卢比" },
  { code: "TRY", name: "土耳其里拉" },
  { code: "AUD", name: "澳元" },
  { code: "CAD", name: "加元" },
  { code: "BRL", name: "巴西雷亚尔" },
  { code: "NGN", name: "奈拉" },
  { code: "ARS", name: "阿根廷比索" },
  { code: "PKR", name: "巴基斯坦卢比" },
  { code: "EGP", name: "埃及镑" },
  { code: "AED", name: "阿联酋迪拉姆" },
  { code: "MXN", name: "墨西哥比索" },
];

export const FX_CODE_SET = new Set(FX_CURRENCIES.map((c) => c.code));

export const CURRENCY_ALIAS: Record<string, string> = {
  USD: "USD",
  USDT: "USD",
  BUCK: "USD",
  美元: "USD",
  美金: "USD",
  刀: "USD",
  TWD: "TWD",
  NTD: "TWD",
  NTS: "TWD",
  台币: "TWD",
  新台币: "TWD",
  CNY: "CNY",
  RMB: "CNY",
  人民币: "CNY",
  软妹币: "CNY",
  HKD: "HKD",
  港币: "HKD",
  港元: "HKD",
  SGD: "SGD",
  新币: "SGD",
  新元: "SGD",
  EUR: "EUR",
  欧元: "EUR",
  GBP: "GBP",
  英镑: "GBP",
  JPY: "JPY",
  日元: "JPY",
  KRW: "KRW",
  韩元: "KRW",
  PHP: "PHP",
  披索: "PHP",
  MYR: "MYR",
  令吉: "MYR",
  THB: "THB",
  泰铢: "THB",
  VND: "VND",
  盾: "VND",
  IDR: "IDR",
  INR: "INR",
  卢比: "INR",
  TRY: "TRY",
  里拉: "TRY",
  AUD: "AUD",
  澳元: "AUD",
  CAD: "CAD",
  加元: "CAD",
  BRL: "BRL",
  NGN: "NGN",
  奈拉: "NGN",
  ARS: "ARS",
  PKR: "PKR",
  EGP: "EGP",
  AED: "AED",
  MXN: "MXN",
};

export type FxSource = "fawaz" | "er-api";

export interface FxTable {
  base: "USD";
  date: string;
  rates: Record<string, number>;
  source: FxSource;
}

export interface RateParse {
  source?: string;
  target: string;
  amount: number;
  listOnly: boolean;
  error?: string;
}

const FAWAZ_URLS = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json",
  "https://latest.currency-api.pages.dev/v1/currencies/usd.min.json",
];
const ER_API_URL = "https://open.er-api.com/v6/latest/USD";

export function normalizeCurrency(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const upper = trimmed.toUpperCase();
  if (CURRENCY_ALIAS[upper]) return CURRENCY_ALIAS[upper];
  if (CURRENCY_ALIAS[trimmed]) return CURRENCY_ALIAS[trimmed];
  if (/^[A-Z]{3}$/.test(upper)) return upper;
  return undefined;
}

export function currencyName(code: string): string {
  const row = FX_CURRENCIES.find((c) => c.code === code.toUpperCase());
  return row?.name ?? code.toUpperCase();
}

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  const src = rates[from.toUpperCase()];
  const tgt = rates[to.toUpperCase()];
  if (!Number.isFinite(amount)) throw new Error("金额无效");
  if (!src || !tgt) throw new Error(`没有 ${from.toUpperCase()} / ${to.toUpperCase()} 的汇率`);
  return amount * (tgt / src);
}

export function formatMoney(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return "—";
  const code = currency.toUpperCase();
  const digits = ZERO_DECIMAL.has(code) ? 0 : 2;
  const n = digits === 0 ? Math.round(amount) : amount;
  const body = n.toLocaleString("zh-TW", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${body} ${code}`;
}

export function formatRate(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return "—";
  if (rate >= 100) return rate.toLocaleString("zh-TW", { maximumFractionDigits: 2 });
  if (rate >= 1) return rate.toFixed(4);
  if (rate >= 0.01) return rate.toFixed(6);
  return rate.toPrecision(4);
}

export function parseRateCommand(input: string, defaultTarget = FX_QUOTE_DEFAULT): RateParse {
  const usage = "用法：/rate 100 USD；/rate USD TWD 100；或 100美元";
  const raw = input.trim();
  if (!raw) return { target: defaultTarget, amount: 0, listOnly: true };

  const parts = raw.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  let target = defaultTarget;
  if (cmd === "/ratec") target = "CNY";
  else if (cmd === "/rateu") target = "USD";
  else if (cmd === "/rateg") target = "GBP";
  else if (cmd === "/ratet") target = "TWD";

  const isSlash = cmd === "/rate" || cmd === "/ratec" || cmd === "/rateu" || cmd === "/rateg" || cmd === "/ratet";
  const tokens = isSlash ? parts.slice(1) : parts;

  if (isSlash && tokens.length === 0) {
    return { target, amount: 0, listOnly: true };
  }

  if (isSlash && tokens.length === 1) {
    const asCode = normalizeCurrency(tokens[0]);
    if (asCode) return { target: asCode, amount: 0, listOnly: true };
    return { target, amount: 0, listOnly: true, error: usage };
  }

  if (isSlash && tokens.length === 2) {
    const a = normalizeCurrency(tokens[0]);
    const bAmt = Number(tokens[1]);
    const b = normalizeCurrency(tokens[1]);
    const aAmt = Number(tokens[0]);
    if (a && Number.isFinite(bAmt)) return { source: a, target, amount: bAmt, listOnly: false };
    if (Number.isFinite(aAmt) && b) return { source: b, target, amount: aAmt, listOnly: false };
    return { target, amount: 0, listOnly: true, error: usage };
  }

  if (isSlash && tokens.length >= 3) {
    const a = normalizeCurrency(tokens[0]);
    const b = normalizeCurrency(tokens[1]);
    const n = Number(tokens[2]);
    if (a && b && Number.isFinite(n)) return { source: a, target: b, amount: n, listOnly: false };
    return { target, amount: 0, listOnly: true, error: usage };
  }

  return parseLooseAmount(raw, defaultTarget) ?? { target: defaultTarget, amount: 0, listOnly: true, error: usage };
}

const LOOSE_AMOUNT =
  /(?:(\d+(?:\.\d+)?)\s*([A-Za-z]{3}|美元|美金|台币|新台币|人民币|港币|港元|日元|欧元|英镑|新币|新元|韩元|令吉|泰铢|里拉|澳元|加元|奈拉))|(?:([A-Za-z]{3})\s*(\d+(?:\.\d+)?))/;

export function parseLooseAmount(raw: string, defaultTarget = FX_QUOTE_DEFAULT): RateParse | null {
  const pair = raw.match(
    /(\d+(?:\.\d+)?)\s*([A-Za-z]{3}|美元|美金|台币|新台币|人民币|港币|港元)\s*(?:兑|到|至|换|=|>|→)\s*([A-Za-z]{3}|台币|新台币|美元|人民币|港币)/,
  );
  if (pair) {
    const amount = Number(pair[1]);
    const source = normalizeCurrency(pair[2]);
    const target = normalizeCurrency(pair[3]) ?? defaultTarget;
    if (source && Number.isFinite(amount)) return { source, target, amount, listOnly: false };
  }
  const m = raw.match(LOOSE_AMOUNT);
  if (!m) return null;
  if (m[1] && m[2]) {
    const source = normalizeCurrency(m[2]);
    const amount = Number(m[1]);
    if (source && Number.isFinite(amount)) return { source, target: defaultTarget, amount, listOnly: false };
  }
  if (m[3] && m[4]) {
    const source = normalizeCurrency(m[3]);
    const amount = Number(m[4]);
    if (source && Number.isFinite(amount)) return { source, target: defaultTarget, amount, listOnly: false };
  }
  return null;
}

function fromFawaz(json: unknown): FxTable | null {
  if (!json || typeof json !== "object") return null;
  const rec = json as { date?: unknown; usd?: unknown };
  const usd = rec.usd;
  if (!usd || typeof usd !== "object") return null;
  const rates: Record<string, number> = { USD: 1 };
  for (const [key, value] of Object.entries(usd as Record<string, unknown>)) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) rates[key.toUpperCase()] = n;
  }
  if (!rates.TWD) return null;
  return {
    base: "USD",
    date: typeof rec.date === "string" ? rec.date : "",
    rates,
    source: "fawaz",
  };
}

function fromErApi(json: unknown): FxTable | null {
  if (!json || typeof json !== "object") return null;
  const rec = json as { result?: unknown; rates?: unknown; time_last_update_utc?: unknown };
  if (rec.result !== "success" || !rec.rates || typeof rec.rates !== "object") return null;
  const rates: Record<string, number> = {};
  for (const [key, value] of Object.entries(rec.rates as Record<string, unknown>)) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) rates[key.toUpperCase()] = n;
  }
  if (!rates.USD) rates.USD = 1;
  if (!rates.TWD) return null;
  const date =
    typeof rec.time_last_update_utc === "string"
      ? rec.time_last_update_utc.slice(0, 16)
      : "";
  return { base: "USD", date, rates, source: "er-api" };
}

export function readFxCache(): FxTable | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: number; table?: FxTable };
    if (!parsed.at || !parsed.table?.rates?.TWD) return null;
    if (Date.now() - parsed.at > FX_TTL_MS) return null;
    return parsed.table;
  } catch {
    return null;
  }
}

export function writeFxCache(table: FxTable) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ at: Date.now(), table }));
  } catch {
    /* quota */
  }
}

export async function loadUsdRates(fetcher: typeof fetch = fetch): Promise<FxTable> {
  const cached = readFxCache();
  if (cached) return cached;

  const get = async (url: string) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    try {
      const res = await fetcher(url, {
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  };

  for (const url of FAWAZ_URLS) {
    try {
      const table = fromFawaz(await get(url));
      if (table) {
        writeFxCache(table);
        return table;
      }
    } catch {
      /* next */
    }
  }
  try {
    const table = fromErApi(await get(ER_API_URL));
    if (table) {
      writeFxCache(table);
      return table;
    }
  } catch {
    /* fall through */
  }
  throw new Error("汇率接口暂时不可用");
}

let inflight: Promise<FxTable> | null = null;

export function clearFxCache() {
  inflight = null;
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(FX_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function getUsdRates(): Promise<FxTable> {
  const cached = readFxCache();
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = loadUsdRates().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function listQuoteRates(table: FxTable, quote: string): Array<{ code: string; name: string; rate: number }> {
  const q = quote.toUpperCase();
  return FX_CURRENCIES.filter((c) => c.code !== q)
    .map((c) => {
      const rate = table.rates[c.code] && table.rates[q] ? table.rates[c.code] / table.rates[q] : NaN;
      return { code: c.code, name: c.name, rate };
    })
    .filter((row) => Number.isFinite(row.rate) && row.rate > 0);
}
