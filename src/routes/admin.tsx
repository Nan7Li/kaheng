import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Fade, LargeTitle, Page } from "@/components/ios";
import { claimAdmin } from "@/lib/admin.functions";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, isPending } = useCurrentUserState();
  const [gate, setGate] = useState<"pending" | "ok" | "forbidden" | "login">("pending");

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setGate("login");
      return;
    }
    let live = true;
    void claimAdmin()
      .then(() => {
        if (live) setGate("ok");
      })
      .catch((err: unknown) => {
        if (!live) return;
        const msg = err instanceof Error ? err.message : "";
        setGate(msg === "Unauthorized" ? "login" : "forbidden");
      });
    return () => {
      live = false;
    };
  }, [user, isPending]);

  if (isPending) {
    return (
      <Page>
        <LargeTitle eyebrow="站长">管理</LargeTitle>
        <Fade>
          <p className="text-[15px] text-muted">正在核对管理员…</p>
        </Fade>
      </Page>
    );
  }

  if (!user || gate === "login") return <RedirectToSignIn />;

  if (gate === "pending") {
    return (
      <Page>
        <LargeTitle eyebrow="站长">管理</LargeTitle>
        <Fade>
          <p className="text-[15px] text-muted">正在核对管理员…</p>
        </Fade>
      </Page>
    );
  }

  if (gate === "forbidden") {
    return (
      <Page>
        <LargeTitle eyebrow="站长">管理</LargeTitle>
        <Fade>
          <p className="max-w-xl text-[17px] leading-relaxed text-muted">
            卡库是公开的，只有站长能改。这个账号还不是管理员。
          </p>
        </Fade>
      </Page>
    );
  }

  return <Outlet />;
}
