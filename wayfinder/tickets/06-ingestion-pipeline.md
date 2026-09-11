---
id: 06-ingestion-pipeline
title: 自动入库管线设计
label: wayfinder:grilling
status: resolved
blocked_by:
  - 01-tech-stack
  - 02-screenshot-pipeline
  - 03-data-model
assignee: main
---

## Question

「发现新库 → 进站」的日常流程长什么样（这是站点能否长大到上百条的关键习惯）：

- **入口形态**：会话里丢链接 / 命令行脚本 / 其他
- **AI 自动做什么**：抓取元信息、生成中英双语描述、建议标签（facet 归位）、跑截图
- **用户在哪一步抽查拍板**：描述质量、标签归属、封面观感
- 各步如何串成一条顺手且不易出错的流水线

产出：定稿流程 + 每步的负责者（AI / 用户）。

## Resolution

- **定稿**：会话驱动入库——主人在 AI 会话丢链接 → AI 抓元信息（名称/官网/仓库）→ 出中英双语描述初稿 → 建议标签（含 facet 归位）→ 调 `npm run shots -- <slug>` 出封面 → 展示条目预览 + git diff → **主人点头才 commit**（push 即部署，天然发布门）。
- **职责**：AI 干全部体力活，主人只做两件事：丢链接、点头/改描述。
- **质量门**：published 必须有 zh 描述（票 03 模型硬规则）；标签 facet 归位靠校验脚本 + 主人抽查。
- **升级路径**：收藏量大或需要手机丢链接时，再开票做 GitHub Issue 触发自动化（本轮被否仅因前期过重，非方向错误）。
