# Uicurio

UI 库收藏导航站 · 纯静态（Astro 7 + Cloudflare Pages）· **uicurio.shinji.me**

- 数据：`data/`（items / categories / tags 三目录 JSON，slug 主键，中英双语）
- 岛交互（过滤/搜索/排序/命令面板）：`public`→`src/scripts/island.js`，纯逻辑在 `src/lib/island-core.ts`（vitest 直测）
- 手绘字标：`scripts/gen-wordmark.mjs --write`（从 fonts-tmp 字体提取轮廓，写入三处落点）

## 开发

```bash
npm run dev        # http://localhost:4321（改 data/ 后需重启 dev server）
npm run build      # 构建前自动跑数据校验（scripts/validate-data.mjs）
npm test           # 岛纯逻辑回归测试
```

## 收录新藏品

**推荐**：在 AI 会话丢链接，元信息 / 双语描述 / 标签 / 截图 / 部署全程代办。

手动路径：

```bash
# 1. 数据：data/items/<slug>.json（slug 全小写连字符，全局唯一）
#    必填：slug/name(en,zh)/description(en,zh)/url/category/tags(≥1)/status/added
#    added = 真实收录日期（影响「最新/最早」排序）
$EDITOR data/items/<slug>.json

# 2. 封面截图（16:10，自动压缩入库）
npm run shots:one -- <slug>

# 3. 校验
npm test && npm run validate

# 4. 本地预览后部署
npm run build && npx wrangler pages deploy dist --project-name=uicurio --branch=main
```

## 注意

- 改 `data/` 后需**重启 dev server** 才能在本地预览（数据为模块加载时读盘）
- 部署依赖 wrangler 登录态（`npx wrangler whoami` 检查）
- 自定义域：uicurio.shinji.me（CNAME → uicurio.pages.dev，已代理）
