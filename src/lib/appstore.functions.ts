import { createServerFn } from "@tanstack/react-start";
import {
  APPSTORE_DEFAULT_COUNTRIES,
  type ItunesApp,
  type ItunesLookupResult,
} from "./appstore.ts";

interface ItunesRaw {
  resultCount?: number;
  results?: Array<{
    trackId?: number;
    trackName?: string;
    artistName?: string;
    artworkUrl100?: string;
    formattedPrice?: string;
    price?: number;
    currency?: string;
    trackViewUrl?: string;
    wrapperType?: string;
    kind?: string;
  }>;
}

async function itunesGet(url: string): Promise<ItunesRaw> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Kaheng/1.0 (+https://kaheng.cc)",
      },
    });
    if (!res.ok) throw new Error(`App Store ${res.status}`);
    return (await res.json()) as ItunesRaw;
  } finally {
    clearTimeout(timer);
  }
}

function asApp(row: NonNullable<ItunesRaw["results"]>[number], country: string): ItunesApp | null {
  if (!row.trackId || !row.trackName) return null;
  return {
    trackId: row.trackId,
    trackName: row.trackName,
    artistName: row.artistName ?? "",
    artworkUrl100: row.artworkUrl100,
    formattedPrice: row.formattedPrice,
    price: typeof row.price === "number" ? row.price : 0,
    currency: row.currency ?? "USD",
    trackViewUrl: row.trackViewUrl,
    country: country.toUpperCase(),
  };
}

export const lookupAppStore = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const rec = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const id = typeof rec.id === "string" ? rec.id.replace(/\D/g, "") : "";
    const term = typeof rec.term === "string" ? rec.term.trim().slice(0, 80) : "";
    const countriesRaw = Array.isArray(rec.countries)
      ? rec.countries.map((c) => String(c).toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c))
      : [];
    const countries = (countriesRaw.length ? countriesRaw : [...APPSTORE_DEFAULT_COUNTRIES]).slice(0, 12);
    if (!id && !term) throw new Error("贴 App Store 链接，或输入应用名");
    return { id, term, countries };
  })
  .handler(async ({ data }): Promise<ItunesLookupResult> => {
    if (!data.id && data.term) {
      const json = await itunesGet(
        `https://itunes.apple.com/search?term=${encodeURIComponent(data.term)}&country=tw&entity=software&limit=6`,
      );
      const searches = (json.results ?? [])
        .filter((r) => r.trackId && r.trackName)
        .map((r) => ({
          trackId: r.trackId as number,
          trackName: r.trackName as string,
          artistName: r.artistName ?? "",
          artworkUrl100: r.artworkUrl100,
        }));
      if (searches.length === 0) throw new Error("商店里没搜到这个应用");
      const first = searches[0];
      const apps = await lookupCountries(String(first.trackId), data.countries);
      return { appId: String(first.trackId), term: data.term, apps, searches };
    }
    const apps = await lookupCountries(data.id, data.countries);
    if (apps.length === 0) throw new Error("这些地区都查不到这个应用");
    return { appId: data.id, apps };
  });

async function lookupCountries(id: string, countries: string[]): Promise<ItunesApp[]> {
  const settled = await Promise.all(
    countries.map(async (country) => {
      try {
        const json = await itunesGet(
          `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&country=${country.toLowerCase()}`,
        );
        const row = json.results?.[0];
        if (!row) return null;
        return asApp(row, country);
      } catch {
        return null;
      }
    }),
  );
  return settled.filter((row): row is ItunesApp => row !== null);
}
