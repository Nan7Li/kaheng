# 卡衡

把在运营 U 卡的费率折成同一个数字：每消费 $1,000，你到底赚还是亏。

对照、卡库、指南、本机管理（费率可改，存在浏览器里）。公开页面无需登录；管理区只对绑定的管理员账户开放。无邀请返佣。

线上版本：[card.stelloras.com](https://card.stelloras.com)

## 公开 API

部署后可以把下面地址发给其他 AI，用来核对卡库数据。查询支持口语和常见错拼（例如 `plsama` → Plasma One）。

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api` | 索引、slug 列表 |
| GET | `/api/cards` | 全部卡片（可加 `?status=active`） |
| GET | `/api/cards/:slug` | 单卡完整记录 |
| GET | `/api/lookup?q=` | 模糊搜索 |
| GET / POST | `/api/ask?q=` | 给机器人和其他模型用的问答接口，返回 `text` + 结构化字段 |
| POST | `/api/telegram` | Telegram webhook；预留给后续机器人 |
| GET | `/api/openapi` | OpenAPI 描述 |
| GET | `/llms.txt` | 给模型看的简短说明 |

示例：

```bash
curl -sS "https://card.stelloras.com/api/ask?q=plsama怎么样"
curl -sS -X POST https://card.stelloras.com/api/ask \
  -H 'content-type: application/json' \
  -d '{"q":"plasma怎么样","spend":1000,"merchant":"TWD","asset":"USDT","tier":"entry"}'
```

接 Telegram 机器人时，在 Cloudflare Pages 环境变量里加：

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`（可选，对应 webhook secret token）

然后把 webhook 设到 `https://card.stelloras.com/api/telegram`。用户发「plasma怎么样」时，机器人会回该卡的全部公开信息。

## 数据可信度

- 官方已核：列出官方帮助页及核验日期。
- 部分官方已核：官方页面存在冲突或仍缺关键字段。
- 未核验：只作检索线索，不应直接据此办卡。
- 全球版、亚太版、新加坡版等若费用不同，会拆成独立条目。

充值、币种转换、消费费与 FX 分开计算；USDT / USDC / USDG 按市价，不默认 1:1；欧元卡按欧元结算。实体卡费可选择是否摊入 12 个月成本。

## 本地运行

```bash
npm install
npm run dev
```

打开终端提示的地址即可。

提交前可运行 `npm run check`，它会校验数据结构、类型、代码规范、测试和 Cloudflare 构建。

## 部署

### GitHub

仓库：https://github.com/Nan7Li/kaheng

### Cloudflare Pages

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → 连接这个 GitHub 仓库。
2. 构建设置：

   | 项 | 值 |
   |---|---|
   | Build command | `npm run build:cf` |
   | Build output directory | `dist` |
   | Node version | `22` |

3. 也可以用 GitHub Actions：在仓库 **Settings → Secrets and variables → Actions** 里加：

   - `CLOUDFLARE_API_TOKEN`（[创建 token](https://dash.cloudflare.com/profile/api-tokens)，权限包含 Account · Cloudflare Pages · Edit）
   - `CLOUDFLARE_ACCOUNT_ID`（Dashboard 右侧 Account ID）

之后每次推 `main` 会自动发布。

### 管理区权限

管理区 `/admin` 需要真实登录，并在 Pages 的生产环境变量中配置以下任一项：

- `ADMIN_USER_ID`：登录会话的稳定用户 ID（优先推荐）
- `ADMIN_EMAIL`：管理员登录邮箱（大小写不敏感）

两项都未配置时，管理区会保持锁定，不会允许任何写入。不要把密码、OAuth token 或其他密钥写进代码；配置变更后重新部署即可生效。

## 说明

费率按公开条款折算，管理页可以改成你的口径。U 卡会停服，只放亏得起的额度。

