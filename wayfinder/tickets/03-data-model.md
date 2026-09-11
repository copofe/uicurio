---
id: 03-data-model
title: 数据模型定稿
label: wayfinder:research
status: resolved
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

## Resolution

- **定稿**：`data/` 下 items / categories / tags 三目录、一实体一 JSON 文件，文件名 = slug = 主键（小写 ASCII 连字符、全局唯一、发布后不可变、保留字黑名单）；`data/_schema/` 放 JSON Schema（2020-12），双语内联 `{en, zh}`——en 必填、published 必须含 zh（未译走 `status: draft`），渲染层 `zh || en` 仅兜底；构建期门禁 `scripts/validate-data.mjs`（单文件 schema 校验 + 跨文件 FK/唯一性/悬空标签/双语完整性，错误阻断 CI、空频道零引用标签降为警告）；四分面与两条既定原则不动，item/category/tag 仅做字段增补。
- **一句话理由**：语义 slug + 目录化 JSON + 框架无关的独立校验脚本是纯静态目录站最稳妥省心的组合——单人好维护、AI 入库每次只追加一个文件、不锁 01 票的框架选型。
- **迁移**：一次性 `migrate-obsidian.mjs` 由 Obsidian 表按官方名称 slugify 派生 slug（整数 id 永不进 slug），输出数据文件 + 冻结的 `migrations/obsidian-id-map.json`；验收 = 20/6/31 计数断言 + validator 全绿。
- **详见**：`wayfinder/findings/03-data-model.md`
