import { Link, useRouterState } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";
import { Wordmark } from "@/components/logo";
import { TABS, navActive } from "@/components/tab-bar";
import { DATA_AS_OF } from "@/data/cards";
import { useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SideNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selectedCount = useDesk((s) => s.selected.length);
  const compareOn = pathname.startsWith("/compare");

  return (
    <aside className="sticky top-0 hidden h-dvh w-[var(--app-sidebar)] shrink-0 flex-col self-start p-3 lg:flex">
      <div className="glass flex min-h-0 flex-1 flex-col rounded-[28px] p-2">
        <Link to="/" className="flex h-12 items-center px-3 pressable">
          <Wordmark />
        </Link>

        <nav className="mt-2 flex flex-col gap-0.5">
          {TABS.map((tab) => {
            const on = navActive(pathname, tab.to);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-[20px] px-3 text-[15px] font-semibold transition-colors duration-200",
                  on ? "bg-accent/12 text-accent" : "text-muted hover:bg-surface/70 hover:text-fg",
                )}
              >
                <Icon className="size-[22px]" strokeWidth={on ? 2.35 : 1.75} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 p-2 pb-3">
          <Link
            to="/compare"
            className={cn(
              "flex h-11 items-center gap-3 rounded-[20px] px-3 text-[15px] font-semibold transition-colors duration-200",
              compareOn
                ? "bg-accent/12 text-accent"
                : selectedCount
                  ? "text-accent hover:bg-accent/10"
                  : "text-muted hover:bg-surface/70 hover:text-fg",
            )}
          >
            <GitCompareArrows className="size-[22px]" strokeWidth={compareOn || selectedCount ? 2.2 : 1.75} />
            比较
            {selectedCount > 0 && (
              <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-fg">
                {selectedCount}
              </span>
            )}
          </Link>
          <p className="px-1 text-[11px] leading-relaxed text-subtle">
            卡衡 · {DATA_AS_OF}
            <br />
            费率可改，无返佣。
          </p>
        </div>
      </div>
    </aside>
  );
}
