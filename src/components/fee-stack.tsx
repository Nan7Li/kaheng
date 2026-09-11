import type { CalcResult } from "@/lib/calc";
import { formatUsd } from "@/lib/calc";
import { cn } from "@/lib/utils";

export function FeeStack({ result }: { result: CalcResult }) {
  const parts = [
    { key: "返现", value: result.cashback, tone: "gain" as const },
    { key: "充值", value: -result.topup, tone: "loss" as const },
    { key: "币种转换", value: -result.conversion, tone: "loss" as const },
    { key: "锚定差", value: -result.peg, tone: result.peg > 0.004 ? ("loss" as const) : ("gain" as const) },
    { key: "支付兑换", value: -result.hop, tone: "loss" as const },
    { key: "消费费", value: -result.spendFee, tone: "loss" as const },
    { key: "FX", value: -result.fx, tone: "loss" as const },
    { key: "摊销", value: -result.amortized, tone: "loss" as const },
  ].filter((p) => Math.abs(p.value) > 0.004);

  const max = Math.max(1, ...parts.map((p) => Math.abs(p.value)));

  return (
    <ul className="flex flex-col gap-2">
      {parts.map((p) => (
        <li key={p.key} className="grid grid-cols-[4.5rem_1fr_5.5rem] items-center gap-3 text-[12px]">
          <span className="text-muted">{p.key}</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn("h-full rounded-full", p.tone === "gain" ? "bg-gain" : "bg-loss")}
              style={{ width: `${(Math.abs(p.value) / max) * 100}%` }}
            />
          </div>
          <span
            className={cn(
              "text-right font-mono tabular-nums",
              p.tone === "gain" ? "text-gain" : "text-loss",
            )}
          >
            {formatUsd(p.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}
