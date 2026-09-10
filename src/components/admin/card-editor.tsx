import { useNavigate } from "@tanstack/react-router";
import { ClipboardPaste, Copy, Download, ImagePlus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { applyHitToDraft, identifyBin } from "@/components/bin-lookup";
import { Area, Divider, Field, Group, Row, Segmented } from "@/components/ios";
import { PlasticCard } from "@/components/plastic-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  BIN_COUNTRY_LABEL,
  SCENE_LABEL,
  type BinCountry,
  type CardLevel,
  type Category,
  type Custody,
  type FormFactor,
  type Kyc,
  type Network,
  type Region,
  type Scene,
  type Status,
  type Tint,
  type UCard,
  type Verification,
  resolveBin,
} from "@/data/cards";
import {
  copySheet,
  downloadSheet,
  parseImportPayload,
  serializeCard,
} from "@/lib/card-sheet";
import { compressFace } from "@/lib/face";
import { digitsOnly } from "@/lib/bin";
import { useCatalog } from "@/lib/catalog";

const SCENES: Scene[] = ["ai", "daily", "apple", "ads", "offramp"];
const REGIONS: Region[] = ["tw", "hk", "cn", "apac", "sg", "us", "eea", "global"];
const TINTS: Tint[] = ["sage", "slate", "stone", "olive", "ink", "paper"];
const BINS = Object.keys(BIN_COUNTRY_LABEL) as BinCountry[];

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function nullable(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function CardEditor({ initial, isNew }: { initial: UCard; isNew?: boolean }) {
  const seedBin = resolveBin(initial);
  const [draft, setDraft] = useState<UCard>({
    ...initial,
    binCountry: seedBin.binCountry,
    binCode: seedBin.binCode ?? "",
    binIssuer: seedBin.binIssuer ?? "",
  });
  const [paste, setPaste] = useState("");
  const [binBusy, setBinBusy] = useState(false);
  const upsert = useCatalog((s) => s.upsert);
  const remove = useCatalog((s) => s.remove);
  const navigate = useNavigate();

  function patch<K extends keyof UCard>(key: K, value: UCard[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function identifyDraftBin(raw?: string) {
    const bin = digitsOnly(raw ?? draft.binCode ?? "");
    if (bin.length < 6) {
      toast.error("至少输入卡号前 6 位");
      return;
    }
    setBinBusy(true);
    try {
      const hit = await identifyBin(bin, useCatalog.getState().cards);
      applyHitToDraft(hit, (key, value) => patch(key, value as never));
      toast.success(`已填入 ${hit.countryName} · ${hit.bank ?? hit.scheme}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "查不到这个 BIN");
    } finally {
      setBinBusy(false);
    }
  }

  function patchLevel(id: string, next: Partial<CardLevel>) {
    setDraft((d) => ({
      ...d,
      levels: (d.levels ?? []).map((l) => (l.id === id ? { ...l, ...next } : l)),
    }));
  }

  function addLevel() {
    setDraft((d) => {
      const existing = d.levels ?? [];
      const id = `lv-${Math.random().toString(36).slice(2, 6)}`;
      const isFirst = existing.length === 0;
      const row: CardLevel = {
        id,
        name: isFirst ? "入门档" : existing.length === 1 ? "进阶档" : `档位 ${existing.length + 1}`,
        openingFeeUsd: d.openingFeeUsd,
        annualFeeUsd: d.annualFeeUsd,
        monthlyFeeUsd: d.monthlyFeeUsd,
        topupFeePct: d.topupFeePct,
        spendFeePct: d.spendFeePct,
        fxFeePct: d.fxFeePct,
        cashbackPct: isFirst ? d.cashbackPct : d.cashbackPctHigh,
        cashbackAmountCapUsd: isFirst ? d.cashbackAmountCapUsd : d.cashbackAmountCapHighUsd,
        cashbackSpendCapUsd: d.cashbackSpendCapUsd,
      };
      return { ...d, levels: [...existing, row] };
    });
  }

  function removeLevel(id: string) {
    setDraft((d) => ({ ...d, levels: (d.levels ?? []).filter((l) => l.id !== id) }));
  }

  function toggleArr<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  }

  function applyImported(card: UCard) {
    const bin = resolveBin(card);
    setDraft((d) => ({
      ...card,
      faceUrl: card.faceUrl || d.faceUrl,
      binCountry: bin.binCountry,
      binCode: bin.binCode ?? "",
      binIssuer: bin.binIssuer ?? "",
    }));
    setPaste("");
    toast.success("已填入表单，核对后点保存");
  }

  function importText(text: string) {
    try {
      const payload = parseImportPayload(text);
      if (payload.mode === "all") {
        toast.error("这是整库 JSON，请回管理页导入");
        return;
      }
      applyImported(payload.card);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "格式不对");
    }
  }

  function save() {
    if (!draft.name.trim()) {
      toast.error("先写一个卡名");
      return;
    }
    let slug = draft.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (isNew && (!slug || slug === "new-card")) {
      slug = `custom-${Math.random().toString(36).slice(2, 7)}`;
    }
    upsert({
      ...draft,
      slug: slug || draft.slug,
      levels: draft.levels && draft.levels.length > 0 ? draft.levels : undefined,
    });
    toast.success("已保存到本机");
    void navigate({ to: "/admin" });
  }

  function onDelete() {
    if (!confirm(`删除「${draft.name}」？此操作只影响你这台设备上的资料。`)) return;
    remove(draft.slug);
    toast.success("已删除");
    void navigate({ to: "/admin" });
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
      <div className="mx-auto mb-5 max-w-xs lg:sticky lg:top-6 lg:mx-0 lg:mb-0">
        <PlasticCard card={draft} />
      </div>
      <div>

      <Group
        header="给其他 AI 核对"
        footer="复制或下载这段文本，发给别的 AI 去查官网。改完原样贴回来。只改冒号后面的值，字段名不要动。"
      >
        <button
          type="button"
          className="flex min-h-12 w-full items-center gap-3 px-4 text-[16px] text-accent pressable"
          onClick={() => {
            void copySheet(draft)
              .then(() => toast.success("已复制单卡文本"))
              .catch(() => {
                setPaste(serializeCard(draft));
                toast.message("复制失败，已填进下面的框，请手动选中");
              });
          }}
        >
          <Copy className="size-4" />
          复制文本
        </button>
        <Divider />
        <button
          type="button"
          className="flex min-h-12 w-full items-center gap-3 px-4 text-[16px] text-accent pressable"
          onClick={() => {
            downloadSheet(draft);
            toast.success("已下载 .txt");
          }}
        >
          <Download className="size-4" />
          下载 .txt
        </button>
        <Divider />
        <label className="flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 text-[16px] text-accent pressable">
          <ClipboardPaste className="size-4" />
          从文件导入
          <input
            type="file"
            accept=".txt,.json,text/plain,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => importText(String(reader.result ?? ""));
              reader.onerror = () => toast.error("文件读不出来");
              reader.readAsText(file);
              e.target.value = "";
            }}
          />
        </label>
        <Divider />
        <label className="block px-4 py-3">
          <span className="text-[13px] text-subtle">贴回修改后的文本</span>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="标识: …"
            rows={7}
            className="mt-1.5 w-full resize-y bg-transparent font-mono text-[13px] leading-relaxed text-fg outline-none placeholder:text-subtle"
          />
        </label>
        {paste.trim() && (
          <>
            <Divider />
            <button
              type="button"
              className="flex min-h-12 w-full items-center px-4 text-[16px] text-accent pressable"
              onClick={() => importText(paste)}
            >
              用这段文本填入表单
            </button>
          </>
        )}
      </Group>

      <Group header="数据来源" footer="只有核过官方帮助页的条目才标“官方已核”；页面会公开这些链接。">
        <div className="px-4 py-3">
          <Segmented<Verification>
            value={draft.verification ?? "unverified"}
            onChange={(v) => patch("verification", v)}
            options={[
              { value: "unverified", label: "未核验" },
              { value: "partial", label: "部分官方" },
              { value: "secondary", label: "二手来源" },
              { value: "official", label: "官方已核" },
            ]}
          />
        </div>
        <Divider />
        <Field
          label="核验日期"
          value={draft.verifiedAt ?? ""}
          onChange={(v) => patch("verifiedAt", v || undefined)}
          placeholder="2026-09-10"
        />
        <Divider />
        <Area
          label="来源链接"
          value={(draft.sourceUrls ?? []).join("\n")}
          onChange={(v) =>
            patch(
              "sourceUrls",
              v
                .split(/\n/)
                .map((url) => url.trim())
                .filter(Boolean),
            )
          }
          placeholder="每行一个官方页面"
        />
      </Group>

      <Group
        header="卡面照片"
        footer="上传会压成卡比例保存在这台设备。也可以贴图片链接。"
      >
        <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2 pressable">
          <ImagePlus className="size-5 text-accent" />
          <span className="text-[16px] text-accent">从相册选取</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void compressFace(file)
                .then((url) => patch("faceUrl", url))
                .catch(() => toast.error("图片读不出来"));
              e.target.value = "";
            }}
          />
        </label>
        <Divider />
        <Field
          label="图片链接"
          value={draft.faceUrl && !draft.faceUrl.startsWith("data:") ? draft.faceUrl : ""}
          onChange={(v) => patch("faceUrl", v || undefined)}
          placeholder="https://…"
          type="url"
        />
        {draft.faceUrl && (
          <>
            <Divider />
            <button
              type="button"
              className="flex min-h-12 w-full items-center px-4 text-[16px] text-loss pressable"
              onClick={() => patch("faceUrl", undefined)}
            >
              恢复默认卡面
            </button>
          </>
        )}
      </Group>

      <Group header="基本">
        <Field label="中文名" value={draft.name} onChange={(v) => patch("name", v)} />
        <Divider />
        <Field label="英文名" value={draft.nameEn} onChange={(v) => patch("nameEn", v)} />
        <Divider />
        <Field label="发行方" value={draft.issuer} onChange={(v) => patch("issuer", v)} />
        <Divider />
        <Field
          label="标识"
          value={draft.slug}
          onChange={(v) => patch("slug", v)}
          placeholder="url-slug"
        />
        <Divider />
        <Field
          label="官网"
          value={draft.url ?? ""}
          onChange={(v) => patch("url", v || undefined)}
          type="url"
        />
      </Group>

      <Group header="邀请" footer="填你自己的邀请码和链接。对照页不会自动抽成，这只是给你自己用的入口。">
        <Field
          label="邀请码"
          value={draft.inviteCode ?? ""}
          onChange={(v) => patch("inviteCode", v || undefined)}
          placeholder="例如 3mQL6"
        />
        <Divider />
        <Field
          label="邀请链接"
          value={draft.inviteUrl ?? ""}
          onChange={(v) => patch("inviteUrl", v || undefined)}
          placeholder="https://…"
          type="url"
        />
      </Group>

      <Group header="卡 BIN" footer="贴卡号前 6–8 位就能识别发卡地和发卡行。订 ChatGPT、绑 Apple ID 时，美区 / 香港差很多。完整卡号不会被保存。">
        <div className="px-4 py-3">
          <p className="mb-2 text-[13px] text-subtle">发卡地</p>
          <div className="flex flex-wrap gap-1.5">
            {BINS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => patch("binCountry", b)}
                className={
                  (draft.binCountry ?? "unknown") === b
                    ? "h-8 rounded-full bg-accent px-3 text-[13px] font-medium text-accent-fg pressable"
                    : "h-8 rounded-full bg-surface-2 px-3 text-[13px] font-medium text-muted pressable"
                }
              >
                {BIN_COUNTRY_LABEL[b].replace(" BIN", "")}
              </button>
            ))}
          </div>
        </div>
        <Divider />
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="w-[6.5rem] shrink-0 text-[15px] text-fg">BIN 号</span>
          <input
            value={draft.binCode ?? ""}
            inputMode="numeric"
            autoComplete="off"
            placeholder="454924"
            onChange={(e) => patch("binCode", digitsOnly(e.target.value) || undefined)}
            onBlur={() => {
              if (digitsOnly(draft.binCode ?? "").length >= 6) void identifyDraftBin();
            }}
            className="h-10 min-w-0 flex-1 bg-transparent text-right font-mono text-[16px] tracking-wide text-fg outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-subtle"
          />
          <button
            type="button"
            disabled={binBusy}
            onClick={() => void identifyDraftBin()}
            className="h-8 shrink-0 rounded-full bg-accent px-3 text-[13px] font-medium text-accent-fg pressable disabled:opacity-60"
          >
            {binBusy ? "识别中" : "识别"}
          </button>
        </div>
        <Divider />
        <Field
          label="发卡行"
          value={draft.binIssuer ?? ""}
          onChange={(v) => patch("binIssuer", v || undefined)}
          placeholder="Rain / Reap / Bivo"
        />
      </Group>

      <Group header="分类">
        <div className="space-y-3 px-4 py-3">
          <Segmented<Network>
            id="net"
            value={draft.network}
            onChange={(v) => patch("network", v)}
            options={[
              { value: "visa", label: "Visa" },
              { value: "mastercard", label: "Mastercard" },
            ]}
          />
          <Segmented<FormFactor>
            id="form"
            value={draft.form}
            onChange={(v) => patch("form", v)}
            options={[
              { value: "virtual", label: "虚拟" },
              { value: "physical", label: "实体" },
              { value: "both", label: "都有" },
            ]}
          />
          <Segmented<Status>
            id="status"
            value={draft.status}
            onChange={(v) => patch("status", v)}
            options={[
              { value: "active", label: "在运营" },
              { value: "restricted", label: "受限" },
              { value: "shutdown", label: "停服" },
            ]}
          />
          <Segmented<Category>
            id="cat"
            value={draft.category}
            onChange={(v) => patch("category", v)}
            options={[
              { value: "exchange", label: "交易所" },
              { value: "wallet", label: "钱包" },
              { value: "defi", label: "链上" },
              { value: "vcc", label: "虚拟卡" },
            ]}
          />
          <Segmented<Custody>
            id="cus"
            value={draft.custody}
            onChange={(v) => patch("custody", v)}
            options={[
              { value: "custodial", label: "托管" },
              { value: "self-custody", label: "自托管" },
              { value: "hybrid", label: "混合" },
            ]}
          />
          <Segmented<Kyc>
            id="kyc"
            value={draft.kyc}
            onChange={(v) => patch("kyc", v)}
            options={[
              { value: "none", label: "免" },
              { value: "basic", label: "基础" },
              { value: "id", label: "身份证" },
              { value: "passport", label: "护照" },
              { value: "full", label: "完整" },
            ]}
          />
        </div>
        <Divider />
        <div className="px-4 py-3">
          <p className="mb-2 text-[13px] text-subtle">卡面颜色</p>
          <div className="flex flex-wrap gap-1.5">
            {TINTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => patch("tint", t)}
                data-tint={t}
                className="size-8 rounded-full pressable"
                style={{
                  background: "var(--card-face)",
                  boxShadow: draft.tint === t ? "0 0 0 2px var(--color-accent)" : undefined,
                }}
                aria-label={t}
              />
            ))}
          </div>
        </div>
      </Group>

      <Group header="费用" footer="单位美元或百分比。开卡费会按 12 个月摊进每月净收益。">
        <Field
          label="开卡费"
          type="number"
          suffix="$"
          value={draft.openingFeeUsd}
          onChange={(v) => patch("openingFeeUsd", num(v))}
        />
        <Divider />
        <Field
          label="实体卡"
          type="number"
          suffix="$"
          value={draft.physicalFeeUsd}
          onChange={(v) => patch("physicalFeeUsd", num(v))}
        />
        <Divider />
        <Field
          label="年费"
          type="number"
          suffix="$"
          value={draft.annualFeeUsd}
          onChange={(v) => patch("annualFeeUsd", num(v))}
        />
        <Divider />
        <Field
          label="月费"
          type="number"
          suffix="$"
          value={draft.monthlyFeeUsd}
          onChange={(v) => patch("monthlyFeeUsd", num(v))}
        />
        <Divider />
        <Field
          label="充值费"
          type="number"
          suffix="%"
          value={draft.topupFeePct}
          onChange={(v) => patch("topupFeePct", num(v))}
        />
        <Divider />
        <Field
          label="币种转换"
          type="number"
          suffix="%"
          value={draft.cryptoConversionFeePct ?? 0}
          onChange={(v) => patch("cryptoConversionFeePct", num(v))}
        />
        <Divider />
        <Field
          label="消费费"
          type="number"
          suffix="%"
          value={draft.spendFeePct}
          onChange={(v) => patch("spendFeePct", num(v))}
        />
        <Divider />
        <Field
          label="活动消费费"
          type="number"
          suffix="%"
          value={draft.promoSpendFeePct ?? ""}
          onChange={(v) => patch("promoSpendFeePct", v === "" ? undefined : num(v))}
        />
        <Divider />
        <Field
          label="活动截止"
          value={draft.promoUntil ?? ""}
          onChange={(v) => patch("promoUntil", v || undefined)}
          placeholder="2026-09-30"
        />
        <Divider />
        <Field
          label="非美元 FX"
          type="number"
          suffix="%"
          value={draft.fxFeePct}
          onChange={(v) => patch("fxFeePct", num(v))}
        />
      </Group>

      <Group header="返现" footer="封顶留空表示无上限。金额封顶是每月最多返多少美元。">
        <Field
          label="入门返现"
          type="number"
          suffix="%"
          value={draft.cashbackPct}
          onChange={(v) => patch("cashbackPct", num(v))}
        />
        <Divider />
        <Field
          label="进阶返现"
          type="number"
          suffix="%"
          value={draft.cashbackPctHigh}
          onChange={(v) => patch("cashbackPctHigh", num(v))}
        />
        <Divider />
        <Field
          label="入门封顶"
          type="number"
          suffix="$"
          value={draft.cashbackAmountCapUsd ?? ""}
          onChange={(v) => patch("cashbackAmountCapUsd", nullable(v))}
        />
        <Divider />
        <Field
          label="进阶封顶"
          type="number"
          suffix="$"
          value={draft.cashbackAmountCapHighUsd ?? ""}
          onChange={(v) => patch("cashbackAmountCapHighUsd", nullable(v))}
        />
        <Divider />
        <Field
          label="计返消费"
          type="number"
          suffix="$"
          value={draft.cashbackSpendCapUsd ?? ""}
          onChange={(v) => patch("cashbackSpendCapUsd", nullable(v))}
        />
        <Divider />
        <Area
          label="返现说明"
          value={draft.cashbackNote}
          onChange={(v) => patch("cashbackNote", v)}
        />
      </Group>

      <Group
        header="等级磨损"
        footer="排行榜的「入门档」用第一档，「进阶档」用最后一档。中间档只在卡详情里选。不填则只按上面的入门/进阶返现算，消费费和 FX 保持不变。"
      >
        {(draft.levels ?? []).map((lv, i) => (
          <div key={lv.id}>
            {i > 0 && <Divider />}
            <div className="px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-medium text-subtle">第 {i + 1} 档</p>
                <button
                  type="button"
                  onClick={() => removeLevel(lv.id)}
                  className="flex size-8 items-center justify-center rounded-full text-loss pressable"
                  aria-label="删除此档"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="overflow-hidden rounded-[16px] bg-surface-2">
                <Field
                  label="档名"
                  value={lv.name}
                  onChange={(v) => patchLevel(lv.id, { name: v })}
                />
                <Divider />
                <Field
                  label="开卡"
                  type="number"
                  suffix="$"
                  value={lv.openingFeeUsd ?? ""}
                  onChange={(v) =>
                    patchLevel(lv.id, { openingFeeUsd: v === "" ? undefined : num(v) })
                  }
                />
                <Divider />
                <Field
                  label="年费"
                  type="number"
                  suffix="$"
                  value={lv.annualFeeUsd ?? ""}
                  onChange={(v) =>
                    patchLevel(lv.id, { annualFeeUsd: v === "" ? undefined : num(v) })
                  }
                />
                <Divider />
                <Field
                  label="月费"
                  type="number"
                  suffix="$"
                  value={lv.monthlyFeeUsd ?? ""}
                  onChange={(v) =>
                    patchLevel(lv.id, { monthlyFeeUsd: v === "" ? undefined : num(v) })
                  }
                />
                <Divider />
                <Field
                  label="充值"
                  type="number"
                  suffix="%"
                  value={lv.topupFeePct ?? ""}
                  onChange={(v) =>
                    patchLevel(lv.id, { topupFeePct: v === "" ? undefined : num(v) })
                  }
                />
                <Divider />
                <Field
                  label="消费"
                  type="number"
                  suffix="%"
                  value={lv.spendFeePct ?? ""}
                  onChange={(v) =>
                    patchLevel(lv.id, { spendFeePct: v === "" ? undefined : num(v) })
                  }
                />
                <Divider />
                <Field
                  label="FX"
                  type="number"
                  suffix="%"
                  value={lv.fxFeePct ?? ""}
                  onChange={(v) => patchLevel(lv.id, { fxFeePct: v === "" ? undefined : num(v) })}
                />
                <Divider />
                <Field
                  label="返现"
                  type="number"
                  suffix="%"
                  value={lv.cashbackPct ?? ""}
                  onChange={(v) =>
                    patchLevel(lv.id, { cashbackPct: v === "" ? undefined : num(v) })
                  }
                />
                <Divider />
                <Field
                  label="封顶"
                  type="number"
                  suffix="$"
                  value={lv.cashbackAmountCapUsd ?? ""}
                  onChange={(v) =>
                    patchLevel(lv.id, { cashbackAmountCapUsd: v === "" ? null : nullable(v) })
                  }
                />
                <Divider />
                <Field
                  label="计返"
                  type="number"
                  suffix="$"
                  value={lv.cashbackSpendCapUsd ?? ""}
                  onChange={(v) =>
                    patchLevel(lv.id, { cashbackSpendCapUsd: v === "" ? null : nullable(v) })
                  }
                />
              </div>
            </div>
          </div>
        ))}
        {(draft.levels ?? []).length > 0 ? <Divider /> : null}
        <button
          type="button"
          onClick={addLevel}
          className="flex min-h-12 w-full items-center gap-3 px-4 text-[16px] text-accent pressable"
        >
          <Plus className="size-4" />
          添加档位
        </button>
      </Group>

      <Group header="能力">
        <Row label="Apple Pay">
          <Switch checked={draft.applePay} onCheckedChange={(v) => patch("applePay", v)} />
        </Row>
        <Divider />
        <Row label="Google Pay">
          <Switch checked={draft.googlePay} onCheckedChange={(v) => patch("googlePay", v)} />
        </Row>
        <Divider />
        <div className="px-4 py-3">
          <p className="mb-2 text-[13px] text-subtle">场景</p>
          <div className="flex flex-wrap gap-1.5">
            {SCENES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => patch("scenes", toggleArr(draft.scenes, s))}
                className={
                  draft.scenes.includes(s)
                    ? "h-8 rounded-full bg-accent px-3 text-[13px] font-medium text-accent-fg pressable"
                    : "h-8 rounded-full bg-surface-2 px-3 text-[13px] font-medium text-muted pressable"
                }
              >
                {SCENE_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <Divider />
        <div className="px-4 py-3">
          <p className="mb-2 text-[13px] text-subtle">地区</p>
          <div className="flex flex-wrap gap-1.5">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => patch("regions", toggleArr(draft.regions, r))}
                className={
                  draft.regions.includes(r)
                    ? "h-8 rounded-full bg-accent px-3 text-[13px] font-medium uppercase text-accent-fg pressable"
                    : "h-8 rounded-full bg-surface-2 px-3 text-[13px] font-medium uppercase text-muted pressable"
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <Divider />
        <Field
          label="资产"
          value={draft.assets.join(", ")}
          onChange={(v) =>
            patch(
              "assets",
              v
                .split(/[,，]/)
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          placeholder="USDT, USDC"
        />
        <Divider />
        <Row label="风险">
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => patch("risk", n)}
                className={
                  draft.risk === n
                    ? "size-8 rounded-full bg-fg text-[13px] font-semibold text-bg pressable"
                    : "size-8 rounded-full bg-surface-2 text-[13px] text-muted pressable"
                }
              >
                {n}
              </button>
            ))}
          </div>
        </Row>
      </Group>

      <Group header="文案">
        <Area label="一句话" value={draft.summary} onChange={(v) => patch("summary", v)} />
        <Divider />
        <Area label="适合谁" value={draft.bestFor} onChange={(v) => patch("bestFor", v)} />
        <Divider />
        <Area label="状态说明" value={draft.statusNote} onChange={(v) => patch("statusNote", v)} />
        <Divider />
        <Area label="风险说明" value={draft.riskNote} onChange={(v) => patch("riskNote", v)} />
        <Divider />
        <Area label="KYC 说明" value={draft.kycNote} onChange={(v) => patch("kycNote", v)} />
        <Divider />
        <Area
          label="优点（一行一条）"
          value={draft.pros.join("\n")}
          onChange={(v) => patch("pros", v.split("\n").filter((x) => x.trim()))}
        />
        <Divider />
        <Area
          label="缺点（一行一条）"
          value={draft.cons.join("\n")}
          onChange={(v) => patch("cons", v.split("\n").filter((x) => x.trim()))}
        />
        <Divider />
        <Field
          label="停服日期"
          value={draft.shutdownDate ?? ""}
          onChange={(v) => patch("shutdownDate", v || undefined)}
          placeholder="2025-07-12"
        />
      </Group>

      <div className="flex flex-col gap-3">
        <Button onClick={save} className="w-full">
          {isNew ? "添加并保存" : "保存修改"}
        </Button>
        {!isNew && (
          <Button variant="ghost" className="w-full text-loss" onClick={onDelete}>
            删除这张卡
          </Button>
        )}
      </div>
      </div>
    </div>
  );
}
