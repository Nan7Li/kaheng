export const APPSTORE_DEFAULT_COUNTRIES = [
  "TW",
  "HK",
  "US",
  "JP",
  "PH",
  "SG",
  "MY",
  "TR",
  "GB",
  "DE",
] as const;

export const APPSTORE_COUNTRY_LABEL: Record<string, string> = {
  TW: "台湾",
  HK: "香港",
  US: "美国",
  JP: "日本",
  PH: "菲律宾",
  SG: "新加坡",
  MY: "马来西亚",
  TR: "土耳其",
  GB: "英国",
  DE: "德国",
  CN: "中国",
  KR: "韩国",
  IN: "印度",
  TH: "泰国",
  VN: "越南",
  AU: "澳大利亚",
  CA: "加拿大",
  NG: "尼日利亚",
  BR: "巴西",
  FR: "法国",
};

export const KNOWN_APPS = [
  { id: "6448311069", name: "ChatGPT", hint: "订阅价见「订阅」" },
  { id: "324684580", name: "Spotify", hint: "订阅价见「订阅」" },
  { id: "363590051", name: "Netflix", hint: "订阅价见「订阅」" },
] as const;

export interface ParsedAppStore {
  country?: string;
  slug?: string;
  id?: string;
  term?: string;
}

const APP_URL =
  /(?:https?:\/\/)?(?:apps\.apple\.com|itunes\.apple\.com)\/(?:(?<country>[a-z]{2})\/)?app\/(?:(?<slug>[^/]+)\/)?id?(?<id>\d+)/i;
const ID_ONLY = /(?:id)?(\d{8,12})\b/i;

export function parseAppStoreInput(raw: string): ParsedAppStore | null {
  const text = raw.trim();
  if (!text) return null;
  const url = text.match(APP_URL);
  if (url?.groups?.id) {
    return {
      country: url.groups.country?.toUpperCase(),
      slug: url.groups.slug && url.groups.slug !== "id" ? url.groups.slug : undefined,
      id: url.groups.id,
    };
  }
  const plain = text.match(
    /apps\.apple\.com\/[^\s]*id(\d{8,12})/i,
  );
  if (plain) return { id: plain[1] };
  if (/^\d{8,12}$/.test(text)) return { id: text };
  if (/^id\d{8,12}$/i.test(text)) return { id: text.replace(/^id/i, "") };
  const idMatch = text.match(ID_ONLY);
  if (idMatch && /app/i.test(text)) return { id: idMatch[1] };
  if (text.length >= 2 && !text.startsWith("/")) return { term: text };
  return null;
}

export function isAppStoreUrl(raw: string): boolean {
  return /(?:apps|itunes)\.apple\.com/i.test(raw);
}

export interface ItunesApp {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  formattedPrice?: string;
  price: number;
  currency: string;
  trackViewUrl?: string;
  country: string;
}

export interface ItunesLookupResult {
  appId: string;
  term?: string;
  apps: ItunesApp[];
  searches?: Array<{ trackId: number; trackName: string; artistName: string; artworkUrl100?: string }>;
}

export function knownAppHint(id: string): string | undefined {
  return KNOWN_APPS.find((a) => a.id === id)?.hint;
}
