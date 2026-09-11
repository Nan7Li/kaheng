import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { CompareBar } from "@/components/compare-bar";
import { Wordmark } from "@/components/logo";
import { RateTicker } from "@/components/rate-board";
import { SideNav } from "@/components/side-nav";
import { TabBar } from "@/components/tab-bar";
import { DATA_AS_OF } from "@/data/cards";
import { useCatalog } from "@/lib/catalog";
import { usePosts } from "@/lib/posts";
import { useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SiteShell({ children }: { children: ReactNode }) {
  const selectedCount = useDesk((s) => s.selected.length);

  useEffect(() => {
    useCatalog.getState().hydrate();
    usePosts.getState().hydrate();
    useDesk.getState().hydrateRates();
    const t = setInterval(() => useDesk.getState().hydrateRates(), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg lg:flex-row">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] lg:hidden">
          <div className="mx-auto flex h-12 max-w-2xl items-center justify-between rounded-full px-4 glass">
            <Link to="/" className="shrink-0 pressable">
              <Wordmark />
            </Link>
            <Link
              to="/compare"
              className={cn(
                "text-[15px] font-semibold pressable",
                selectedCount ? "text-accent" : "text-subtle",
              )}
            >
              比较{selectedCount ? ` ${selectedCount}` : ""}
            </Link>
          </div>
          <div className="mx-auto mt-1.5 max-w-2xl px-2">
            <RateTicker />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mx-auto w-full max-w-2xl px-6 pb-32 pt-4 text-[12px] leading-relaxed text-subtle lg:max-w-[88rem] lg:px-8 lg:pb-10 xl:px-10">
          <p className="lg:hidden">卡衡 · {DATA_AS_OF}</p>
          <p className="mt-1">
            费率按公开条款折算，可在管理页改成你的口径。本站无邀请返佣。U
            卡会停服，只放亏得起的额度。
          </p>
        </footer>
      </div>
      <CompareBar />
      <TabBar />
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "!rounded-full !border-0 !bg-fg !text-bg !shadow-[0_12px_40px_rgba(0,0,0,0.18)] !text-[14px] !font-medium",
        }}
      />
    </div>
  );
}
