import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Chip, Group } from "@/components/ios";
import { lookupAppStore } from "@/lib/appstore.functions";
import {
  APPSTORE_COUNTRY_LABEL,
  APPSTORE_DEFAULT_COUNTRIES,
  KNOWN_APPS,
  knownAppHint,
  parseAppStoreInput,
  type ItunesApp,
  type ItunesLookupResult,
} from "@/lib/appstore";
import { convertAmount, formatMoney, FX_QUOTE_DEFAULT, type FxTable } from "@/lib/fx";
import { cn } from "@/lib/utils";

export function AppStoreBoard({
  table,
  seed,
}: {
  table: FxTable | null;
  seed?: { url?: string; term?: string; appId?: string };
}) {
  const [input, setInput] = useState(seed?.url ?? seed?.term ?? seed?.appId ?? "");
  const [countries, setCountries] = useState<string[]>([...APPSTORE_DEFAULT_COUNTRIES]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ItunesLookupResult | null>(null);

  useEffect(() => {
    if (!seed) return;
    const next = seed.url ?? seed.appId ?? seed.term ?? "";
    if (!next) return;
    setInput(next);
    void run(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed?.url, seed?.appId, seed?.term]);

  async function run(raw = input) {
    const parsed = parseAppStoreInput(raw.trim());
    if (!parsed?.id && !parsed?.term) {
      toast.error("贴 App Store 链接，或输入应用名");
      return;
    }
    setBusy(true);
    try {
      const next = await lookupAppStore({
        data: { id: parsed.id ?? "", term: parsed.id ? "" : parsed.term ?? "", countries },
      });
      setResult(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "商店查不到");
    } finally {
      setBusy(false);
    }
  }

  const quote = FX_QUOTE_DEFAULT;
  const rows = useMemo(() => {
    if (!result) return [];
    return result.apps.map((app) => {
      const quoted =
        table && Number.isFinite(app.price)
          ? convertAmount(app.price, app.currency, quote, table.rates)
          : app.currency === quote
            ? app.price
            : NaN;
      return { app, quoted };
    });
  }, [result, table, quote]);

  const hint = result ? knownAppHint(result.appId) : undefined;

  return (
    <>
      <Group header="查商店价" footer="走 Apple iTunes lookup，比较的是应用购买价。订阅 IAP 不在这个接口里，ChatGPT / Spotify / Netflix 请看「订阅」。">
        <div className="flex items-center gap-2 px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void run();
              }
            }}
            placeholder="App Store 链接或应用名"
            className="h-11 min-w-0 flex-1 rounded-[14px] bg-surface-2 px-3 text-[16px] text-fg outline-none placeholder:text-subtle"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void run()}
            className="h-11 shrink-0 rounded-full bg-accent px-4 text-[15px] font-semibold text-accent-fg pressable disabled:opacity-60"
          >
            {busy ? "查询中" : "查询"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {KNOWN_APPS.map((app) => (
            <Chip
              key={app.id}
              on={result?.appId === app.id}
              onClick={() => {
                setInput(app.id);
                void run(app.id);
              }}
            >
              {app.name}
            </Chip>
          ))}
        </div>
      </Group>

      <Group header="对比地区">
        <div className="flex flex-wrap gap-1.5 px-4 py-3">
          {APPSTORE_DEFAULT_COUNTRIES.map((cc) => {
            const on = countries.includes(cc);
            return (
              <Chip
                key={cc}
                on={on}
                onClick={() =>
                  setCountries((prev) =>
                    prev.includes(cc) ? (prev.length === 1 ? prev : prev.filter((c) => c !== cc)) : [...prev, cc],
                  )
                }
              >
                {APPSTORE_COUNTRY_LABEL[cc] ?? cc}
              </Chip>
            );
          })}
        </div>
      </Group>

      {result && (
        <Group
          header="各地区购买价"
          footer={hint ?? (result.term ? `搜「${result.term}」，取第一条再按地区比价。` : "免费应用的购买价是 0，不代表订阅免费。")}
        >
          {result.apps[0] && (
            <div className="flex items-center gap-3 px-4 py-3">
              {result.apps[0].artworkUrl100 && (
                <img
                  src={result.apps[0].artworkUrl100}
                  alt=""
                  className="size-12 rounded-[12px]"
                  width={48}
                  height={48}
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-[16px] font-medium">{result.apps[0].trackName}</p>
                <p className="truncate text-[12px] text-subtle">{result.apps[0].artistName}</p>
              </div>
            </div>
          )}
          {rows.map((row, i) => (
            <StoreRow key={row.app.country} row={row} quote={quote} first={i === 0} />
          ))}
        </Group>
      )}

      {result?.searches && result.searches.length > 1 && (
        <Group header="其它搜到的">
          {result.searches.slice(1).map((hit, i) => (
            <div key={hit.trackId}>
              {i > 0 && <div className="ml-4 h-px bg-border" />}
              <button
                type="button"
                className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left pressable"
                onClick={() => {
                  setInput(String(hit.trackId));
                  void run(String(hit.trackId));
                }}
              >
                {hit.artworkUrl100 && (
                  <img src={hit.artworkUrl100} alt="" className="size-9 rounded-[10px]" width={36} height={36} />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px]">{hit.trackName}</span>
                  <span className="block truncate text-[12px] text-subtle">{hit.artistName}</span>
                </span>
              </button>
            </div>
          ))}
        </Group>
      )}
    </>
  );
}

function StoreRow({
  row,
  quote,
  first,
}: {
  row: { app: ItunesApp; quoted: number };
  quote: string;
  first: boolean;
}) {
  const free = row.app.price === 0;
  return (
    <div>
      {!first && <div className="ml-4 h-px bg-border" />}
      <div className={cn("flex min-h-12 items-center justify-between gap-3 px-4 py-2.5", row.app.country === "TW" && "bg-accent/6")}>
        <div>
          <p className="text-[16px]">{APPSTORE_COUNTRY_LABEL[row.app.country] ?? row.app.country}</p>
          <p className="text-[12px] text-subtle">
            {row.app.formattedPrice ?? formatMoney(row.app.price, row.app.currency)}
          </p>
        </div>
        <p className="text-[16px] font-medium tabular-nums">
          {free ? "免费" : Number.isFinite(row.quoted) ? formatMoney(row.quoted, quote) : "—"}
        </p>
      </div>
    </div>
  );
}
