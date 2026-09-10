import { createServerFn } from "@tanstack/react-start";
import {
  digitsOnly,
  fetchBinlist,
  hitFromKnown,
  matchKnownBin,
  schemeFromPrefix,
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
    const live = await fetchBinlist(data.bin);
    if (live) return live;
    const scheme = schemeFromPrefix(data.bin);
    if (scheme === "unknown") throw new Error("查不到这个 BIN");
    return {
      bin: data.bin,
      scheme,
      country: "unknown",
      countryName: "未收录",
      source: "binlist",
      note: "公共库没有发卡行，只根据卡号前缀判断了卡组织。",
    };
  });
