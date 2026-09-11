---
id: 08-seo-landing-pages
title: SEO 着陆页策略
label: wayfinder:research
status: resolved
blocked_by: []
assignee: main
---

## Question

长尾流量靠真 path 页承接。基于已定稿的数据模型（slug 主键、四分面标签、6 频道）与「标准画廊 v1」边界，哪些着陆页值得生成、怎么切：

- **页面清单**：tag 页 / 频道 × tag 组合页 / 条目详情互链图——各页的 SEO 价值与生成成本
- **文档面**：每页的 title / H1 / description 模板（中英双语）
- **链接图**：频道页 ↔ 标签页 ↔ 条目页如何互链保证全量可爬
- **门槛**：多少条目以上才值得生成某类组合页（避免薄页/重复内容）

产出：着陆页清单定稿 + 模板 + 互链规则。

## Resolution

- **定稿**：五类页全部构建期生成、中英双语——首页（根 stub x-default 语言跳转）、6 频道页、条目详情页（核心长尾）、标签页（**≥2 条才生成**）、频道×标签组合页（**≥3 条才生成**）。
- **一句话理由**：tag/组合页是数据模型的 SEO 变现器，但 Google 把价值稀薄的批量导流页列为 doorway 垃圾，门槛宁缺毋滥、随收藏增长自动解锁。
- **hreflang**：每页列 en/zh 自身互指 + x-default→en，全限定 URL，sitemap 携带 alternates（均按 Google 官方规则）。
- **互链**：频道 ↔ 标签 ↔ 条目全互链；条目页带 Alternatives 模块（同 function tag，≥2 才渲染）。
- **详见**：`wayfinder/findings/08-seo-landing-pages.md`
