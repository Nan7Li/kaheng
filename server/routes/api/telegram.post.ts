import { CARDS } from "../../../src/data/cards.ts";
import { catalogSuggestions, findCards, formatCardText } from "../../../src/lib/public-api.ts";
import { corsPreflight, json } from "../../lib/api-http.ts";

type TelegramMessage = {
  chat?: { id?: number };
  text?: string;
};

type TelegramUpdate = {
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
};

function extractText(update: TelegramUpdate): { chatId?: number; text: string } {
  const msg = update.message ?? update.edited_message ?? {};
  return { chatId: msg.chat?.id, text: String(msg.text ?? "").trim() };
}

async function sendTelegram(chatId: number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) === "OPTIONS") return corsPreflight();

  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected) {
    const got = getHeader(event, "x-telegram-bot-api-secret-token");
    if (got !== expected) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }
  }

  let update: TelegramUpdate = {};
  try {
    update = (await readBody(event)) as TelegramUpdate;
  } catch {
    update = {};
  }

  const { chatId, text } = extractText(update);
  if (!text) return json({ ok: true, ignored: true });

  const cleaned = text.replace(/^\/(?:start|help|card|ask)\s*/i, "").trim();
  if (!cleaned || /^\/(?:start|help)$/i.test(text)) {
    const help = `问我某张 U 卡即可，例如「plasma怎么样」。\n已收录：${catalogSuggestions().map((c) => c.slug).join("、")}`;
    if (chatId) await sendTelegram(chatId, help);
    return json({ ok: true, text: help });
  }

  const hits = findCards(cleaned, CARDS);
  const reply =
    hits.length === 0
      ? `卡库里没有找到「${cleaned}」。可以换 slug 再问，例如 plasma、etherfi、mexc。`
      : formatCardText(hits[0]!);

  if (chatId) await sendTelegram(chatId, reply);
  return json({
    ok: true,
    query: cleaned,
    slug: hits[0]?.slug,
    text: reply,
  });
});
