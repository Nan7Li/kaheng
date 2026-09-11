import assert from "node:assert/strict";
import test from "node:test";
import { FALLBACK_RATES, convert, toUsd } from "./rates.ts";

test("USDT is not assumed to be 1 USD", () => {
  assert.ok(FALLBACK_RATES.usdPer.USDT < 1);
  assert.ok(FALLBACK_RATES.usdPer.USDT > 0.99);
});

test("USDG tracks USDT rather than a hard 1.00 peg", () => {
  assert.notEqual(FALLBACK_RATES.usdPer.USDG, 1);
  const usdtToUsdg = convert(1000, "USDT", "USDG", FALLBACK_RATES);
  assert.ok(Math.abs(usdtToUsdg - 1000 / 1.0002) < 0.02);
});

test("TWD and EUR convert through USD", () => {
  const usd = toUsd(31.600366, "TWD", FALLBACK_RATES);
  assert.ok(Math.abs(usd - 1) < 0.002);
  const eur = convert(1, "USD", "EUR", FALLBACK_RATES);
  assert.ok(Math.abs(eur - 0.860738) < 0.001);
});
