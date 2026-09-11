# Research: 01-tech-stack —— 技术栈与部署选型（wayfinder 票 01）

> 执行说明：本票原派 `researcher` 子代理，遇运行时工具注册故障（4/5 实例缺 web 工具，详见会话记录），经站点主人批准改由主管在主会话带联网工具代跑。取证时间 2026-09-11，所有额度数字均取自当日官方页面。

## Summary（定稿）

**Astro（纯静态输出）+ Cloudflare Pages 托管 + Cloudflare Web Analytics 统计 + @astrojs/sitemap**；域名与 DNS 同家 Cloudflare。

一句话理由：站点形状是「构建期数据校验 + 中英全量双语路由 + 单页局部交互岛 + SEO 长尾」——这四件事在 Astro 全是一等公民；而 Cloudflare 免费档的构建额度与配套完整度对单人「push 即部署」的省心流最友好。

## Findings

### 1. Astro 能力逐项核对（官方文档）

- **i18n 路由**：`i18n` 配置（`locales` + `defaultLocale` + `prefixDefaultLocale`）生成全量前缀双语路由，`astro:i18n` 提供取 URL 辅助函数。Source: [Internationalization (i18n) Routing](https://docs.astro.build/en/guides/internationalization/)
- **内容集合**：`defineCollection` + `glob()` loader + `schema`（zod）做构建期校验与类型安全；v5 起为 Content Layer API。Source: [Content collections](https://docs.astro.build/en/guides/content-collections/)
- **交互岛**：默认渲染零 JS 静态 HTML，`client:load / client:idle / client:visible` 指令按需水合单个组件。Source: [Islands architecture](https://docs.astro.build/en/concepts/islands/)
- **Sitemap**：`@astrojs/sitemap` 官方集成，构建期自动生成（含 `getStaticPaths()` 产生的动态路由）。Source: [Astro Sitemap integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/)

### 2. Next.js（static export）对照（官方文档，页面标注 2025-08-25 更新）

静态导出可用，但 **Unsupported Features** 明确排除 Middleware / Proxy / Rewrites / Headers——基于中间件的 locale 协商路线不可用；内建 i18n 路由未列入静态导出支持特性。双语需手搓 `[lang]` 路径段 + `generateStaticParams()`，数据层（collections + schema 校验）同样自建。**可行但每一块都要手搓。** Source: [Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)

### 3. 托管四候选（2026-09 官方页取证）

| 平台 | 免费档关键额度（官方页当日数值） | 对本站的适配 |
| --- | --- | --- |
| **Cloudflare Pages** | 500 构建次/月（单并发，20 分钟超时）；站点 ≤20,000 文件；单文件 ≤25 MiB；自定义域名 ≤100；项目 ≤100；limits 页**未列带宽上限条目** | push 即部署；500 次/月对「录一条推一次」绰绰有余；与 R2 / Analytics / Registrar 同一家 |
| Netlify | **已改积分制**：300 积分/月，生产部署 15 积分/次 ≈ **20 次/月**；带宽 20 积分/GB ≈ 15GB；**积分用尽整个团队项目暂停至下月** | 「用完即停站」与高频录入流直接冲突，硬伤 |
| Vercel Hobby | Fast Data Transfer 100 GB/月；100 deploys/天；单次构建上限 45 分钟 | 额度够用，但域名/DNS/存储/统计分散多家，工具链碎片化 |
| GitHub Pages | 发布站点 ≤1 GB；月带宽软限 100 GB | 额度最小；无内建构建管线（自行串 Actions）；截图资产入场后空间紧张 |

Sources: [Cloudflare Pages Limits](https://developers.cloudflare.com/pages/platform/limits/) · [Netlify credit-based plans](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/) / [Netlify Pricing](https://www.netlify.com/pricing/) · [Vercel Pricing](https://vercel.com/pricing) / [Vercel Limits](https://vercel.com/docs/limits) · [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

### 4. 配套

- **统计**：Cloudflare Web Analytics（免费、无 cookie）；备选 umami 自托管（多一个运维件，不选）。
- **OG 分享卡**：构建期生成（astro-og-canvas 等社区集成），部署后即纯静态文件——不引入运行时。
- **对象存储**：R2 免费档 10 GB 存储、**egress 免费**（Class A 100 万次 / Class B 1000 万次/月免费）。Source: [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)——截图管线（票 02）的备选存放位。

## 被否清单（一项一句话）

- **Netlify**：积分制下约 20 次生产部署/月且用尽即停站，与「录一条推一次」冲突。
- **Vercel**：额度够用但域名/DNS/存储/统计散落多家，违背单人省心原则。
- **GitHub Pages**：1GB 站点上限、无构建管线，双语 + 截图资产下空间与工装都紧。
- **Next.js SSG**：双语路由与数据校验全手搓，静态前提下只剩运行时负担。
- **11ty**：无 islands 等价物与内建 schema 校验，交互岛和数据层都要拼装（架构常识判断，置信度中）。
- **VitePress**：文档站骨架，画廊卡片网格 + 过滤 UI 不是它的形状（同上）。

## Missing evidence

- Cloudflare Pages「无限带宽」是市场口径；官方 limits 页仅未列带宽条目，本报告按「未列上限」声明，不作「无限」承诺。
- ScreenshotOne 等云截图 API 只核实了免费档（100 张/月），付费档未逐档核价——本票不用它，详见票 02 findings。
