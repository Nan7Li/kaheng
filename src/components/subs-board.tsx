import { useEffect, useMemo, useState } from "react";
import { Chip, Group } from "@/components/ios";
import { formatMoney, FX_QUOTE_DEFAULT, type FxTable } from "@/lib/fx";
import { formatLocalPrice, quotePrices, SUB_PRODUCTS, type QuotedPrice } from "@/lib/subs";
import { cn } from "@/lib/utils";

const QUOTES = ["TWD", "USD", "CNY", "HKD"] as const;

export function SubsBoard({
  table,
  seed,
}: {
  table: FxTable | null;
  seed?: { product?: string; quote?: string; localOnly?: boolean };
}) {
  const [productId, setProductId] = useState(seed?.product ?? "chatgpt-plus");
  const [quote, setQuote] = useState(seed?.quote ?? FX_QUOTE_DEFAULT);
  const [localOnly, setLocalOnly] = useState(seed?.localOnly ?? false);

  useEffect(() => {
    if (!seed) return;
    if (seed.product) setProductId(seed.product);
    if (seed.quote) setQuote(seed.quote);
    if (typeof seed.localOnly === "boolean") setLocalOnly(seed.localOnly);
  }, [seed?.product, seed?.quote, seed?.localOnly]);

  const product = SUB_PRODUCTS.find((p) => p.id === productId) ?? SUB_PRODUCTS[0];
  const rows = useMemo(
    () => quotePrices(product, quote, table),
    [product, quote, table],
  );
  const cheapest = rows.find((r) => Number.isFinite(r.quoted));

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {SUB_PRODUCTS.map((p) => (
          <Chip key={p.id} on={p.id === product.id} onClick={() => setProductId(p.id)}>
            {p.name}
          </Chip>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {QUOTES.map((c) => (
          <Chip key={c} on={!localOnly && quote === c} onClick={() => { setQuote(c); setLocalOnly(false); }}>
            折合 {c}
          </Chip>
        ))}
        <Chip on={localOnly} onClick={() => setLocalOnly(true)}>
          原币
        </Chip>
      </div>

      <Group
        header="地区月费"
        footer={`${product.asOf} 整理的当地标价。${product.note ?? ""} 结账以商店为准。`}
      >
        {rows.map((row, i) => (
          <div key={`${row.country}-${row.currency}`}>
            {i > 0 && <div className="ml-4 h-px bg-border" />}
            <SubRow row={row} localOnly={localOnly} highlight={row.country === "TW"} cheapest={cheapest?.country === row.country} />
          </div>
        ))}
      </Group>
    </>
  );
}

function SubRow({
  row,
  localOnly,
  highlight,
  cheapest,
}: {
  row: QuotedPrice;
  localOnly: boolean;
  highlight: boolean;
  cheapest: boolean;
}) {
  const quotedOk = Number.isFinite(row.quoted);
  return (
    <div
      className={cn(
        "flex min-h-12 items-center justify-between gap-3 px-4 py-2.5",
        highlight && "bg-accent/6",
      )}
    >
      <div className="min-w-0">
        <p className="text-[16px]">
          {row.name}
          {highlight && <span className="ml-1.5 text-[12px] font-medium text-accent">本站默认</span>}
          {cheapest && !highlight && (
            <span className="ml-1.5 text-[12px] font-medium text-gain">最低</span>
          )}
        </p>
        <p className="text-[12px] text-subtle">{formatLocalPrice(row)}</p>
      </div>
      <div className="text-right">
        {localOnly || !quotedOk ? (
          <p className="text-[15px] tabular-nums text-muted">{row.country}</p>
        ) : (
          <>
            <p className="text-[16px] font-medium tabular-nums">{formatMoney(row.quoted, row.quoteCurrency)}</p>
            {row.vsUsPct !== null && (
              <p className={cn("text-[12px] tabular-nums", row.vsUsPct < -1 ? "text-gain" : row.vsUsPct > 1 ? "text-loss" : "text-subtle")}>
                {row.vsUsPct > 0.05 ? "+" : ""}
                {row.vsUsPct.toFixed(0)}% 美
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
