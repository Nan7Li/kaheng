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

test("entry uses first named level and boost uses last", () => {
  const entry = calcCard(card("mexc"), {
    spend: 1000,
    bill: "usd",
    tier: "entry",
  }, new Date("2026-10-01T00:00:00Z"));
  const boost = calcCard(card("mexc"), {
    spend: 1000,
    bill: "usd",
    tier: "boost",
  }, new Date("2026-10-01T00:00:00Z"));
  assert.equal(entry.levelName, "VVIP Standard");
  assert.equal(entry.cashback, 40);
  assert.equal(boost.levelName, "VVIP Elite");
  assert.equal(boost.cashback, 100);
});

test("Crypto.com Midnight FX is not applied on USD bills", () => {
  const midnight = calcCard(card("cryptocom"), {
    spend: 1000,
    bill: "usd",
    tier: "entry",
    levelId: "midnight",
  });
  const icyLocal = calcCard(card("cryptocom"), {
    spend: 1000,
    bill: "local",
    tier: "boost",
    levelId: "icy",
  });
  assert.equal(midnight.fx, 0);
  assert.equal(midnight.cashback, 0);
  assert.equal(icyLocal.fx, 0);
  assert.equal(icyLocal.cashback, 50);
});

test("RedotPay Pro monthly fee is amortized into net", () => {
  const standard = calcCard(card("redotpay"), {
    spend: 1000,
    bill: "usd",
    tier: "entry",
  });
  const pro = calcCard(card("redotpay"), {
    spend: 1000,
    bill: "usd",
    tier: "boost",
  });
  assert.equal(standard.levelName, "标准卡");
  assert.equal(pro.levelName, "Pro");
  assert.ok(pro.amortized - standard.amortized > 12);
});

