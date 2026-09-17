import { appendFile } from "node:fs/promises";
import { CARDS } from "../src/data/cards.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const staleAfterDays = Number.parseInt(process.env.SOURCE_STALE_DAYS ?? "90", 10);
const timeoutMs = Number.parseInt(process.env.SOURCE_AUDIT_TIMEOUT_MS ?? "12000", 10);
const concurrency = Math.max(1, Number.parseInt(process.env.SOURCE_AUDIT_CONCURRENCY ?? "4", 10));
const strict = process.env.STRICT_SOURCE_AUDIT === "1";
const now = new Date();

function verificationAgeDays(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - date.getTime()) / DAY_MS);
}

function classifyStatus(status) {
  if (status >= 200 && status < 400) return "reachable";
  if (status === 401 || status === 403) return "protected";
  if (status === 429) return "rate-limited";
  if (status === 404 || status === 410) return "broken";
  if (status >= 500) return "server-error";
  return "unexpected";
}

async function request(url, method) {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    headers: {
      accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "user-agent": "kaheng-source-audit/1.0 (+https://github.com/Nan7Li/kaheng)",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  await response.body?.cancel();
  return response;
}

async function probe(url) {
  const startedAt = Date.now();
  try {
    let response = await request(url, "HEAD");
    if ([400, 401, 403, 405, 406].includes(response.status)) {
      response = await request(url, "GET");
    }
    return {
      url,
      status: response.status,
      kind: classifyStatus(response.status),
      finalUrl: response.url,
      elapsedMs: Date.now() - startedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const kind = /timeout|aborted/i.test(message) ? "timeout" : "network-error";
    return { url, status: null, kind, finalUrl: url, elapsedMs: Date.now() - startedAt, error: message };
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

const verifiedCards = CARDS.filter((card) => card.verification === "official" || card.verification === "partial");
const staleCards = verifiedCards
  .map((card) => ({
    slug: card.slug,
    name: card.name,
    verification: card.verification,
    verifiedAt: card.verifiedAt ?? "missing",
    ageDays: verificationAgeDays(card.verifiedAt),
  }))
  .filter((card) => card.ageDays > staleAfterDays)
  .sort((a, b) => b.ageDays - a.ageDays);

const sourceOwners = new Map();
for (const card of verifiedCards) {
  for (const url of card.sourceUrls ?? []) {
    const owners = sourceOwners.get(url) ?? [];
    owners.push(card.slug);
    sourceOwners.set(url, owners);
  }
}

const urls = [...sourceOwners.keys()].sort();
const probeResults = await mapLimit(urls, concurrency, probe);
const broken = probeResults.filter((result) => result.kind === "broken");
const guarded = probeResults.filter((result) => ["protected", "rate-limited"].includes(result.kind));
const transient = probeResults.filter((result) => ["timeout", "network-error", "server-error"].includes(result.kind));

const summaryLines = [
  `Audited ${verifiedCards.length} verified/partially verified cards.`,
  `Checked ${urls.length} unique source URLs.`,
  `${staleCards.length} card(s) are older than ${staleAfterDays} days since verification.`,
  `${broken.length} source URL(s) returned 404/410.`,
  `${guarded.length} source URL(s) require authentication, block bots, or are rate-limited.`,
  `${transient.length} source URL(s) had a transient network/server result.`,
];

console.log(summaryLines.join("\n"));

for (const card of staleCards) {
  console.warn(`STALE ${card.slug}: verified ${card.verifiedAt} (${card.ageDays} days ago)`);
}
for (const result of broken) {
  console.error(`BROKEN ${result.status} ${result.url} (${(sourceOwners.get(result.url) ?? []).join(", ")})`);
}
for (const result of [...guarded, ...transient]) {
  console.warn(`${result.kind.toUpperCase()} ${result.status ?? "-"} ${result.url}`);
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

const markdown = [
  "# Card source audit",
  "",
  ...summaryLines.map((line) => `- ${line}`),
  "",
  "## Re-verification queue",
  "",
  staleCards.length
    ? [
        "| Card | Verification | Last verified | Age |",
        "|---|---|---:|---:|",
        ...staleCards.map(
          (card) =>
            `| ${escapeCell(card.slug)} | ${escapeCell(card.verification)} | ${escapeCell(card.verifiedAt)} | ${card.ageDays} days |`,
        ),
      ].join("\n")
    : `No verified cards are older than ${staleAfterDays} days.`,
  "",
  "## Source checks",
  "",
  "| Result | HTTP | Cards | Source |",
  "|---|---:|---|---|",
  ...probeResults.map((result) => {
    const owners = (sourceOwners.get(result.url) ?? []).join(", ");
    return `| ${escapeCell(result.kind)} | ${result.status ?? "-"} | ${escapeCell(owners)} | ${escapeCell(result.url)} |`;
  }),
  "",
  "> Protected/rate-limited results are informational because many issuer sites block automated requests. A 404/410 is treated as a broken evidence link.",
  "",
].join("\n");

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown, "utf8");
}

if (strict && broken.length > 0) {
  process.exit(1);
}
