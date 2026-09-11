import assert from "node:assert/strict";
import test from "node:test";
import {
  convertAmount,
  formatMoney,
  formatRate,
  listQuoteRates,
  normalizeCurrency,
  parseLooseAmount,
  parseRateCommand,
  type FxTable,
} from "./fx.ts";

const table: FxTable = {
  base: "USD",
  date: "2026-09-10",
  source: "fawaz",
  rates: {
    USD: 1,
    TWD: 31.5,
    CNY: 7.1,
    HKD: 7.8,
    JPY: 147,
    PHP: 58,
  },
};

test("aliases map 台币 and 美金", () => {
  assert.equal(normalizeCurrency("台币"), "TWD");
  assert.equal(normalizeCurrency("美金"), "USD");
  assert.equal(normalizeCurrency("ntd"), "TWD");
  assert.equal(normalizeCurrency("JPY"), "JPY");
});

test("USD-base invert converts both ways", () => {
  assert.equal(convertAmount(100, "USD", "TWD", table.rates), 3150);
  assert.equal(convertAmount(3150, "TWD", "USD", table.rates), 100);
  const phpToTwd = convertAmount(999, "PHP", "TWD", table.rates);
  assert.ok(Math.abs(phpToTwd - (999 * 31.5) / 58) < 1e-6);
});

test("/rate defaults the quote to TWD", () => {
  const listed = parseRateCommand("/rate");
  assert.equal(listed.listOnly, true);
  assert.equal(listed.target, "TWD");
  const one = parseRateCommand("/rate USD 100");
  assert.equal(one.source, "USD");
  assert.equal(one.target, "TWD");
  assert.equal(one.amount, 100);
  const pair = parseRateCommand("/rate USD CNY 20");
  assert.equal(pair.source, "USD");
  assert.equal(pair.target, "CNY");
  assert.equal(pair.amount, 20);
  const cny = parseRateCommand("/ratec USD 20");
  assert.equal(cny.target, "CNY");
  const tw = parseRateCommand("/ratet 100 USD");
  assert.equal(tw.source, "USD");
  assert.equal(tw.target, "TWD");
  assert.equal(tw.amount, 100);
});

test("loose 100美元 and 100 USD 兑台币", () => {
  const a = parseLooseAmount("100美元");
  assert.equal(a?.source, "USD");
  assert.equal(a?.amount, 100);
  assert.equal(a?.target, "TWD");
  const b = parseRateCommand("20 USD");
  assert.equal(b.source, "USD");
  assert.equal(b.amount, 20);
  const c = parseLooseAmount("100美金兑人民币");
  assert.equal(c?.source, "USD");
  assert.equal(c?.target, "CNY");
});

test("formats zero-decimal yen and two-decimal dollars", () => {
  assert.equal(formatMoney(3000, "JPY"), "3,000 JPY");
  assert.equal(formatMoney(19.99, "USD"), "19.99 USD");
  assert.equal(formatRate(31.5), "31.5000");
});

test("quote board inverts against TWD", () => {
  const rows = listQuoteRates(table, "TWD");
  const usd = rows.find((r) => r.code === "USD");
  assert.ok(usd);
  assert.ok(Math.abs(usd.rate - 1 / 31.5) < 1e-9);
});
