import { CARDS } from "../../../../src/data/cards.ts";
import {
  cardToSummary,
  catalogSuggestions,
  formatCardText,
  notFoundBody,
} from "../../../../src/lib/public-api.ts";
import { getRates } from "../../../../src/lib/rates.ts";
import { corsPreflight, json } from "../../../lib/api-http.ts";

export default defineEventHandler(async (event) => {
  if (getMethod(event) === "OPTIONS") return corsPreflight();
  const slug = decodeURIComponent(getRouterParam(event, "slug") ?? "").trim();
  const card = CARDS.find((c) => c.slug === slug);
  if (!card) {
    return json(notFoundBody(slug, catalogSuggestions().slice(0, 12)), 404);
  }
  const rates = await getRates();
  return json({
    ok: true,
    card: cardToSummary(card),
    rates: { asOf: rates.asOf, source: rates.source },
    text: formatCardText(card, { rates }),
    raw: card,
  });
});
