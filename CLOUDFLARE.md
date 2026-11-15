# Cloudflare 部署交接

本仓库已加入独立 Cloudflare Worker 入口。原 Sites 入口与本地预览保持不变。尚未创建云端资源，必须完成以下配置后才能上线。

## 资源与登录

1. 在自己的 Cloudflare 账号创建 D1 数据库 `silvernoise-content` 和 R2 桶 `silvernoise-media`，保留实际数据库 ID。不要将示例 ID 用于发布。
2. 创建名为 `silvernoise` 的 Worker，连接 GitHub 仓库 `ChrisCheng-cj/silvernoise` 的 `main` 分支。
3. 通过 Cloudflare Access 保护该 Worker 的完整域名（所有路径），包括 workers.dev 域名。只允许所有者邮箱登录；可以使用邮箱一次性验证码。记录 Access 团队域名和应用 AUD。预览网址已禁用。
4. 当前迁移保持原网站的仅所有者可访问权限。不要配置 Allow Everyone 或绕过登录的规则。若将来公开作品展示，需要另行调整访客与编辑权限。

## GitHub 自动构建

构建环境使用 Node.js 22 或以上，包管理器为 pnpm（仓库提供锁文件）。

- Build command: `pnpm run cf:configure`
- Deploy command: `pnpm run cf:deploy`
- Root directory: 仓库根目录
- 生产分支：`main`；不启用其他分支自动部署到生产环境。

在 Cloudflare Workers Builds 的构建变量中配置：

| 名称 | 内容 |
| --- | --- |
| CF_DATABASE_ID | 实际 D1 数据库 ID |
| CF_ACCESS_TEAM_DOMAIN | 例如 your-team.cloudflareaccess.com，不含协议和路径 |
| CF_ACCESS_AUD | Access 应用的 AUD |
| PORTFOLIO_OWNER_EMAIL | 唯一允许编辑和访问的所有者邮箱 |

构建生成 `.cloudflare/wrangler.json`，再应用数据库迁移并发布。该目录不提交 Git。构建使用 Cloudflare 为项目配置的部署授权；不要把 API Token 写入仓库。

## 身份验证

`cloudflare/worker.js` 验证 Cloudflare Access 签名、签发方、应用 AUD、有效期和所有者邮箱。调用者伪造的 Sites 身份头会被清除。未配置或校验失败时整个网站拒绝访问，包括静态媒体。原始 Sites 入口不能直接用作独立 Worker 的入口。

## 数据迁移（发布前完成）

源码仅包含默认项目和静态素材。线上 D1 保存的草稿/正式内容、R2 用户上传文件以及本地编辑内容并不会随 GitHub 自动迁移。

先保留原站与本地备份，再把原站 `projects` 记录导入新 D1，按原 `/media/` 路径复制 R2 文件，并核对每个引用都存在。若本地与线上同一项目都有修改，按项目对比后再选择，禁止静默覆盖。SQL 备份包含私人草稿，不应提交到公开仓库。

核对草稿、正式页、图片和视频均正常后再切换使用新网址。原 chatgpt.site 地址由原平台管理，不会随此流程迁移。

## 检查

`pnpm run test:cloudflare` 验证身份、过期/错误签名、错误 AUD 与伪造身份头。`pnpm exec wrangler deploy --dry-run --config .cloudflare/wrangler.json` 只打包检查，不会发布。

官方参考：[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)、[Access JWT 验证](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)。
