import {
  BIN_SEED,
  type BinCountry,
  type CardLevel,
  type Category,
  type Custody,
  type FormFactor,
  type Kyc,
  type Network,
  type Region,
  type Scene,
  type Status,
  type Tint,
  type UCard,
  type Verification,
} from "../data/cards.ts";
import { createBlankCard, normalizeCard } from "./catalog.ts";
import { cardMoney } from "./money.ts";

export const SHEET_HEADER = `# 卡衡单卡 v1
# 把整段复制发给其他 AI 核对或修改，改完原样贴回即可导入。
# 只改冒号后面的值，不要改字段名。百分号、金额只写数字，不要加 % 或 $。
# 空着表示无。是否用 是 / 否。优点缺点每行一条，以 - 开头。
`;

const BOOL_YES = new Set(["是", "true", "yes", "1", "y"]);
const BOOL_NO = new Set(["否", "false", "no", "0", "n"]);

function yn(v: boolean | undefined): string {
  return v ? "是" : "否";
}
function numOrEmpty(v: number | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v);
}
function list(v: string[] | undefined): string {
  return (v ?? []).join(", ");
}

function serializeLevels(levels: CardLevel[] | undefined): string {
  if (!levels?.length) return "";
  const lines = levels.map((l) => {
    const bits = [l.id, l.name];
    if (l.openingFeeUsd !== undefined) bits.push(`开卡:${l.openingFeeUsd}`);
    if (l.annualFeeUsd !== undefined) bits.push(`年费:${l.annualFeeUsd}`);
    if (l.monthlyFeeUsd !== undefined) bits.push(`月费:${l.monthlyFeeUsd}`);
    if (l.topupFeePct !== undefined) bits.push(`充值:${l.topupFeePct}`);
    if (l.spendFeePct !== undefined) bits.push(`消费:${l.spendFeePct}`);
    if (l.fxFeePct !== undefined) bits.push(`FX:${l.fxFeePct}`);
    if (l.cashbackPct !== undefined) bits.push(`返现:${l.cashbackPct}`);
    if (l.cashbackAmountCapUsd !== undefined) bits.push(`封顶:${numOrEmpty(l.cashbackAmountCapUsd)}`);
    if (l.cashbackSpendCapUsd !== undefined) bits.push(`计返:${numOrEmpty(l.cashbackSpendCapUsd)}`);
    return `- ${bits.join(" | ")}`;
  });
  return `档位:\n${lines.join("\n")}\n`;
}

export function serializeCard(card: UCard): string {
  const bin = {
    binCountry: card.binCountry ?? BIN_SEED[card.slug]?.binCountry ?? "",
    binCode: card.binCode ?? BIN_SEED[card.slug]?.binCode ?? "",
    binIssuer: card.binIssuer ?? BIN_SEED[card.slug]?.binIssuer ?? "",
  };
  const pros = (card.pros ?? []).map((p) => `- ${p}`).join("\n") || "- ";
  const cons = (card.cons ?? []).map((p) => `- ${p}`).join("\n") || "- ";
  const money = cardMoney(card);
  return `${SHEET_HEADER}
标识: ${card.slug}
中文名: ${card.name}
英文名: ${card.nameEn}
发行方: ${card.issuer}
官网: ${card.url ?? ""}
邀请码: ${card.inviteCode ?? ""}
邀请链接: ${card.inviteUrl ?? ""}
卡组织: ${card.network}
形态: ${card.form}
状态: ${card.status}
状态说明: ${card.statusNote ?? ""}
类型: ${card.category}
托管: ${card.custody}
KYC: ${card.kyc}
KYC说明: ${card.kycNote ?? ""}
地区: ${list(card.regions)}
Apple Pay: ${yn(card.applePay)}
Google Pay: ${yn(card.googlePay)}
卡面色: ${card.tint}
BIN地: ${bin.binCountry}
BIN号: ${bin.binCode}
发卡行: ${bin.binIssuer}
开卡费: ${card.openingFeeUsd}
实体卡费: ${card.physicalFeeUsd}
年费: ${card.annualFeeUsd}
月费: ${card.monthlyFeeUsd}
充值费: ${card.topupFeePct}
币种转换费: ${card.cryptoConversionFeePct ?? 0}
消费费: ${card.spendFeePct}
活动消费费: ${numOrEmpty(card.promoSpendFeePct)}
活动截止: ${card.promoUntil ?? ""}
FX: ${card.fxFeePct}
结算币: ${card.settlement ?? money.settlement}
扣款币: ${card.nativeAsset ?? money.nativeAsset}
锚定: ${card.pegPolicy ?? money.peg}
卡内锚定率: ${numOrEmpty(card.pegRate)}
免FX: ${list(card.fxFree ?? money.fxFree)}
入门返现: ${card.cashbackPct}
进阶返现: ${card.cashbackPctHigh}
入门封顶: ${numOrEmpty(card.cashbackAmountCapUsd)}
进阶封顶: ${numOrEmpty(card.cashbackAmountCapHighUsd)}
计返消费: ${numOrEmpty(card.cashbackSpendCapUsd)}
返现说明: ${card.cashbackNote ?? ""}
${serializeLevels(card.levels)}资产: ${list(card.assets)}
场景: ${list(card.scenes)}
风险: ${card.risk}
风险说明: ${card.riskNote ?? ""}
摘要: ${card.summary ?? ""}
最适合: ${card.bestFor ?? ""}
停服日期: ${card.shutdownDate ?? ""}
更新: ${card.updatedAt ?? ""}
核验级别: ${card.verification ?? "unverified"}
核验日期: ${card.verifiedAt ?? ""}
来源链接: ${(card.sourceUrls ?? []).join(" | ")}
优点:
${pros}
缺点:
${cons}
`.trimStart();
}

function parseBool(v: string, fallback: boolean): boolean {
  const s = v.trim().toLowerCase();
  if (BOOL_YES.has(s) || BOOL_YES.has(v.trim())) return true;
  if (BOOL_NO.has(s) || BOOL_NO.has(v.trim())) return false;
  return fallback;
}

function parseNum(v: string, fallback = 0): number {
  if (!v.trim()) return fallback;
  const n = Number(v.replace(/%/g, "").replace(/\$/g, "").trim());
  return Number.isFinite(n) ? n : fallback;
}

function parseNullNum(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v.replace(/%/g, "").replace(/\$/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function splitList(v: string): string[] {
  return v
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBulletBlock(lines: string[], start: number): { items: string[]; next: number } {
  const items: string[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (/^[^#\s][^:]*:/.test(line) && !/^\s*[-*•]/.test(line)) break;
    const m = line.match(/^\s*[-*•]\s*(.*)$/);
    if (m) items.push((m[1] ?? "").trim());
    else if (line.trim()) items.push(line.trim());
    i += 1;
  }
  return { items: items.filter(Boolean), next: i };
}

function parseLevelLine(line: string): CardLevel | null {
  const parts = line
    .replace(/^\s*[-*•]\s*/, "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const id = parts[0] ?? "";
  const name = parts[1] ?? "";
  if (!id || !name) return null;
  const map = new Map<string, string>();
  for (const p of parts.slice(2)) {
    const m = p.match(/^([^:]+):\s*(.*)$/);
    if (m) map.set((m[1] ?? "").trim(), (m[2] ?? "").trim());
  }
  const opt = (k: string): number | undefined => {
    const v = map.get(k);
    if (v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const cap = (k: string): number | null | undefined => {
    if (!map.has(k)) return undefined;
    const v = map.get(k) ?? "";
    if (v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const level: CardLevel = { id, name };
  const opening = opt("开卡");
  const annual = opt("年费");
  const monthly = opt("月费");
  const topup = opt("充值");
  const spend = opt("消费");
  const fx = opt("FX");
  const cashback = opt("返现");
  const amountCap = cap("封顶");
  const spendCap = cap("计返");
  if (opening !== undefined) level.openingFeeUsd = opening;
  if (annual !== undefined) level.annualFeeUsd = annual;
  if (monthly !== undefined) level.monthlyFeeUsd = monthly;
  if (topup !== undefined) level.topupFeePct = topup;
  if (spend !== undefined) level.spendFeePct = spend;
  if (fx !== undefined) level.fxFeePct = fx;
  if (cashback !== undefined) level.cashbackPct = cashback;
  if (amountCap !== undefined) level.cashbackAmountCapUsd = amountCap;
  if (spendCap !== undefined) level.cashbackSpendCapUsd = spendCap;
  return level;
}

export function parseCardSheet(text: string): UCard {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const json = JSON.parse(trimmed) as unknown;
    const raw = Array.isArray(json) ? json[0] : json;
    const card = normalizeCard(raw);
    if (!card) throw new Error("JSON 里没有可用的卡");
    return card;
  }

  const base = createBlankCard();
  const map = new Map<string, string>();
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let pros: string[] | undefined;
  let cons: string[] | undefined;
  let levels: CardLevel[] | undefined;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const t = line.trim();
    if (!t || t.startsWith("#")) {
      i += 1;
      continue;
    }
    const m = line.match(/^([^:#\n]+):\s*(.*)$/);
    if (!m) {
      i += 1;
      continue;
    }
    const key = m[1].trim();
    const val = (m[2] ?? "").trim();
    if (key === "优点") {
      const block = parseBulletBlock(lines, i + 1);
      pros = block.items;
      i = block.next;
      continue;
    }
    if (key === "缺点") {
      const block = parseBulletBlock(lines, i + 1);
      cons = block.items;
      i = block.next;
      continue;
    }
    if (key === "档位") {
      const block = parseBulletBlock(lines, i + 1);
      const parsed = block.items.map(parseLevelLine).filter((l): l is CardLevel => Boolean(l));
      levels = parsed.length ? parsed : undefined;
      i = block.next;
      continue;
    }
    map.set(key, val);
    i += 1;
  }

  const g = (k: string) => map.get(k) ?? "";
  const network = (g("卡组织") || base.network).toLowerCase() as Network;
  const form = (g("形态") || base.form) as FormFactor;
  const status = (g("状态") || base.status) as Status;
  const category = (g("类型") || base.category) as Category;
  const custody = (g("托管") || base.custody) as Custody;
  const kyc = (g("KYC") || base.kyc) as Kyc;
  const tint = (g("卡面色") || base.tint) as Tint;
  const binCountry = (g("BIN地") || base.binCountry || "unknown") as BinCountry;

  const raw: Partial<UCard> = {
    ...base,
    slug: g("标识") || base.slug,
    name: g("中文名") || base.name,
    nameEn: g("英文名") || base.nameEn,
    issuer: g("发行方") || base.issuer,
    url: g("官网") || undefined,
    inviteCode: g("邀请码") || undefined,
    inviteUrl: g("邀请链接") || undefined,
    network: ["visa", "mastercard"].includes(network) ? network : base.network,
    form: ["virtual", "physical", "both"].includes(form) ? form : base.form,
    status: ["active", "restricted", "shutdown"].includes(status) ? status : base.status,
    statusNote: g("状态说明"),
    category: ["exchange", "wallet", "defi", "vcc"].includes(category) ? category : base.category,
    custody: ["custodial", "self-custody", "hybrid"].includes(custody) ? custody : base.custody,
    kyc: ["none", "basic", "id", "passport", "full"].includes(kyc) ? kyc : base.kyc,
    kycNote: g("KYC说明"),
    regions: splitList(g("地区")).length ? (splitList(g("地区")) as Region[]) : base.regions,
    applePay: parseBool(g("Apple Pay"), base.applePay),
    googlePay: parseBool(g("Google Pay"), base.googlePay),
    tint: ["sage", "slate", "stone", "olive", "ink", "paper"].includes(tint) ? tint : base.tint,
    binCountry,
    binCode: g("BIN号") || undefined,
    binIssuer: g("发卡行") || undefined,
    openingFeeUsd: parseNum(g("开卡费")),
    physicalFeeUsd: parseNum(g("实体卡费")),
    annualFeeUsd: parseNum(g("年费")),
    monthlyFeeUsd: parseNum(g("月费")),
    topupFeePct: parseNum(g("充值费")),
    cryptoConversionFeePct: parseNum(g("币种转换费")),
    spendFeePct: parseNum(g("消费费")),
    promoSpendFeePct: g("活动消费费") === "" ? undefined : parseNum(g("活动消费费")),
    promoUntil: g("活动截止") || undefined,
    fxFeePct: parseNum(g("FX")),
    settlement: (["USD", "EUR", "SGD", "GBP"].includes(g("结算币"))
      ? g("结算币")
      : undefined) as UCard["settlement"],
    nativeAsset: (["USDT", "USDC", "USDG", "EURe"].includes(g("扣款币"))
      ? g("扣款币")
      : undefined) as UCard["nativeAsset"],
    pegPolicy: (g("锚定") === "one-to-one" || g("锚定") === "官方1:1" || g("锚定") === "1:1"
      ? "one-to-one"
      : g("锚定") === "market" || g("锚定") === "市价"
        ? "market"
        : undefined),
    pegRate: (() => {
      const value = parseNum(g("卡内锚定率"), Number.NaN);
      return Number.isFinite(value) && value > 0 ? value : undefined;
    })(),
    fxFree: splitList(g("免FX")).length ? splitList(g("免FX")) : undefined,
    cashbackPct: parseNum(g("入门返现")),
    cashbackPctHigh: parseNum(g("进阶返现")),
    cashbackAmountCapUsd: parseNullNum(g("入门封顶")),
    cashbackAmountCapHighUsd: parseNullNum(g("进阶封顶")),
    cashbackSpendCapUsd: parseNullNum(g("计返消费")),
    cashbackNote: g("返现说明"),
    levels,
    assets: splitList(g("资产")).length ? splitList(g("资产")) : base.assets,
    scenes: (splitList(g("场景")) as Scene[]) || base.scenes,
    risk: ([1, 2, 3, 4, 5] as const).includes(Number(g("风险")) as 1)
      ? (Number(g("风险")) as 1 | 2 | 3 | 4 | 5)
      : 3,
    riskNote: g("风险说明"),
    summary: g("摘要"),
    bestFor: g("最适合"),
    shutdownDate: g("停服日期") || undefined,
    updatedAt: g("更新") || base.updatedAt,
    verification: (["official", "partial", "secondary", "unverified"].includes(g("核验级别"))
      ? g("核验级别")
      : "unverified") as Verification,
    verifiedAt: g("核验日期") || undefined,
    sourceUrls: g("来源链接")
      .split("|")
      .map((url) => url.trim())
      .filter(Boolean),
    pros: pros ?? base.pros,
    cons: cons ?? base.cons,
  };

  const card = normalizeCard(raw);
  if (!card) throw new Error("解析失败");
  return card;
}

export function parseImportPayload(
  text: string,
): { mode: "one"; card: UCard } | { mode: "all"; cards: UCard[] } {
  const t = text.trim();
  if (t.startsWith("[")) {
    const json = JSON.parse(t) as unknown;
    if (!Array.isArray(json)) throw new Error("不是数组");
    const cards = json.map(normalizeCard).filter((c): c is UCard => Boolean(c));
    if (!cards.length) throw new Error("JSON 里没有可用的卡");
    return { mode: "all", cards };
  }
  return { mode: "one", card: parseCardSheet(t) };
}

export function looksLikeSheet(text: string): boolean {
  const t = text.trim();
  if (t.startsWith("{") || t.startsWith("[")) return true;
  return t.includes("标识:") && (t.includes("中文名:") || t.includes("# 卡衡单卡"));
}

export function downloadSheet(card: UCard) {
  const blob = new Blob([serializeCard(card)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${card.slug || "card"}-kaheng.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copySheet(card: UCard): Promise<void> {
  const text = serializeCard(card);
  await navigator.clipboard.writeText(text);
}

