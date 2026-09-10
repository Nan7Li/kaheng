import { createServerFn } from "@tanstack/react-start";
import { digitsOnly, hitFromKnown, matchKnownBin, prefixHit, type BinHit } from "./bin.ts";

/** Kept for callers that still POST; never hits a rate-limited public API. */
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
  .handler(({ data }): BinHit => {
    const known = matchKnownBin(data.bin);
    if (known) return hitFromKnown(known, data.bin);
    return prefixHit(data.bin, "miss");
  });
