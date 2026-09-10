import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, CreditCard, Scale, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export const TABS = [
  { to: "/", label: "对照", icon: Scale },
  { to: "/cards", label: "卡库", icon: CreditCard },
  { to: "/guide", label: "指南", icon: Compass },
  { to: "/admin", label: "管理", icon: SlidersHorizontal },
] as const;

export function navActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  if (to === "/admin") return pathname.startsWith("/admin");
  if (to === "/cards") return pathname.startsWith("/cards") || pathname.startsWith("/card/");
  if (to === "/guide") return pathname.startsWith("/guide") || pathname.startsWith("/risks");
  return pathname === to;
}

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const idx = TABS.findIndex((t) => navActive(pathname, t.to));

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.7rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="pointer-events-auto relative mx-auto flex max-w-md items-stretch gap-1 rounded-[28px] px-2 py-1.5 glass">
        {idx >= 0 && (
          <div
            className="tab-pill pointer-events-none absolute top-1.5 bottom-1.5 rounded-[22px] bg-accent/12"
            style={{
              width: `calc((100% - 16px) / ${TABS.length})`,
              left: 8,
              transform: `translateX(${idx * 100}%)`,
            }}
          />
        )}
        {TABS.map((tab) => {
          const on = navActive(pathname, tab.to);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "relative z-10 flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-[22px] text-[10px] font-semibold transition-colors duration-300",
                on ? "text-accent" : "text-subtle",
              )}
            >
              <Icon
                className="size-[22px] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                strokeWidth={on ? 2.35 : 1.75}
                style={{ transform: on ? "translateY(-1px) scale(1.04)" : undefined }}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
