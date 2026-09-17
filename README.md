# 卡衡

卡衡是一个开源的 U 卡 / 加密支付卡费率与返现对照项目，目标是把分散在不同官方页面、地区版本和计价口径里的信息，整理成**可验证、可比较、可机器读取**的数据。

项目不仅提供公开网页，也提供结构化 API、OpenAPI 描述和面向 AI / Agent 的查询入口，便于开发者、研究者和自动化工具复用这些数据。

线上版本：<https://card.stelloras.com>

## 为什么做这个项目

不同 U 卡和加密支付卡常把成本拆成充值费、换汇费、消费费、FX、实体卡费、会员等级和分段返现。单看宣传页很难判断真实成本，而且不同地区版本的费率可能并不相同。

卡衡希望解决三个问题：

1. **统一口径**：把费用和返现折算到同一个消费场景里比较；
2. **保留证据链**：记录官方来源、适用地区和核验状态；
3. **机器可读**：让 API、机器人、AI Agent 和其他开源项目可以直接复用数据，而不是重新抓取网页。

## 当前能力

- 卡片费率、返现、地区版本和状态对照
- 每消费 `$1,000` 的综合成本 / 收益口径
- 官方来源与核验状态标记
- 全球版、亚太版、新加坡版等差异化条目
- 充值、币种转换、消费费与 FX 分开计算
- 公共查询 API
- OpenAPI 描述
- `llms.txt`
- 面向机器人和 AI 的自然语言查询接口
- Telegram webhook 接口
- Cloudflare Pages 部署
- 管理区维护与数据更新

## 数据可信度

数据按以下状态区分：

- **官方已核**：关键字段可以由官方帮助页、条款、公告或产品页面支持；
- **部分官方已核**：存在官方来源，但页面之间有冲突或关键字段仍不完整；
- **未核验**：只作为检索线索，不建议直接据此做办卡或资金决策。

涉及费率时尽量保留：

- 官方来源
- 适用地区 / 产品版本
- 原始计价单位
- 报价方向
- 核验日期
- 已知冲突或限制

USDT / USDC / USDG 等资产不默认按 1:1 处理；欧元卡按欧元结算。实体卡费用可以选择是否摊入长期成本。

## Public API

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api` | API 索引、slug 列表 |
| GET | `/api/cards` | 全部卡片，可加 `?status=active` |
| GET | `/api/cards/:slug` | 单卡完整记录 |
| GET | `/api/lookup?q=` | 模糊搜索 |
| GET / POST | `/api/ask?q=` | 面向机器人 / AI 的问答接口，返回文本与结构化字段 |
| POST | `/api/telegram` | Telegram webhook |
| GET | `/api/openapi` | OpenAPI 描述 |
| GET | `/llms.txt` | 面向 LLM / Agent 的简要说明 |

示例：

```bash
curl -sS "https://card.stelloras.com/api/ask?q=plsama怎么样"

curl -sS -X POST https://card.stelloras.com/api/ask \
  -H 'content-type: application/json' \
  -d '{"q":"plasma怎么样","spend":1000,"merchant":"TWD","asset":"USDT","tier":"entry"}'
```

查询支持口语和常见错拼，例如 `plsama` → `Plasma One`。

## 面向 AI / Agent 的使用场景

卡衡的数据层不仅服务网页，也可以作为其他工具的数据源，例如：

- 自动比较不同卡片在指定消费额下的净收益；
- 在 Agent 工作流中读取结构化卡片数据；
- 检查某个字段是否已经有官方来源；
- 识别过期费率、缺失来源或地区版本冲突；
- 对数据更新自动生成测试、校验或 PR；
- 为 Telegram Bot、聊天机器人或研究工具提供统一数据接口。

## 开发

```bash
npm install
npm run dev
```

提交前运行：

```bash
npm run check
```

`npm run check` 会依次执行：

- 数据结构校验
- TypeScript 类型检查
- ESLint
- 自动测试
- Cloudflare 构建

这样可以尽量避免错误费率、类型问题或构建问题直接进入公开版本。

## 贡献

欢迎提交数据纠错、官方来源、测试、API 改进、计算逻辑修复和文档改进。

请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。涉及费率、返现、地区限制或状态变化的贡献，优先附官方来源和核验日期。

## 部署到 Cloudflare Pages

1. 打开 Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages**；
2. 连接本 GitHub 仓库；
3. 使用以下构建配置：

| 项 | 值 |
|---|---|
| Build command | `npm run build:cf` |
| Build output directory | `dist` |
| Node version | `22` |

也可以通过 GitHub Actions 部署。需要在仓库 Secrets 中配置：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

不要把任何 token 或密钥提交到仓库。

## 管理区

后台登录地址为 `/login`，使用独立管理员账户，不依赖 Google、X 或其他 OAuth 应用权限。

Cloudflare Pages 的 Production Variables / Secrets 中需要配置：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

其中密码和 session secret 必须作为 Secret 保存。没有完整配置时，管理区应保持锁定。

## 项目维护方向

当前维护重点包括：

- 提高字段级证据可追溯性；
- 增强分段返现、代币返现和非现金奖励的建模；
- 区分全球版、地区版与活动期费率；
- 自动发现过期数据和来源冲突；
- 提升 API / OpenAPI 对 Agent 工作流的可用性；
- 增加更多自动测试和数据一致性检查。

## 免责声明

本项目用于信息整理和技术研究，不构成金融、投资或办卡建议。支付产品条款可能随时变化，实际使用前请以发行方和官方页面的最新条款为准。

## License

MIT License. See [LICENSE](./LICENSE).
