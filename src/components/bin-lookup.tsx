import { Link } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Divider } from "@/components/ios";
import { CardThumb } from "@/components/plastic-card";
import type { BinCountry, Network, UCard } from "@/data/cards";
import {
  countryDisplay,
  digitsOnly,
  fetchHandyApi,
  formatBinReport,
  hitFromKnown,
  levelLabel,
  matchCatalog,
  matchCatalogAll,
  matchKnownBin,
  mergeBinHits,
  needsLiveEnrichment,
  networkFromScheme,
  prefixHit,
  prepaidLabel,
  sceneHint,
  schemeLabel,
  sourceLabel,
  typeLabel,
  type BinHit,
} from "@/lib/bin";
import { lookupBin } from "@/lib/bin.functions";
import { loadBinIndex, matchIndex } from "@/lib/bin-index";
import { useCatalog } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const CACHE_KEY = "kaheng-bin-cache-v5";

function readCache(bin: string): BinHit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, BinHit>;
    const hit = map[bin] ?? (bin.length > 6 ? map[bin.slice(0, 6)] : undefined);
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

function attachCard(hit: BinHit, bin: string, cards: UCard[]): BinHit {
  const card = matchCatalog(bin, cards);
  return {
    ...hit,
    cardSlug: hit.cardSlug ?? card?.slug,
    cardName: card?.name ?? hit.cardName,
  };
}

export async function identifyBinLocal(raw: string, cards: UCard[]): Promise<BinHit> {
  const bin = digitsOnly(raw);
  if (bin.length < 6) throw new Error("至少输入卡号前 6 位");
  const known = matchKnownBin(bin);
  if (known) {
    let hit = attachCard(hitFromKnown(known, bin), bin, cards);
    const local = await matchIndex(bin);
    if (local) hit = attachCard(mergeBinHits(hit, local), bin, cards);
    writeCache(hit);
    return hit;
  }
  const cached = readCache(bin);
  if (cached) return attachCard(cached, bin, cards);
  const local = await matchIndex(bin);
  if (local) return attachCard(local, bin, cards);
  return attachCard(prefixHit(bin, "miss"), bin, cards);
}

export async function enrichBinLive(bin: string): Promise<BinHit | null> {
  try {
    const hit = await lookupBin({ data: { bin } });
    if (hit?.source === "live") return hit;
  } catch {
    /* server cold / preview */
  }
  try {
    const handy = await fetchHandyApi(bin);
    if ("hit" in handy) return handy.hit;
  } catch {
    /* CORS or quota */
  }
  return null;
}

export async function identifyBin(raw: string, cards: UCard[]): Promise<BinHit> {
  const bin = digitsOnly(raw);
  const local = await identifyBinLocal(bin, cards);
  if (!needsLiveEnrichment(local, bin)) return local;
  const live = await enrichBinLive(bin);
  if (!live) return local;
  const merged = attachCard(mergeBinHits(local, live), bin, cards);
  writeCache(merged);
  return merged;
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 px-4">
      <span className="shrink-0 text-[15px] text-muted">{label}</span>
      <span
        className={cn(
          "min-w-0 text-right text-[15px] text-fg",
          mono && "font-mono tabular-nums tracking-wide",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function BinLookup({
  onApply,
  compact,
  auto,
  seed,
}: {
  onApply?: (hit: BinHit) => void;
  compact?: boolean;
  auto?: boolean;
  seed?: string;
}) {
  const cards = useCatalog((s) => s.cards);
  const [value, setValue] = useState(seed ?? "");
  const [busy, setBusy] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [hit, setHit] = useState<BinHit | null>(null);
  const last = useRef("");

  useEffect(() => {
    void loadBinIndex();
  }, []);

  useEffect(() => {
    if (!seed) return;
    const bin = digitsOnly(seed);
    if (bin.length < 6) return;
    setValue(bin);
    void run(bin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  async function run(raw = value) {
    const bin = digitsOnly(raw);
    if (bin.length < 6) {
      toast.error("至少输入卡号前 6 位");
      return;
    }
    if (last.current === bin && hit && hit.source !== "prefix" && !needsLiveEnrichment(hit, bin)) {
      return;
    }
    setBusy(true);
    setEnriching(false);
    try {
      const local = await identifyBinLocal(bin, cards);
      last.current = bin;
      setHit(local);
      onApply?.(local);
      setBusy(false);
      if (!needsLiveEnrichment(local, bin)) return;
      setEnriching(true);
      const live = await enrichBinLive(bin);
      if (live) {
        const merged = attachCard(mergeBinHits(local, live), bin, cards);
        writeCache(merged);
        last.current = bin;
        setHit(merged);
        onApply?.(merged);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "查不到这个 BIN");
    } finally {
      setBusy(false);
      setEnriching(false);
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

  const matched = hit ? matchCatalogAll(hit.bin, cards) : [];
  const hint = hit ? hit.note || sceneHint(hit) : undefined;

  function copyReport() {
    if (!hit) return;
    const text = formatBinReport(hit, cards);
    void navigator.clipboard.writeText(text).then(
      () => toast.success("已复制"),
      () => toast.error("复制失败"),
    );
  }

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
        <div>
          <Divider />
          <Fact label="卡片 BIN" value={hit.bin} mono />
          <Divider />
          <Fact label="支付体系" value={schemeLabel(hit.scheme)} />
          <Divider />
          <Fact label="卡片类型" value={typeLabel(hit.type, hit.prepaid)} />
          <Divider />
          <Fact label="卡片等级" value={levelLabel(hit.level, hit.brand)} />
          <Divider />
          <Fact label="卡片币种" value={hit.currency || "未知"} />
          <Divider />
          <Fact label="发行国家" value={countryDisplay(hit)} />
          <Divider />
          <Fact label="银行名称" value={hit.bank || "未知"} />
          <Divider />
          <Fact label="是否预付卡" value={prepaidLabel(hit.prepaid)} />
          <Divider />
          <Fact label="来源" value={sourceLabel(hit.source)} />
          {enriching && (
            <p className="px-4 py-2 text-[12px] leading-relaxed text-subtle">正在对照公共库，补发卡行和等级…</p>
          )}
          {hint && (
            <p className="px-4 py-2 text-[12px] leading-relaxed text-subtle">{hint}</p>
          )}
          {matched.length > 0 && (
            <>
              <Divider />
              <p className="px-4 pt-2 text-[12px] text-subtle">卡库对上</p>
              {matched.map((card) => (
                <Link
                  key={card.slug}
                  to="/card/$slug"
                  params={{ slug: card.slug }}
                  className="flex min-h-12 items-center gap-3 px-4 py-2 pressable"
                >
                  <CardThumb card={card} className="size-8 shrink-0 rounded-[10px]" />
                  <span className="min-w-0 flex-1 truncate text-[15px]">{card.name}</span>
                </Link>
              ))}
            </>
          )}
          <Divider />
          <button
            type="button"
            onClick={copyReport}
            className="flex min-h-12 w-full items-center gap-2 px-4 text-[16px] text-accent pressable"
          >
            <Copy className="size-4" />
            复制查询结果
          </button>
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
  patch("binCode", digitsOnly(hit.bin));
  if (hit.bank) patch("binIssuer", hit.bank);
  const network = networkFromScheme(hit.scheme);
  if (network) patch("network", network);
}
