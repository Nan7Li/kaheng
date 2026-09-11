import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppStoreBoard } from "@/components/appstore-board";
import { BinLookup } from "@/components/bin-lookup";
import { FxBoard } from "@/components/fx-board";
import { Chip, Fade, Group, LargeTitle, Page } from "@/components/ios";
import { CardThumb } from "@/components/plastic-card";
import { SubsBoard } from "@/components/subs-board";
import { BIN_COUNTRY_LABEL } from "@/data/cards";
import { KNOWN_BINS } from "@/lib/bin";
import { useCatalog } from "@/lib/catalog";
import { parseToolCommand, type ToolIntent, type ToolPane } from "@/lib/tool-parse";
import { useUsdRates } from "@/lib/use-usd-rates";

export const Route = createFileRoute("/bin")({ component: ToolsPage });

const PANES: Array<{ id: ToolPane; label: string }> = [
  { id: "bin", label: "BIN" },
  { id: "fx", label: "汇率" },
  { id: "subs", label: "订阅" },
  { id: "store", label: "商店" },
];

function ToolsPage() {
  const cards = useCatalog((s) => s.cards);
  const rates = useUsdRates();
  const [pane, setPane] = useState<ToolPane>("bin");
  const [intent, setIntent] = useState<ToolIntent | null>(null);
  const [command, setCommand] = useState("");

  function submit() {
    const parsed = parseToolCommand(command);
    if (!parsed) {
      toast.error("没看懂。试试 /rate 100 USD、493875，或贴 App Store 链接");
      return;
    }
    if (parsed.error) {
      toast.error(parsed.error);
      return;
    }
    setPane(parsed.pane);
    setIntent(parsed);
  }

  return (
    <Page>
      <LargeTitle eyebrow="卡粉工具箱">工具</LargeTitle>
      <Fade>
        <p className="mb-5 max-w-xl text-[17px] leading-relaxed text-muted">
          把开源 Telegram 机器人卡粉工具箱搬到网页里：查 BIN、换汇、对照 ChatGPT / Spotify / Netflix 分区价、查 App Store 购买价。默认报价台币。
        </p>
      </Fade>

      <Group header="指令" footer="和机器人同一套写法：/rate 100 USD、/bin 493875、/spotify、/appstore 链接。也可以直接贴卡号前 6 位。">
        <div className="flex items-center gap-2 px-4 py-3">
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="/rate 100 USD"
            className="h-11 min-w-0 flex-1 rounded-[14px] bg-surface-2 px-3 text-[16px] text-fg outline-none placeholder:text-subtle"
          />
          <button
            type="button"
            onClick={submit}
            className="h-11 shrink-0 rounded-full bg-accent px-4 text-[15px] font-semibold text-accent-fg pressable"
          >
            执行
          </button>
        </div>
      </Group>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {PANES.map((p) => (
          <Chip key={p.id} on={pane === p.id} onClick={() => setPane(p.id)}>
            {p.label}
          </Chip>
        ))}
      </div>

      {pane === "bin" && (
        <>
          <Group header="查卡段" footer="已知 U 卡段走本站表。其余先查内置开源库，再按卡粉工具箱同款瀑布对照公共库，补发卡行、等级和 8 位精度。">
            <BinLookup auto={!intent?.bin} seed={intent?.pane === "bin" ? intent.bin : undefined} />
          </Group>
          <Group header="本站已知 U 卡段" footer="社区核对过的 U 卡段。没有的前缀也能在开源库里查出发卡地。">
            {KNOWN_BINS.map((row, i) => {
              const card = row.cardSlug ? cards.find((c) => c.slug === row.cardSlug) : undefined;
              return (
                <div key={row.bin}>
                  {i > 0 && <div className="ml-4 h-px bg-border" />}
                  {card ? (
                    <Link
                      to="/card/$slug"
                      params={{ slug: card.slug }}
                      className="flex items-center gap-3 px-4 py-3 pressable"
                    >
                      <CardThumb card={card} className="size-10 shrink-0 rounded-[12px]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] font-medium">{card.name}</span>
                        <span className="block truncate text-[12px] text-subtle">
                          {BIN_COUNTRY_LABEL[row.country]} · {row.bank}
                        </span>
                      </span>
                      <span className="font-mono text-[13px] tabular-nums text-muted">{row.bin}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="text-[15px]">{row.bank}</span>
                      <span className="font-mono text-[13px] tabular-nums text-muted">{row.bin}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </Group>
        </>
      )}

      {pane === "fx" && (
        <FxBoard
          table={rates.table}
          busy={rates.busy}
          error={rates.error}
          onRetry={() => void rates.reload(true)}
          seed={
            intent?.pane === "fx"
              ? { source: intent.source, target: intent.target, amount: intent.amount, listOnly: intent.listOnly }
              : undefined
          }
        />
      )}

      {pane === "subs" && (
        <SubsBoard
          table={rates.table}
          seed={
            intent?.pane === "subs"
              ? { product: intent.product, quote: intent.quote, localOnly: intent.localOnly }
              : undefined
          }
        />
      )}

      {pane === "store" && (
        <AppStoreBoard
          table={rates.table}
          seed={
            intent?.pane === "store"
              ? { url: intent.url, term: intent.term, appId: intent.appId }
              : undefined
          }
        />
      )}

      <p className="px-4 text-[12px] leading-relaxed text-subtle">
        工具改编自开源 Telegram 机器人{" "}
        <a
          href="https://github.com/monlor/tg-card-tool-bot"
          className="text-accent"
          target="_blank"
          rel="noreferrer"
        >
          卡粉工具箱
        </a>
        （monlor/tg-card-tool-bot）。BIN 先走开源库，再对照 HandyAPI / binlist.net。表见{" "}
        <a
          href="https://github.com/Techbuddie-Solutions/binlist-data"
          className="text-accent"
          target="_blank"
          rel="noreferrer"
        >
          binlist-data
        </a>
        。汇率是中间价；订阅是整理过的当地标价，结账以商店为准。
      </p>
    </Page>
  );
}
