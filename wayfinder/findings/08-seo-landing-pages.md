# Research: 08-seo-landing-pages —— SEO 着陆页策略（wayfinder 票 08）

> 主管主会话代跑（同 01/02 缘由）。取证 2026-09-11，SEO 政策类结论引 Google Search Central 官方页。

## Summary（定稿）

五类页面，全部构建期生成、中英双语 ×2：

| 页面 | 路径（/{locale}/…） | 生成门槛 |
| --- | --- | --- |
| 首页 | `/`（根 stub 语言跳转）+ `/en/` + `/zh/` | 恒有 |
| 频道页 | `collections/<cat>/` | 6 频道恒有 |
| 条目详情 | `item/<slug>/` | 恒有（核心长尾页） |
| 标签页 | `tags/<tag>/` | 该 tag **≥2 条**才生成 |
| 频道×标签组合页 | `collections/<cat>/tag/<tag>/` | 该组合 **≥3 条**才生成 |

**一句话理由**：条目页与频道页是必赚的长尾面；tag / 组合页是「数据模型每多一个 tag 就多一批着陆页」的变现器——但 Google 把「大量近似、价值稀薄的导流页」明确列为 doorway 垃圾政策，所以组合页设 3 条门槛、tag 页设 2 条门槛，宁缺毋滥。

## Findings

### 1. 门槛规则的官方依据

Google spam policies 将 **doorway abuse** 定义为「为相似查询批量建页、把用户导去中间页」的垃圾行为；「thin content with little or no added value」是明确的手动处罚标签。Sources: [Spam Policies](https://developers.google.com/search/docs/essentials/spam-policies) · [An update on doorway pages](https://developers.google.cn/search/blog/2015/03/an-update-on-doorway-pages) · [Manual actions](https://support.google.com/webmasters/answer/9044175)
→ 推论：1 个条目的 tag 页、2 条以下的组合页对用户无增量价值，不生成；随收藏增长自动解锁。

### 2. hreflang 规则（官方）

- 每个语言版本页面必须**列出自身 + 全部其他语言版本**，alternate 用**全限定 URL**（含 https）。
- 根跳转 stub 用 **`x-default`** 标注（语言/地区中立入口的官方做法）。
- Google 不用 hreflang 判断页面语言，仅用于互链归并；实现走 `<link rel="alternate">` + sitemap alternates。

Sources: [Localized Versions of your Pages](https://developers.google.com/search/docs/specialty/international/localized-versions) · [How to build x-default](https://developers.google.cn/search/blog/2023/05/x-default) · [International homepage](https://developers.google.cn/search/blog/2014/05/creating-right-homepage-for-your)

### 3. 标题/描述模板（中英双语）

- **条目页**：title `<Name> — <首个 function 标签> for <主 stack>`（如 `Liveline — realtime chart component for React`）；H1 = name；description = 条目 description。
- **标签页**：EN `<Tag> <category-noun>s – N curated libraries`；ZH `<标签名> · 精选 N 个库`（计数进标题，CTR 与预期一致性都更好）。
- **频道页**：EN `<Category> — curated UI libraries`；ZH `<频道名> · 精选 UI 库`。
- 模板在实现期微调措辞，结构不变。

### 4. 互链图（保证全量可爬）

- 频道页 ↔ 标签页（该频道下的 tag 行）双向；频道页 → 全部条目卡 → 条目页。
- 条目页 → 所属频道 + 全部 tag 页 + **Alternatives 模块**（同 function tag 的其他条目，≥2 条才渲染）——数据模型的「同 function tag = 互为替代」直接变成产品功能与内链。
- 首页 → 6 频道 + 精选条目；每页 breadcrumb（首页 › 频道 › 条目）。

## Missing evidence

- 标题模板的具体 CTR 措辞无先验数据，上线后看 Search Console 表现再调（运营期话题，不在本票）。
- 每条目 OG 分享图属品牌资产（雾区，等站名/logo 定稿），本票只保证 OG 标签结构正确。
