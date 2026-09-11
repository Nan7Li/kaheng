import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const getAdminStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { readAdminStatus } = await import("./admin.server");
    return readAdminStatus(context.userId);
  });

/** Opening /admin claims the seat if nobody has yet. */
export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin(context.userId);
    return { isAdmin: true as const };
  });
