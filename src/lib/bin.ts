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
  level?: string;
  prepaid?: boolean;
  country: BinCountry;
  countryName: string;
  countryAlpha2?: string;
  currency?: string;
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
  type?: string;
  brand?: string;
  level?: string;
  prepaid?: boolean;
}

/** Local U-card prefixes verified against public BIN data / community reports. Longer prefixes win. */
export const KNOWN_BINS: KnownBin[] = [
  {
    bin: "493875",
    scheme: "visa",
    country: "hk",
    bank: "Unicard Solution / Reap",
    cardSlug: "bybit",
    note: "Bybit 亚太常见段。公共库标香港 Unicard / Reap、Visa。订美区订阅不一定过。",
  },
  {
    bin: "493728",
    scheme: "visa",
    country: "hk",
    bank: "Reap Technologies",
    cardSlug: "redotpay",
    note: "RedotPay 美元卡常见段。香港 Unicard/Reap Visa。",
  },
  {
    bin: "414631",
    scheme: "visa",
    country: "hk",
    bank: "Reap Technologies",
    cardSlug: "redotpay",
    note: "RedotPay 港币卡常见段（卡号前五位 41463）。",
  },
  {
    bin: "454924",
    scheme: "visa",
    country: "pr",
    bank: "Bivo / Rain",
    note: "Rain 美区（波多黎各）常见段。KAST、Solayer、Plasma、ether.fi 等都可能发这段，不能单靠 BIN 认卡。",
  },
  {
    bin: "454926",
    scheme: "visa",
    country: "pr",
    bank: "Nimbus LLC",
    cardSlug: "tria",
    note: "Tria / Nimbus 美区（波多黎各）常见段。",
  },
  {
    bin: "54810849",
    scheme: "mastercard",
    country: "ch",
    bank: "Fiat24 / SR Saphirstein",
    note: "Fiat24 官方 8 位 BIN。Bitget Wallet、SafePal 等走这条瑞士 Mastercard 通道。6 位 548108 在开源库会误标成美国 Shazam，以 8 位为准。",
  },
  {
    bin: "559666",
    scheme: "mastercard",
    country: "us",
    bank: "MVB Bank, Inc.",
    cardSlug: "pokepay",
    note: "PokePay 美区 Mastercard Platinum。",
  },
  {
    bin: "442601",
    scheme: "visa",
    country: "uk",
    bank: "Wirex, Ltd.",
    cardSlug: "wirex",
    note: "Wirex 英国 Visa 段。",
  },
  {
    bin: "439771",
    scheme: "visa",
    country: "eea",
    bank: "Foris MT, Ltd.",
    cardSlug: "cryptocom",
    note: "Crypto.com 预付卡欧区 Foris 段之一，各地卡头不同。",
  },
  {
    bin: "440393",
    scheme: "visa",
    country: "us",
    bank: "Sutton Bank / Pathward",
    cardSlug: "coinbase",
    note: "Coinbase Card 常见美区 Visa 段。发卡行已迁 Pathward，卡头 440393 仍多见 Sutton。",
  },
  {
    bin: "459939",
    scheme: "visa",
    country: "my",
    bank: "CIMB Bank Berhad",
    type: "credit",
    brand: "Visa Platinum",
    level: "platinum",
    prepaid: false,
    cardSlug: "mexc",
    note: "马来西亚 CIMB Visa 白金。MEXC 全球卡走马来西亚通道时常见这段。公共库有时会误标成香港 TripLink，以马来西亚为准。",
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
  MY: "my",
};

const ALPHA_TO_CCY: Record<string, string> = {
  US: "USD",
  PR: "USD",
  HK: "HKD",
  GB: "GBP",
  UK: "GBP",
  SG: "SGD",
  CH: "CHF",
  AU: "AUD",
  GE: "GEL",
  KZ: "KZT",
  MY: "MYR",
  CN: "CNY",
  JP: "JPY",
  KR: "KRW",
  TW: "TWD",
  CA: "CAD",
  NZ: "NZD",
  IN: "INR",
  BR: "BRL",
  MX: "MXN",
  AE: "AED",
  TH: "THB",
  VN: "VND",
  PH: "PHP",
  ID: "IDR",
  AT: "EUR",
  BE: "EUR",
  BG: "BGN",
  HR: "EUR",
  CY: "EUR",
  CZ: "CZK",
  DK: "DKK",
  EE: "EUR",
  FI: "EUR",
  FR: "EUR",
  DE: "EUR",
  GR: "EUR",
  HU: "HUF",
  IE: "EUR",
  IT: "EUR",
  LV: "EUR",
  LT: "EUR",
  LU: "EUR",
  MT: "EUR",
  NL: "EUR",
  PL: "PLN",
  PT: "EUR",
  RO: "RON",
  SK: "EUR",
  SI: "EUR",
  ES: "EUR",
  SE: "SEK",
  IS: "ISK",
  LI: "CHF",
  NO: "NOK",
};

const COUNTRY_CCY: Record<BinCountry, string> = {
  us: "USD",
  pr: "USD",
  hk: "HKD",
  uk: "GBP",
  sg: "SGD",
  ch: "CHF",
  eea: "EUR",
  au: "AUD",
  ge: "GEL",
  kz: "KZT",
  my: "MYR",
  mixed: "",
  unknown: "",
};

const ALPHA_TO_ZH: Record<string, string> = {
  US: "美国",
  PR: "波多黎各",
  HK: "香港",
  GB: "英国",
  UK: "英国",
  SG: "新加坡",
  CH: "瑞士",
  AU: "澳洲",
  GE: "格鲁吉亚",
  KZ: "哈萨克斯坦",
  MY: "马来西亚",
  CN: "中国",
  TW: "台湾",
  JP: "日本",
  KR: "韩国",
  DE: "德国",
  FR: "法国",
  LT: "立陶宛",
  EE: "爱沙尼亚",
  IE: "爱尔兰",
  NL: "荷兰",
  ES: "西班牙",
  IT: "意大利",
  PL: "波兰",
  SE: "瑞典",
  NO: "挪威",
  DK: "丹麦",
  MT: "马耳他",
  CY: "塞浦路斯",
  BE: "比利时",
  AT: "奥地利",
  PT: "葡萄牙",
  FI: "芬兰",
  GR: "希腊",
  LU: "卢森堡",
  SK: "斯洛伐克",
  SI: "斯洛文尼亚",
  HR: "克罗地亚",
  HU: "匈牙利",
  CZ: "捷克",
  RO: "罗马尼亚",
  BG: "保加利亚",
  LV: "拉脱维亚",
  IS: "冰岛",
  LI: "列支敦士登",
  CA: "加拿大",
  NZ: "新西兰",
  IN: "印度",
  BR: "巴西",
  AE: "阿联酋",
  TH: "泰国",
  VN: "越南",
  PH: "菲律宾",
  ID: "印尼",
};

const LEVEL_ZH: Record<string, string> = {
  classic: "经典",
  standard: "普通",
  gold: "金卡",
  platinum: "白金",
  titanium: "钛金",
  business: "商务",
  commercial: "商旅",
  world: "World",
  black: "黑卡",
  infinite: "无限",
  premium: "高端",
  enhanced: "增强",
  gift: "礼品",
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

export function parseLevel(raw?: string | null): string | undefined {
  const s = (raw ?? "").toLowerCase().trim();
  if (!s) return undefined;
  if (s.includes("infinite") || s.includes("signature") || s.includes("无限") || s.includes("御玺")) {
    return "infinite";
  }
  if (s.includes("world elite")) return "world";
  if (s.includes("world")) return "world";
  if (s.includes("black") || s.includes("黑卡")) return "black";
  if (s.includes("titanium") || s.includes("钛金")) return "titanium";
  if (s.includes("platinum") || s.includes("白金")) return "platinum";
  if (s.includes("gold") || s.includes("金卡")) return "gold";
  if (s.includes("classic") || s.includes("经典")) return "classic";
  if (s.includes("standard") || s.includes("普通")) return "standard";
  if (s.includes("business") || s.includes("corporate") || s.includes("commercial") || s.includes("商务") || s.includes("商旅")) {
    return s.includes("commercial") || s.includes("travel") || s.includes("商旅") ? "commercial" : "business";
  }
  if (s.includes("premium") || s.includes("高端")) return "premium";
  if (s.includes("enhanced")) return "enhanced";
  if (s.includes("gift") || s.includes("礼品")) return "gift";
  return undefined;
}

export function levelLabel(level?: string, brand?: string): string {
  if (level && LEVEL_ZH[level]) return LEVEL_ZH[level]!;
  const fromBrand = parseLevel(brand);
  if (fromBrand && LEVEL_ZH[fromBrand]) return LEVEL_ZH[fromBrand]!;
  return "未知";
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
  if (n.includes("malaysia")) return "my";
  return "unknown";
}

export function currencyFromAlpha2(alpha2: string | undefined): string | undefined {
  const code = (alpha2 ?? "").toUpperCase();
  return (code && ALPHA_TO_CCY[code]) || undefined;
}

export function currencyFromCountry(country: BinCountry): string | undefined {
  return COUNTRY_CCY[country] || undefined;
}

export function schemeLabel(scheme: BinScheme): string {
  if (scheme === "visa") return "Visa";
  if (scheme === "mastercard") return "Mastercard";
  if (scheme === "amex") return "Amex";
  if (scheme === "unionpay") return "银联";
  return "未知";
}

export function typeLabel(type?: string, prepaid?: boolean): string {
  if (prepaid === true) return "预付";
  const t = (type ?? "").toLowerCase();
  if (t === "p" || t.includes("prepaid")) return "预付";
  if (t === "d" || t.includes("debit")) return "借记";
  if (t === "c" || t.includes("credit")) return "贷记";
  if (t.includes("charge")) return "签账";
  return type?.trim() || "未知";
}

export function prepaidLabel(prepaid?: boolean): string {
  if (prepaid === true) return "是";
  if (prepaid === false) return "否";
  return "未知";
}

export function countryDisplay(hit: Pick<BinHit, "country" | "countryName" | "countryAlpha2">): string {
  const alpha = (hit.countryAlpha2 ?? "").toUpperCase();
  if (alpha && ALPHA_TO_ZH[alpha]) return ALPHA_TO_ZH[alpha]!;
  const raw = (hit.countryName ?? "").replace(/\s*BIN\s*/g, "").trim();
  if (raw && raw !== "未收录" && raw !== hit.country) return raw;
  return BIN_COUNTRY_LABEL[hit.country]?.replace(" BIN", "").replace("（波多黎各）", "") || "未知";
}

export function withBinMeta(hit: BinHit): BinHit {
  const currency =
    (hit.currency && hit.currency !== "未知" ? hit.currency : undefined) ||
    currencyFromAlpha2(hit.countryAlpha2) ||
    currencyFromCountry(hit.country);
  const level = hit.level || parseLevel(hit.brand);
  return {
    ...hit,
    level,
    currency: currency || undefined,
    countryName: countryDisplay(hit),
  };
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
  return withBinMeta({
    bin: digitsOnly(bin) || known.bin,
    scheme: known.scheme,
    type: known.type,
    brand: known.brand,
    level: known.level,
    prepaid: known.prepaid,
    country: known.country,
    countryName: BIN_COUNTRY_LABEL[known.country],
    bank: known.bank,
    source: "known",
    cardSlug: known.cardSlug,
    note: known.note,
  });
}

export function prefixHit(bin: string, reason: "miss" | "rate" = "miss"): BinHit {
  const digits = digitsOnly(bin);
  const scheme = schemeFromPrefix(digits);
  const schemeName = schemeLabel(scheme);
  return withBinMeta({
    bin: digits,
    scheme,
    country: "unknown",
    countryName: "未收录",
    source: "prefix",
    note:
      reason === "rate"
        ? `公共库这小时额度用完了。按卡号前缀，这是 ${schemeName}；开源库若有发卡地会先显示。`
        : `公共库没有这条发卡行。按卡号前缀，这是 ${schemeName}。`,
  });
}

export function matchCatalog(bin: string, cards: UCard[]): UCard | undefined {
  return matchCatalogAll(bin, cards)[0];
}

export function matchCatalogAll(bin: string, cards: UCard[]): UCard[] {
  const digits = digitsOnly(bin);
  if (digits.length < 6) return [];
  const known = matchKnownBin(digits);
  const fromKnown = known?.cardSlug ? cards.filter((c) => c.slug === known.cardSlug) : [];
  const fromCode = cards.filter((c) => {
    const code = c.binCode?.replace(/\D/g, "") ?? "";
    return code.length >= 6 && (digits.startsWith(code) || code.startsWith(digits.slice(0, 6)));
  });
  const seen = new Set<string>();
  const out: UCard[] = [];
  for (const c of [...fromKnown, ...fromCode]) {
    if (seen.has(c.slug)) continue;
    seen.add(c.slug);
    out.push(c);
  }
  return out;
}

export function formatBinHit(hit: BinHit): string {
  const meta = withBinMeta(hit);
  const bits = [countryDisplay(meta), schemeLabel(meta.scheme)];
  if (meta.bank) bits.push(meta.bank);
  if (meta.brand && !bits.some((b) => b.toLowerCase().includes(meta.brand!.toLowerCase()))) {
    bits.push(meta.brand);
  }
  return bits.join(" · ");
}

/** Telegram 卡粉工具箱同款字段，方便复制到群里。 */
export function formatBinReport(hit: BinHit, cards: UCard[] = []): string {
  const meta = withBinMeta(hit);
  const matched = matchCatalogAll(meta.bin, cards);
  const lines = [
    "卡BIN查询",
    "",
    `卡片BIN: ${meta.bin}`,
    `支付体系: ${schemeLabel(meta.scheme)}`,
    `卡片类型: ${typeLabel(meta.type, meta.prepaid)}`,
    `卡片等级: ${levelLabel(meta.level, meta.brand)}`,
    `卡片币种: ${meta.currency || "未知"}`,
    `发行国家: ${countryDisplay(meta)}`,
    `银行名称: ${meta.bank || "未知"}`,
    `是否预付卡：${prepaidLabel(meta.prepaid)}`,
    `来源: ${sourceLabel(meta.source)}`,
  ];
  if (meta.note) lines.push("", meta.note);
  if (matched.length) lines.push("", `卡库对上：${matched.map((c) => c.name).join("、")}`);
  return lines.join("\n");
}

export function sourceLabel(source: BinSource | string): string {
  if (source === "known") return "本站已知段";
  if (source === "index") return "开源库";
  if (source === "prefix") return "仅卡组织";
  return "公共库";
}

export function sceneHint(hit: BinHit): string | undefined {
  if (hit.note) return undefined;
  if (hit.country === "pr" || hit.country === "us") {
    return "美区卡头。订 ChatGPT、绑美区 Apple ID 更常见，不保证过。";
  }
  if (hit.country === "hk") return "香港卡头。美区订阅不一定过。";
  return undefined;
}

export function needsLiveEnrichment(hit: BinHit, raw = hit.bin): boolean {
  if (hit.source === "known" || hit.source === "live") return false;
  const digits = digitsOnly(raw);
  if (digits.length >= 8) return true;
  if (hit.source === "prefix") return true;
  if (!hit.bank) return true;
  if (hit.country === "unknown") return true;
  return false;
}

/** Overlay a live/index hit onto a faster local result without clobbering known U-card rows. */
export function mergeBinHits(base: BinHit, extra: BinHit): BinHit {
  if (base.source === "known") {
    const samePlace = extra.country === "unknown" || extra.country === base.country;
    if (!samePlace) return base;
    return withBinMeta({
      ...base,
      type: base.type || extra.type,
      brand: base.brand || extra.brand,
      level: base.level || extra.level,
      prepaid: base.prepaid ?? extra.prepaid,
      currency: base.currency || extra.currency,
    });
  }
  const extraLonger = extra.bin.length > base.bin.length;
  const extraCountry = extra.country !== "unknown";
  const takeCountry = (base.country === "unknown" && extraCountry) || (extraLonger && extraCountry);
  const contributed = Boolean(
    (extra.bank && extra.bank !== base.bank) ||
      takeCountry ||
      extraLonger ||
      (extra.level && extra.level !== base.level) ||
      (extra.type && extra.type !== base.type),
  );
  return withBinMeta({
    bin: extra.bin.length >= base.bin.length ? extra.bin : base.bin,
    scheme: extra.scheme !== "unknown" ? extra.scheme : base.scheme,
    type: extra.type || base.type,
    brand: extra.brand || base.brand,
    level: extra.level || base.level,
    prepaid: extra.prepaid ?? base.prepaid,
    country: takeCountry ? extra.country : base.country,
    countryName: takeCountry ? extra.countryName : base.countryName,
    countryAlpha2: takeCountry ? extra.countryAlpha2 : base.countryAlpha2,
    currency: extra.currency || base.currency,
    bank: extra.bank || base.bank,
    source: extra.source === "live" && contributed ? extra.source : base.source,
    cardSlug: base.cardSlug || extra.cardSlug,
    cardName: base.cardName || extra.cardName,
    note: base.note,
  });
}

interface BinlistPayload {
  scheme?: string | null;
  type?: string | null;
  brand?: string | null;
  prepaid?: boolean | null;
  country?: {
    alpha2?: string | null;
    name?: string | null;
    currency?: string | null;
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

function prepaidOf(type?: string | null, prepaid?: boolean | null, brand?: string | null): boolean | undefined {
  if (typeof prepaid === "boolean") return prepaid;
  const t = `${type ?? ""} ${brand ?? ""}`.toLowerCase();
  if (t.includes("prepaid") || t.includes("gift")) return true;
  return undefined;
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
  return withBinMeta({
    bin,
    scheme: schemeOf(o.Scheme, bin),
    type: o.Type ?? undefined,
    brand: brand || undefined,
    level: parseLevel(brand),
    prepaid: prepaidOf(o.Type, undefined, brand),
    country,
    countryName: name || BIN_COUNTRY_LABEL[country],
    countryAlpha2: alpha2 ?? undefined,
    bank: bank || undefined,
    source: "live",
  });
}

export function parseBinlistPayload(bin: string, json: unknown): BinHit | null {
  if (!json || typeof json !== "object") return null;
  const o = json as BinlistPayload;
  const country = countryFromAlpha2(o.country?.alpha2 ?? undefined, o.country?.name ?? undefined);
  const currency = (o.country?.currency ?? "").trim();
  const brand = (o.brand ?? "").trim();
  return withBinMeta({
    bin,
    scheme: schemeOf(o.scheme, bin),
    type: o.type ?? undefined,
    brand: brand || undefined,
    level: parseLevel(brand),
    prepaid: prepaidOf(o.type, o.prepaid, brand),
    country,
    countryName: o.country?.name ?? country,
    countryAlpha2: o.country?.alpha2 ?? undefined,
    currency: currency || undefined,
    bank: o.bank?.name ?? undefined,
    source: "live",
  });
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
