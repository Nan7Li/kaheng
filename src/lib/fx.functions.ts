import { createServerFn } from "@tanstack/react-start";
import { loadUsdRates, type FxTable } from "./fx.ts";

/** Browser CDN blocked → same public USD table from the server. */
export const fetchUsdRatesServer = createServerFn({ method: "POST" }).handler(
  async (): Promise<FxTable> => loadUsdRates(),
);
