import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, CreditCard, Scale, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "对照", icon: Scale },
  { to: "/cards", label: "卡库", icon: CreditCard },
  { to: "/guide", label: "指南", icon: Compass },
  { to: "/admin", label: "管理", icon: SlidersHorizontal },
] as const;

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  function active(to: string) {
    if (to === "/") return pathname === "/";
    if (to === "/admin") return pathname.startsWith("/admin");
    if (to === "/cards") return pathname.startsWith("/cards") || pathname.startsWith("/card/");
    if (to === "/guide") return pathname.startsWith("/guide") || pathname.startsWith("/risks");
    return pathname === to;
  }

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.7rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto flex max-w-md items-stretch gap-1 rounded-[28px] px-2 py-1.5 glass">
        {TABS.map((tab) => {
          const on = active(tab.to);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "relative flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-[22px] text-[10px] font-semibold",
                on ? "bg-accent/10 text-accent" : "text-subtle",
              )}
            >
              <Icon className="size-[22px]" strokeWidth={on ? 2.35 : 1.75} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
