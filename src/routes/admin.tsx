import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Fade, LargeTitle, Page } from "@/components/ios";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getAdminAccess, type AdminAccessResult } from "@/lib/auth/admin.functions";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id;
  const hasUser = userId !== undefined;
  const [access, setAccess] = useState<AdminAccessResult | null>(null);

  useEffect(() => {
    let active = true;
    if (isPending || !hasUser || !authEnabled) {
      setAccess(null);
      return () => {
        active = false;
      };
    }
    setAccess(null);
    void getAdminAccess()
      .then((result) => {
        if (active) setAccess(result);
      })
      .catch(() => {
        if (active) setAccess({ authorized: false, reason: "forbidden" });
      });
    return () => {
      active = false;
    };
  }, [hasUser, isPending, userId]);

  if (isPending || (user && authEnabled && !access)) {
    return <AdminMessage title="正在验证管理员权限…" detail="请稍候。" />;
  }

  if (!authEnabled || !hasUser) {
    return (
      <AdminMessage
        title="管理区需要登录"
        detail="访客仍可浏览公开卡库；登录后才会检查管理员账户。"
        action={
          authEnabled ? (
            <Link to="/login" className="text-accent underline-offset-4 hover:underline">
              去登录
            </Link>
          ) : (
            <span className="text-subtle">当前部署未启用身份认证</span>
          )
        }
      />
    );
  }

  if (!access?.authorized) {
    const detail =
      access?.reason === "not_configured"
        ? "后台尚未绑定管理员账户。请在部署环境设置 ADMIN_USER_ID 或 ADMIN_EMAIL；未设置时所有写入默认拒绝。"
        : "当前登录账户没有修改权限，请切换到管理员账户。";
    return <AdminMessage title="无管理员权限" detail={detail} action={<Link to="/" className="text-accent underline-offset-4 hover:underline">返回对照</Link>} />;
  }

  return <Outlet />;
}

function AdminMessage({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <Page>
      <LargeTitle eyebrow="仅限管理员">管理</LargeTitle>
      <Fade>
        <div className="ios-card rounded-[24px] p-5">
          <p className="text-[18px] font-semibold">{title}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{detail}</p>
          {action && <div className="mt-4 text-[14px] font-medium">{action}</div>}
        </div>
      </Fade>
    </Page>
  );
}

