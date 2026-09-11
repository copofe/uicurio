# Research: 数据模型定稿——Obsidian 三表 → 仓库 schema 化数据文件（wayfinder 票 03）

> 运行说明：本票以设计判断为主、官方来源为辅。本次运行环境未注册 `web_search` / `fetch_content` / `source_check` 工具，无法实时抓取官方页面核验；下列来源链接均为既有知识中的官方文档路径，所有引用一律按「未实时核验的二手记忆」处理并降级标注置信度。设计结论不依赖任何单条来源。

## Summary（结论）

数据落成 `data/` 下三类实体目录（`items/`、`categories/`、`tags/<facet>/`），**一实体一 JSON 文件，文件名 = slug = 主键**；整数 id 退役，只保留在一次性迁移生成的冻结映射文件（`migrations/obsidian-id-map.json`）里备查。双语用字段内联 `{en, zh}` 对象：en 必填，`status: "published"` 时 zh 必填（未译走 draft），渲染层保留 `zh || en` 仅作兜底——「zh 缺省回退 en」只在渲染兜底层面合理，不能作为创作政策（双语全站 + zh SEO 会被静默降级成英文薄页）。引用完整性由独立 `scripts/validate-data.mjs`（JSON Schema 单文件校验 + 跨文件交叉规则）在 CI 构建期红绿灯把关，不锁死 SSG 选型；四分面 function·stack·style·scenario 与两条既定原则（频道按「访客来找什么」、属性进标签不进分类）原样保留。

## 定稿：数据文件结构

```text
data/
  items/<slug>.json              # 100+ 条目，一库一文件
  categories/<slug>.json         # 6 频道，可扩展树（parent 字段）
  tags/<facet>/<slug>.json       # 31 标签，按四分面分目录
  _schema/
    item.schema.json             # JSON Schema draft 2020-12
    category.schema.json
    tag.schema.json
migrations/
  obsidian-id-map.json           # 迁移期冻结：{items:{"1":"shadcn-ui",...},...}
scripts/
  validate-data.mjs              # 构建期数据门禁（CI 阻断）
  migrate-obsidian.mjs           # 一次性迁移脚本（跑完即冻结）
assets/shots/<slug>.png          # 截图按 slug 键（截图管线产出）
```

**item.schema.json 对应的实例示例**（标签词条为示意，非 31 标签定案）：

```json
{
  "slug": "shadcn-ui",
  "name": { "en": "shadcn/ui", "zh": "shadcn/ui" },
  "description": {
    "en": "Copy-paste React components built on Radix UI and Tailwind CSS.",
    "zh": "基于 Radix UI 与 Tailwind CSS 的可复制粘贴 React 组件集。"
  },
  "url": "https://ui.shadcn.com",
  "repo": "https://github.com/shadcn-ui/ui",
  "category": "components",
  "tags": ["function:components", "stack:react", "style:minimal", "scenario:saas"],
  "aliases": ["shadcn"],
  "license": "MIT",
  "screenshot": "shadcn-ui.png",
  "featured": false,
  "status": "published",
  "added": "2026-09-11"
}
```

字段必选性：`slug` / `name` / `description` / `url` / `category` / `tags`(≥1) / `status` / `added` 必填；`repo` / `aliases` / `license` / `screenshot` / `featured` 可选（screenshot 缺省由截图管线按 `<slug>.png` 约定回填）。

**category 实例示例**：

```json
{
  "slug": "components",
  "parent": null,
  "name": { "en": "Component Libraries", "zh": "组件库" },
  "description": { "en": "...", "zh": "..." },
  "order": 1,
  "icon": "grid"
}
```

**tag 实例示例**（id = `<facet>:<slug>`，facet 为封闭枚举）：

```json
{
  "id": "stack:react",
  "facet": "stack",
  "slug": "react",
  "name": { "en": "React", "zh": "React" },
  "description": { "en": "...", "zh": "..." }
}
```

## Findings

### 1. slug 主键与映射规则（问 a）

- **Claim:** 整数 id 全部废除；slug 是唯一标识符，直接构成 URL；slug 规则：全小写 ASCII `[a-z0-9]+(-[a-z0-9]+)*`、连字符分词、长度软上限 48 字符、发布后不可变。**Sources:** [Google URL 结构最佳实践](https://developers.google.com/search/docs/crawling-indexing/url-structure)、[MDN Percent-encoding](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding)。**Support:** 解读（官方文档常识，未实时核验：Google 建议 URL 用可读单词、连字符优于下划线；非 ASCII 字符在 URL 中需百分号编码，分享/打印易碎）。**Confidence:** 高（规则本身是 SEO 与静态托管共识）。
- **Claim:** slug 派生自库的官方名称：NFD 分解去变音符 → 转小写 → 非 `[a-z0-9]` 字符替换为连字符 → 折叠连续连字符 → 去首尾连字符 → 词边界截断。例：`shadcn/ui` → `shadcn-ui`，`Radix UI` → `radix-ui`，`daisyUI` → `daisyui`，`Element Plus` → `element-plus`。**Support:** 设计判断。**Confidence:** 高（机械规则，可测）。
- **Claim:** 唯一性与冲突消解：集合内大小写不敏感去重；冲突时优先加语义限定词（`radix-ui` vs `radix-vue`），禁用 `-2` 式后缀作为第一手段；仍冲突转人工。标签 slug 额外要求**跨 facet 全局唯一**（否则 `/tags/<slug>` 路由会歧义）。**Support:** 设计判断。**Confidence:** 高。
- **Claim:** 保留字黑名单禁止占用路由段：`en`、`zh`、`tags`、`channels`、`library`、`assets`、`api`、`_schema`、`index` 等；validator 强制 `slug` 字段 == 文件名。**Support:** 设计判断。**Confidence:** 高。
- **Claim:** 整数 id → slug 的映射只存在于冻结的 `migrations/obsidian-id-map.json`（`{"items":{"1":"shadcn-ui",...}}`），提交后只读、不再被任何运行时读取；正式 schema 中无 id 字段。发布后 slug 不可变；确需改名必须同时生成 301（静态托管 `_redirects`），因为旧 URL 已被搜索引擎收录。**Support:** 设计判断（SEO 命脉项目的标准做法）。**Confidence:** 高。

### 2. schema 与双语建模（问 b）

- **Claim:** 三类实体各自一个 JSON Schema（draft 2020-12），双语字段一律内联对象 `"name": {"en": "...", "zh": "..."}`；不拆 per-locale 文件、不拆 per-locale 目录。**Sources:** [JSON Schema 规范](https://json-schema.org/specification)、[Astro i18n 指南](https://docs.astro.build/en/guides/internationalization/)。**Support:** 解读 + 设计判断（拆 locale 文件会让「同一条目」散在两处，引用完整性和 AI 入库都要处理双写漂移；内联后一条目 = 一个文件 = 一次校验 = 一次写入，两条语言路由共享同一数据）。**Confidence:** 高。
- **Claim:** **zh 缺省回退 en：渲染层合理、创作政策不合理。** schema 层面：`name.en/zh` 与 `description.en` 永远必填；`description.zh` 在 `status: "published"` 时必填（JSON Schema if/then 条件必填），未译条目以 `status: "draft"` 存在、不出现在任何构建输出。这匹配入库管线的真实节奏（图注：英文描述已备、中文由管线 AI 产出——en 先到、zh 后到，draft 承接中间态），又保证双语全站承诺不被静默破坏：zh 页面出现英文薄页 = zh 搜索引擎眼里的低质重复内容。代码中仍保留 `zh || en` 兜底，但 CI 保证 published 数据永不触发它。**Support:** 设计判断 + 对 map 既有决议的解读。**Confidence:** 高。
- **Claim:** 对现模型的字段演进（在允许范围内）：item 增补 `status`(draft/published)、`added`(ISO 日期)、`featured`、`license`、`repo`、`aliases`(搜索/去重辅助)、`screenshot`；category 增补 `parent`(nullable 自引用，现在全 null = 平铺，树能力留给未来)、`order`、`icon`；tag 增补 `id`(`facet:slug`) 并把 facet 做成封闭枚举。四分面 function·stack·style·scenario **不做调整**——它已完整覆盖「做什么/什么栈/什么风格/什么场景」，且两条既定原则正好由这个结构落实。**Support:** 设计判断。**Confidence:** 中高（字段集合是起点，validator 与迁移会让缺口显形）。

### 3. 构建期引用完整性校验（问 c）

- **Claim:** 两层校验。第一层单文件：JSON Schema（draft 2020-12）+ [Ajv](https://ajv.js.org/)（v8 支持 2020-12）逐文件校验类型/必填/格式；第二层跨文件：`scripts/validate-data.mjs` 检查 schema 表达不了的引用规则。**Sources:** [Ajv](https://ajv.js.org/)、[ajv-cli](https://github.com/ajv-validator/ajv-cli)、[Zod](https://zod.dev)。**Support:** 解读（官方文档常识，未实时核验）。**Confidence:** 高。
- **Claim:** 跨文件规则清单：① `item.category` 必须存在于 categories；② `category.parent` 为 null 或存在、且无自指/环；③ `item.tags[]` 每项必须是存在的 tag id（消灭悬空标签），且 tag 的 `facet` 字段 == 其所在目录名 ∈ 枚举；④ slug 全局唯一（items、categories 集合内 + tags 跨 facet）且 == 文件名；⑤ `url`/`repo` 必须为 https 且 `url` 全局唯一（AI 丢链接入库的去重闸门）；⑥ slug 字符集/保留字/长度；⑦ 双语完整性（published 必含 zh）；⑧ 日期格式。**Support:** 设计判断。**Confidence:** 高。
- **Claim:** 错误分级：错误（悬空 FK、重复 slug、url 重复、published 缺 zh、facet 非法）→ 退出码 1 阻断；警告（空频道、零引用标签、缺某个 facet、description 超长）→ 打印不阻断。CI 用 GitHub Actions 在 PR + push 上跑，公开仓库标准 runner 免费（**未按 2026-09 官方页面实时核验**，见 Missing evidence；脚本本地也能跑，CI 只是门禁载体）。**Sources:** [GitHub Actions 文档](https://docs.github.com/en/actions)。**Support:** 解读 + 设计判断。**Confidence:** 中高。
- **Claim:** 校验权归脚本单点：若 01 票定稿 Astro，可叠加 content collections（glob loader + Zod）做构建期再校验，但跨文件规则仍以脚本为唯一权威，避免两套规则漂移。**Sources:** [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)、[Astro Content Loader Reference](https://docs.astro.build/en/reference/content-loader-reference/)。**Support:** 解读（官方文档常识，未实时核验）。**Confidence:** 高。

### 4. 100+ 条目下的文件组织（问 d）

- **Claim:** **一条目一文件**。100+ 个 ~1KB 的 JSON 对任何 SSG 的 glob loader 都是零压力量级（主流案例数千条）；目录即索引，git diff 按条目隔离，AI 入库管线每次只追加一个文件、无写冲突，validator 兜底质量。**Sources:** [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)。**Support:** 解读 + 设计判断。**Confidence:** 高。
- **Claim:** draft 用字段不用文件夹：`status: "draft"` 而非 `_drafts/` 目录——挪文件夹会动 glob 模式且与 slug 稳定性耦合，字段是数据、文件夹是结构。**Support:** 设计判断。**Confidence:** 高。

## 迁移映射规则（整数 id → slug）

`scripts/migrate-obsidian.mjs` 一次性执行：

1. **输入**：从 vault 的 `UI-Libs.md` 导出三表（CSV/JSON，20 条目 / 6 频道 / 31 标签）。
2. **派生 slug**：按 Findings-1 的 slugify 算法从官方名称生成；整数 id 永不进入 slug。
3. **唯一化**：集合内 casefold 去重；冲突加语义限定词；再冲突列出清单转人工。
4. **标签**：按四分面归位生成 `tags/<facet>/<slug>.json`，slug 跨 facet 全局唯一，`id = facet:slug`。
5. **输出**：`data/**.json` 全量数据文件 + 冻结映射 `migrations/obsidian-id-map.json`（id → slug，仅备查）。
6. **验收断言**：迁移前后计数一致（items=20 / categories=6 / tags=31）且 `validate-data.mjs` 全绿，两者都过才算迁移完成。
7. **此后**：新条目一律走 AI 入库管线直接产 slug，不再经过 id 映射。

## 候选对比与被否清单

- 单一大 `items.json` vs 一条目一文件 → **一条目一文件胜**（写隔离、diff 干净、AI 单文件追加、per-file 校验）。
- YAML / TOML vs JSON → **JSON 胜**（无隐式类型坑、AI 生成最可靠、校验工具链最标准；数据文件无需注释，schema 另放 `_schema/`）。
- markdown frontmatter 条目 vs 纯 JSON 字段 → **纯 JSON 胜**（v1 无长文正文需求，frontmatter 的自由文本空间只会制造漂移）。
- per-locale 数据目录 vs 内联 `{en, zh}` → **内联胜**（一个实体一个事实点，校验与入库都单点）。
- 「zh 全局缺省回退 en」vs「published 条件必填 zh + 渲染兜底」→ **后者胜**（前者会让 zh 页静默降级为英文薄页，伤 zh SEO 与双语承诺）。
- SSG 内嵌校验（如 Astro Zod）单点 vs 独立校验脚本单点 → **独立脚本胜**（01 票未定稿前不锁框架；跨文件规则本就超出 per-file schema 能力；SSG 校验可叠加）。
- 标签 URL 带 facet 前缀（`/tags/function/react`）vs 扁平（`/tags/react`）→ **扁平 + 全局唯一 slug 胜**（更短更利于 tag 着陆页 SEO；数据层用唯一性约束留足自由度，路由最终由 SEO 票定）。
- license 做第五分面 vs item 字段 → **字段胜**（协议是结构化属性不是浏览维度；将来要按协议过滤再派生标签不迟）。

## Contradictions

未发现事实性矛盾。一处取向张力（非对错冲突）：Astro 生态惯用「markdown frontmatter + content collections 内联 Zod」，本票选「纯 JSON + 独立 JSON Schema/脚本门禁」——根因是 01 票（技术栈）尚未定稿，数据层先按框架无关定稿最稳妥；若定 Astro 则叠加 content collections 校验、规则以脚本为唯一权威。已按此定稿并写入 Resolution。

## Missing evidence

- **工具局限（已声明）**：本运行无 `web_search` / `fetch_content` / `source_check`，所有来源链接未实时核验；各文档 URL 为既有知识中的官方路径，置信度已相应降级。定稿不依赖单条来源。
- **vault 源文件不可读**：`02-Areas 领域/工具库/UI-Libs.md` 在本环境 ENOENT，6 频道 / 31 标签的真实词条未能逐条过目，文中 tag 示例均为示意；迁移票据执行时以 vault 导出为准，靠计数断言（20/6/31）+ validator 兜住。
- **GitHub Actions 2026-09 免费额度**未实时核验；即便额度有变，validate 脚本本地可跑，CI 只是门禁载体，不影响数据模型定稿。
- **tag 扁平 URL 的 SEO 效果**属「SEO 着陆页策略」待开票据的验证范围；数据层以全局唯一性约束保证两条路线都可行。

## Sources

- Kept: [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) — 官方数据层模式：目录化数据 + glob loader + schema 校验，佐证「一条目一文件 + 构建期校验」是主流稳妥做法（未实时核验）
- Kept: [Astro Content Loader Reference](https://docs.astro.build/en/reference/content-loader-reference/) — glob() 从文件名派生 id 的官方参考，对应「文件名 = slug = 主键」（未实时核验）
- Kept: [JSON Schema](https://json-schema.org/specification) — draft 2020-12 规范，`_schema/` 契约与条件必填（if/then）的依据（未实时核验）
- Kept: [Ajv](https://ajv.js.org/) 与 [ajv-cli](https://github.com/ajv-validator/ajv-cli) — 构建期 JSON Schema 校验事实标准（未实时核验）
- Kept: [Zod](https://zod.dev) — SSG 内嵌校验等价物，Astro 官方示例即用（未实时核验）
- Kept: [Google URL 结构最佳实践](https://developers.google.com/search/docs/crawling-indexing/url-structure) — 连字符优于下划线、URL 用可读词：SEO 命脉项目的 slug 规则依据（未实时核验）
- Kept: [MDN Percent-encoding](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) — 非 ASCII slug 的编码风险依据（未实时核验）
- Kept: [Astro i18n](https://docs.astro.build/en/guides/internationalization/) — 双语共享数据、分语言路由的语境（未实时核验）
- Kept: [GitHub Actions](https://docs.github.com/en/actions) — CI 门禁载体；公开仓库免费额度待核（未实时核验）
- Rejected/deprioritized: 各类「前端目录站模板/boilerplate」博客文 — SEO 噪音、非一手来源
- Rejected/deprioritized: 旧 uicurio 文档 — 图谱明确作废并禁止引用

## Next steps

- 01 票（技术栈）定稿后：把 `validate-data.mjs` 挂进所选框架的构建/CI 链；若为 Astro，用 content collections + Zod 镜像 per-file 规则，跨文件规则仍归脚本。
- 种子迁移票据：按本票算法实现 `migrate-obsidian.mjs`，跑 20/6/31 计数断言 + validator 全绿后冻结映射表。
- SEO 票：基于 slug 定稿设计路由形态与 tag 着陆页（数据层已不设限）。
