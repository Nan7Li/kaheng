import { CARDS } from "../src/data/cards.ts";

const errors: string[] = [];
const warnings: string[] = [];
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
  "cashbackAmountCapUsd",
  "cashbackAmountCapHighUsd",
  "cashbackSpendCapUsd",
  "pegRate",
] as const;

const levelNumericFields = [
  "openingFeeUsd",
  "annualFeeUsd",
  "monthlyFeeUsd",
  "topupFeePct",
  "spendFeePct",
  "fxFeePct",
  "cashbackPct",
  "cashbackAmountCapUsd",
  "cashbackSpendCapUsd",
] as const;

function validCatalogDate(value: string | undefined, allowMonth: boolean): boolean {
  if (!value) return false;
  const match = value.match(allowMonth ? /^(\d{4})-(\d{2})(?:-(\d{2}))?$/ : /^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3] ?? 1);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

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
  if (!validCatalogDate(card.updatedAt, true))
    errors.push(card.slug + ".updatedAt: expected YYYY-MM or YYYY-MM-DD");
  if (card.promoUntil && !validCatalogDate(card.promoUntil, false))
    errors.push(card.slug + ".promoUntil: expected YYYY-MM-DD");
  if (card.promoSpendFeePct !== undefined && !card.promoUntil)
    errors.push(card.slug + ": promoSpendFeePct needs promoUntil");
  if (card.shutdownDate && !validCatalogDate(card.shutdownDate, false))
    errors.push(card.slug + ".shutdownDate: expected YYYY-MM-DD");
  if (card.cashbackPctHigh < card.cashbackPct)
    errors.push(card.slug + ": cashbackPctHigh cannot be below cashbackPct");
  if (card.verifiedAt && !validCatalogDate(card.verifiedAt, false))
    errors.push(card.slug + ".verifiedAt: expected YYYY-MM-DD");

  const levelIds = new Set<string>();
  for (const level of card.levels ?? []) {
    if (!level.id.trim()) errors.push(card.slug + ": level id cannot be empty");
    if (levelIds.has(level.id)) errors.push(card.slug + ": duplicate level id " + level.id);
    levelIds.add(level.id);
    for (const field of levelNumericFields) {
      const value = level[field];
      if (value === undefined || value === null) continue;
      if (!Number.isFinite(value) || value < 0)
        errors.push(card.slug + ".levels." + level.id + "." + field + ": invalid " + value);
      if (field.endsWith("Pct") && value > 100)
        errors.push(card.slug + ".levels." + level.id + "." + field + ": percentage exceeds 100");
    }
  }

  const verification = card.verification ?? "unverified";
  if (verification === "secondary" && !card.sourceUrls?.length)
    warnings.push(card.slug + ": secondary entry has no sourceUrls");
  if (verification !== "unverified" && !card.verifiedAt)
    warnings.push(card.slug + ": non-unverified entry has no verifiedAt");

  if (card.verification === "official" || card.verification === "partial") {
    if (!card.sourceUrls?.length) errors.push(`${card.slug}: verified entry needs sourceUrls`);
    if (!card.verifiedAt || !/^\d{4}-\d{2}-\d{2}$/.test(card.verifiedAt))
      errors.push(`${card.slug}: verified entry needs ISO verifiedAt`);
  }
  for (const url of card.sourceUrls ?? []) {
    if (!url.startsWith("https://")) errors.push(`${card.slug}: source must use https: ${url}`);
  }
}

if (warnings.length) console.warn(warnings.join("\n"));

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const official = CARDS.filter((card) => card.verification === "official").length;
const partial = CARDS.filter((card) => card.verification === "partial").length;
console.log(`Validated ${CARDS.length} cards (${official} officially verified, ${partial} partially verified).`);

