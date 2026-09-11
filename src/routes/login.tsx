import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Fade, LargeTitle, Page } from "@/components/ios";
import { SignInButtons } from "@/lib/auth/gates";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && user) void navigate({ to: "/admin" });
  }, [isPending, navigate, user]);

  return (
    <Page>
      <LargeTitle eyebrow="账户">登录</LargeTitle>
      <Fade>
        <div className="ios-card rounded-[24px] p-5">
          <p className="text-[18px] font-semibold">进入卡衡管理区</p>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            公开页面无需登录；只有管理员账户可以修改卡资料、费率和上下架状态。
          </p>
          <div className="mt-5">
            {authEnabled ? (
              <SignInButtons callbackURL="/admin" />
            ) : (
              <p className="text-[14px] text-loss">当前部署未启用身份认证，管理区已安全锁定。</p>
            )}
          </div>
          <Link to="/" className="mt-5 inline-block text-[14px] text-accent underline-offset-4 hover:underline">
            返回公开页面
          </Link>
        </div>
      </Fade>
    </Page>
  );
}

