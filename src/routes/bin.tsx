import { createFileRoute, Link } from "@tanstack/react-router";
import { BinLookup } from "@/components/bin-lookup";
import { Fade, Group, LargeTitle, Page } from "@/components/ios";
import { CardThumb } from "@/components/plastic-card";
import { BIN_COUNTRY_LABEL } from "@/data/cards";
import { KNOWN_BINS } from "@/lib/bin";
import { useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/bin")({ component: BinPage });

function BinPage() {
  const cards = useCatalog((s) => s.cards);

  return (
    <Page>
      <LargeTitle eyebrow="只填前 6–8 位">识别 BIN</LargeTitle>
      <Fade>
        <p className="mb-5 max-w-xl text-[17px] leading-relaxed text-muted">
          发卡地决定 ChatGPT、Apple ID 能不能过。完整卡号不会保存。查询走本站内置的开源 BIN 表（GitHub{" "}
          <a
            href="https://github.com/Techbuddie-Solutions/binlist-data"
            className="text-accent"
            target="_blank"
            rel="noreferrer"
          >
            binlist-data
          </a>
          ，约 45 万条，CC BY 4.0），不请求会限流的 binlist.net / HandyAPI。U 卡已知段优先对上卡库。
        </p>
      </Fade>

      <Group header="查卡段" footer="已知 U 卡段走本站表。其他前缀查内置开源库，不依赖 binlist.net。">
        <BinLookup auto />
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
    </Page>
  );
}
