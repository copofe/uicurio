---
id: 01-tech-stack
title: 技术栈与部署选型
label: wayfinder:research
status: resolved
blocked_by: []
assignee: main
---

## Question

纯静态「标准画廊」UI 导航站（浏览 / 分面过滤 / 搜索 / 条目详情 / 中英双语全量页 / SEO 基建），技术栈与部署怎么定：

- **框架**：静态站生成器选谁（Astro / Next SSG / 11ty / VitePress / 其他）——过滤交互岛、双语路由、构建期数据校验的支持度各如何
- **托管**：Cloudflare Pages / Vercel / Netlify / GitHub Pages——免费额度要覆盖 100+ 条目 × 双语的全量页 + 截图等静态资产
- **配套**：域名接入、站点统计、sitemap / 分享卡等 SEO 基建在该平台上的最省心做法

硬偏好：零服务端运行时；单人维护、稳妥省心优先；SEO 是命脉。

产出：定稿一组合 + 每项理由 + 被否清单（一项一句话）。

## Resolution

- **定稿**：Astro（纯静态输出）+ Cloudflare Pages 托管 + Cloudflare Web Analytics 统计 + @astrojs/sitemap；域名与 DNS 同家 Cloudflare。
- **一句话理由**：双语路由 / 构建期数据校验 / 交互岛在 Astro 全是一等公民；CF 免费档 500 构建月 + 20k 文件对「录一条推一次」绰绰有余，且托管 / R2 / 统计 / 域名一家管齐（Netlify 积分制下 ≈20 次部署/月且用尽即停站，硬伤出局）。
- **执行备注**：勿装任何 SSR adapter；额度数字均经 2026-09-11 官方页取证。
- **详见**：`wayfinder/findings/01-tech-stack.md`（原 researcher 通道工具故障，经站点主人批准由主管主会话代跑）
