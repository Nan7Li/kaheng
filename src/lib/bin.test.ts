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
  schemeFromPrefix,
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
