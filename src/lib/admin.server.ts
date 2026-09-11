import { getSql } from "@/lib/db";

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

/** First caller becomes the only admin; later callers must already be in the table. */
export async function requireAdmin(userId: string): Promise<void> {
  const sql = await getSql();
  const mine = await sql<{ user_id: string }>`
    select user_id from site_admins where user_id = ${userId} limit 1
  `;
  if (mine.length) return;
  const claimed = await sql<{ user_id: string }>`select user_id from site_admins limit 1`;
  if (claimed.length) throw new ForbiddenError();
  await sql`insert into site_admins (user_id) values (${userId}) on conflict do nothing`;
  const confirm = await sql<{ user_id: string }>`
    select user_id from site_admins where user_id = ${userId} limit 1
  `;
  if (!confirm.length) throw new ForbiddenError();
}

export async function readAdminStatus(
  userId: string,
): Promise<{ isAdmin: boolean; open: boolean }> {
  const sql = await getSql();
  const mine = await sql<{ user_id: string }>`
    select user_id from site_admins where user_id = ${userId} limit 1
  `;
  if (mine.length) return { isAdmin: true, open: false };
  const claimed = await sql<{ user_id: string }>`select user_id from site_admins limit 1`;
  return { isAdmin: false, open: claimed.length === 0 };
}
