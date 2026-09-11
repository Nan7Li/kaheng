import { create } from "zustand";
import type { Scene } from "@/data/cards";
import type { Tier } from "@/lib/calc";
import { FALLBACK_RATES, type AssetCode, type FiatCode, type RateTable } from "@/lib/rates";

const MAX_COMPARE = 3;

interface DeskState {
  spend: number;
  merchant: FiatCode;
  asset: AssetCode;
  tier: Tier;
  includePhysicalFee: boolean;
  scene: Scene | "all";
  selected: string[];
  saved: string[];
  rates: RateTable;
  ratesLive: boolean;
  setSpend: (n: number) => void;
  setMerchant: (c: FiatCode) => void;
  setAsset: (a: AssetCode) => void;
  setTier: (t: Tier) => void;
  setIncludePhysicalFee: (v: boolean) => void;
  setScene: (s: Scene | "all") => void;
  toggleSelected: (slug: string) => void;
  clearSelected: () => void;
  toggleSaved: (slug: string) => void;
  hydrateRates: () => void;
}

export const useDesk = create<DeskState>()((set, get) => ({
  spend: 1000,
  merchant: "USD",
  asset: "USDT",
  tier: "entry",
  includePhysicalFee: false,
  scene: "all",
  selected: [],
  saved: [],
  rates: FALLBACK_RATES,
  ratesLive: false,
  setSpend: (n) => {
    const spend = Math.min(20000, Math.max(50, Math.round(n)));
    if (get().spend === spend) return;
    set({ spend });
  },
  setMerchant: (merchant) => {
    if (get().merchant === merchant) return;
    set({ merchant });
  },
  setAsset: (asset) => {
    if (get().asset === asset) return;
    set({ asset });
  },
  setTier: (tier) => {
    if (get().tier === tier) return;
    set({ tier });
  },
  setIncludePhysicalFee: (includePhysicalFee) => {
    if (get().includePhysicalFee === includePhysicalFee) return;
    set({ includePhysicalFee });
  },
  setScene: (scene) => {
    if (get().scene === scene) return;
    set({ scene });
  },
  toggleSelected: (slug) => {
    const cur = get().selected;
    if (cur.includes(slug)) {
      set({ selected: cur.filter((s) => s !== slug) });
      return;
    }
    if (cur.length >= MAX_COMPARE) {
      set({ selected: [...cur.slice(1), slug] });
      return;
    }
    set({ selected: [...cur, slug] });
  },
  clearSelected: () => set({ selected: [] }),
  toggleSaved: (slug) => {
    const cur = get().saved;
    set({
      saved: cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug],
    });
  },
  hydrateRates: () => {
    void (async () => {
      try {
        const res = await fetch("/api/rates");
        if (!res.ok) return;
        const data = (await res.json()) as RateTable;
        if (data?.usdPer?.USDT) set({ rates: data, ratesLive: data.source !== "fallback" });
      } catch {
        /* keep fallback */
      }
    })();
  },
}));

export function useCalcInput() {
  const spend = useDesk((s) => s.spend);
  const merchant = useDesk((s) => s.merchant);
  const asset = useDesk((s) => s.asset);
  const tier = useDesk((s) => s.tier);
  const includePhysicalFee = useDesk((s) => s.includePhysicalFee);
  const rates = useDesk((s) => s.rates);
  return { spend, merchant, asset, tier, includePhysicalFee, rates };
}

export { MAX_COMPARE };
