import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { BinCountry, Network, UCard } from "@/data/cards";
import { BIN_COUNTRY_LABEL } from "@/data/cards";
import {
  digitsOnly,
  fetchHandyApi,
  formatBinHit,
  hitFromKnown,
  matchCatalog,
  matchKnownBin,
  networkFromScheme,
  prefixHit,
  sourceLabel,
  type BinHit,
} from "@/lib/bin";
import { lookupBin } from "@/lib/bin.functions";
import { useCatalog } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const CACHE_KEY = "kaheng-bin-cache-v1";

function readCache(bin: string): BinHit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, BinHit>;
    const hit = map[bin];
    if (!hit || hit.source === "prefix") return null;
    return hit;
  } catch {
    return null;
  }
}

function writeCache(hit: BinHit) {
  if (typeof window === "undefined") return;
  if (hit.source === "prefix") return;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, BinHit>) : {};
    map[hit.bin] = hit;
    const keys = Object.keys(map);
    if (keys.length > 80) {
      for (const k of keys.slice(0, keys.length - 80)) delete map[k];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

function Tag({ children, accent }: { children: string; accent?: boolean }) {
  return (
    <span
      className={cn(
        "h-8 rounded-full px-3 text-[13px] font-medium leading-8",
        accent ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
      )}
    >
      {children}
    </span>
  );
}

export async function identifyBin(raw: string, cards: UCard[]): Promise<BinHit> {
  const bin = digitsOnly(raw);
  if (bin.length < 6) throw new Error("至少输入卡号前 6 位");
  const attach = (hit: BinHit): BinHit => {
    const card = matchCatalog(bin, cards);
    return {
      ...hit,
      cardSlug: hit.cardSlug ?? card?.slug,
      cardName: card?.name ?? hit.cardName,
    };
  };
  const cached = readCache(bin);
  if (cached) return attach(cached);
  const known = matchKnownBin(bin);
  if (known) {
    const hit = attach(hitFromKnown(known, bin));
    writeCache(hit);
    return hit;
  }
  try {
    const hit = attach(await lookupBin({ data: { bin } }));
    writeCache(hit);
    return hit;
  } catch {
    const handy = await fetchHandyApi(bin);
    if ("hit" in handy) {
      const hit = attach(handy.hit);
      writeCache(hit);
      return hit;
    }
    return attach(prefixHit(bin, "rate" in handy ? "rate" : "miss"));
  }
}

export function BinLookup({
  onApply,
  compact,
  auto,
}: {
  onApply?: (hit: BinHit) => void;
  compact?: boolean;
  auto?: boolean;
}) {
  const cards = useCatalog((s) => s.cards);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [hit, setHit] = useState<BinHit | null>(null);
  const last = useRef("");

  async function run(raw = value) {
    const bin = digitsOnly(raw);
    if (bin.length < 6) {
      toast.error("至少输入卡号前 6 位");
      return;
    }
    if (last.current === bin && hit && hit.source !== "prefix") return;
    setBusy(true);
    try {
      const next = await identifyBin(bin, cards);
      last.current = bin;
      setHit(next);
      onApply?.(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "查不到这个 BIN");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!auto) return;
    const bin = digitsOnly(value);
    if (bin.length < 6) return;
    const t = window.setTimeout(() => {
      void run(bin);
    }, 420);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, value]);

  return (
    <div>
      <div className={cn("flex items-center gap-2", compact ? "px-0" : "px-4 py-3")}>
        <input
          value={value}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          placeholder="卡号前 6–8 位"
          onChange={(e) => {
            const next = digitsOnly(e.target.value);
            setValue(next);
            if (next.length < 6) setHit(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void run();
            }
          }}
          className="h-11 min-w-0 flex-1 rounded-[14px] bg-surface-2 px-3 font-mono text-[16px] tracking-[0.18em] text-fg outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-subtle"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void run()}
          className="h-11 shrink-0 rounded-full bg-accent px-4 text-[15px] font-semibold text-accent-fg pressable disabled:opacity-60"
        >
          {busy ? "识别中" : "识别"}
        </button>
      </div>
      {hit && (
        <div className={cn("pb-3", compact ? "px-0 pt-3" : "px-4")}>
          <p className="text-[16px] font-medium">{formatBinHit(hit)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Tag accent>{BIN_COUNTRY_LABEL[hit.country]}</Tag>
            {hit.type && <Tag>{hit.type}</Tag>}
            {hit.prepaid === true && <Tag>Prepaid</Tag>}
            {hit.prepaid === false && <Tag>非预付</Tag>}
            <Tag>{sourceLabel(hit.source)}</Tag>
          </div>
          {hit.cardSlug && (
            <p className="mt-2 text-[13px] text-muted">
              对上卡库里的{" "}
              <Link to="/card/$slug" params={{ slug: hit.cardSlug }} className="font-medium text-accent">
                {hit.cardName ?? hit.cardSlug}
              </Link>
            </p>
          )}
          {hit.note && <p className="mt-1 text-[12px] leading-relaxed text-subtle">{hit.note}</p>}
        </div>
      )}
    </div>
  );
}

export function applyHitToDraft(
  hit: BinHit,
  patch: (key: "binCountry" | "binCode" | "binIssuer" | "network", value: BinCountry | Network | string) => void,
) {
  patch("binCountry", hit.country);
  patch("binCode", hit.bin.slice(0, 6));
  if (hit.bank) patch("binIssuer", hit.bank);
  const network = networkFromScheme(hit.scheme);
  if (network) patch("network", network);
}
