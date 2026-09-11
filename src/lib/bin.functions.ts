import { createServerFn } from "@tanstack/react-start";
import { digitsOnly, lookupLive, type BinHit } from "./bin.ts";

const liveCache = new Map<string, { at: number; hit: BinHit }>();
const LIVE_TTL_MS = 6 * 60 * 60 * 1000;

function cacheKey(bin: string): string {
  return bin.length >= 8 ? bin.slice(0, 8) : bin.slice(0, 6);
}

/** Same waterfall as 卡粉工具箱: HandyAPI then binlist.net. Cached on the server. */
export const lookupBin = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const raw =
      typeof data === "string"
        ? data
        : data && typeof data === "object" && "bin" in data
          ? String((data as { bin: unknown }).bin)
          : "";
    const bin = digitsOnly(raw);
    if (bin.length < 6) throw new Error("至少输入卡号前 6 位");
    return { bin };
  })
  .handler(async ({ data }): Promise<BinHit | null> => {
    const key = cacheKey(data.bin);
    const cached = liveCache.get(key);
    if (cached && Date.now() - cached.at < LIVE_TTL_MS) return cached.hit;
    const live = await lookupLive(data.bin);
    if (!("hit" in live)) return null;
    liveCache.set(key, { at: Date.now(), hit: live.hit });
    if (liveCache.size > 400) {
      const first = liveCache.keys().next().value;
      if (first) liveCache.delete(first);
    }
    return live.hit;
  });
