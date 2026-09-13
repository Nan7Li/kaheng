import { serializeAdminSessionClearCookie } from "../../../../src/lib/auth/admin-session.server.ts";

function privateJson(data: unknown, status = 200, setCookie?: string): Response {
  const headers = new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  if (setCookie) headers.set("set-cookie", setCookie);
  return new Response(JSON.stringify(data), { status, headers });
}

export default defineEventHandler((event) => {
  if (getMethod(event) !== "POST") {
    return privateJson({ ok: false, error: "method_not_allowed" }, 405);
  }
  return privateJson({ ok: true }, 200, serializeAdminSessionClearCookie());
});
