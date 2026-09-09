import { create } from "zustand";
import { CARDS, type UCard } from "@/data/cards";

const KEY = "kaheng-catalog-v1";

function cloneCards(): UCard[] {
  return JSON.parse(JSON.stringify(CARDS)) as UCard[];
}

function asNum(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function normalizeCard(raw: unknown): UCard | null {
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
    openingFeeUsd: asNum(c.openingFeeUsd),
    physicalFeeUsd: asNum(c.physicalFeeUsd),
    annualFeeUsd: asNum(c.annualFeeUsd),
    monthlyFeeUsd: asNum(c.monthlyFeeUsd),
    topupFeePct: asNum(c.topupFeePct),
    spendFeePct: asNum(c.spendFeePct),
    fxFeePct: asNum(c.fxFeePct),
    cashbackPct: asNum(c.cashbackPct),
    cashbackPctHigh: asNum(c.cashbackPctHigh),
    risk: ([1, 2, 3, 4, 5] as const).includes(c.risk as 1) ? (c.risk as 1 | 2 | 3 | 4 | 5) : 3,
  };
}

function readStored(): UCard[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    const cards = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          "state" in parsed &&
          parsed.state &&
          typeof parsed.state === "object" &&
          "cards" in parsed.state
        ? (parsed.state as { cards: unknown }).cards
        : null;
    if (!Array.isArray(cards)) return null;
    const normalized = cards.map(normalizeCard).filter((c): c is UCard => Boolean(c));
    return normalized.length ? normalized : null;
  } catch {
    return null;
  }
}

function writeStored(cards: UCard[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ state: { cards }, version: 0 }));
  } catch {
    /* quota */
  }
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
    openingFeeUsd: 0,
    physicalFeeUsd: 0,
    annualFeeUsd: 0,
    monthlyFeeUsd: 0,
    topupFeePct: 0,
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
    updatedAt: "2026-09",
  };
}

interface CatalogState {
  cards: UCard[];
  hydrated: boolean;
  upsert: (card: UCard) => void;
  remove: (slug: string) => void;
  reset: () => void;
  replaceAll: (cards: UCard[]) => void;
  hydrate: () => void;
}

export const useCatalog = create<CatalogState>()((set, get) => ({
  cards: cloneCards(),
  hydrated: false,
  upsert: (card) => {
    const next = { ...card, updatedAt: new Date().toISOString().slice(0, 7) };
    const cards = get().cards;
    const i = cards.findIndex((c) => c.slug === next.slug);
    const updated = i === -1 ? [next, ...cards] : cards.map((c) => (c.slug === next.slug ? next : c));
    writeStored(updated);
    set({ cards: updated });
  },
  remove: (slug) => {
    const cards = get().cards.filter((c) => c.slug !== slug);
    writeStored(cards);
    set({ cards });
  },
  reset: () => {
    const cards = cloneCards();
    writeStored(cards);
    set({ cards });
  },
  replaceAll: (cards) => {
    const normalized = cards.map(normalizeCard).filter((c): c is UCard => Boolean(c));
    writeStored(normalized);
    set({ cards: normalized });
  },
  hydrate: () => {
    if (get().hydrated) return;
    const stored = readStored();
    set(stored ? { cards: stored, hydrated: true } : { hydrated: true });
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
