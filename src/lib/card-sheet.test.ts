import assert from "node:assert/strict";
import test from "node:test";
import { CARDS } from "../data/cards.ts";
import { parseCardSheet, serializeCard } from "./card-sheet.ts";

test("single-card text round-trips fee semantics and verification sources", () => {
  const source = CARDS.find((card) => card.slug === "okx-eea");
  assert.ok(source);
  const parsed = parseCardSheet(serializeCard(source));
  assert.equal(parsed.cryptoConversionFeePct, 0.1);
  assert.equal(parsed.verification, "official");
  assert.equal(parsed.verifiedAt, "2026-09-10");
  assert.deepEqual(parsed.sourceUrls, source.sourceUrls);
  assert.equal(parsed.settlement, "EUR");
  assert.equal(parsed.nativeAsset, "USDG");
  assert.deepEqual(parsed.fxFree, ["EUR"]);
});

test("empty region field falls back to the safe global default", () => {
  const parsed = parseCardSheet("标识: example\n中文名: Example\n地区:\n");
  assert.deepEqual(parsed.regions, ["global"]);
});

test("named levels round-trip through the text sheet", () => {
  const source = CARDS.find((card) => card.slug === "cryptocom");
  assert.ok(source);
  const parsed = parseCardSheet(serializeCard(source));
  assert.equal(parsed.levels?.length, 5);
  assert.equal(parsed.levels?.[0]?.id, "midnight");
  assert.equal(parsed.levels?.[0]?.fxFeePct, 2.5);
  assert.equal(parsed.levels?.[3]?.id, "icy");
  assert.equal(parsed.levels?.[3]?.cashbackPct, 4);
  assert.equal(parsed.levels?.[4]?.id, "obsidian");
  assert.equal(parsed.levels?.[4]?.cashbackPct, 5);
});

test("invite code and link round-trip through the text sheet", () => {
  const parsed = parseCardSheet(
    "标识: demo\n中文名: Demo\n邀请码: ABC123\n邀请链接: https://example.com/r/ABC123\n",
  );
  assert.equal(parsed.inviteCode, "ABC123");
  assert.equal(parsed.inviteUrl, "https://example.com/r/ABC123");
  const again = parseCardSheet(serializeCard(parsed));
  assert.equal(again.inviteCode, "ABC123");
  assert.equal(again.inviteUrl, "https://example.com/r/ABC123");
});
