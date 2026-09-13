import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Fade, LargeTitle, Page } from "@/components/ios";
import { getAdminAccess } from "@/lib/auth/admin.functions";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void getAdminAccess()
      .then((access) => {
        if (!active) return;
        if (access.authorized) {
          void navigate({ to: "/admin" });
          return;
        }
        setCheckingAccess(false);
      })
      .catch(() => {
        if (active) setCheckingAccess(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: unknown;
      } | null;
      if (!response.ok) {
        throw new Error(
          typeof payload?.message === "string"
            ? payload.message
            : "登录失败，请稍后再试。",
        );
      }
      setPassword("");
      await navigate({ to: "/admin" });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "登录失败，请稍后再试。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Page>
      <LargeTitle eyebrow="账户">登录</LargeTitle>
      <Fade>
        <div className="ios-card rounded-[24px] p-5">
          <p className="text-[18px] font-semibold">进入卡衡管理区</p>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            公开页面无需登录；只有管理员账户可以修改卡资料、费率和上下架状态。
          </p>

          {checkingAccess ? (
            <p className="mt-5 text-[14px] text-muted">正在检查登录状态…</p>
          ) : (
            <form className="mt-5 flex w-full max-w-sm flex-col gap-4" onSubmit={onSubmit}>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] text-subtle">账户</span>
                <input
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  className="rounded-xl border border-border bg-transparent px-3 py-2.5 text-[16px] text-fg outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] text-subtle">密码</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="rounded-xl border border-border bg-transparent px-3 py-2.5 text-[16px] text-fg outline-none focus:border-accent"
                />
              </label>
              {error && (
                <p role="alert" className="text-[14px] text-loss">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-fg px-4 py-3 text-[16px] font-medium text-bg pressable disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? "登录中…" : "登录"}
              </button>
              <p className="text-[12px] leading-relaxed text-subtle">
                管理员账户由部署环境中的 ADMIN_USERNAME 和 ADMIN_PASSWORD 提供。
              </p>
            </form>
          )}

          <Link
            to="/"
            className="mt-5 inline-block text-[14px] text-accent underline-offset-4 hover:underline"
          >
            返回公开页面
          </Link>
        </div>
      </Fade>
    </Page>
  );
}
