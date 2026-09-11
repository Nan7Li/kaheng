import assert from "node:assert/strict";
import test from "node:test";
import { writeErrorMessage } from "./write-error.ts";
import {
  SEED_ACTOR,
  cardsFromRows,
  mergeCatalogRows,
  normalizeCard,
  orderCatalog,
} from "./catalog.ts";
import { CARDS } from "../data/cards.ts";

test("admin-edited catalog rows survive a seed refresh", () => {
  const seed = CARDS.find((c) => c.slug === "mexc");
  assert.ok(seed);
  const edited = { ...seed, spendFeePct: 9.9, name: "MEXC 手改" };
  const merged = mergeCatalogRows([
    { slug: "mexc", payload: edited, updated_by: "admin-1" },
    { slug: "custom-aa", payload: { slug: "custom-aa", name: "自制卡" }, updated_by: "admin-1" },
  ]);
  const mexc = merged.find((row) => row.slug === "mexc");
  assert.ok(mexc);
  assert.equal(mexc.updated_by, "admin-1");
  const card = normalizeCard(mexc.payload);
  assert.equal(card?.spendFeePct, 9.9);
  assert.equal(card?.name, "MEXC 手改");
  const untouched = merged.find((row) => row.slug === "bybit");
  assert.ok(untouched);
  assert.equal(untouched.updated_by, SEED_ACTOR);
  assert.ok(merged.some((row) => row.slug === "custom-aa"));
});

test("seed-owned rows pick up the built-in card when fees change", () => {
  const seed = CARDS.find((c) => c.slug === "mexc");
  assert.ok(seed);
  const stale = { ...seed, spendFeePct: 99 };
  const merged = mergeCatalogRows([{ slug: "mexc", payload: stale, updated_by: SEED_ACTOR }]);
  const mexc = merged.find((row) => row.slug === "mexc");
  const card = normalizeCard(mexc?.payload);
  assert.equal(card?.spendFeePct, seed.spendFeePct);
});

test("custom cards sort ahead of built-in seed order", () => {
  const mexc = CARDS.find((c) => c.slug === "mexc");
  const bybit = CARDS.find((c) => c.slug === "bybit");
  assert.ok(mexc && bybit);
  const ordered = orderCatalog([
    bybit,
    { ...mexc, slug: "custom-z", name: "自制" },
    mexc,
  ]);
  assert.equal(ordered[0]?.slug, "custom-z");
  assert.ok(ordered.findIndex((c) => c.slug === "mexc") < ordered.findIndex((c) => c.slug === "bybit"));
});

test("cardsFromRows parses JSON string payloads", () => {
  const seed = CARDS.find((c) => c.slug === "mexc");
  assert.ok(seed);
  const cards = cardsFromRows([{ slug: "mexc", payload: JSON.stringify(seed), updated_by: SEED_ACTOR }]);
  assert.equal(cards[0]?.slug, "mexc");
  assert.equal(cards[0]?.name, seed.name);
});

test("write errors tell visitors to sign in or that they are not admin", () => {
  assert.equal(writeErrorMessage(new Error("Unauthorized")), "请先登录管理员");
  assert.equal(writeErrorMessage(new Error("Forbidden")), "你不是管理员，不能改公开资料");
  assert.equal(writeErrorMessage(new Error("boom"), "保存失败"), "boom");
});
