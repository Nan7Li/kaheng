import { createFileRoute, Link } from "@tanstack/react-router";
import { Fade, Group, LargeTitle, Page, Row } from "@/components/ios";
import { Badge } from "@/components/ui/badge";
import { RISK_EVENTS } from "@/data/events";
import { useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/risks")({ component: RisksPage });

const KIND = {
  shutdown: { label: "停服", tone: "loss" as const },
  restrict: { label: "收紧", tone: "warn" as const },
  hack: { label: "被盗", tone: "loss" as const },
  note: { label: "备忘", tone: "default" as const },
};

function RisksPage() {
  const cards = useCatalog((s) => s.cards);
  const archive = cards.filter((c) => c.status === "shutdown");

  return (
    <Page>
      <LargeTitle eyebrow="校准预期">停服备忘</LargeTitle>
      <Fade>
        <p className="mb-5 max-w-xl text-[15px] leading-relaxed text-muted">
          返现条款会变，平台会消失。这一页是 2025–2026 中文圈 U 卡的公开事件：U 卡不是银行卡。
        </p>
      </Fade>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start lg:gap-8">
        <Group header="时间线">
          {RISK_EVENTS.map((e, i) => (
            <div key={`${e.date}-${e.title}`}>
              {i > 0 && <div className="ml-4 h-px bg-border" />}
              <div className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12px] tabular-nums text-subtle">{e.date}</span>
                  <Badge tone={KIND[e.kind].tone}>{KIND[e.kind].label}</Badge>
                </div>
                <p className="mt-1.5 text-[16px] font-medium">{e.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{e.body}</p>
              </div>
            </div>
          ))}
        </Group>

        <div>
          {archive.length > 0 && (
            <Group header="已停服档案">
              {archive.map((c, i) => (
                <div key={c.slug}>
                  {i > 0 && <div className="ml-4 h-px bg-border" />}
                  <Link to="/card/$slug" params={{ slug: c.slug }}>
                    <Row label={c.name} chevron>
                      <span className="font-mono text-[12px] tabular-nums text-subtle">
                        {c.shutdownDate ?? "—"}
                      </span>
                    </Row>
                  </Link>
                </div>
              ))}
            </Group>
          )}

          <Group header="用法">
            {[
              "只充下个月要用的额度，不要把 U 卡当储蓄账户。",
              "订阅类商户用独立虚拟卡隔离，冻卡时不至于全军覆没。",
              "高返现如果是平台币，按能换成 USDT 的价格算，不要按广告百分比。",
              "客服私聊退款、引导你转账到「安全地址」，几乎一定是假的。",
            ].map((line, i) => (
              <div key={line}>
                {i > 0 && <div className="ml-4 h-px bg-border" />}
                <p className="px-4 py-3 text-[14px] leading-relaxed text-muted">{line}</p>
              </div>
            ))}
          </Group>
        </div>
      </div>
    </Page>
  );
}
