import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { POST_SEED, isArticle, type XArticle } from "./posts.ts";

async function sql() {
  const { getSql } = await import("./db");
  return getSql();
}

async function readMeta(key: string): Promise<string | undefined> {
  const db = await sql();
  const rows = await db<{ value: string }>`select value from site_meta where key = ${key} limit 1`;
  return rows[0]?.value;
}

async function writeMeta(key: string, value: string) {
  const db = await sql();
  await db.query(
    `insert into site_meta (key, value) values ($1, $2)
     on conflict (key) do update set value = excluded.value`,
    [key, value],
  );
}

function parsePost(payload: unknown): XArticle | null {
  let raw = payload;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return isArticle(raw) ? raw : null;
}

async function upsertPost(post: XArticle, actor: string) {
  const db = await sql();
  await db.query(
    `insert into site_posts (id, payload, updated_by, updated_at)
     values ($1, $2::jsonb, $3, now())
     on conflict (id) do update set
       payload = excluded.payload,
       updated_by = excluded.updated_by,
       updated_at = now()`,
    [post.id, JSON.stringify(post), actor],
  );
}

async function seedPostsIfNeeded(): Promise<XArticle[]> {
  const db = await sql();
  const rows = await db<{ payload: unknown }>`select payload from site_posts`;
  const initialized = (await readMeta("posts_initialized")) === "1";
  if (rows.length === 0 && !initialized) {
    for (const post of POST_SEED) await upsertPost(post, "seed");
    await writeMeta("posts_initialized", "1");
    return POST_SEED.map((p) => ({ ...p }));
  }
  const posts = rows.map((row) => parsePost(row.payload)).filter((p): p is XArticle => Boolean(p));
  if (!initialized) await writeMeta("posts_initialized", "1");
  return posts;
}

export const listPosts = createServerFn({ method: "POST" }).handler(async (): Promise<XArticle[]> => {
  return seedPostsIfNeeded();
});

export const savePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    if (!isArticle(data)) throw new Error("文章资料不完整");
    return data;
  })
  .handler(async ({ data, context }): Promise<XArticle> => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin(context.userId);
    await upsertPost(data, context.userId);
    await writeMeta("posts_initialized", "1");
    return data;
  });

export const removePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    const id =
      typeof data === "string"
        ? data
        : data && typeof data === "object" && "id" in data
          ? String((data as { id: unknown }).id)
          : "";
    if (!id.trim()) throw new Error("缺少文章");
    return id.trim();
  })
  .handler(async ({ data: id, context }): Promise<{ id: string }> => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin(context.userId);
    const db = await sql();
    await db`delete from site_posts where id = ${id}`;
    await writeMeta("posts_initialized", "1");
    return { id };
  });
