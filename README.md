# 卡衡

把在运营 U 卡的费率折成同一个数字：每消费 $1,000，你到底赚还是亏。

对照、卡库、指南、本机管理（费率可改，存在浏览器里）。无账号、无邀请返佣。

线上版本：[kaheng.cc](https://kaheng.cc)

## 数据可信度

- 官方已核：列出官方帮助页及核验日期。
- 部分官方已核：官方页面存在冲突或仍缺关键字段。
- 未核验：只作检索线索，不应直接据此办卡。
- 全球版、亚太版、新加坡版等若费用不同，会拆成独立条目。

充值、币种转换、消费费与 FX 分开计算；实体卡费可选择是否摊入 12 个月成本。

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

## 说明

费率按公开条款折算，管理页可以改成你的口径。U 卡会停服，只放亏得起的额度。
