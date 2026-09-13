import {
  createAdminSession,
  getAdminAuthConfig,
  serializeAdminSessionCookie,
  verifyAdminCredentials,
} from "../../../../src/lib/auth/admin-session.server.ts";

function privateJson(
  data: unknown,
  status = 200,
  setCookie?: string,
): Response {
  const headers = new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  if (setCookie) headers.set("set-cookie", setCookie);
  return new Response(JSON.stringify(data), { status, headers });
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== "POST") {
    return privateJson({ ok: false, error: "method_not_allowed" }, 405);
  }

  if (!getAdminAuthConfig()) {
    return privateJson(
      {
        ok: false,
        error: "admin_auth_not_configured",
        message: "请先在部署环境配置 ADMIN_USERNAME 和 ADMIN_PASSWORD。",
      },
      503,
    );
  }

  let body: Record<string, unknown> | null;
  try {
    body = (await readBody<unknown>(event)) as Record<string, unknown> | null;
  } catch {
    body = null;
  }

  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) {
    return privateJson(
      { ok: false, error: "missing_credentials", message: "请输入账户和密码。" },
      400,
    );
  }

  if (!(await verifyAdminCredentials(username, password))) {
    return privateJson(
      { ok: false, error: "invalid_credentials", message: "账户或密码不正确。" },
      401,
    );
  }

  try {
    const token = await createAdminSession(username);
    return privateJson({ ok: true }, 200, serializeAdminSessionCookie(token));
  } catch (error) {
    console.error("[admin-auth] session creation failed", error);
    return privateJson(
      { ok: false, error: "server_error", message: "登录服务暂时不可用，请稍后再试。" },
      500,
    );
  }
});
