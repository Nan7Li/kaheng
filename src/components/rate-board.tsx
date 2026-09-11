import { FIAT_SHORT, unitsPerUsd, type RateTable } from "@/lib/rates";
import { useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";

const STABLES = ["USDT", "USDC", "USDG"] as const;
const FIATS = ["TWD", "HKD", "EUR", "SGD", "JPY", "CNY"] as const;

function asOfLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function usdPrint(rates: RateTable, code: string, digits: number) {
  const v = rates.usdPer[code];
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  return `$${v.toFixed(digits)}`;
}

export function RateTicker({ className }: { className?: string }) {
  const rates = useDesk((s) => s.rates);
  const live = useDesk((s) => s.ratesLive);
  const usdt = usdPrint(rates, "USDT", 4);
  const usdc = usdPrint(rates, "USDC", 4);
  const usdg = usdPrint(rates, "USDG", 4);
  return (
    <p className={cn("font-mono text-[11px] tabular-nums leading-relaxed text-subtle", className)}>
      USDT {usdt} · USDC {usdc} · USDG {usdg}
      <span className={live ? "text-accent" : ""}>{live ? " · 实时" : " · 备用价"}</span>
    </p>
  );
}

export function RateBoard() {
  const rates = useDesk((s) => s.rates);
  const live = useDesk((s) => s.ratesLive);
  const when = asOfLabel(rates.asOf);

  return (
    <div className="ios-card rounded-[28px] p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-subtle">实时汇率</p>
          <p className="mt-0.5 text-[12px] text-subtle">
            {live ? "OKX + 法币市价" : "备用价，尚未拉到行情"}
            {when ? ` · ${when}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            live ? "bg-accent/12 text-accent" : "bg-surface-2 text-subtle",
          )}
        >
          {live ? "已上线" : "备用"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {STABLES.map((code) => (
          <div key={code} className="rounded-[16px] bg-surface-2 px-3 py-2.5">
            <p className="text-[11px] text-subtle">1 {code}</p>
            <p className="mt-0.5 font-mono text-[15px] tabular-nums tracking-tight">
              {usdPrint(rates, code, 4)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {FIATS.map((code) => {
          const units = unitsPerUsd(code, rates);
          const digits = code === "JPY" ? 1 : 2;
          return (
            <p key={code} className="flex items-baseline justify-between gap-2 text-[13px]">
              <span className="text-subtle">{FIAT_SHORT[code]}</span>
              <span className="font-mono tabular-nums">{units.toFixed(digits)}</span>
            </p>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-subtle">
        法币为 1 美元可换多少。稳定币按市价，不是 1:1。
      </p>
    </div>
  );
}

