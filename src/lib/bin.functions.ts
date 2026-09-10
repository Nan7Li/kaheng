import { createServerFn } from "@tanstack/react-start";
import {
  digitsOnly,
  hitFromKnown,
  lookupLive,
  matchKnownBin,
  resolveLive,
  type BinHit,
} from "./bin.ts";

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
  .handler(async ({ data }): Promise<BinHit> => {
    const known = matchKnownBin(data.bin);
    if (known) return hitFromKnown(known, data.bin);
    return resolveLive(data.bin, await lookupLive(data.bin));
  });
