import {
  countryFromAlpha2,
  currencyFromAlpha2,
  digitsOnly,
  schemeFromPrefix,
  withBinMeta,
  type BinHit,
  type BinScheme,
} from "./bin.ts";
import { BIN_COUNTRY_LABEL } from "../data/cards.ts";

export const BIN_INDEX_URL = "/bin-index.json.gz";
export const BIN_INDEX_CREDIT = "Techbuddie-Solutions/binlist-data";

export interface BinIndexFile {
  v: number;
  src: string;
  n: number;
  b: string[];
  r: string;
}

export interface LoadedBinIndex {
  banks: string[];
  lines: string[];
}

const SCHEME_CHAR: Record<string, BinScheme> = {
  v: "visa",
  m: "mastercard",
  a: "amex",
  u: "unionpay",
};

const TYPE_CHAR: Record<string, string> = {
  d: "debit",
  c: "credit",
  p: "prepaid",
};

export const LEVEL_CHAR: Record<string, string> = {
  c: "classic",
  s: "standard",
  g: "gold",
  p: "platinum",
  t: "titanium",
  b: "business",
  w: "world",
  k: "black",
  i: "infinite",
  m: "premium",
  e: "enhanced",
  f: "gift",
};

let pending: Promise<LoadedBinIndex | null> | null = null;

export function resetBinIndex() {
  pending = null;
}

export function parseIndexRecord(line: string, banks: string[]): BinHit | null {
  if (line.length < 10) return null;
  const bin = line.slice(0, 6);
  if (!/^\d{6}$/.test(bin)) return null;
  const scheme = SCHEME_CHAR[line[6] ?? ""] ?? schemeFromPrefix(bin);
  const alpha2 = line.slice(7, 9);
  const type = TYPE_CHAR[line[9] ?? ""] ?? undefined;
  const v2 = line.length > 10 && /[a-z]/.test(line[10] ?? "");
  const level = v2 ? LEVEL_CHAR[line[10] ?? ""] : undefined;
  const bankIdx = Number(line.slice(v2 ? 11 : 10));
  const bank = Number.isInteger(bankIdx) ? banks[bankIdx] : undefined;
  const country = alpha2 === "??" ? "unknown" : countryFromAlpha2(alpha2);
  return withBinMeta({
    bin,
    scheme,
    type,
    level,
    prepaid: type === "prepaid" ? true : undefined,
    country,
    countryName: country === "unknown" ? "未收录" : BIN_COUNTRY_LABEL[country],
    countryAlpha2: alpha2 === "??" ? undefined : alpha2,
    currency: alpha2 === "??" ? undefined : currencyFromAlpha2(alpha2),
    bank: bank || undefined,
    source: "index",
  });
}

export function matchIndexLines(bin: string, lines: string[], banks: string[]): BinHit | undefined {
  const key = digitsOnly(bin).slice(0, 6);
  if (key.length < 6) return undefined;
  let lo = 0;
  let hi = lines.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const line = lines[mid] ?? "";
    const k = line.slice(0, 6);
    if (k === key) return parseIndexRecord(line, banks) ?? undefined;
    if (k < key) lo = mid + 1;
    else hi = mid - 1;
  }
  return undefined;
}

export function loadIndexFile(json: BinIndexFile): LoadedBinIndex {
  return { banks: json.b, lines: json.r.split("\n") };
}

export async function decodeIndexBody(buf: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buf);
  const gzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (!gzip) return new TextDecoder().decode(bytes);
  return gunzipToText(buf);
}

async function gunzipToText(buf: ArrayBuffer): Promise<string> {
  if (typeof DecompressionStream === "function") {
    const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  }
  const zlib = await import("node:zlib");
  return zlib.gunzipSync(Buffer.from(buf)).toString("utf8");
}

export async function loadBinIndex(url = BIN_INDEX_URL): Promise<LoadedBinIndex | null> {
  if (!pending) {
    pending = (async () => {
      const res = await fetch(url);
      if (!res.ok) return null;
      const json = JSON.parse(await decodeIndexBody(await res.arrayBuffer())) as BinIndexFile;
      if (!json?.r || !Array.isArray(json.b)) return null;
      return loadIndexFile(json);
    })().catch(() => null);
  }
  return pending;
}

export async function matchIndex(bin: string): Promise<BinHit | undefined> {
  const idx = await loadBinIndex();
  if (!idx) return undefined;
  return matchIndexLines(bin, idx.lines, idx.banks);
}
