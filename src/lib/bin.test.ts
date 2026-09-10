import assert from "node:assert/strict";
import test from "node:test";
import { CARDS } from "../data/cards.ts";
import {
  countryFromAlpha2,
  digitsOnly,
  formatBinHit,
  hitFromKnown,
  matchCatalog,
  matchKnownBin,
  networkFromScheme,
  parseBinlistPayload,
  parseHandyPayload,
  prefixHit,
  resolveLive,
  schemeFromPrefix,
  sourceLabel,
} from "./bin.ts";

test("strips PAN to at most 8 digits", () => {
  assert.equal(digitsOnly("4938 7512 3456 7890"), "49387512");
  assert.equal(digitsOnly("bin: 454924"), "454924");
});

test("scheme follows the first digit", () => {
  assert.equal(schemeFromPrefix("493875"), "visa");
  assert.equal(schemeFromPrefix("559666"), "mastercard");
  assert.equal(schemeFromPrefix("222100"), "mastercard");
});

test("maps issuer countries used by U cards", () => {
  assert.equal(countryFromAlpha2("HK"), "hk");
  assert.equal(countryFromAlpha2("PR"), "pr");
  assert.equal(countryFromAlpha2("US"), "us");
  assert.equal(countryFromAlpha2("DE"), "eea");
  assert.equal(countryFromAlpha2("GE"), "ge");
});

test("known Bybit prefix is Hong Kong Reap Visa", () => {
  const known = matchKnownBin("49387512");
  assert.ok(known);
  assert.equal(known.cardSlug, "bybit");
  assert.equal(known.country, "hk");
  assert.equal(known.bank, "Reap Technologies Limited");
  const hit = hitFromKnown(known, "49387512");
  assert.match(formatBinHit(hit), /香港/);
  assert.equal(networkFromScheme(hit.scheme), "visa");
  assert.equal(matchCatalog("493875", CARDS)?.slug, "bybit");
});

test("known Solayer prefix is Puerto Rico Bivo", () => {
  const known = matchKnownBin("454924");
  assert.equal(known?.cardSlug, "solayer");
  assert.equal(known?.country, "pr");
  assert.equal(matchCatalog("45492488", CARDS)?.slug, "solayer");
});

test("known PokePay prefix is US Mastercard", () => {
  const known = matchKnownBin("559666");
  assert.equal(known?.scheme, "mastercard");
  assert.equal(known?.country, "us");
  assert.equal(matchCatalog("559666", CARDS)?.slug, "pokepay");
});

test("HandyAPI success payload maps Denmark to EEA Visa", () => {
  const hit = parseHandyPayload("457173", {
    Status: "SUCCESS",
    Scheme: "VISA",
    Type: "DEBIT",
    Issuer: "DJURSLANDS BANK",
    CardTier: "DANKORT",
    Country: { A2: "DK", Name: "Denmark" },
  });
  assert.ok(hit && hit !== "rate");
  assert.equal(hit.scheme, "visa");
  assert.equal(hit.country, "eea");
  assert.equal(hit.bank, "DJURSLANDS BANK");
  assert.equal(hit.source, "live");
});

test("HandyAPI rate-limit status is not treated as a miss", () => {
  assert.equal(
    parseHandyPayload("411111", {
      Status: "RATE LIMIT EXCEEDED: Please contact us or upgrade plan",
    }),
    "rate",
  );
});

test("binlist payload keeps Puerto Rico as a US-adjacent BIN", () => {
  const hit = parseBinlistPayload("454924", {
    scheme: "visa",
    type: "credit",
    brand: "Visa Platinum",
    country: { alpha2: "PR", name: "Puerto Rico" },
    bank: { name: "Bivo, Inc." },
  });
  assert.ok(hit);
  assert.equal(hit.country, "pr");
  assert.equal(hit.bank, "Bivo, Inc.");
});

test("rate-limited live lookup still reports Visa from the prefix", () => {
  const hit = resolveLive("411111", { rate: true });
  assert.equal(hit.scheme, "visa");
  assert.equal(hit.source, "prefix");
  assert.equal(sourceLabel(hit.source), "仅卡组织");
  assert.match(hit.note ?? "", /额度用完/);
});

test("missing live record still reports Mastercard from the prefix", () => {
  const hit = prefixHit("555555", "miss");
  assert.equal(hit.scheme, "mastercard");
  assert.match(formatBinHit(hit), /Mastercard/);
});
