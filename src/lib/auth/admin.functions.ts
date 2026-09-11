import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./middleware";
import { isAdminIdentity } from "./admin";
import { getSessionUser } from "./verify.server";

export type AdminAccessResult = {
  authorized: boolean;
  reason: "granted" | "not_configured" | "forbidden";
};

function env(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

/**
 * Server-side admin check. The allowlist is read at request time so the
 * deployment can rotate the owner without putting an email or id in the
 * client bundle. `VITE_*` fallbacks make local preview setup convenient; use
 * the non-VITE names in production because they stay server-only.
 */
export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AdminAccessResult> => {
    const userId = env("ADMIN_USER_ID") ?? env("VITE_ADMIN_USER_ID");
    const email = env("ADMIN_EMAIL") ?? env("VITE_ADMIN_EMAIL");
    if (!userId && !email) {
      return { authorized: false, reason: "not_configured" };
    }

    const bearerToken =
      "bearerToken" in context && typeof context.bearerToken === "string"
        ? context.bearerToken
        : undefined;
    const user = await getSessionUser(bearerToken);
    return {
      authorized: isAdminIdentity(user, { userId, email }),
      reason: isAdminIdentity(user, { userId, email }) ? "granted" : "forbidden",
    };
  });

