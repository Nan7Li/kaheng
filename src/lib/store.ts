import { create } from "zustand";
import type { Scene } from "@/data/cards";
import type { Bill, Tier } from "@/lib/calc";

const MAX_COMPARE = 3;

interface DeskState {
  spend: number;
  bill: Bill;
  tier: Tier;
  includePhysicalFee: boolean;
  scene: Scene | "all";
  selected: string[];
  saved: string[];
  setSpend: (n: number) => void;
  setBill: (b: Bill) => void;
  setTier: (t: Tier) => void;
  setIncludePhysicalFee: (v: boolean) => void;
  setScene: (s: Scene | "all") => void;
  toggleSelected: (slug: string) => void;
  clearSelected: () => void;
  toggleSaved: (slug: string) => void;
}

export const useDesk = create<DeskState>()((set, get) => ({
  spend: 1000,
  bill: "usd",
  tier: "entry",
  includePhysicalFee: false,
  scene: "all",
  selected: [],
  saved: [],
  setSpend: (n) => {
    const spend = Math.min(20000, Math.max(50, Math.round(n)));
    if (get().spend === spend) return;
    set({ spend });
  },
  setBill: (bill) => {
    if (get().bill === bill) return;
    set({ bill });
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
}));

export { MAX_COMPARE };
