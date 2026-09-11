import assert from "node:assert/strict";
import test from "node:test";
import { quotePrices, SUB_PRODUCTS, productById } from "./subs.ts";
import type { FxTable } from "./fx.ts";

const table: FxTable = {
  base: "USD",
  date: "2026-09-10",
  source: "fawaz",
  rates: {
    USD: 1,
    TWD: 31.5,
    PHP: 62.5,
    JPY: 153.6,
    TRY: 48.5,
    CNY: 7.1,
  },
};

test("ChatGPT Plus includes Taiwan and sorts by converted quote", () => {
  const plus = productById("chatgpt-plus");
  assert.ok(plus);
  const tw = plus.prices.find((p) => p.country === "TW");
  assert.equal(tw?.amount, 690);
  assert.equal(tw?.currency, "TWD");
  const rows = quotePrices(plus, "TWD", table);
  const finite = rows.filter((r) => Number.isFinite(r.quoted));
  assert.ok(finite.length > 0);
  assert.equal(finite[0].quoted, Math.min(...finite.map((r) => r.quoted)));
  const ph = rows.find((r) => r.country === "PH");
  assert.ok(ph);
  assert.ok(ph.quoted < 690);
  const us = rows.find((r) => r.country === "US");
  assert.ok(us);
  assert.ok(Math.abs(us.quoted - 19.99 * 31.5) < 0.01);
});

test("Spotify Taiwan list price is NT$168", () => {
  const spotify = productById("spotify");
  assert.equal(spotify?.prices.find((p) => p.country === "TW")?.amount, 168);
});

test("Netflix Premium keeps the Taiwan 4K tier", () => {
  const netflix = productById("netflix");
  assert.equal(netflix?.prices.find((p) => p.country === "TW")?.amount, 460);
  assert.equal(netflix?.prices.find((p) => p.country === "US")?.amount, 26.99);
});

test("catalog covers the four bot-era tools plus ChatGPT", () => {
  assert.deepEqual(
    SUB_PRODUCTS.map((p) => p.id),
    ["chatgpt-plus", "chatgpt-go", "spotify", "netflix"],
  );
});
