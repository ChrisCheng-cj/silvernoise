# Silver Noise · 个人作品集

当前网站：https://visual-portfolio-1113.chengjie1028.chatgpt.site/

此仓库存放当前网站源码和随站静态素材（图片、视频、字体），不包含个人作品集 PDF、凭据、线上数据库或用户上传媒体的备份。

## 构建

需要 Node.js 22 或更新版本，执行：

```sh
npm run build
```

输出为 `dist/client`（前端）和 `dist/server`（Worker 后端）。

## Cloudflare 独立部署

独立部署入口、GitHub 自动构建配置和迁移步骤见 [CLOUDFLARE.md](CLOUDFLARE.md)。当前仅完成代码适配；尚未完成账号授权、云端资源创建和数据迁移，不代表新站已经上线。

## 托管说明

当前完整网站运行在 Sites，依赖 Cloudflare Worker、D1 数据库、R2 存储及 Sites 提供的可信登录身份。上传代码到 GitHub 不会自动迁移这些服务。

GitHub Pages 只提供静态托管，不能直接运行本项目的登录、编辑、发布和媒体上传 API。不要直接将现有身份头逻辑部署到未经认证的独立 Worker；迁移到其他平台时，需要接入该平台的身份验证并配置独立 D1/R2 资源。

构建生成的 Wrangler 数据库 ID 为占位符，不是可用的生产配置。线上内容目前仍保存在原站点后台。

---

# Silver Noise portfolio

White portfolio with a video homepage, brand project table, individual project pages, and owner-only editing.

## Source and build

- `public/`: website and editor assets. Never add PDFs.
- `worker/index.js`: protected JSON APIs, D1 drafts/publication, R2 media.
- `db/schema.ts` and `drizzle/`: append-only database migrations.
- `node scripts/build.mjs`: builds `dist/client`, `dist/server`, and deployment metadata.
- `node --test tests/editor.test.mjs`: integration checks against local Wrangler on port 8787.

Runtime secret `PORTFOLIO_OWNER_EMAIL` identifies the owner using trusted Sites identity headers. It is configured in Sites, never in client code. Writes require owner identity, same-origin requests, and the editor header. Site audience stays owner-private.

Drafts and published data persist in D1; media files persist in R2. Saving a draft does not alter the live site. Publishing updates project content immediately without redeploying source. Concurrent updates return a conflict instead of overwriting newer changes. Removing media from a project does not delete its stored object (so existing published versions stay intact). JPG, PNG, WebP, GIF, MP4, WebM are supported, up to 50 MB each; PDFs are rejected.

## Local-only development

Use Wrangler with `--local --persist-to .wrangler/state`, set a test owner email through `--var`, then use `scripts/preview-editor.mjs` for an authenticated loopback preview. This adapter is never packaged or deployed. Local and hosted databases are separate. Stop Wrangler before rebuilding on Windows to release asset file locks.
