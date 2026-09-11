import { CARDS } from "../../../src/data/cards.ts";
import {
  cardToSummary,
  catalogSuggestions,
  findCards,
  formatCardText,
  notFoundBody,
} from "../../../src/lib/public-api.ts";
import { corsPreflight, json } from "../../lib/api-http.ts";

export default defineEventHandler((event) => {
  if (getMethod(event) === "OPTIONS") return corsPreflight();
  const q = String((getQuery(event) as { q?: string }).q ?? "").trim();
  if (!q) {
    return json(
      {
        ok: false,
        error: "missing_query",
        message: "请提供 q，例如 /api/lookup?q=plasma",
        cards: catalogSuggestions(),
      },
      400,
    );
  }
  const hits = findCards(q, CARDS);
  if (hits.length === 0) {
    return json(notFoundBody(q, catalogSuggestions()), 404);
  }
  return json({
    ok: true,
    query: q,
    count: hits.length,
    cards: hits.map((card) => ({
      ...cardToSummary(card),
      text: formatCardText(card),
    })),
  });
});
