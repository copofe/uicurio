---
id: 05-name-domain
title: 站名与域名
label: wayfinder:grilling
status: resolved
blocked_by: []
assignee: main
---

## Question

站叫什么名字？要求：可注册的域名（.com / .dev 等优先）、无撞名、气质贴合「个人严选的 UI 库画廊」。

流程：AI 出候选清单 → 用户拍板 → 用户购买域名（约 $10 / 年，付款动作在用户）。

产出：站名 + 已注册域名。

## Resolution

- **定稿**：站名 **uicurio**（UI + curio 珍品陈列柜，直贴「个人严选」定位）；主域 **uicurio.com**，建议顺手拿下 uicurio.dev 301 到主域防混淆。
- **可用性**：RDAP 实时核验（2026-09-11）：uicurio.com / uicurio.dev 均未注册 ✅（同轮候选 uigems.com / uipantry.com / uizoo.com / uigallery.com / curioui.com 已被注册）。
- **比价存档**（2026-09-11，主人看完全部低价后缀后仍拍板 .com）：CF 成本价下 uicurio.xyz $12.30 反贵于 .com $10.46；.site/.online 首年 $4.99 续费 $27.70 刺客；最便宜的干净选项 uicurio.link $7.20 / uicurio.fyi $5.20 均落选；低价后缀在 RDAP 下全部可注册。
- **定稿（更新 2026-09-11 二次）**：站名 **uicurio**，域名走主域子域 **uicurio.shinji.me**（$0）——主人已有 shinji.me 且已托管在 Cloudflare DNS（emma/chase.ns.cloudflare.com），绑域零手工。uicurio.com 不购买；日后若自立门户再做 301 迁移（sitemap/hreflang/OG 全部走 Astro.site，改一行配置即可切换）。
- **可用性核验**：RDAP 实时核验（2026-09-11）：uicurio.com / .dev / 全部低价后缀均未注册；uicurio.shinji.me 属主人主域，无可用性问题。
