import { CARDS } from "../../../src/data/cards.ts";
import {
  cardToSummary,
  catalogSuggestions,
  findCards,
  formatCardText,
  notFoundBody,
} from "../../../src/lib/public-api.ts";
import { corsPreflight, json, text } from "../../lib/api-http.ts";

type AskBody = {
  q?: string;
  text?: string;
  spend?: number;
  bill?: "usd" | "local";
  tier?: "entry" | "boost";
  format?: "json" | "text";
};

async function readAsk(event: { req?: { method?: string } }): Promise<AskBody> {
  const method = getMethod(event);
  const query = getQuery(event) as Record<string, string | undefined>;
  let body: AskBody = {};
  if (method === "POST") {
    try {
      body = (await readBody(event)) as AskBody;
    } catch {
      body = {};
    }
  }
  return {
    q: body.q ?? body.text ?? query.q ?? query.text ?? "",
    spend: Number(body.spend ?? query.spend ?? 1000),
    bill: (body.bill ?? query.bill ?? "usd") as AskBody["bill"],
    tier: (body.tier ?? query.tier ?? "entry") as AskBody["tier"],
    format: (body.format ?? query.format ?? "json") as AskBody["format"],
  };
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  if (method === "OPTIONS") return corsPreflight();
  if (method !== "GET" && method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const input = await readAsk(event);
  const q = (input.q ?? "").trim();
  if (!q) {
    return json(
      {
        ok: false,
        error: "missing_query",
        message: "请提供 q。Telegram 机器人可直接把用户原话传到这里。",
        example: "/api/ask?q=plasma怎么样",
      },
      400,
    );
  }

  const hits = findCards(q, CARDS);
  if (hits.length === 0) {
    if (input.format === "text") {
      return text(`卡库里没有找到「${q}」。可先查 ${catalogSuggestions().map((c) => c.slug).join("、")} 。`, 404);
    }
    return json(notFoundBody(q, catalogSuggestions()), 404);
  }

  const card = hits[0]!;
  const rendered = formatCardText(card, {
    spend: Number.isFinite(input.spend) ? input.spend : 1000,
    bill: input.bill === "local" ? "local" : "usd",
    tier: input.tier === "boost" ? "boost" : "entry",
  });

  if (input.format === "text") return text(rendered);

  return json({
    ok: true,
    query: q,
    text: rendered,
    card: cardToSummary(card),
    alternatives: hits.slice(1).map((c) => ({ slug: c.slug, name: c.name })),
  });
});
