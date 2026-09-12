---
label: wayfinder:map
title: UI 库导航站 · 从零重建
status: open
created: 2026-09-11
---

## Destination

一个**公开上线的 UI 库收藏导航站 v1（标准画廊）**：浅色极简画廊风、中英双语、纯静态；收藏从 Obsidian 的 20 条起步、按上百条设计；发现新库 = 丢链接给 AI 自动入库。**做完 = 站点可公开访问**。

## Notes

- **数据源**：Obsidian `02-Areas 领域/工具库/UI-Libs.md`——20 条目 / 6 频道 / 31 标签（function · stack · style · scenario 四分面）。唯一事实源；迁移后退役为个人阅读视图
- **参与方式（长期有效）**：纯结果导向——技术决策 AI 全权定稿，以「稳妥、省心、免费额度够」为准；用户只在品味 / 流程类 HITL 票据出现
- **本 effort 携带执行至上线**（覆盖 wayfinder 默认 plan-only）：地图走到头 = 站点已发布
- **语言**：中英双语全站；英文描述已备，中文由入库 / 迁移管线 AI 产出、用户抽查
- **视觉**：浅色极简画廊（深色画廊已落选；细节由「视觉原型」票据定稿）
- **历史**：2026-09-11 用户令旧 uicurio 文档全部作废删除、从零思考——本图与旧文档无传承关系，禁止引用旧档
- **tracker**：本地 markdown（`wayfinder/` 目录）；票据身份 = 文件名；blocking 走 frontmatter `blocked_by`；claim = 填 `assignee`
- **⚠ researcher 通道注意事项**（2026-09-11 事故）：子代理批量启动时工具注册不稳定（5 次中 4 次缺 web 工具，仅 read/write/contact_supervisor），且 supervisor 回执通道偶发投递失败；派研究子代理前先要求其第一步自检工具并向主管上报缺件，勿凭内部知识定稿；web 抓取需 `~/.pi/agent/web-search.json` 配 `ssrf.allowRanges: ["198.18.0.0/15"]`（本机为 fake-IP TUN 代理环境，已配）
- **技能**：票据按类型调用 grilling / prototype / research

### 开图前决议（2026-09-11，开图 grill 定案）

- 公开站点，SEO 是命脉；目的地 = 上线可访问站点（非 spec / 本地原型）
- 收藏持续增长，按 100+ 条量级设计
- 内容中英双语（双份录入负担由 AI 入库管线消化）
- 视觉走浅色极简
- 收录流程 = 丢链接 AI 自动入库；封面 = 自动截图管线
- v1 = 标准画廊：浏览 / 分面过滤 / 搜索 / 条目详情 / 双语 / SEO 基建；无动态功能

## Decisions so far

- [数据模型定稿](tickets/03-data-model.md)：`data/` 三目录一实体一 JSON，文件名 = slug = 主键（发布后不可变）；JSON Schema 2020-12 + 构建期门禁校验（FK/唯一性/悬空标签/双语，错误阻断 CI）；四分面与两条分类原则不变；迁移由 Obsidian 表 slugify 派生 slug、冻结整数 id 映射表
- [技术栈与部署选型](tickets/01-tech-stack.md)：Astro（纯静态）+ Cloudflare Pages + CF Web Analytics + @astrojs/sitemap，域名 DNS 同家；Netlify 积分制（≈20 次部署/月用尽即停）出局，额度均经 2026-09 官方页取证
- [自动截图管线选型](tickets/02-screenshot-pipeline.md)：本地 Playwright + sharp 转 WebP + 图入 git 仓库，脚本双入口（全量/单条）；云 API 与 R2 仅作量级触发后的备选
- [视觉原型](tickets/04-visual-prototype.md)：**B 侧栏过滤**骨架 + **图文卡**；浅色极简、无彩色 accent；原型存档于 `prototype/gallery` 分支
- [站名与域名](tickets/05-name-domain.md)：站名 **uicurio**，部署域 **uicurio.shinji.me**（主人主域的子域，$0，主域已托管 CF DNS）——顶域不买，日后可 301 迁移
- [自动入库管线设计](tickets/06-ingestion-pipeline.md)：会话驱动——丢链接→AI 全程代办→主人点头才 commit；升级路径留了 GitHub Issue 触发
- [种子数据迁移](tickets/07-seed-migration.md)：20/6/31 全部入库含中文描述，门禁 0 错 0 警；20/20 封面就位（724KB）
- [SEO 着陆页策略](tickets/08-seo-landing-pages.md)：五类页全生成双语（tag ≥2 / 组合 ≥3 门槛）；hreflang 自指 + x-default→en；Alternatives 互链模块

## Not yet specified

- **品牌资产**：logo / favicon 定稿设计、每条目 OG 分享图——favicon 已有临时版（SVG 字标），等品牌打磨
- **移动端深度打磨**：B 骨架已带基础响应式（<1024px 侧栏堆叠），细化体验随上线后反馈迭代
- **上线后运营**：Search Console 接入、Analytics 观察、标题模板 CTR 微调——等部署完成开票

## Out of scope

- **动态功能**（账号 / 评论 / 点赞 / 访客提交）：突破纯静态边界，v1 后另起 effort
- **v1 后增强**（⌘K 命令面板、深色主题、点击计数展示）：超出本目的地
