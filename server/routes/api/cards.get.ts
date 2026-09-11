import { CARDS, DATA_AS_OF } from "../../../src/data/cards.ts";
import { cardToSummary } from "../../../src/lib/public-api.ts";
import { corsPreflight, json } from "../../lib/api-http.ts";

export default defineEventHandler((event) => {
  if (getMethod(event) === "OPTIONS") return corsPreflight();
  const q = getQuery(event) as Record<string, string | undefined>;
  const status = q.status;
  const list = status ? CARDS.filter((c) => c.status === status) : CARDS;
  return json({
    ok: true,
    dataAsOf: DATA_AS_OF,
    count: list.length,
    cards: list.map(cardToSummary),
  });
});
