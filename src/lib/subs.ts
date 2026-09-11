import { convertAmount, formatMoney, type FxTable } from "./fx.ts";

export const SUBS_AS_OF = "2026-09-10";

export interface RegionPrice {
  country: string;
  name: string;
  currency: string;
  amount: number;
}

export interface SubProduct {
  id: string;
  name: string;
  plan: string;
  asOf: string;
  note?: string;
  prices: RegionPrice[];
}

export interface QuotedPrice extends RegionPrice {
  quoted: number;
  quoteCurrency: string;
  vsUsPct: number | null;
}

export const SUB_PRODUCTS: SubProduct[] = [
  {
    id: "chatgpt-plus",
    name: "ChatGPT Plus",
    plan: "月付",
    asOf: SUBS_AS_OF,
    note: "App Store 标价，部分地区含税。发卡地 BIN 过不了美区订阅时，用这一表对照当地价。",
    prices: [
      { country: "PH", name: "菲律宾", currency: "PHP", amount: 999 },
      { country: "PK", name: "巴基斯坦", currency: "PKR", amount: 4900 },
      { country: "CA", name: "加拿大", currency: "CAD", amount: 24.99 },
      { country: "VN", name: "越南", currency: "VND", amount: 499_000 },
      { country: "EG", name: "埃及", currency: "EGP", amount: 999.99 },
      { country: "JP", name: "日本", currency: "JPY", amount: 3000 },
      { country: "BR", name: "巴西", currency: "BRL", amount: 99.9 },
      { country: "US", name: "美国", currency: "USD", amount: 19.99 },
      { country: "AR", name: "阿根廷", currency: "USD", amount: 19.99 },
      { country: "TR", name: "土耳其", currency: "TRY", amount: 999.99 },
      { country: "IN", name: "印度", currency: "INR", amount: 1999 },
      { country: "TH", name: "泰国", currency: "THB", amount: 699 },
      { country: "AU", name: "澳大利亚", currency: "AUD", amount: 29.99 },
      { country: "KR", name: "韩国", currency: "KRW", amount: 29_000 },
      { country: "AE", name: "阿联酋", currency: "AED", amount: 79.99 },
      { country: "TW", name: "台湾", currency: "TWD", amount: 690 },
      { country: "NG", name: "尼日利亚", currency: "NGN", amount: 31_500 },
      { country: "SG", name: "新加坡", currency: "SGD", amount: 29.98 },
      { country: "MY", name: "马来西亚", currency: "MYR", amount: 99.9 },
      { country: "ID", name: "印尼", currency: "IDR", amount: 349_000 },
      { country: "GB", name: "英国", currency: "GBP", amount: 19.99 },
      { country: "DE", name: "德国", currency: "EUR", amount: 22.99 },
    ],
  },
  {
    id: "chatgpt-go",
    name: "ChatGPT Go",
    plan: "月付",
    asOf: SUBS_AS_OF,
    note: "入门档。比 Plus 便宜，额度也少。",
    prices: [
      { country: "IN", name: "印度", currency: "INR", amount: 399 },
      { country: "PH", name: "菲律宾", currency: "PHP", amount: 300 },
      { country: "EG", name: "埃及", currency: "EGP", amount: 249.99 },
      { country: "PK", name: "巴基斯坦", currency: "PKR", amount: 1400 },
      { country: "VN", name: "越南", currency: "VND", amount: 132_000 },
      { country: "TR", name: "土耳其", currency: "TRY", amount: 249.99 },
      { country: "US", name: "美国", currency: "USD", amount: 8 },
      { country: "JP", name: "日本", currency: "JPY", amount: 1400 },
      { country: "TH", name: "泰国", currency: "THB", amount: 259 },
      { country: "KR", name: "韩国", currency: "KRW", amount: 13_000 },
      { country: "CA", name: "加拿大", currency: "CAD", amount: 12.99 },
      { country: "AU", name: "澳大利亚", currency: "AUD", amount: 13 },
      { country: "AE", name: "阿联酋", currency: "AED", amount: 29.99 },
      { country: "TW", name: "台湾", currency: "TWD", amount: 270 },
    ],
  },
  {
    id: "spotify",
    name: "Spotify",
    plan: "Premium 个人月付",
    asOf: SUBS_AS_OF,
    note: "官方 Premium 页标价。台湾现价 NT$168。",
    prices: [
      { country: "NG", name: "尼日利亚", currency: "NGN", amount: 1600 },
      { country: "PK", name: "巴基斯坦", currency: "PKR", amount: 379 },
      { country: "EG", name: "埃及", currency: "EGP", amount: 79 },
      { country: "TR", name: "土耳其", currency: "TRY", amount: 99 },
      { country: "IN", name: "印度", currency: "INR", amount: 139 },
      { country: "AR", name: "阿根廷", currency: "ARS", amount: 3299 },
      { country: "VN", name: "越南", currency: "VND", amount: 65_000 },
      { country: "PH", name: "菲律宾", currency: "PHP", amount: 169 },
      { country: "BR", name: "巴西", currency: "BRL", amount: 23.9 },
      { country: "MX", name: "墨西哥", currency: "MXN", amount: 139 },
      { country: "JP", name: "日本", currency: "JPY", amount: 1080 },
      { country: "TH", name: "泰国", currency: "THB", amount: 149 },
      { country: "MY", name: "马来西亚", currency: "MYR", amount: 16.9 },
      { country: "TW", name: "台湾", currency: "TWD", amount: 168 },
      { country: "SG", name: "新加坡", currency: "SGD", amount: 12.98 },
      { country: "CA", name: "加拿大", currency: "CAD", amount: 13.99 },
      { country: "AU", name: "澳大利亚", currency: "AUD", amount: 15.99 },
      { country: "US", name: "美国", currency: "USD", amount: 12.99 },
      { country: "DE", name: "德国", currency: "EUR", amount: 12.99 },
      { country: "GB", name: "英国", currency: "GBP", amount: 12.99 },
    ],
  },
  {
    id: "netflix",
    name: "Netflix",
    plan: "Premium 4K 月付",
    asOf: SUBS_AS_OF,
    note: "高级档（4K）。台湾 2026 年仍是 NT$460；美国 3 月已调到 $26.99。",
    prices: [
      { country: "PK", name: "巴基斯坦", currency: "PKR", amount: 1500 },
      { country: "IN", name: "印度", currency: "INR", amount: 649 },
      { country: "PH", name: "菲律宾", currency: "PHP", amount: 549 },
      { country: "MY", name: "马来西亚", currency: "MYR", amount: 55 },
      { country: "KR", name: "韩国", currency: "KRW", amount: 17_000 },
      { country: "JP", name: "日本", currency: "JPY", amount: 2290 },
      { country: "TW", name: "台湾", currency: "TWD", amount: 460 },
      { country: "HK", name: "香港", currency: "HKD", amount: 118 },
      { country: "CA", name: "加拿大", currency: "CAD", amount: 23.99 },
      { country: "SG", name: "新加坡", currency: "SGD", amount: 25.98 },
      { country: "AU", name: "澳大利亚", currency: "AUD", amount: 28.99 },
      { country: "DE", name: "德国", currency: "EUR", amount: 17.99 },
      { country: "GB", name: "英国", currency: "GBP", amount: 18.99 },
      { country: "US", name: "美国", currency: "USD", amount: 26.99 },
    ],
  },
];

export function productById(id: string): SubProduct | undefined {
  return SUB_PRODUCTS.find((p) => p.id === id);
}

export function quotePrices(
  product: SubProduct,
  quoteCurrency: string,
  table: FxTable | null,
): QuotedPrice[] {
  const quote = quoteCurrency.toUpperCase();
  const us = product.prices.find((p) => p.country === "US");
  const usQuoted =
    table && us
      ? convertAmount(us.amount, us.currency, quote, table.rates)
      : null;
  const rows: QuotedPrice[] = product.prices.map((row) => {
    const quoted =
      table && table.rates[row.currency] && table.rates[quote]
        ? convertAmount(row.amount, row.currency, quote, table.rates)
        : row.currency === quote
          ? row.amount
          : NaN;
    const vsUsPct =
      usQuoted && Number.isFinite(quoted) && usQuoted > 0
        ? ((quoted - usQuoted) / usQuoted) * 100
        : null;
    return { ...row, quoted, quoteCurrency: quote, vsUsPct };
  });
  rows.sort((a, b) => {
    const av = Number.isFinite(a.quoted) ? a.quoted : Number.POSITIVE_INFINITY;
    const bv = Number.isFinite(b.quoted) ? b.quoted : Number.POSITIVE_INFINITY;
    return av - bv;
  });
  return rows;
}

export function formatLocalPrice(row: RegionPrice): string {
  return formatMoney(row.amount, row.currency);
}
