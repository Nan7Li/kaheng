import { create } from "zustand";
import { CARDS, type CardLevel, type UCard } from "../data/cards.ts";

/** Bump when built-in CARDS fees change so seed-owned DB rows rematch. */
export const SEED_REVISION = 8;
export const SEED_ACTOR = "seed";

function cloneCards(): UCard[] {
  return JSON.parse(JSON.stringify(CARDS)) as UCard[];
}

function asNum(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asCap(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return undefined;
}

function normalizeLevel(raw: unknown): CardLevel | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Partial<CardLevel>;
  const id = typeof l.id === "string" ? l.id.trim() : "";
  const name = typeof l.name === "string" ? l.name.trim() : "";
  if (!id || !name) return null;
  const level: CardLevel = { id, name };
  if (typeof l.note === "string" && l.note) level.note = l.note;
  if (typeof l.openingFeeUsd === "number" && Number.isFinite(l.openingFeeUsd)) {
    level.openingFeeUsd = l.openingFeeUsd;
  }
  if (typeof l.annualFeeUsd === "number" && Number.isFinite(l.annualFeeUsd)) {
    level.annualFeeUsd = l.annualFeeUsd;
  }
  if (typeof l.monthlyFeeUsd === "number" && Number.isFinite(l.monthlyFeeUsd)) {
    level.monthlyFeeUsd = l.monthlyFeeUsd;
  }
  if (typeof l.topupFeePct === "number" && Number.isFinite(l.topupFeePct)) {
    level.topupFeePct = l.topupFeePct;
  }
  if (typeof l.spendFeePct === "number" && Number.isFinite(l.spendFeePct)) {
    level.spendFeePct = l.spendFeePct;
  }
  if (typeof l.fxFeePct === "number" && Number.isFinite(l.fxFeePct)) {
    level.fxFeePct = l.fxFeePct;
  }
  if (typeof l.cashbackPct === "number" && Number.isFinite(l.cashbackPct)) {
    level.cashbackPct = l.cashbackPct;
  }
  const amountCap = asCap(l.cashbackAmountCapUsd);
  if (amountCap !== undefined) level.cashbackAmountCapUsd = amountCap;
  const spendCap = asCap(l.cashbackSpendCapUsd);
  if (spendCap !== undefined) level.cashbackSpendCapUsd = spendCap;
  return level;
}

export function normalizeCard(raw: unknown): UCard | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<UCard>;
  if (typeof c.slug !== "string" || !c.slug) return null;
  const blank = createBlankCard();
  return {
    ...blank,
    ...c,
    slug: c.slug,
    name: typeof c.name === "string" && c.name ? c.name : blank.name,
    nameEn: typeof c.nameEn === "string" ? c.nameEn : blank.nameEn,
    issuer: typeof c.issuer === "string" ? c.issuer : "",
    scenes: Array.isArray(c.scenes) ? c.scenes : blank.scenes,
    regions: Array.isArray(c.regions) ? c.regions : blank.regions,
    assets: Array.isArray(c.assets) ? c.assets : blank.assets,
    pros: Array.isArray(c.pros) ? c.pros : [],
    cons: Array.isArray(c.cons) ? c.cons : [],
    binCountry: typeof c.binCountry === "string" ? c.binCountry : undefined,
    binCode: typeof c.binCode === "string" ? c.binCode : undefined,
    binIssuer: typeof c.binIssuer === "string" ? c.binIssuer : undefined,
    faceUrl: typeof c.faceUrl === "string" ? c.faceUrl : undefined,
    inviteCode: typeof c.inviteCode === "string" && c.inviteCode ? c.inviteCode : undefined,
    inviteUrl: typeof c.inviteUrl === "string" && c.inviteUrl ? c.inviteUrl : undefined,
    openingFeeUsd: asNum(c.openingFeeUsd),
    physicalFeeUsd: asNum(c.physicalFeeUsd),
    annualFeeUsd: asNum(c.annualFeeUsd),
    monthlyFeeUsd: asNum(c.monthlyFeeUsd),
    topupFeePct: asNum(c.topupFeePct),
    cryptoConversionFeePct: asNum(c.cryptoConversionFeePct),
    spendFeePct: asNum(c.spendFeePct),
    fxFeePct: asNum(c.fxFeePct),
    cashbackPct: asNum(c.cashbackPct),
    cashbackPctHigh: asNum(c.cashbackPctHigh),
    sourceUrls: Array.isArray(c.sourceUrls)
      ? c.sourceUrls.filter((url): url is string => typeof url === "string")
      : [],
    risk: ([1, 2, 3, 4, 5] as const).includes(c.risk as 1) ? (c.risk as 1 | 2 | 3 | 4 | 5) : 3,
    levels: Array.isArray(c.levels)
      ? c.levels.map(normalizeLevel).filter((l): l is CardLevel => Boolean(l))
      : undefined,
  };
}

export interface CatalogRow {
  slug: string;
  payload: unknown;
  updated_by: string;
}

export function parseCatalogPayload(payload: unknown): UCard | null {
  if (typeof payload === "string") {
    try {
      return normalizeCard(JSON.parse(payload));
    } catch {
      return null;
    }
  }
  return normalizeCard(payload);
}

export function orderCatalog(cards: UCard[]): UCard[] {
  const seedOrder = CARDS.map((c) => c.slug);
  const seedSet = new Set(seedOrder);
  const bySlug = new Map(cards.map((c) => [c.slug, c]));
  const extras = cards.filter((c) => !seedSet.has(c.slug));
  const seeded = seedOrder.map((slug) => bySlug.get(slug)).filter((c): c is UCard => Boolean(c));
  return [...extras, ...seeded];
}

export function cardsFromRows(rows: CatalogRow[]): UCard[] {
  const cards = rows
    .map((row) => parseCatalogPayload(row.payload))
    .filter((c): c is UCard => Boolean(c));
  return orderCatalog(cards);
}

/** Seed rows refresh with built-in fees; admin-edited slugs stay put. */
export function mergeCatalogRows(rows: CatalogRow[]): CatalogRow[] {
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  const seedSlugs = new Set(CARDS.map((c) => c.slug));
  const next: CatalogRow[] = CARDS.map((seed) => {
    const old = bySlug.get(seed.slug);
    if (!old || old.updated_by === SEED_ACTOR) {
      return { slug: seed.slug, payload: seed, updated_by: SEED_ACTOR };
    }
    const card = parseCatalogPayload(old.payload);
    return {
      slug: seed.slug,
      payload: card ?? seed,
      updated_by: old.updated_by,
    };
  });
  for (const row of rows) {
    if (!seedSlugs.has(row.slug)) next.push(row);
  }
  return next;
}

export function createBlankCard(): UCard {
  return {
    slug: "new-card",
    name: "新卡",
    nameEn: "New Card",
    issuer: "",
    network: "visa",
    form: "virtual",
    status: "active",
    statusNote: "",
    category: "vcc",
    custody: "custodial",
    kyc: "basic",
    kycNote: "",
    regions: ["global"],
    applePay: false,
    googlePay: false,
    tint: "slate",
    binCountry: "unknown",
    openingFeeUsd: 0,
    physicalFeeUsd: 0,
    annualFeeUsd: 0,
    monthlyFeeUsd: 0,
    topupFeePct: 0,
    cryptoConversionFeePct: 0,
    spendFeePct: 0,
    fxFeePct: 0,
    cashbackPct: 0,
    cashbackPctHigh: 0,
    cashbackAmountCapUsd: null,
    cashbackAmountCapHighUsd: null,
    cashbackSpendCapUsd: null,
    cashbackNote: "",
    assets: ["USDT"],
    scenes: ["ai"],
    risk: 3,
    riskNote: "",
    summary: "",
    bestFor: "",
    pros: [],
    cons: [],
    sourceUrls: [],
    verification: "unverified",
    updatedAt: "2026-09-10",
  };
}

interface CatalogState {
  cards: UCard[];
  hydrated: boolean;
  hydrating: boolean;
  upsert: (card: UCard) => Promise<UCard>;
  remove: (slug: string) => Promise<void>;
  reset: () => Promise<void>;
  replaceAll: (cards: UCard[]) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useCatalog = create<CatalogState>()((set, get) => ({
  cards: cloneCards(),
  hydrated: false,
  hydrating: false,
  upsert: async (card) => {
    const { saveCatalogCard } = await import("./catalog.functions");
    const existing = get().cards.find((c) => c.slug === card.slug);
    const saved = await saveCatalogCard({
      data: {
        ...card,
        faceUrl: card.faceUrl || existing?.faceUrl,
      },
    });
    const cards = get().cards;
    const i = cards.findIndex((c) => c.slug === saved.slug);
    const updated = i === -1 ? [saved, ...cards] : cards.map((c) => (c.slug === saved.slug ? saved : c));
    set({ cards: updated });
    return saved;
  },
  remove: async (slug) => {
    const { removeCatalogCard } = await import("./catalog.functions");
    await removeCatalogCard({ data: slug });
    set({ cards: get().cards.filter((c) => c.slug !== slug) });
  },
  reset: async () => {
    const { resetCatalog } = await import("./catalog.functions");
    const cards = await resetCatalog();
    set({ cards: cards.length ? cards : cloneCards() });
  },
  replaceAll: async (cards) => {
    const { replaceCatalog } = await import("./catalog.functions");
    const normalized = cards.map(normalizeCard).filter((c): c is UCard => Boolean(c));
    const saved = await replaceCatalog({ data: normalized });
    set({ cards: saved });
  },
  hydrate: async () => {
    if (get().hydrated || get().hydrating) return;
    set({ hydrating: true });
    try {
      const { listCatalog } = await import("./catalog.functions");
      const cards = await listCatalog();
      set({ cards: cards.length ? cards : cloneCards(), hydrated: true, hydrating: false });
    } catch {
      set({ hydrated: true, hydrating: false });
    }
  },
}));

export function useCard(slug: string | undefined): UCard | undefined {
  return useCatalog((s) => s.cards.find((c) => c.slug === slug));
}

export function exportCatalog(cards: UCard[]) {
  const blob = new Blob([JSON.stringify(cards, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kaheng-cards-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
