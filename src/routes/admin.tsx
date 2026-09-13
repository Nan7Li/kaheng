import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Fade, LargeTitle, Page } from "@/components/ios";
import { getAdminAccess, type AdminAccessResult } from "@/lib/auth/admin.functions";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const [access, setAccess] = useState<AdminAccessResult | null>(null);

  useEffect(() => {
    let active = true;
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
  }, []);

  if (!access) {
    return <AdminMessage title="正在验证管理员权限…" detail="请稍候。" />;
  }

  if (!access.authorized) {
    const notConfigured = access.reason === "not_configured";
    return (
      <AdminMessage
        title={notConfigured ? "管理区尚未配置" : "管理区需要登录"}
        detail={
          notConfigured
            ? "请在 Cloudflare Pages 的生产环境变量中设置 ADMIN_USERNAME 和 ADMIN_PASSWORD；未设置时管理区会保持锁定。"
            : "账户或密码不正确，或登录已过期。"
        }
        action={
          notConfigured ? (
            <Link to="/" className="text-accent underline-offset-4 hover:underline">
              返回公开页面
            </Link>
          ) : (
            <Link to="/login" className="text-accent underline-offset-4 hover:underline">
              去登录
            </Link>
          )
        }
      />
    );
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
