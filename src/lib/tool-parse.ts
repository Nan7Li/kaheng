import { isAppStoreUrl, parseAppStoreInput } from "./appstore.ts";
import { digitsOnly } from "./bin.ts";
import { FX_QUOTE_DEFAULT, parseLooseAmount, parseRateCommand } from "./fx.ts";

export type ToolPane = "bin" | "fx" | "subs" | "store";

export interface ToolIntent {
  pane: ToolPane;
  source?: string;
  target?: string;
  amount?: number;
  listOnly?: boolean;
  bin?: string;
  product?: string;
  quote?: string;
  localOnly?: boolean;
  url?: string;
  term?: string;
  appId?: string;
  error?: string;
}

export function parseToolCommand(input: string, defaultQuote = FX_QUOTE_DEFAULT): ToolIntent | null {
  const raw = input.trim();
  if (!raw) return null;

  if (isAppStoreUrl(raw)) {
    const parsed = parseAppStoreInput(raw);
    return {
      pane: "store",
      url: raw,
      appId: parsed?.id,
      term: parsed?.term,
    };
  }

  const parts = raw.split(/\s+/);
  const cmd = parts[0]?.toLowerCase() ?? "";

  if (
    cmd === "/rate" ||
    cmd === "/ratec" ||
    cmd === "/rateu" ||
    cmd === "/rateg" ||
    cmd === "/ratet"
  ) {
    const parsed = parseRateCommand(raw, defaultQuote);
    return {
      pane: "fx",
      source: parsed.source,
      target: parsed.target,
      amount: parsed.amount,
      listOnly: parsed.listOnly,
      error: parsed.error,
    };
  }

  if (cmd === "/bin") {
    const rest = parts.slice(1).join(" ");
    const bin = digitsOnly(rest || raw);
    if (bin.length >= 6) return { pane: "bin", bin };
    return { pane: "bin", error: "至少输入卡号前 6 位" };
  }

  if (
    cmd === "/spotify" ||
    cmd === "/spotifyo" ||
    cmd === "/netflix" ||
    cmd === "/netflixo" ||
    cmd === "/chatgpt" ||
    cmd === "/chatgptgo"
  ) {
    const product =
      cmd.startsWith("/netflix")
        ? "netflix"
        : cmd.startsWith("/spotify")
          ? "spotify"
          : cmd === "/chatgptgo"
            ? "chatgpt-go"
            : "chatgpt-plus";
    const quote = parts[1] ? parts[1].toUpperCase() : defaultQuote;
    return {
      pane: "subs",
      product,
      quote: /^[A-Z]{3}$/.test(quote) ? quote : defaultQuote,
      localOnly: cmd.endsWith("o"),
    };
  }

  if (cmd === "/appstore" || cmd === "/appstoreo" || cmd === "/appstorea") {
    const rest = parts.slice(1).join(" ").trim();
    const parsed = rest ? parseAppStoreInput(rest) : null;
    return {
      pane: "store",
      url: rest || undefined,
      appId: parsed?.id,
      term: parsed?.id ? undefined : parsed?.term ?? (rest || undefined),
    };
  }

  const bin = digitsOnly(raw);
  if (bin.length >= 6 && bin.length <= 8 && /^\d[\d\s-]*$/.test(raw)) {
    return { pane: "bin", bin };
  }

  const rate = parseRateCommand(raw, defaultQuote);
  if (!rate.error && (rate.source || rate.listOnly === false)) {
    return {
      pane: "fx",
      source: rate.source,
      target: rate.target,
      amount: rate.amount,
      listOnly: rate.listOnly,
    };
  }
  const loose = parseLooseAmount(raw, defaultQuote);
  if (loose?.source) {
    return {
      pane: "fx",
      source: loose.source,
      target: loose.target,
      amount: loose.amount,
      listOnly: false,
    };
  }

  const lower = raw.toLowerCase();
  if (/chatgpt\s*go|chatgptgo/.test(lower)) return { pane: "subs", product: "chatgpt-go", quote: defaultQuote };
  if (/chatgpt|gpt\s*plus/.test(lower)) return { pane: "subs", product: "chatgpt-plus", quote: defaultQuote };
  if (/spotify/.test(lower)) return { pane: "subs", product: "spotify", quote: defaultQuote };
  if (/netflix|奈飞|网飞/.test(lower)) return { pane: "subs", product: "netflix", quote: defaultQuote };
  if (/^汇率|换汇|fx$/.test(lower)) return { pane: "fx", target: defaultQuote, amount: 0, listOnly: true };
  if (/^订阅|流媒体$/.test(lower)) return { pane: "subs", product: "chatgpt-plus", quote: defaultQuote };

  const asApp = parseAppStoreInput(raw);
  if (asApp?.id) return { pane: "store", appId: asApp.id };
  if (asApp?.term && raw.length <= 40) return { pane: "store", term: asApp.term };

  return null;
}
