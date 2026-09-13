export type Network = "visa" | "mastercard";
export type Custody = "custodial" | "self-custody" | "hybrid";
export type Kyc = "none" | "basic" | "id" | "passport" | "full";
export type FormFactor = "virtual" | "physical" | "both";
export type Status = "active" | "restricted" | "shutdown";
export type Category = "exchange" | "wallet" | "defi" | "vcc";
export type Scene = "ai" | "daily" | "apple" | "ads" | "offramp";
export type Tint = "sage" | "slate" | "stone" | "olive" | "ink" | "paper";
export type Region = "tw" | "hk" | "cn" | "eea" | "us" | "sg" | "global" | "apac";
export type Verification = "official" | "partial" | "secondary" | "unverified";
export type CashbackKind = "cash" | "stablecoin" | "token" | "points" | "unknown";
export interface CashbackBand {
  /** Cumulative USD spend boundary; null means no upper boundary. */
  upToSpendUsd: number | null;
  pct: number;
  kind?: CashbackKind;
  asset?: string;
}
export type BinCountry =
  | "us"
  | "hk"
  | "uk"
  | "sg"
  | "ch"
  | "eea"
  | "pr"
  | "au"
  | "ge"
  | "kz"
  | "cn"
  | "tw"
  | "jp"
  | "kr"
  | "ca"
  | "de"
  | "fr"
  | "nl"
  | "ie"
  | "lt"
  | "es"
  | "it"
  | "my"
  | "th"
  | "in"
  | "ae"
  | "nz"
  | "mx"
  | "br"
  | "za"
  | "tr"
  | "ph"
  | "id"
  | "mixed"
  | "unknown";


export interface CardLevel {
  id: string;
  name: string;
  note?: string;
  openingFeeUsd?: number;
  annualFeeUsd?: number;
  monthlyFeeUsd?: number;
  topupFeePct?: number;
  spendFeePct?: number;
  fxFeePct?: number;
  cashbackPct?: number;
  cashbackKind?: CashbackKind;
  cashbackAsset?: string;
  cashbackBands?: CashbackBand[];
  cashbackAmountCapUsd?: number | null;
  cashbackSpendCapUsd?: number | null;
}

export interface UCard {
  slug: string;
  name: string;
  nameEn: string;
  issuer: string;
  network: Network;
  form: FormFactor;
  status: Status;
  statusNote: string;
  category: Category;
  custody: Custody;
  kyc: Kyc;
  kycNote: string;
  regions: Region[];
  applePay: boolean;
  googlePay: boolean;
  tint: Tint;
  binCountry?: BinCountry;
  binCode?: string;
  binIssuer?: string;
  faceUrl?: string;
  openingFeeUsd: number;
  physicalFeeUsd: number;
  annualFeeUsd: number;
  monthlyFeeUsd: number;
  topupFeePct: number;
  /** Optional issuer fees that are not part of the monthly spend calculator. */
  refundFeePct?: number;
  reversalFeeUsd?: number;
  chargebackFeeUsd?: number;
  /** Stablecoin/crypto to card settlement currency conversion, separate from loading funds. */
  cryptoConversionFeePct?: number;
  spendFeePct: number;
  promoSpendFeePct?: number;
  promoUntil?: string;
  fxFeePct: number;
  /** Card billing currency. EUR cards must not be treated as USD. */
  settlement?: "USD" | "EUR" | "SGD" | "GBP";
  /** Asset the card actually deducts. OKX is USDG. */
  nativeAsset?: "USDT" | "USDC" | "USDG" | "EURe";
  /** one-to-one: issuer treats 1 USDT = 1 USD (or 1 EURe = 1 EUR). market: live print. */
  pegPolicy?: "market" | "one-to-one";
  /** Optional issuer rate: native-asset units charged for 1 settlement-currency unit. */
  pegRate?: number;
  /** Merchant currencies that do not attract the card FX markup. */
  fxFree?: string[];
  cashbackPct: number;
  cashbackPctHigh: number;
  cashbackAmountCapUsd: number | null;
  cashbackAmountCapHighUsd: number | null;
  cashbackSpendCapUsd: number | null;
  cashbackNote: string;
  /** How the reward is paid. Token/points rewards are excluded from USD net by default. */
  cashbackKind?: CashbackKind;
  cashbackAsset?: string;
  cashbackBands?: CashbackBand[];
  levels?: CardLevel[];
  assets: string[];
  scenes: Scene[];
  risk: 1 | 2 | 3 | 4 | 5;
  riskNote: string;
  summary: string;
  bestFor: string;
  pros: string[];
  cons: string[];
  shutdownDate?: string;
  url?: string;
  inviteCode?: string;
  inviteUrl?: string;
  sourceUrls?: string[];
  verification?: Verification;
  verifiedAt?: string;
  updatedAt: string;
}

export const DATA_AS_OF = "2026-09-12";

export const CARDS: UCard[] = [
  {
    slug: "mexc",
    name: "MEXC Global",
    nameEn: "MEXC Global Card",
    issuer: "MEXC",
    network: "visa",
    form: "virtual",
    status: "active",
    statusNote: "全球版；与亚太版费率、钱包支持不同，已拆开计算。",
    category: "exchange",
    custody: "custodial",
    kyc: "id",
    kycNote: "交易所 KYC，门槛中等。",
    regions: ["global"],
    applePay: true,
    googlePay: true,
    tint: "olive",
    openingFeeUsd: 0,
    physicalFeeUsd: 0,
    annualFeeUsd: 0,
    monthlyFeeUsd: 0,
    topupFeePct: 0,
    spendFeePct: 1,
    promoSpendFeePct: 0,
    promoUntil: "2026-09-30",
    fxFeePct: 0,
    pegPolicy: "one-to-one",
    pegRate: 1.102,
    nativeAsset: "USDT",
    settlement: "USD",
    cashbackPct: 4,
    cashbackPctHigh: 10,
    cashbackAmountCapUsd: 100,
    cashbackAmountCapHighUsd: 800,
    cashbackSpendCapUsd: null,
    cashbackNote: "VVIP Standard 4% 月封顶 100 USDT，Premier 6%/300，Elite 10%/800。活动至 2026-09-30 消费费 0，之后 1%。MEXC 不加 FX 加价。",
    cashbackKind: "stablecoin",
    cashbackAsset: "USDT",
    levels: [
      { id: "standard", name: "VVIP Standard", spendFeePct: 1, cashbackPct: 4, cashbackAmountCapUsd: 100 },
      { id: "premier", name: "VVIP Premier", spendFeePct: 1, cashbackPct: 6, cashbackAmountCapUsd: 300 },
      { id: "elite", name: "VVIP Elite", spendFeePct: 1, cashbackPct: 10, cashbackAmountCapUsd: 800 },
    ],
    assets: ["USDT"],
    scenes: ["daily", "offramp", "ai"],
    risk: 3,
    riskNote: "交易所托管，奖励条款可随时改；先看 App 内实时费率。",
    summary: "USDT 直花、返现数字好看，但是封顶和 VVIP 门槛会吃掉广告里的 10%。",
    bestFor: "长期持有 USDT、想用返现对冲消费的人",
    pros: ["USDT 记账，少一层出金", "活动期消费费可为 0", "返现用稳定币到账", "可绑 Apple Pay / Google Pay"],
    cons: ["资金在交易所", "高返现绑定等级与月封顶", "绑 Apple Pay 需手动输卡号"],
    url: "https://www.mexc.com",
    sourceUrls: [
      "https://www.mexc.com/learn/article/mexc-card-fees-and-limits-global-card-and-mexc-card-apac-compared/1",
      "https://www.mexc.com/en-GB/learn/article/mexc-card-cashback-4-to-10-back-in-usdt-heres-how-it-works/1",
      "https://x.com/MEXCZH/status/2094272494211600583",
    ],
    verification: "official",
    verifiedAt: "2026-09-10",
    updatedAt: "2026-09-10",
  },
  {
