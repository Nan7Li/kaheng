import { getCookie } from "@tanstack/react-start/server";
import { createServerFn } from "@tanstack/react-start";
import {
  ADMIN_SESSION_COOKIE,
  getAdminAuthConfig,
  getAdminSessionUsername,
} from "./admin-session.server";

export type AdminAccessResult = {
  authorized: boolean;
  reason: "granted" | "not_configured" | "forbidden";
};

/**
 * Check the signed admin cookie on the server. This does not use the optional
 * Google/X OAuth setup, so the admin account works without provider access.
 */
export const getAdminAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminAccessResult> => {
    if (!getAdminAuthConfig()) {
      return { authorized: false, reason: "not_configured" };
    }

    const username = await getAdminSessionUsername(
      getCookie(ADMIN_SESSION_COOKIE),
    );
    return username
      ? { authorized: true, reason: "granted" }
      : { authorized: false, reason: "forbidden" };
  },
);
