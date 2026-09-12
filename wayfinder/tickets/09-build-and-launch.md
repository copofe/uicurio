---
id: 09-build-and-launch
title: 建站与上线
label: wayfinder:task
status: in-progress
blocked_by:
  - 04-visual-prototype
  - 05-name-domain
  - 07-seed-migration
assignee: main
---

## Question

按已定稿的选型（Astro + Cloudflare Pages）把站建起来并发布：

- 站点骨架：双语路由、`data/` 数据层 + 校验门禁、Directory 交互岛（按视觉原型定稿实现）
- 种子数据就位（票 07 产出）、截图就位
- Cloudflare Pages 部署 + 自定义域名（票 05 产出）接入 + Web Analytics beacon
- 发布检查单：sitemap / OG 卡 / hreflang / 移动端 / Lighthouse 过一遍

产出：公开可访问的 v1 站点 + 发布检查单全绿。

## Resolution（本地阶段完成，部署待主人账号动作）

- **已建成**：Astro 7 站点——双语全前缀路由（根 stub x-default 跳转）、`data/` 数据层 + 门禁 prebuild、六类页面（首页/频道/条目/标签/组合）、无框架渐进增强岛（服务端全量渲染 SEO 零损失，URL 同步 ?f=&q=）、@astrojs/sitemap + hreflang 三联、每条目 og:image 用真封面。`npm run build` 出 **113 页**；preview 冒烟全绿（过滤 9→7、搜索、中文页、零 JS 错误）。
- **岛选型记录**：v1 用原生 JS 渐进增强（无 React/Preact 水合）——20→100 条量级下最零依赖最稳；若未来需要布局动画/⌘K 再评估 React 岛。
- **剩余（主人的动作，约 10 分钟，全程 $0）**：① GitHub 建仓并 push 本仓库 ② Cloudflare Pages 连接仓库（构建命令 `npm run build`，输出 `dist/`）③ Pages 项目 → Custom domains → 绑 **uicurio.shinji.me**（主域已在 CF DNS，CNAME 自动创建，证书自动签发）④ CF 控制台开 Web Analytics，把 beacon 换入 Base.astro 注释处。
