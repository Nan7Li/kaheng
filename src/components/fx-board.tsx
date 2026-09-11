import { ArrowLeftRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Chip, Divider, Field, Group } from "@/components/ios";
import {
  convertAmount,
  currencyName,
  formatMoney,
  formatRate,
  FX_CURRENCIES,
  FX_QUOTE_DEFAULT,
  listQuoteRates,
  normalizeCurrency,
  type FxTable,
} from "@/lib/fx";
import { cn } from "@/lib/utils";

const AMOUNTS = [20, 100, 1000];

export function FxBoard({
  table,
  busy,
  error,
  onRetry,
  seed,
}: {
  table: FxTable | null;
  busy: boolean;
  error: string | null;
  onRetry: () => void;
  seed?: { source?: string; target?: string; amount?: number; listOnly?: boolean };
}) {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState(FX_QUOTE_DEFAULT);

  useEffect(() => {
    if (seed?.source) setFrom(seed.source);
    if (seed?.target) setTo(seed.target);
    if (typeof seed?.amount === "number" && seed.amount > 0) setAmount(String(seed.amount));
  }, [seed?.source, seed?.target, seed?.amount]);

  const n = Number(amount);
  const converted = useMemo(() => {
    if (!table || !Number.isFinite(n) || n < 0) return null;
    try {
      return convertAmount(n, from, to, table.rates);
    } catch {
      return null;
    }
  }, [table, n, from, to]);

  const unit = useMemo(() => {
    if (!table) return null;
    try {
      return convertAmount(1, from, to, table.rates);
    } catch {
      return null;
    }
  }, [table, from, to]);

  const board = table ? listQuoteRates(table, to) : [];

  return (
    <>
      <Group
        header="换算"
        footer={
          table
            ? `${table.source === "fawaz" ? "公开市场中间价" : "open.er-api"} · ${table.date || "刚才"}。不是卡组织结算价。`
            : "先拉到汇率再换。"
        }
      >
        <Field
          label="金额"
          type="number"
          value={amount}
          onChange={setAmount}
          placeholder="100"
        />
        <Divider />
        <SelectRow
          label="从"
          value={from}
          onChange={(v) => setFrom(normalizeCurrency(v) ?? v)}
        />
        <Divider />
        <SelectRow
          label="到"
          value={to}
          onChange={(v) => setTo(normalizeCurrency(v) ?? v)}
        />
        <div className="flex items-center justify-between gap-2 px-4 py-2">
          <div className="flex flex-wrap gap-1.5">
            {AMOUNTS.map((v) => (
              <Chip key={v} on={amount === String(v)} onClick={() => setAmount(String(v))}>
                {v}
              </Chip>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-accent pressable"
            aria-label="对调"
          >
            <ArrowLeftRight className="size-4" />
          </button>
        </div>
        <div className="border-t border-border px-4 py-4">
          {busy && !table ? (
            <p className="text-[15px] text-muted">正在拉汇率…</p>
          ) : error && !table ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15px] text-loss">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="h-9 rounded-full bg-accent px-3 text-[13px] font-semibold text-accent-fg pressable"
              >
                重试
              </button>
            </div>
          ) : converted !== null && unit !== null ? (
            <>
              <p className="text-[13px] text-subtle">
                {formatMoney(n, from)} =
              </p>
              <p className="mt-1 text-[28px] font-semibold tracking-tight tabular-nums">
                {formatMoney(converted, to)}
              </p>
              <p className="mt-1 text-[13px] text-muted">
                1 {from} = {formatRate(unit)} {to}
              </p>
            </>
          ) : (
            <p className="text-[15px] text-muted">缺这一对货币的报价。</p>
          )}
        </div>
      </Group>

      <Group header={`相对 1 ${currencyName(to)}`} footer="1 报价货币能换到的外币数量。中间价，不是刷卡结算价。">
        {board.length === 0 ? (
          <p className="px-4 py-3 text-[15px] text-muted">{busy ? "正在拉汇率…" : "还没有报价。"}</p>
        ) : (
          board.map((row, i) => (
            <div key={row.code}>
              {i > 0 && <div className="ml-4 h-px bg-border" />}
              <div className="flex min-h-12 items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <p className="text-[16px]">{row.name}</p>
                  <p className="text-[12px] text-subtle">{row.code}</p>
                </div>
                <p className="font-mono text-[15px] tabular-nums text-muted">
                  {formatRate(row.rate)}
                </p>
              </div>
            </div>
          ))
        )}
      </Group>
    </>
  );
}

function SelectRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 px-4 py-2">
      <span className="w-[6.5rem] shrink-0 text-[15px] text-fg">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 min-w-0 flex-1 bg-transparent text-right text-[16px] text-fg outline-none",
          "appearance-none",
        )}
      >
        {FX_CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name} {c.code}
          </option>
        ))}
      </select>
    </label>
  );
}
