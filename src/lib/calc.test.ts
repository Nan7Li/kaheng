import assert from "node:assert/strict";
import test from "node:test";
import { CARDS } from "../data/cards.ts";
import { calcCard } from "./calc.ts";

function card(slug: string) {
  const found = CARDS.find((item) => item.slug === slug);
  assert.ok(found, `missing card ${slug}`);
  return found;
}

test("MEXC Global applies its dated fee promotion", () => {
  const result = calcCard(
    card("mexc"),
    { spend: 1000, bill: "usd", tier: "entry" },
    new Date("2026-09-10T00:00:00Z"),
  );
  assert.equal(result.spendFee, 0);
  assert.equal(result.cashback, 40);
});

test("MEXC APAC separates conversion and local-currency FX", () => {
  const result = calcCard(card("mexc-apac"), {
    spend: 1000,
    bill: "local",
    tier: "entry",
  });
  assert.equal(result.conversion, 10);
  assert.equal(result.fx, 10);
});

test("OKX regional caps are not conflated", () => {
  assert.equal(card("okx").cashbackAmountCapHighUsd, 800);
  assert.equal(card("okx-eea").cashbackAmountCapUsd, 50);
  assert.equal(card("okx-eea").cryptoConversionFeePct, 0.1);
  assert.equal(card("okx-sg").cashbackAmountCapHighUsd, 1000);
});

test("physical card fee is included only when selected", () => {
  const virtual = calcCard(card("bybit"), { spend: 1000, bill: "usd", tier: "entry" });
  const physical = calcCard(card("bybit"), {
    spend: 1000,
    bill: "usd",
    tier: "entry",
    includePhysicalFee: true,
  });
  assert.equal(physical.amortized - virtual.amortized, 5 / 12);
});

test("Bybit conversion is not mislabeled as top-up", () => {
  const result = calcCard(card("bybit"), { spend: 1000, bill: "usd", tier: "entry" });
  assert.equal(result.topup, 0);
  assert.equal(result.conversion, 9);
});

test("Bybit high tier uses the documented cap", () => {
  assert.equal(card("bybit").cashbackAmountCapHighUsd, 600);
});
