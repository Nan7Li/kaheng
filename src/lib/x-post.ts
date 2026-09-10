export function parseXStatusId(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (/^\d{8,}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/(?:x\.com|twitter\.com)\/(?:i\/web\/status|[^/\s]+\/status)\/(\d+)/i);
  return m?.[1];
}

export function xStatusUrl(id: string, handle?: string): string {
  const who = handle ? handle.replace(/^@/, "") : "i/web";
  return `https://x.com/${who}/status/${id}`;
}

export interface FetchedXPost {
  id: string;
  url: string;
  handle: string;
  name: string;
  text: string;
  createdAt?: string;
  avatar?: string;
}

interface FxTweet {
  id?: string;
  url?: string;
  text?: string;
  created_at?: string;
  author?: {
    screen_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

export async function fetchXPost(raw: string): Promise<FetchedXPost> {
  const id = parseXStatusId(raw);
  if (!id) throw new Error("请贴 x.com 的帖子链接");
  const res = await fetch(`https://api.fxtwitter.com/status/${id}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("这篇文章读不出来，检查链接或稍后再试");
  const json = (await res.json()) as { code?: number; tweet?: FxTweet };
  const tweet = json.tweet;
  if (!tweet?.id || !tweet.text) throw new Error("公共接口没有这篇帖子");
  const handle = tweet.author?.screen_name ?? "";
  return {
    id: String(tweet.id),
    url: tweet.url || xStatusUrl(String(tweet.id), handle),
    handle,
    name: tweet.author?.name ?? handle,
    text: tweet.text,
    createdAt: tweet.created_at,
    avatar: tweet.author?.avatar_url,
  };
}
