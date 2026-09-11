---
id: 03-data-model
title: 数据模型定稿
label: wayfinder:research
status: open
blocked_by: []
assignee: researcher
---

## Question

Obsidian 三表模型（Items / Categories 可扩展树 / Tags 四分面 function·stack·style·scenario）落成仓库内 schema 化数据文件，定稿：

- **主键**：slug 替换整数 id 的映射规则（整数 id 是 markdown 表格时代的产物；静态站点标识符应语义化、可直接进 URL）
- **schema**：条目 / 频道 / 标签的字段定义，双语 name / description 怎么建模（zh 缺省回退 en？）
- **校验**：引用完整性（外键存在性、悬空标签）在构建期怎么查
- **规模**：100+ 条目下的文件组织（一条目一文件？）

允许对现模型提出演进（字段增补、facet 调整），但两条既定原则不变：频道按「访客来找什么」划分；具体属性一律进标签、不进分类。

产出：数据文件结构定稿 + 整数 id → slug 迁移映射规则。
