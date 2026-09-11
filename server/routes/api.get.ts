import { CARDS, DATA_AS_OF } from "../../src/data/cards.ts";
import { apiMeta } from "../../src/lib/public-api.ts";
import { corsPreflight, json } from "../lib/api-http.ts";

export default defineEventHandler((event) => {
  if (getMethod(event) === "OPTIONS") return corsPreflight();
  return json({
    ok: true,
    ...apiMeta(),
    cardCount: CARDS.length,
    dataAsOf: DATA_AS_OF,
    slugs: CARDS.map((c) => c.slug),
  });
});
