import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Fade, Group, LargeTitle, Page } from "@/components/ios";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

const LABELS: Record<string, string> = {
  Google: "使用 Google 登录",
  X: "使用 X 登录",
};

function Login() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <Page>
        <LargeTitle eyebrow="站长">登录</LargeTitle>
        <p className="text-[15px] text-muted">正在核对登录状态…</p>
      </Page>
    );
  }

  if (user) return <Navigate to="/admin" />;

  return (
    <Page>
      <LargeTitle eyebrow="站长">管理员登录</LargeTitle>
      <Fade>
        <p className="mb-5 max-w-xl text-[17px] leading-relaxed text-muted">
          对照页给所有人看。改费率、上下架、导入导出，只有管理员能做。第一位登录并进入管理页的人会成为站长，之后别人改不了。
        </p>
      </Fade>
      <Group header="登录" footer="用 Google 或 X。登录后会回到管理页。">
        {authEnabled ? (
          GROK_PROVIDERS.map((p, i) => (
            <div key={p.providerId}>
              {i > 0 && <div className="ml-4 h-px bg-border" />}
              <button
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/admin" })}
                className="flex min-h-12 w-full items-center px-4 text-[16px] text-accent pressable"
              >
                {LABELS[p.label] ?? `使用 ${p.label} 登录`}
              </button>
            </div>
          ))
        ) : (
          <p className="px-4 py-3 text-[15px] text-muted">登录还没打开。</p>
        )}
      </Group>
    </Page>
  );
}
