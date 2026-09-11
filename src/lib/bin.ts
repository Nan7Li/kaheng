import {
  BIN_COUNTRY_LABEL,
  type BinCountry,
  type Network,
  type UCard,
} from "../data/cards.ts";

export type BinScheme = "visa" | "mastercard" | "amex" | "unionpay" | "unknown";
export type BinSource = "known" | "index" | "live" | "prefix";

export interface BinHit {
  bin: string;
  scheme: BinScheme;
  type?: string;
  brand?: string;
  prepaid?: boolean;
  country: BinCountry;
  countryName: string;
  countryAlpha2?: string;
  bank?: string;
  source: BinSource;
  cardSlug?: string;
  cardName?: string;
  note?: string;
}

export interface KnownBin {
  bin: string;
  scheme: BinScheme;
  country: BinCountry;
  bank: string;
  cardSlug?: string;
  note?: string;
}

/** Local U-card prefixes verified against public BIN data / community reports. Longer prefixes win. */
export const KNOWN_BINS: KnownBin[] = [
  {
    bin: "493875",
    scheme: "visa",
    country: "hk",
    bank: "Reap Technologies Limited",
    cardSlug: "bybit",
    note: "Bybit 亚太常见段。公共库多标香港 Unicard / Reap、Visa Platinum。订美区订阅不一定过。",
  },
  {
    bin: "454924",
    scheme: "visa",
    country: "pr",
    bank: "Bivo, Inc.",
    cardSlug: "solayer",
    note: "Solayer 美区（波多黎各）Visa。社区反馈订 ChatGPT 通过率高。",
  },
  {
    bin: "559666",
    scheme: "mastercard",
    country: "us",
    bank: "MVB Bank, Inc.",
    cardSlug: "pokepay",
    note: "PokePay 美区 Mastercard Platinum。",
  },
];

const EEA = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "IS",
  "LI",
  "NO",
]);

const ALPHA_TO_BIN: Record<string, BinCountry> = {
  US: "us",
  PR: "pr",
  HK: "hk",
  GB: "uk",
  UK: "uk",
  SG: "sg",
  CH: "ch",
  AU: "au",
  GE: "ge",
  KZ: "kz",
  CN: "cn",
  TW: "tw",
  JP: "jp",
  KR: "kr",
  CA: "ca",
  DE: "de",
  FR: "fr",
  NL: "nl",
  IE: "ie",
  LT: "lt",
  ES: "es",
  IT: "it",
  MY: "my",
  TH: "th",
  IN: "in",
  AE: "ae",
  NZ: "nz",
  MX: "mx",
  BR: "br",
  ZA: "za",
  TR: "tr",
  PH: "ph",
  ID: "id",
};

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

export function schemeFromPrefix(bin: string): BinScheme {
  const d = bin[0];
  if (d === "4") return "visa";
  if (d === "5" || d === "2") return "mastercard";
  if (d === "3") return "amex";
  if (d === "6") return "unionpay";
  return "unknown";
}

export function countryFromAlpha2(alpha2: string | undefined, name?: string): BinCountry {
  const code = (alpha2 ?? "").toUpperCase();
  if (code && ALPHA_TO_BIN[code]) return ALPHA_TO_BIN[code]!;
  if (code && EEA.has(code)) return "eea";
  const n = (name ?? "").toLowerCase();
  if (n.includes("hong kong")) return "hk";
  if (n.includes("puerto rico")) return "pr";
  if (n.includes("united states") || n === "usa") return "us";
  if (n.includes("united kingdom") || n.includes("great britain")) return "uk";
  if (n.includes("switzerland")) return "ch";
  if (n.includes("singapore")) return "sg";
  if (n.includes("australia")) return "au";
  if (n.includes("georgia")) return "ge";
  if (n.includes("kazakhstan")) return "kz";
  return "unknown";
}

export function networkFromScheme(scheme: BinScheme): Network | undefined {
  if (scheme === "visa" || scheme === "mastercard") return scheme;
  return undefined;
}

export function matchKnownBin(bin: string): KnownBin | undefined {
  const digits = digitsOnly(bin);
  if (digits.length < 6) return undefined;
  const hits = KNOWN_BINS.filter((k) => digits.startsWith(k.bin) || k.bin.startsWith(digits.slice(0, 6))).sort(
    (a, b) => b.bin.length - a.bin.length,
  );
  return hits[0];
}

export function hitFromKnown(known: KnownBin, bin: string): BinHit {
  return {
    bin: digitsOnly(bin) || known.bin,
    scheme: known.scheme,
    country: known.country,
    countryName: BIN_COUNTRY_LABEL[known.country],
    bank: known.bank,
    source: "known",
    cardSlug: known.cardSlug,
    note: known.note,
  };
}

export function prefixHit(bin: string, reason: "miss" | "rate" = "miss"): BinHit {
  const digits = digitsOnly(bin);
  const scheme = schemeFromPrefix(digits);
  const schemeName =
    scheme === "visa"
      ? "Visa"
      : scheme === "mastercard"
        ? "Mastercard"
        : scheme === "amex"
          ? "Amex"
          : scheme === "unionpay"
            ? "银联"
            : "未知组织";
  return {
    bin: digits,
    scheme,
    country: "unknown",
    countryName: "未收录",
    source: "prefix",
    note:
      reason === "rate"
        ? `公共库这小时额度用完了。按卡号前缀，这是 ${schemeName}；过一会儿再查才能看到发卡地。`
        : `公共库没有这条发卡行。按卡号前缀，这是 ${schemeName}。`,
  };
}

export function matchCatalog(bin: string, cards: UCard[]): UCard | undefined {
  const digits = digitsOnly(bin);
  if (digits.length < 6) return undefined;
  const known = matchKnownBin(digits);
  if (known?.cardSlug) {
    const found = cards.find((c) => c.slug === known.cardSlug);
    if (found) return found;
  }
  return cards.find((c) => {
    const code = c.binCode?.replace(/\D/g, "") ?? "";
    return code.length >= 6 && (digits.startsWith(code) || code.startsWith(digits.slice(0, 6)));
  });
}

export function formatBinHit(hit: BinHit): string {
  const scheme =
    hit.scheme === "visa"
      ? "Visa"
      : hit.scheme === "mastercard"
        ? "Mastercard"
        : hit.scheme === "amex"
          ? "Amex"
          : hit.scheme === "unionpay"
            ? "银联"
            : "未知组织";
  const bits = [BIN_COUNTRY_LABEL[hit.country] || hit.countryName, scheme];
  if (hit.bank) bits.push(hit.bank);
  if (hit.brand && !bits.some((b) => b.toLowerCase().includes(hit.brand!.toLowerCase()))) {
    bits.push(hit.brand);
  }
  return bits.join(" · ");
}

export function sourceLabel(source: BinSource | string): string {
  if (source === "known") return "本站已知段";
  if (source === "index") return "开源库";
  if (source === "prefix") return "仅卡组织";
  return "公共库";
}

interface BinlistPayload {
  scheme?: string | null;
  type?: string | null;
  brand?: string | null;
  prepaid?: boolean | null;
  country?: {
    alpha2?: string | null;
    name?: string | null;
  } | null;
  bank?: {
    name?: string | null;
  } | null;
}

interface HandyPayload {
  Status?: string;
  Scheme?: string | null;
  Type?: string | null;
  Issuer?: string | null;
  CardTier?: string | null;
  Country?: {
    A2?: string | null;
    Name?: string | null;
  } | null;
}

function schemeOf(raw: string | null | undefined, bin: string): BinScheme {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("visa")) return "visa";
  if (s.includes("master")) return "mastercard";
  if (s.includes("american") || s === "amex") return "amex";
  if (s.includes("union") || s.includes("discover")) return "unionpay";
  return schemeFromPrefix(bin);
}

export function parseHandyPayload(bin: string, json: unknown): BinHit | "rate" | null {
  if (!json || typeof json !== "object") return null;
  const o = json as HandyPayload;
  const status = String(o.Status ?? "");
  if (/rate limit/i.test(status)) return "rate";
  if (status.toUpperCase() !== "SUCCESS") return null;
  const alpha2 = o.Country?.A2 ?? undefined;
  const name = o.Country?.Name ?? undefined;
  const country = countryFromAlpha2(alpha2, name);
  const bank = (o.Issuer ?? "").trim();
  const brand = (o.CardTier ?? "").trim();
  return {
    bin,
    scheme: schemeOf(o.Scheme, bin),
    type: o.Type ?? undefined,
    brand: brand || undefined,
    country,
    countryName: name || BIN_COUNTRY_LABEL[country],
    countryAlpha2: alpha2 ?? undefined,
    bank: bank || undefined,
    source: "live",
  };
}

export function parseBinlistPayload(bin: string, json: unknown): BinHit | null {
  if (!json || typeof json !== "object") return null;
  const o = json as BinlistPayload;
  const country = countryFromAlpha2(o.country?.alpha2 ?? undefined, o.country?.name ?? undefined);
  return {
    bin,
    scheme: schemeOf(o.scheme, bin),
    type: o.type ?? undefined,
    brand: o.brand ?? undefined,
    prepaid: typeof o.prepaid === "boolean" ? o.prepaid : undefined,
    country,
    countryName: o.country?.name ?? country,
    countryAlpha2: o.country?.alpha2 ?? undefined,
    bank: o.bank?.name ?? undefined,
    source: "live",
  };
}

type LiveLookup = { hit: BinHit } | { miss: true } | { rate: true };

async function getJson(
  url: string,
  headers?: Record<string, string>,
): Promise<{ status: number; json: unknown } | "network"> {
  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(6500),
    });
    if (res.status === 429 || res.status === 403) return { status: res.status, json: null };
    const json = await res.json().catch(() => null);
    return { status: res.status, json };
  } catch {
    return "network";
  }
}

/** HandyAPI allows browser CORS; anonymous quota is still small. */
export async function fetchHandyApi(bin: string): Promise<LiveLookup> {
  const got = await getJson(`https://data.handyapi.com/bin/${bin}`, {
    Accept: "application/json",
  });
  if (got === "network") return { miss: true };
  if (got.status === 429 || got.status === 403) return { rate: true };
  const parsed = parseHandyPayload(bin, got.json);
  if (parsed === "rate") return { rate: true };
  if (parsed) return { hit: parsed };
  return { miss: true };
}

/** Public IIN lookup. Same dataset as github.com/paylike/binlookup. No CORS; server-only. */
export async function fetchBinlist(bin: string): Promise<LiveLookup> {
  const got = await getJson(`https://lookup.binlist.net/${bin}`, {
    "Accept-Version": "3",
    Accept: "application/json",
  });
  if (got === "network") return { miss: true };
  if (got.status === 429 || got.status === 403) return { rate: true };
  if (got.status === 404) return { miss: true };
  const parsed = parseBinlistPayload(bin, got.json);
  if (parsed) return { hit: parsed };
  return { miss: true };
}

export async function lookupLive(bin: string): Promise<LiveLookup> {
  const handy = await fetchHandyApi(bin);
  if ("hit" in handy) return handy;
  const list = await fetchBinlist(bin);
  if ("hit" in list) return list;
  if ("rate" in handy || "rate" in list) return { rate: true };
  return { miss: true };
}

export function resolveLive(bin: string, live: LiveLookup): BinHit {
  if ("hit" in live) return live.hit;
  return prefixHit(bin, "rate" in live ? "rate" : "miss");
}

