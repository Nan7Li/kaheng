import { apiMeta, SITE_URL } from "../../../src/lib/public-api.ts";
import { corsPreflight, json } from "../../lib/api-http.ts";

export default defineEventHandler((event) => {
  if (getMethod(event) === "OPTIONS") return corsPreflight();
  const meta = apiMeta();
  return json({
    openapi: "3.1.0",
    info: {
      title: meta.name,
      version: meta.version,
      description:
        "Public catalog API for Kaheng U-card fee data. Use /api/ask so other models or a Telegram bot can resolve a card name and return the full record.",
    },
    servers: [{ url: SITE_URL }],
    paths: {
      "/api": { get: { summary: "API index and slug list" } },
      "/api/cards": {
        get: {
          summary: "List all cards",
          parameters: [{ name: "status", in: "query", schema: { type: "string" } }],
        },
      },
      "/api/cards/{slug}": {
        get: {
          summary: "Get one card by slug",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        },
      },
      "/api/lookup": {
        get: {
          summary: "Fuzzy search",
          parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }],
        },
      },
      "/api/ask": {
        get: {
          summary: "Natural-language card lookup for bots and other models",
          parameters: [
            { name: "q", in: "query", required: true, schema: { type: "string" } },
            { name: "format", in: "query", schema: { enum: ["json", "text"] } },
          ],
        },
        post: { summary: "Same as GET, accepts JSON { q, spend, merchant, asset, tier, format }" },
      },
      "/api/rates": {
        get: { summary: "Live USDT / USDC / USDG and fiat quotes used by the calculator" },
      },
      "/api/telegram": {
        post: {
          summary: "Telegram Bot webhook. Set TELEGRAM_BOT_TOKEN after creating the bot.",
        },
      },
    },
  });
});
