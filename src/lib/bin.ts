import {
  BIN_COUNTRY_LABEL,
  type BinCountry,
  type Network,
  type UCard,
} from "../data/cards.ts";

export type BinScheme = "visa" | "mastercard" | "amex" | "unionpay" | "unknown";

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
  source: "known" | "binlist";
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

/** Local U-card prefixes verified against binlist / community reports. Longer prefixes win. */
export const KNOWN_BINS: KnownBin[] = [
  {
    bin: "493875",
    scheme: "visa",
    country: "hk",
    bank: "Reap Technologies Limited",
    cardSlug: "bybit",
    note: "Bybit 亚太常见段。binlist：香港 Reap、Visa Platinum。订美区订阅不一定过。",
  },
  {
    bin: "454924",
    scheme: "visa",
    country: "pr",
    bank: "Bivo, Inc.",
    cardSlug: "solayer",
    note: "Solayer 美区（波多黎各）Visa Platinum。社区反馈订 ChatGPT 通过率高。",
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

function schemeOf(raw: string | null | undefined, bin: string): BinScheme {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("visa")) return "visa";
  if (s.includes("master")) return "mastercard";
  if (s.includes("american") || s === "amex") return "amex";
  if (s.includes("union")) return "unionpay";
  return schemeFromPrefix(bin);
}

/** Public IIN lookup. Same dataset as github.com/paylike/binlookup. */
export async function fetchBinlist(bin: string): Promise<BinHit | null> {
  const res = await fetch(`https://lookup.binlist.net/${bin}`, {
    headers: {
      "Accept-Version": "3",
      Accept: "application/json",
    },
  });
  if (res.status === 404) return null;
  if (res.status === 429) {
    throw new Error("BIN 公共库这小时额度用完了，请稍后再试，或先看本站已知 U 卡段。");
  }
  if (!res.ok) throw new Error(`BIN 查询失败（${res.status}）`);
  const json = (await res.json()) as BinlistPayload;
  const country = countryFromAlpha2(json.country?.alpha2 ?? undefined, json.country?.name ?? undefined);
  return {
    bin,
    scheme: schemeOf(json.scheme, bin),
    type: json.type ?? undefined,
    brand: json.brand ?? undefined,
    prepaid: typeof json.prepaid === "boolean" ? json.prepaid : undefined,
    country,
    countryName: json.country?.name ?? country,
    countryAlpha2: json.country?.alpha2 ?? undefined,
    bank: json.bank?.name ?? undefined,
    source: "binlist",
  };
}
