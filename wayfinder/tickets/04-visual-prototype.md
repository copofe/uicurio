---
id: 04-visual-prototype
title: 视觉原型
label: wayfinder:prototype
status: resolved
blocked_by: []
assignee: main
---

## Question

浅色极简画廊长什么样？做一个可 react 的粗糙原型（静态 HTML / 截图拼贴即可，不求工程正确），定：

- 首页 / 频道页 / 条目详情的版式与密度
- 卡片形态（截图为主还是图文并重）、过滤器形态（chips / 侧栏 / 混合）
- 移动端一并 react

方向既定：浅色底、界面无彩色、克制、画廊感；颜色全部来自截图内容本身。

产出：定稿视觉方向 + 原型资产链接。

## Resolution

- **定稿**：**B · 侧栏过滤**骨架（左 220px 浏览+四分面复选栏带计数，右侧响应式卡片网格）+ **图文卡**（16:10 封面 + 标题/首标签 + 两行描述）；详情含大图、官网/源码按钮、标签 chips、同功能 Alternatives 模块；浅色极简 tokens（白底 / 灰界面 / 无彩色 accent，颜色全部来自截图）。
- **原型存档**：分支 `prototype/gallery`（单文件 `prototype/gallery.html`，三变体可切换，真封面数据）——一次性产物，主分支不留。
- **执行备注**：首页可借用 C 变体的开卷气质（大标题 + 频道入口），画廊页按 B 实现。
