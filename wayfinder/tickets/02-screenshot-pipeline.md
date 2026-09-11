---
id: 02-screenshot-pipeline
title: 自动截图管线选型
label: wayfinder:research
status: resolved
blocked_by: []
assignee: main
---

## Question

「丢一个库的网址 → 得到体面的 16:10 封面图」的自动截图管线怎么搭：

- **手段**：本地 Playwright（或同类）脚本 vs 云截图 API——成本、质量、维护面
- **拍摄策略**：视口尺寸、等待 / 滚动策略（大量条目是动效组件站点，如何截得体面）
- **产物**：格式与压缩（webp / avif）、尺寸档位
- **存放**：git 仓库内 vs 对象存储直链——与免费托管额度、构建速度的权衡
- **入口**：批量跑全量 20 条 + 单条新增，两种入口怎么共用一套脚本

若结论依赖部署平台，按主流候选分别给出推荐。

产出：定稿方案 + 一次性 / 持续成本 + 维护面。

## Resolution

- **定稿**：本地 Playwright + sharp 转 WebP（主）/ AVIF（可选）+ 图入 git 仓库（`assets/shots/<slug>.webp`）；脚本双入口：全量批跑 / 单条补拍（`-- <slug>`，供票 06 入库管线调用）；云截图 API 仅作零安装备选。
- **一句话理由**：截图本地可算、边际成本应为零；100+ 张 × <150KB ≈ <15MB，离 R2 / 云服务的量级门槛很远，入库反而换来版本化与可回滚。
- **拍摄参数**：1280×800 @2x 只截首屏；networkidle + 固定延时到动效稳态；per-item 可覆盖延时参数留给轮播 / 3D 类异质站点（施工期实测调参）。
- **详见**：`wayfinder/findings/02-screenshot-pipeline.md`（同票 01，主管主会话代跑）
