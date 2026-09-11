---
id: 02-screenshot-pipeline
title: 自动截图管线选型
label: wayfinder:research
status: open
blocked_by: []
assignee: researcher
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
