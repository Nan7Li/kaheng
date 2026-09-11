import assert from "node:assert/strict";
import test from "node:test";
import { CARDS } from "../data/cards.ts";
import { calcCard } from "./calc.ts";
import { FALLBACK_RATES, convert } from "./rates.ts";
import { cardMoney } from "./money.ts";

function card(slug: string) {
  const found = CARDS.find((item) => item.slug === slug);
  assert.ok(found, `missing card ${slug}`);
  return found;
}

const rates = FALLBACK_RATES;

test("MEXC Global applies its dated fee promotion", () => {
  const result = calcCard(
    card("mexc"),
    { spend: 1000, merchant: "USD", asset: "USDT", tier: "entry", rates },
    new Date("2026-09-10T00:00:00Z"),
  );
  assert.equal(result.spendFee, 0);
  assert.equal(result.cashback, 40);
});

test("MEXC Global 1 USDT is not 1 USD — one-to-one debit still uses the live print", () => {
  const result = calcCard(card("mexc"), {
    spend: 1000,
    merchant: "USD",
    asset: "USDT",
    tier: "entry",
    rates,
  });
  assert.equal(result.assetSpent, 1000);
  assert.ok(result.peg < -0.3 && result.peg > -0.5);
  assert.equal(result.nativeAsset, "USDT");
  assert.equal(result.pegPolicy, "one-to-one");
});

test("MEXC APAC separates conversion and local-currency FX", () => {
  const result = calcCard(card("mexc-apac"), {
    spend: 1000,
    bill: "local",
    tier: "entry",
    rates,
  });
  assert.equal(result.merchant, "TWD");
  assert.equal(result.conversion, 10);
  assert.equal(result.fx, 10);
});

test("OKX regional caps are not conflated", () => {
  assert.equal(card("okx").cashbackAmountCapHighUsd, 800);
  assert.equal(card("okx-eea").cashbackAmountCapUsd, 50);
  assert.equal(card("okx-eea").cryptoConversionFeePct, 0.1);
  assert.equal(card("okx-sg").cashbackAmountCapHighUsd, 1000);
});

test("OKX deducts USDG, not USDT", () => {
  assert.equal(cardMoney(card("okx")).nativeAsset, "USDG");
  assert.equal(cardMoney(card("okx-eea")).settlement, "EUR");
  assert.equal(cardMoney(card("okx-sg")).settlement, "SGD");
  const result = calcCard(card("okx"), {
    spend: 1000,
    merchant: "USD",
    asset: "USDT",
    tier: "entry",
    rates,
  });
  assert.equal(result.nativeAsset, "USDG");
  assert.equal(result.asset, "USDT");
  assert.ok(result.assetSpent > 1000);
});

test("OKX EEA euro card bills in EUR and converts USDG at 0.1%", () => {
  const eur = calcCard(card("okx-eea"), {
    spend: 1000,
    merchant: "EUR",
    asset: "USDG",
    tier: "entry",
    rates,
  });
  assert.equal(eur.settlement, "EUR");
  assert.equal(eur.fx, 0);
  assert.equal(eur.conversion, 1);
  const expectedSettle = convert(1000, "USD", "EUR", rates);
  assert.ok(Math.abs(eur.billedSettle - expectedSettle) < 1e-6);
  assert.ok(Math.abs(eur.cashback - 20) < 0.02);
});

test("USD spend on a EUR card is not treated as a dollar bill", () => {
  const usdBill = calcCard(card("okx-eea"), {
    spend: 1000,
    merchant: "USD",
    asset: "USDG",
    tier: "entry",
    rates,
  });
  assert.equal(usdBill.settlement, "EUR");
  assert.ok(usdBill.billedSettle < 1000);
});

test("physical card fee is included only when selected", () => {
  const virtual = calcCard(card("bybit"), {
    spend: 1000,
    merchant: "USD",
    asset: "USDT",
    tier: "entry",
    rates,
  });
  const physical = calcCard(card("bybit"), {
    spend: 1000,
    merchant: "USD",
    asset: "USDT",
    tier: "entry",
    includePhysicalFee: true,
    rates,
  });
  assert.equal(physical.amortized - virtual.amortized, 5 / 12);
});

test("Bybit conversion is not mislabeled as top-up", () => {
  const result = calcCard(card("bybit"), {
    spend: 1000,
    merchant: "USD",
    asset: "USDT",
    tier: "entry",
    rates,
  });
  assert.equal(result.topup, 0);
  assert.equal(result.conversion, 9);
});

test("Bybit high tier uses the documented cap", () => {
  assert.equal(card("bybit").cashbackAmountCapHighUsd, 600);
});

test("entry uses first named level and boost uses last", () => {
  const entry = calcCard(
    card("mexc"),
    { spend: 1000, merchant: "USD", asset: "USDT", tier: "entry", rates },
    new Date("2026-10-01T00:00:00Z"),
  );
  const boost = calcCard(
    card("mexc"),
    { spend: 1000, merchant: "USD", asset: "USDT", tier: "boost", rates },
    new Date("2026-10-01T00:00:00Z"),
  );
  assert.equal(entry.levelName, "VVIP Standard");
  assert.equal(entry.cashback, 40);
  assert.equal(boost.levelName, "VVIP Elite");
  assert.equal(boost.cashback, 100);
});

test("Crypto.com Midnight FX is not applied on USD bills", () => {
  const midnight = calcCard(card("cryptocom"), {
    spend: 1000,
    merchant: "USD",
    asset: "USDT",
    tier: "entry",
    levelId: "midnight",
    rates,
  });
  const icyLocal = calcCard(card("cryptocom"), {
    spend: 1000,
    merchant: "TWD",
    asset: "USDT",
    tier: "boost",
    levelId: "icy",
    rates,
  });
  assert.equal(midnight.fx, 0);
  assert.equal(midnight.cashback, 0);
  assert.equal(icyLocal.fx, 0);
  assert.equal(icyLocal.cashback, 40);
});

test("RedotPay conversion is not mislabeled as a spend fee", () => {
  const standard = calcCard(card("redotpay"), {
    spend: 1000,
    merchant: "USD",
    asset: "USDT",
    tier: "entry",
    rates,
  });
  const pro = calcCard(card("redotpay"), {
    spend: 1000,
    merchant: "USD",
    asset: "USDT",
    tier: "boost",
    rates,
  });
  assert.equal(standard.levelName, "标准卡");
  assert.equal(standard.conversion, 10);
  assert.equal(standard.spendFee, 0);
  assert.equal(standard.cashback, 0);
  assert.equal(pro.levelName, "Pro");
  assert.equal(pro.cashback, 20);
  assert.ok(pro.amortized - standard.amortized > 12);
});

test("ether.fi Core FX is 1% and cashback is capped by spend band", () => {
  const usdBill = calcCard(card("etherfi"), {
    spend: 1000,
    merchant: "USD",
    asset: "USDC",
    tier: "entry",
    rates,
  });
  const local = calcCard(card("etherfi"), {
    spend: 1000,
    merchant: "TWD",
    asset: "USDC",
    tier: "entry",
    rates,
  });
  const vip = calcCard(card("etherfi"), {
    spend: 1000,
    merchant: "USD",
    asset: "USDC",
    tier: "boost",
    rates,
  });
  assert.equal(usdBill.levelName, "Core");
  assert.equal(usdBill.cashback, 30);
  assert.equal(usdBill.fx, 0);
  assert.equal(local.fx, 10);
  assert.equal(vip.levelName, "VIP");
  assert.equal(vip.cashback, 40);
});

test("Gnosis is an euro card: EUR spend has no FX", () => {
  assert.equal(cardMoney(card("gnosis")).settlement, "EUR");
  const result = calcCard(card("gnosis"), {
    spend: 1000,
    merchant: "EUR",
    asset: "USDC",
    tier: "entry",
    rates,
  });
  assert.equal(result.fx, 0);
  assert.equal(result.settlement, "EUR");
  assert.equal(result.nativeAsset, "EURe");
});

test("TWD bill on a USD card converts TWD to USDT, not only USD to USDT", () => {
  const result = calcCard(card("bybit"), {
    spend: 1000,
    merchant: "TWD",
    asset: "USDT",
    tier: "entry",
    rates,
  });
  assert.equal(result.merchant, "TWD");
  assert.equal(result.fx, 20);
  assert.ok(result.assetSpent > 1000);
});
