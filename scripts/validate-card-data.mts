import { CARDS } from "../src/data/cards.ts";

const errors: string[] = [];
const slugs = new Set<string>();
const numericFields = [
  "openingFeeUsd",
  "physicalFeeUsd",
  "annualFeeUsd",
  "monthlyFeeUsd",
  "topupFeePct",
  "refundFeePct",
  "reversalFeeUsd",
  "chargebackFeeUsd",
  "cryptoConversionFeePct",
  "spendFeePct",
  "promoSpendFeePct",
  "fxFeePct",
  "cashbackPct",
  "cashbackPctHigh",
] as const;

for (const card of CARDS) {
  if (slugs.has(card.slug)) errors.push(`${card.slug}: duplicate slug`);
  slugs.add(card.slug);
  if (!card.regions.length) errors.push(`${card.slug}: regions cannot be empty`);
  for (const field of numericFields) {
    const value = card[field];
    if (value === undefined) continue;
    if (!Number.isFinite(value) || value < 0) errors.push(`${card.slug}.${field}: invalid ${value}`);
    if (field.endsWith("Pct") && value > 100)
      errors.push(`${card.slug}.${field}: percentage exceeds 100`);
  }
  if (card.verification === "official" || card.verification === "partial") {
    if (!card.sourceUrls?.length) errors.push(`${card.slug}: verified entry needs sourceUrls`);
    if (!card.verifiedAt || !/^\d{4}-\d{2}-\d{2}$/.test(card.verifiedAt))
      errors.push(`${card.slug}: verified entry needs ISO verifiedAt`);
  }
  for (const url of card.sourceUrls ?? []) {
    if (!url.startsWith("https://")) errors.push(`${card.slug}: source must use https: ${url}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const official = CARDS.filter((card) => card.verification === "official").length;
const partial = CARDS.filter((card) => card.verification === "partial").length;
console.log(`Validated ${CARDS.length} cards (${official} officially verified, ${partial} partially verified).`);

