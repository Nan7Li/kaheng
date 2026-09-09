export interface RiskEvent {
  date: string;
  title: string;
  body: string;
  kind: "shutdown" | "restrict" | "hack" | "note";
}

export const RISK_EVENTS: RiskEvent[] = [
  {
    date: "2026-06-30",
    title: "Wirex：EEA / 澳洲经典加密功能停",
    body: "经典 App 转向 Wirex One。老品牌还在，产品已经不是同一张卡。",
    kind: "restrict",
  },
  {
    date: "2026-06-05",
    title: "SafePal / Fiat24 停止大陆新开",
    body: "中国大陆新用户开户关闭。存量用户另行通知，不要按旧教程去注册。",
    kind: "restrict",
  },
  {
    date: "2026-06",
    title: "Bitget Wallet Card 开卡收紧",
    body: "部分地区转候补。交易所钱包卡也开始按地区关闸。",
    kind: "restrict",
  },
  {
    date: "2025-11-30",
    title: "Dupay 关服务器",
    body: "合规问题，终止全部服务。警惕假冒退款客服。余额只走官方渠道。",
    kind: "shutdown",
  },
  {
    date: "2025-07-12",
    title: "野卡 WildCard 停服",
    body: "应监管要求停止虚拟卡，原卡全部失效。品牌后转 WildAI 代充，不再发卡。",
    kind: "shutdown",
  },
  {
    date: "2025-06-17",
    title: "Infini 关停卡业务",
    body: "称合规成本不可持续。此前 2 月金库被盗约 $49.5M USDC。",
    kind: "shutdown",
  },
  {
    date: "2025-02-24",
    title: "Infini 被盗约 $49.5M",
    body: "Morpho 金库权限被越权，疑前员工。高返现 + 金库权限是同一类风险。",
    kind: "hack",
  },
  {
    date: "2025-01-31",
    title: "OneKey Card 正式停服",
    body: "上游支付终止合作。2024-10-31 前余额转回钱包，是少数有序清退。",
    kind: "shutdown",
  },
  {
    date: "2025-01",
    title: "Nexo 实体卡暂停新发",
    body: "欧洲产品线收缩的信号之一，虚拟卡并不等于永远可办。",
    kind: "restrict",
  },
];

export const METHOD_NOTES = [
  "入门档：按公开的最低持续返现 + 月封顶计算，不把限时 10% 当成你能拿到的数。",
  "进阶档：按广告最高返现和更高封顶估算，仍扣除开卡摊销、充值、消费和 FX。",
  "美元账单不计 FX；本地货币（台币等）计入各卡公开的 FX / 跨境费。",
  "开卡费按 12 个月摊销。只用三个月就关卡，真实成本会更高。",
  "返现若是平台币 / 积分，按面值计入——这会高估，细节见各卡说明。",
  "数字会变。下单前以官方 App 报价为准。本站无邀请返佣。",
];
