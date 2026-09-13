import assert from "node:assert/strict";
import test from "node:test";
import { FALLBACK_RATES } from "./rates.ts";
import { findCards, formatCardText, normalizeQuery } from "./public-api.ts";

test("normalizeQuery strips chatter around a card name", () => {
  assert.equal(normalizeQuery("plsama怎么样"), "plsama");
  assert.equal(normalizeQuery("Plasma One 好不好"), "plasma one");
});

test("findCards maps common misspellings to Plasma One", () => {
  const hits = findCards("plsama怎么样");
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.slug, "plasma");
});

test("findCards accepts slug and official name", () => {
  assert.equal(findCards("plasma")[0]?.slug, "plasma");
  assert.equal(findCards("Plasma One")[0]?.slug, "plasma");
  assert.equal(findCards("ether.fi")[0]?.slug, "etherfi");
});

test("formatCardText records the supplied rate snapshot", () => {
  const card = findCards("plasma")[0];
  assert.ok(card);
  const text = formatCardText(card, {
    spend: 1000,
    merchant: "USD",
    asset: "USDT",
    tier: "entry",
    rates: {
      ...FALLBACK_RATES,
      source: "test-rates",
      asOf: "2026-09-13T00:00:00Z",
    },
  });
  assert.match(text, /汇率：test-rates/);
  assert.match(text, /2026-09-13/);
});

test("formatCardText includes key fields", () => {
  const card = findCards("plasma")[0];
  assert.ok(card);
  const text = formatCardText(card);
  assert.match(text, /Plasma One/);
  assert.match(text, /返现/);
  assert.match(text, /card\.stelloras\.com\/card\/plasma/);
});
