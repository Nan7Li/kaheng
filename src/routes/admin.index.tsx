import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Fade, Group, LargeTitle, Page } from "@/components/ios";
import { CardThumb } from "@/components/plastic-card";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, formatBin } from "@/data/cards";
import { exportCatalog, useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/admin/")({ component: AdminPage });

function AdminPage() {
  const cards = useCatalog((s) => s.cards);
  const reset = useCatalog((s) => s.reset);
  const replaceAll = useCatalog((s) => s.replaceAll);
  const navigate = useNavigate();

  function onReset() {
    if (!confirm("恢复内置资料？你改过的内容会从这台设备上消失。")) return;
    reset();
    toast.success("已恢复内置资料");
  }

  function onImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed) || parsed.some((c) => !c || typeof c.slug !== "string")) {
          throw new Error("not array");
        }
        replaceAll(parsed);
        toast.success(`已导入 ${parsed.length} 张卡`);
      } catch {
        toast.error("文件格式不对");
      }
    };
    reader.readAsText(file);
  }

  return (
    <Page>
      <LargeTitle
        eyebrow="本机资料"
        trailing={
          <Button
            size="icon"
            aria-label="新增"
            onClick={() => void navigate({ to: "/admin/new" })}
          >
            <Plus className="size-5" />
          </Button>
        }
      >
        管理
      </LargeTitle>
      <Fade>
        <p className="mb-5 text-[15px] leading-relaxed text-muted">
          改费率、上下架、新增卡。保存在这台设备的浏览器里，对照页会马上跟着变。
        </p>
      </Fade>

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

      <Group header="资料">
        <button
          type="button"
          onClick={() => exportCatalog(cards)}
          className="flex min-h-12 w-full items-center px-4 text-[16px] text-accent pressable"
        >
          导出 JSON
        </button>
        <div className="ml-4 h-px bg-border" />
        <label className="flex min-h-12 w-full cursor-pointer items-center px-4 text-[16px] text-accent pressable">
          从 JSON 导入
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
        </label>
        <div className="ml-4 h-px bg-border" />
        <button
          type="button"
          onClick={onReset}
          className="flex min-h-12 w-full items-center px-4 text-[16px] text-loss pressable"
        >
          恢复内置资料
        </button>
      </Group>
    </Page>
  );
}
