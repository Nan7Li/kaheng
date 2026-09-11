import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { CARDS, type UCard } from "../data/cards.ts";
import {
  SEED_ACTOR,
  SEED_REVISION,
  cardsFromRows,
  mergeCatalogRows,
  normalizeCard,
  type CatalogRow,
} from "./catalog.ts";

async function sql() {
  const { getSql } = await import("./db");
  return getSql();
}

async function readRows(): Promise<CatalogRow[]> {
  const db = await sql();
  return db<CatalogRow>`select slug, payload, updated_by from catalog_cards`;
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

async function upsertRow(row: CatalogRow, force: boolean) {
  const db = await sql();
  const payload = JSON.stringify(row.payload);
  if (force) {
    await db.query(
      `insert into catalog_cards (slug, payload, updated_by, updated_at)
       values ($1, $2::jsonb, $3, now())
       on conflict (slug) do update set
         payload = excluded.payload,
         updated_by = excluded.updated_by,
         updated_at = now()`,
      [row.slug, payload, row.updated_by],
    );
    return;
  }
  await db.query(
    `insert into catalog_cards (slug, payload, updated_by, updated_at)
     values ($1, $2::jsonb, $3, now())
     on conflict (slug) do update set
       payload = excluded.payload,
       updated_at = now()
     where catalog_cards.updated_by = 'seed'`,
    [row.slug, payload, row.updated_by],
  );
}

async function persistSeedMerge(existing: CatalogRow[]) {
  const merged = mergeCatalogRows(existing);
  for (const row of merged) {
    if (row.updated_by === SEED_ACTOR) await upsertRow(row, false);
    else if (!existing.some((r) => r.slug === row.slug)) await upsertRow(row, true);
  }
  await writeMeta("catalog_initialized", "1");
  await writeMeta("catalog_seed_revision", String(SEED_REVISION));
  return cardsFromRows(merged);
}

export const listCatalog = createServerFn({ method: "POST" }).handler(async (): Promise<UCard[]> => {
  try {
    const rows = await readRows();
    const initialized = (await readMeta("catalog_initialized")) === "1";
    const revision = Number((await readMeta("catalog_seed_revision")) ?? 0) || 0;
    if (!initialized || rows.length === 0 || revision < SEED_REVISION) {
      return persistSeedMerge(rows);
    }
    const cards = cardsFromRows(rows);
    return cards.length ? cards : CARDS.map((c) => ({ ...c }));
  } catch {
    return CARDS.map((c) => ({ ...c }));
  }
});

export const saveCatalogCard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    const card = normalizeCard(data);
    if (!card) throw new Error("卡片资料不完整");
    return card;
  })
  .handler(async ({ data, context }): Promise<UCard> => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin(context.userId);
    const card: UCard = {
      ...data,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    await upsertRow({ slug: card.slug, payload: card, updated_by: context.userId }, true);
    await writeMeta("catalog_initialized", "1");
    return card;
  });

export const removeCatalogCard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    const slug =
      typeof data === "string"
        ? data
        : data && typeof data === "object" && "slug" in data
          ? String((data as { slug: unknown }).slug)
          : "";
    const clean = slug.trim().toLowerCase();
    if (!clean) throw new Error("缺少卡片标识");
    return clean;
  })
  .handler(async ({ data: slug, context }): Promise<{ slug: string }> => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin(context.userId);
    const db = await sql();
    await db`delete from catalog_cards where slug = ${slug}`;
    return { slug };
  });

export const replaceCatalog = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    if (!Array.isArray(data)) throw new Error("需要卡片数组");
    const cards = data.map(normalizeCard).filter((c): c is UCard => Boolean(c));
    if (!cards.length) throw new Error("没有可用的卡片");
    if (cards.length > 200) throw new Error("一次最多 200 张");
    return cards;
  })
  .handler(async ({ data, context }): Promise<UCard[]> => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin(context.userId);
    const db = await sql();
    await db`delete from catalog_cards`;
    for (const card of data) {
      await upsertRow({ slug: card.slug, payload: card, updated_by: context.userId }, true);
    }
    await writeMeta("catalog_initialized", "1");
    await writeMeta("catalog_seed_revision", String(SEED_REVISION));
    return data;
  });

export const resetCatalog = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<UCard[]> => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin(context.userId);
    const db = await sql();
    await db`delete from catalog_cards`;
    return persistSeedMerge([]);
  });
