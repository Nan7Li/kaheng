import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import { CARDS, formatBin } from "../data/cards.ts";
import {
  countryFromAlpha2,
  digitsOnly,
  formatBinHit,
  formatBinReport,
  hitFromKnown,
  levelLabel,
  matchCatalog,
  matchCatalogAll,
  matchKnownBin,
  mergeBinHits,
  needsLiveEnrichment,
  networkFromScheme,
  parseBinlistPayload,
  parseHandyPayload,
  parseLevel,
  prefixHit,
  resolveLive,
  schemeFromPrefix,
  sourceLabel,
} from "./bin.ts";
import { decodeIndexBody, loadIndexFile, matchIndexLines, parseIndexRecord, type BinIndexFile } from "./bin-index.ts";

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
  assert.equal(known.bank, "Unicard Solution / Reap");
  const hit = hitFromKnown(known, "49387512");
  assert.match(formatBinHit(hit), /香港/);
  assert.equal(hit.currency, "HKD");
  assert.equal(networkFromScheme(hit.scheme), "visa");
  assert.equal(matchCatalog("493875", CARDS)?.slug, "bybit");
});

test("Rain 454924 is a shared Puerto Rico segment", () => {
  const known = matchKnownBin("454924");
  assert.equal(known?.country, "pr");
  assert.equal(known?.cardSlug, undefined);
  const slugs = CARDS.filter((c) => c.binCode === "454924").map((c) => c.slug);
  assert.ok(slugs.includes("solayer"));
  assert.ok(slugs.includes("kast"));
  assert.ok(slugs.includes("etherfi"));
  assert.ok(slugs.includes("plasma"));
});

test("RedotPay USD prefix is Hong Kong Reap 493728", () => {
  const known = matchKnownBin("493728");
  assert.equal(known?.cardSlug, "redotpay");
  assert.equal(known?.country, "hk");
  assert.equal(matchCatalog("493728", CARDS)?.slug, "redotpay");
  const hkd = matchKnownBin("414631");
  assert.equal(hkd?.cardSlug, "redotpay");
});

test("Fiat24 official 8-digit BIN beats the 6-digit Shazam collision", () => {
  const known = matchKnownBin("54810849");
  assert.equal(known?.country, "ch");
  assert.equal(known?.scheme, "mastercard");
  assert.match(known?.bank ?? "", /Fiat24/);
  const short = matchKnownBin("548108");
  assert.equal(short?.bin, "54810849");
  const slugs = matchCatalogAll("54810849", CARDS).map((c) => c.slug);
  assert.ok(slugs.includes("bitget"));
  assert.ok(slugs.includes("safepal"));
});

test("Coinbase common segment is Sutton 440393", () => {
  assert.equal(matchKnownBin("440393")?.cardSlug, "coinbase");
  assert.equal(matchCatalog("440393", CARDS)?.slug, "coinbase");
});

test("Tria Nimbus segment is 454926, not the Rain 454924 block", () => {
  assert.equal(matchKnownBin("454926")?.cardSlug, "tria");
  assert.equal(matchCatalog("454926", CARDS)?.slug, "tria");
  assert.ok(!CARDS.filter((c) => c.binCode === "454924").some((c) => c.slug === "tria"));
});

test("cards without a published BIN number surface 号未填写", () => {
  const nexo = CARDS.find((c) => c.slug === "nexo");
  assert.ok(nexo);
  assert.match(formatBin(nexo), /号未填写/);
  const bybit = CARDS.find((c) => c.slug === "bybit");
  assert.ok(bybit);
  assert.match(formatBin(bybit), /493875/);
  assert.doesNotMatch(formatBin(bybit), /号未填写/);
});

test("459939 is Malaysia CIMB Platinum, not the stale Hong Kong TripLink label", () => {
  const known = matchKnownBin("459939");
  assert.ok(known);
  assert.equal(known.country, "my");
  assert.match(known.bank, /CIMB/i);
  assert.equal(known.level, "platinum");
  assert.equal(known.cardSlug, "mexc");
  const hit = hitFromKnown(known, "459939");
  assert.equal(hit.country, "my");
  assert.equal(hit.currency, "MYR");
  assert.equal(hit.source, "known");
  assert.equal(hit.prepaid, false);
  assert.equal(needsLiveEnrichment(hit), false);
  assert.match(formatBinHit(hit), /马来西亚/);
  assert.equal(matchCatalog("459939", CARDS)?.slug, "mexc");
  const liveHk = parseBinlistPayload("459939", {
    scheme: "visa",
    type: "credit",
    brand: "Visa Commercial Choice Travel",
    country: { alpha2: "HK", name: "Hong Kong", currency: "HKD" },
    bank: { name: "Triplink International Co., Limited" },
  });
  assert.ok(liveHk);
  const merged = mergeBinHits(hit, liveHk);
  assert.equal(merged.country, "my");
  assert.match(merged.bank ?? "", /CIMB/i);
});

test("known PokePay prefix is US Mastercard", () => {
  const known = matchKnownBin("559666");
  assert.equal(known?.scheme, "mastercard");
  assert.equal(known?.country, "us");
  assert.equal(matchCatalog("559666", CARDS)?.slug, "pokepay");
});

test("BIN report matches the card-tool-bot field list plus level", () => {
  const known = matchKnownBin("493875");
  assert.ok(known);
  const report = formatBinReport(hitFromKnown(known, "493875"), CARDS);
  assert.match(report, /卡片BIN: 493875/);
  assert.match(report, /支付体系: Visa/);
  assert.match(report, /卡片等级:/);
  assert.match(report, /卡片币种: HKD/);
  assert.match(report, /发行国家: 香港/);
  assert.match(report, /银行名称: Unicard Solution \/ Reap/);
  assert.match(report, /是否预付卡：/);
  assert.match(report, /卡库对上：Bybit/);
});

test("HandyAPI success payload maps Denmark to EEA Visa and keeps CardTier", () => {
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
  assert.equal(hit.currency, "DKK");
  assert.equal(hit.brand, "DANKORT");
});

test("HandyAPI classic tier becomes 经典", () => {
  const hit = parseHandyPayload("411111", {
    Status: "SUCCESS",
    Scheme: "VISA",
    Type: "DEBIT",
    Issuer: "CONOTOXIA SP. Z O.O",
    CardTier: "CLASSIC",
    Country: { A2: "PL", Name: "Poland" },
  });
  assert.ok(hit && hit !== "rate");
  assert.equal(hit.level, "classic");
  assert.equal(levelLabel(hit.level, hit.brand), "经典");
});

test("HandyAPI prepaid private-label tier is prepaid, not a raw level", () => {
  const hit = parseHandyPayload("400014", {
    Status: "SUCCESS",
    Scheme: "VISA",
    Type: "DEBIT",
    Issuer: "",
    CardTier: "PREPAID PRIVATE LABEL",
    Country: { A2: "US", Name: "United States" },
  });
  assert.ok(hit && hit !== "rate");
  assert.equal(hit.prepaid, true);
  assert.equal(levelLabel(hit.level, hit.brand), "未知");
});

test("HandyAPI rate-limit status is not treated as a miss", () => {
  assert.equal(
    parseHandyPayload("411111", {
      Status: "RATE LIMIT EXCEEDED: Please contact us or upgrade plan",
    }),
    "rate",
  );
});

test("binlist payload keeps Puerto Rico as a US-adjacent BIN and reads Platinum", () => {
  const hit = parseBinlistPayload("454924", {
    scheme: "visa",
    type: "credit",
    brand: "Visa Platinum",
    prepaid: false,
    country: { alpha2: "PR", name: "Puerto Rico", currency: "USD" },
    bank: { name: "Bivo, Inc." },
  });
  assert.ok(hit);
  assert.equal(hit.country, "pr");
  assert.equal(hit.bank, "Bivo, Inc.");
  assert.equal(hit.currency, "USD");
  assert.equal(hit.prepaid, false);
  assert.equal(hit.level, "platinum");
  assert.equal(levelLabel(hit.level), "白金");
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

test("known U-card rows are not overwritten by a live collision", () => {
  const known = hitFromKnown(matchKnownBin("54810849")!, "54810849");
  const live = parseBinlistPayload("548108", {
    scheme: "mastercard",
    type: "debit",
    brand: "Standard",
    country: { alpha2: "US", name: "United States", currency: "USD" },
    bank: { name: "Shazam" },
  });
  assert.ok(live);
  const merged = mergeBinHits(known, live);
  assert.equal(merged.source, "known");
  assert.equal(merged.country, "ch");
  assert.match(merged.bank ?? "", /Fiat24/);
  assert.equal(merged.level, undefined);
});

test("live 8-digit hit fills a 6-digit index miss and keeps the longer BIN", () => {
  const local = prefixHit("41111111", "miss");
  const live = parseHandyPayload("41111111", {
    Status: "SUCCESS",
    Scheme: "VISA",
    Type: "DEBIT",
    Issuer: "CONOTOXIA SP. Z O.O",
    CardTier: "CLASSIC",
    Country: { A2: "PL", Name: "Poland" },
  });
  assert.ok(live && live !== "rate");
  const merged = mergeBinHits(local, live);
  assert.equal(merged.source, "live");
  assert.equal(merged.bin, "41111111");
  assert.equal(merged.country, "eea");
  assert.equal(merged.level, "classic");
  assert.match(merged.bank ?? "", /CONOTOXIA/i);
});

test("complete index hits skip live; 8-digit and missing bank do not", () => {
  const index = parseIndexRecord("411111vPLdc0", ["CONOTOXIA"]);
  assert.ok(index);
  assert.equal(needsLiveEnrichment(index, "411111"), false);
  assert.equal(needsLiveEnrichment(index, "41111111"), true);
  assert.equal(needsLiveEnrichment(prefixHit("999999", "miss"), "999999"), true);
  const known = hitFromKnown(matchKnownBin("493875")!, "493875");
  assert.equal(needsLiveEnrichment(known, "49387512"), false);
});

test("parseLevel reads common card tiers", () => {
  assert.equal(parseLevel("Visa Platinum"), "platinum");
  assert.equal(parseLevel("GOLD"), "gold");
  assert.equal(parseLevel("Visa Commercial Choice Travel"), "commercial");
  assert.equal(parseLevel("DANKORT"), undefined);
});

test("index decoder accepts both gzip bytes and already-unzipped JSON", async () => {
  const gz = readFileSync("public/bin-index.json.gz");
  const fromGzip = await decodeIndexBody(gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength));
  const raw = gunzipSync(gz);
  const fromPlain = await decodeIndexBody(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  assert.equal(JSON.parse(fromGzip).n, JSON.parse(fromPlain).n);
  assert.ok(JSON.parse(fromGzip).n > 400_000);
  assert.equal(JSON.parse(fromGzip).v, 2);
});

test("open BIN index resolves common prefixes without a live API", async () => {
  const gz = readFileSync("public/bin-index.json.gz");
  const json = JSON.parse(await decodeIndexBody(gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength))) as BinIndexFile;
  const idx = loadIndexFile(json);
  const poland = matchIndexLines("411111", idx.lines, idx.banks);
  assert.equal(poland?.scheme, "visa");
  assert.equal(poland?.country, "eea");
  assert.match(poland?.bank ?? "", /CONOTOXIA/i);
  assert.equal(poland?.source, "index");
  assert.equal(poland?.currency, "PLN");
  assert.equal(poland?.level, "classic");
  const stripe = matchIndexLines("424242", idx.lines, idx.banks);
  assert.equal(stripe?.country, "uk");
  const bybit = matchIndexLines("493875", idx.lines, idx.banks);
  assert.equal(bybit?.country, "hk");
  assert.equal(bybit?.currency, "HKD");
});

test("index record parser maps scheme letter, level and bank table", () => {
  const v1 = parseIndexRecord("457173vDKd2", ["x", "y", "DEN JYSKE SPAREKASSE"]);
  assert.ok(v1);
  assert.equal(v1.scheme, "visa");
  assert.equal(v1.country, "eea");
  assert.equal(v1.type, "debit");
  assert.equal(v1.bank, "DEN JYSKE SPAREKASSE");
  assert.equal(v1.currency, "DKK");
  assert.equal(v1.level, undefined);
  const v2 = parseIndexRecord("457173vDKdc2", ["x", "y", "DEN JYSKE SPAREKASSE"]);
  assert.ok(v2);
  assert.equal(v2.level, "classic");
  assert.equal(v2.bank, "DEN JYSKE SPAREKASSE");
  assert.equal(sourceLabel("index"), "开源库");
});
