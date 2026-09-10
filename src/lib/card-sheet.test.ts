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
});

test("empty region field falls back to the safe global default", () => {
  const parsed = parseCardSheet("标识: example\n中文名: Example\n地区:\n");
  assert.deepEqual(parsed.regions, ["global"]);
});
