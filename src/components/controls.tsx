import { useMemo } from "react";
import { SCENE_HINT, SCENE_LABEL, type Scene } from "@/data/cards";
import { Chip, Segmented } from "@/components/ios";
import { Slider } from "@/components/ui/slider";
import { SPEND_PRESETS, type Bill, type Tier } from "@/lib/calc";
import { useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";

const SCENES: Array<Scene | "all"> = ["all", "ai", "daily", "apple", "ads", "offramp"];

export function DeskControls({ dense = false }: { dense?: boolean }) {
  const spend = useDesk((s) => s.spend);
  const bill = useDesk((s) => s.bill);
  const tier = useDesk((s) => s.tier);
  const includePhysicalFee = useDesk((s) => s.includePhysicalFee);
  const scene = useDesk((s) => s.scene);
  const setSpend = useDesk((s) => s.setSpend);
  const setBill = useDesk((s) => s.setBill);
  const setTier = useDesk((s) => s.setTier);
  const setIncludePhysicalFee = useDesk((s) => s.setIncludePhysicalFee);
  const setScene = useDesk((s) => s.setScene);
  const sliderValue = useMemo(() => [Math.min(spend, 10000)], [spend]);

  return (
    <div className={cn("flex flex-col", dense ? "gap-3" : "gap-4")}>
      <div>
        <div className="flex items-end justify-between gap-3">
          <p className="font-mono text-[28px] font-semibold tabular-nums tracking-tight">
            ${spend.toLocaleString("en-US")}
          </p>
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
      <Segmented<Bill>
        value={bill}
        onChange={setBill}
        options={[
          { value: "usd", label: "美元账单" },
          { value: "local", label: "本地货币" },
        ]}
      />
      <Segmented<Tier>
        value={tier}
        onChange={setTier}
        options={[
          { value: "entry", label: "入门档" },
          { value: "boost", label: "进阶档" },
        ]}
      />
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
