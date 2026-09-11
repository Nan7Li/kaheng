import { useCallback, useEffect, useState } from "react";
import { fetchUsdRatesServer } from "./fx.functions.ts";
import { clearFxCache, getUsdRates, type FxTable } from "./fx.ts";

export function useUsdRates() {
  const [table, setTable] = useState<FxTable | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (force = false) => {
    setBusy(true);
    setError(null);
    if (force) clearFxCache();
    try {
      try {
        const next = await getUsdRates();
        setTable(next);
        return;
      } catch {
        const next = await fetchUsdRatesServer();
        setTable(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "汇率接口暂时不可用");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { table, busy, error, reload };
}
