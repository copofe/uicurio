---
id: 06-ingestion-pipeline
title: 自动入库管线设计
label: wayfinder:grilling
status: open
blocked_by:
  - 01-tech-stack
  - 02-screenshot-pipeline
  - 03-data-model
assignee:
---

## Question

「发现新库 → 进站」的日常流程长什么样（这是站点能否长大到上百条的关键习惯）：

- **入口形态**：会话里丢链接 / 命令行脚本 / 其他
- **AI 自动做什么**：抓取元信息、生成中英双语描述、建议标签（facet 归位）、跑截图
- **用户在哪一步抽查拍板**：描述质量、标签归属、封面观感
- 各步如何串成一条顺手且不易出错的流水线

产出：定稿流程 + 每步的负责者（AI / 用户）。
