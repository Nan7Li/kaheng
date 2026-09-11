import { useMemo } from "react";
import { SCENE_HINT, SCENE_LABEL, type Scene } from "@/data/cards";
import { Chip, Segmented } from "@/components/ios";
import { Slider } from "@/components/ui/slider";
import { SPEND_PRESETS, type Tier } from "@/lib/calc";
import {
  ASSET_CODES,
  FIAT_CODES,
  FIAT_SHORT,
  formatFiatAmount,
  unitsPerUsd,
  type AssetCode,
  type FiatCode,
} from "@/lib/rates";
import { useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";

const SCENES: Array<Scene | "all"> = ["all", "ai", "daily", "apple", "ads", "offramp"];

export function DeskControls({ dense = false }: { dense?: boolean }) {
  const spend = useDesk((s) => s.spend);
  const merchant = useDesk((s) => s.merchant);
  const asset = useDesk((s) => s.asset);
  const tier = useDesk((s) => s.tier);
  const includePhysicalFee = useDesk((s) => s.includePhysicalFee);
  const scene = useDesk((s) => s.scene);
  const rates = useDesk((s) => s.rates);
  const ratesLive = useDesk((s) => s.ratesLive);
  const setSpend = useDesk((s) => s.setSpend);
  const setMerchant = useDesk((s) => s.setMerchant);
  const setAsset = useDesk((s) => s.setAsset);
  const setTier = useDesk((s) => s.setTier);
  const setIncludePhysicalFee = useDesk((s) => s.setIncludePhysicalFee);
  const setScene = useDesk((s) => s.setScene);
  const sliderValue = useMemo(() => [Math.min(spend, 10000)], [spend]);
  const localAmount = spend * unitsPerUsd(merchant, rates);
  const usdt = rates.usdPer.USDT ?? 1;
  const usdc = rates.usdPer.USDC ?? 1;
  const usdg = rates.usdPer.USDG ?? 1;

  return (
    <div className={cn("flex flex-col", dense ? "gap-3" : "gap-4")}>
      <div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[28px] font-semibold tabular-nums tracking-tight">
              ${spend.toLocaleString("en-US")}
            </p>
            {merchant !== "USD" && (
              <p className="mt-0.5 text-[12px] text-subtle">
                约 {formatFiatAmount(localAmount, merchant, merchant === "JPY" || merchant === "KRW" ? 0 : 0)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {SPEND_PRESETS.map((n) => (
              <Chip key={n} on={spend === n} onClick={() => setSpend(n)}>
                {n >= 1000 ? `${n / 1000}k` : n}
              </Chip>
            ))}
          </div>
        </div>
        <Slider
          min={50}
          max={10000}
          step={50}
          value={sliderValue}
          onValueChange={(v) => {
            const next = v[0];
            if (typeof next === "number") setSpend(next);
          }}
        />
      </div>

      <div>
        <p className="mb-1.5 text-[12px] text-subtle">账单货币</p>
        <div className="flex flex-wrap gap-1.5">
          {FIAT_CODES.map((code) => (
            <Chip key={code} on={merchant === code} onClick={() => setMerchant(code as FiatCode)}>
              {FIAT_SHORT[code]}
            </Chip>
          ))}
        </div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-subtle">
          {merchant === "USD"
            ? "按美元商户记账。欧元卡会先把这笔换成欧元再扣稳定币。"
            : `商户收 ${FIAT_SHORT[merchant]}。与卡结算币不同时计入 FX，再按市价换成支付币。`}
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-[12px] text-subtle">支付币</p>
        <Segmented<AssetCode>
          value={asset}
          onChange={setAsset}
          options={ASSET_CODES.map((value) => ({ value, label: value }))}
        />
        <p className="mt-1.5 text-[12px] leading-relaxed text-subtle">
          {asset === "USDG"
            ? "OKX 走 USDG 计返。其他卡会按市价折成它们的扣款币。"
            : asset === "USDC"
              ? "按 USDC 市价扣。不是 1 USDC = 1 美元。"
              : "按 USDT 市价扣。不是 1 USDT = 1 美元。OKX 会先换成 USDG。"}
        </p>
      </div>

      <p className="font-mono text-[11px] leading-relaxed text-subtle">
        1 USDT ${usdt.toFixed(4)} · 1 USDC ${usdc.toFixed(4)} · 1 USDG ${usdg.toFixed(4)}
        {merchant !== "USD" ? ` · 1 USD = ${unitsPerUsd(merchant, rates).toFixed(merchant === "JPY" || merchant === "KRW" ? 1 : 2)} ${merchant}` : ""}
        {ratesLive ? " · 实时" : " · 备用价"}
      </p>

      <Segmented<Tier>
        value={tier}
        onChange={setTier}
        options={[
          { value: "entry", label: "入门档" },
          { value: "boost", label: "进阶档" },
        ]}
      />
      <p className="-mt-2 text-[12px] text-subtle">
        进阶档按该卡最高一档的返现和磨损估算，不只换返现。
      </p>
      <Segmented<"virtual" | "physical">
        value={includePhysicalFee ? "physical" : "virtual"}
        onChange={(value) => setIncludePhysicalFee(value === "physical")}
        options={[
          { value: "virtual", label: "只算虚拟卡" },
          { value: "physical", label: "含实体卡费" },
        ]}
      />
      <div className="flex flex-wrap gap-1.5">
        {SCENES.map((s) => (
          <Chip key={s} on={scene === s} onClick={() => setScene(s)}>
            {SCENE_LABEL[s]}
          </Chip>
        ))}
      </div>
      {!dense && scene !== "all" && <p className="text-[12px] text-subtle">{SCENE_HINT[scene]}</p>}
    </div>
  );
}
