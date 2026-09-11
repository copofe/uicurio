---
id: 07-seed-migration
title: 种子数据迁移
label: wayfinder:task
status: resolved
blocked_by:
  - 02-screenshot-pipeline
  - 03-data-model
assignee: main
---

## Question

把 Obsidian 20 条按定稿数据模型迁成仓库内数据文件：

- 整数 id → slug 映射，三表 → 数据文件
- 20 条中文描述产出（AI 翻译初稿，用户事后抽查）
- 20 张封面截图按截图管线产出

产出：全量数据文件 + 校验通过 + 20 张封面就位。

## Resolution

- **完成**：`data/` 下 20 items / 6 categories / 31 tags（含全部中文描述初稿，由迁移时 AI 同步译出）；`migrations/obsidian-id-map.json` 冻结整数 id 映射；`scripts/validate-data.mjs` 门禁 **0 错误 0 警告**。
- **截图**：20/20 封面就位（`assets/shots/<slug>.webp`，合计 724KB，均 <200KB）。管线三级降级策略实戼验证：networkidle(30s) → domcontentloaded+6s(45s) → commit+10s(60s)，慢站（trees/spell/spectrum 等 TTFB 25s+）由三级兜底命中；浏览器显式走本机代理（`SHOTS_PROXY` 可覆盖）。
- **遗留微调**（不阻塞）：个别站截图若构图不理想，`npm run shots:one -- <slug>` 随时重拍。
