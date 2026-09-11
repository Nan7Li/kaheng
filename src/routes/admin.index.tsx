import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BinLookup } from "@/components/bin-lookup";
import { Divider, Fade, Group, LargeTitle, Page } from "@/components/ios";
import { CardThumb } from "@/components/plastic-card";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, formatBin } from "@/data/cards";
import { writeErrorMessage } from "@/lib/admin-access";
import { UserButton } from "@/lib/auth/gates";
import { parseImportPayload } from "@/lib/card-sheet";
import { exportCatalog, useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/admin/")({ component: AdminPage });

function AdminPage() {
  const cards = useCatalog((s) => s.cards);
  const reset = useCatalog((s) => s.reset);
  const replaceAll = useCatalog((s) => s.replaceAll);
  const upsert = useCatalog((s) => s.upsert);
  const navigate = useNavigate();
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);

  async function onReset() {
    if (!confirm("恢复内置资料？公开卡库会回到内置版本，自定义卡也会没。")) return;
    setBusy(true);
    try {
      await reset();
      toast.success("已恢复内置资料");
    } catch (err) {
      toast.error(writeErrorMessage(err, "恢复失败"));
    } finally {
      setBusy(false);
    }
  }

  async function applyText(text: string) {
    setBusy(true);
    try {
      const payload = parseImportPayload(text);
      if (payload.mode === "all") {
        await replaceAll(payload.cards);
        toast.success(`已导入 ${payload.cards.length} 张卡`);
        setPaste("");
        return;
      }
      await upsert(payload.card);
      toast.success(`已写入「${payload.card.name}」`);
      setPaste("");
    } catch (err) {
      toast.error(writeErrorMessage(err, "文件格式不对。单卡用卡衡文本或 JSON 对象，整库用 JSON 数组。"));
    } finally {
      setBusy(false);
    }
  }

  function onImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => void applyText(String(reader.result ?? ""));
    reader.onerror = () => toast.error("文件读不出来");
    reader.readAsText(file);
  }

  return (
    <Page>
      <LargeTitle
        eyebrow="站长后台"
        trailing={
          <Button
            size="icon"
            aria-label="新增"
            disabled={busy}
            onClick={() => void navigate({ to: "/admin/new" })}
          >
            <Plus className="size-5" />
          </Button>
        }
      >
        管理
      </LargeTitle>
      <Fade>
        <p className="mb-5 max-w-xl text-[15px] leading-relaxed text-muted">
          改费率、上下架、新增卡。保存后所有人立刻看到同一份卡库。只有管理员能进来。
        </p>
      </Fade>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start lg:gap-8">
        <Group header={`卡库 · ${cards.length}`}>
          {cards.map((card, i) => (
            <div key={card.slug}>
              {i > 0 && <div className="ml-[4.5rem] h-px bg-border" />}
              <Link
                to="/admin/$slug"
                params={{ slug: card.slug }}
                className="flex min-h-14 items-center gap-3 px-3 py-2 pressable"
              >
                <CardThumb card={card} className="size-10 shrink-0 rounded-[12px]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-medium">{card.name}</p>
                  <p className="truncate text-[12px] text-subtle">
                    {formatBin(card)} · {STATUS_LABEL[card.status] ?? card.status}
                  </p>
                </div>
                <ChevronRight className="size-4 text-subtle/70" />
              </Link>
            </div>
          ))}
        </Group>

        <div>
          <Group header="文章">
            <Link to="/posts" className="flex min-h-12 items-center justify-between px-4 pressable">
              <span className="text-[16px]">X 文章</span>
              <ChevronRight className="size-4 text-subtle/70" />
            </Link>
          </Group>
          <Group
            header="识别 BIN"
            footer="贴卡号前 6–8 位。已知 U 卡段走本站表，其他查内置开源库。完整卡号不会保存。"
          >
            <BinLookup />
          </Group>
          <Group
            header="单卡文本"
            footer="点进某一张卡也可以复制 / 下载。格式以「# 卡衡单卡 v1」开头，改完原样贴回即可。"
          >
            <label className="block px-4 py-3">
              <span className="text-[13px] text-subtle">粘贴单卡文本或 JSON</span>
              <textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder={"# 卡衡单卡 v1\n标识: …"}
                rows={6}
                className="mt-1.5 w-full resize-y bg-transparent font-mono text-[13px] leading-relaxed text-fg outline-none placeholder:text-subtle"
              />
            </label>
            {paste.trim() && (
              <>
                <Divider />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void applyText(paste)}
                  className="flex min-h-12 w-full items-center px-4 text-[16px] text-accent pressable disabled:opacity-60"
                >
                  导入这段文本
                </button>
              </>
            )}
            <Divider />
            <label className="flex min-h-12 w-full cursor-pointer items-center px-4 text-[16px] text-accent pressable">
              从文件导入（.txt / .json）
              <input
                type="file"
                accept=".txt,.json,text/plain,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImport(f);
                  e.target.value = "";
                }}
              />
            </label>
          </Group>

          <Group header="账号" footer="退出后别人进不了管理页。">
            <div className="px-4 py-3">
              <UserButton />
            </div>
          </Group>
          <Group header="整库">
            <button
              type="button"
              onClick={() => exportCatalog(cards)}
              className="flex min-h-12 w-full items-center px-4 text-[16px] text-accent pressable"
            >
              导出全部 JSON
            </button>
            <Divider />
            <button
              type="button"
              disabled={busy}
              onClick={() => void onReset()}
              className="flex min-h-12 w-full items-center px-4 text-[16px] text-loss pressable disabled:opacity-60"
            >
              恢复内置资料
            </button>
          </Group>
        </div>
      </div>
    </Page>
  );
}
