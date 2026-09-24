<p align="center">
  <img src="public/favicon.svg" alt="UIcurio Logo" width="64" height="64" />
</p>

<h1 align="center">UIcurio</h1>

<p align="center">
  <strong>A curated cabinet of remarkable UI libraries, component sets, and creative interactions.</strong><br>
  每一件都亲手试过，没有凑数。现代 Web 界面与动效组件精选展馆。
</p>

<p align="center">
  <a href="https://uicurio.shinji.me"><strong>Explore Online (uicurio.shinji.me)</strong></a> ·
  <a href="https://uicurio.pages.dev">Mirror (Cloudflare Pages)</a>
</p>

<p align="center">
  <a href="#english">English</a> · <a href="#简体中文">简体中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Astro-7.3-FF5D01?logo=astro&logoColor=white" alt="Astro" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflarepages&logoColor=white" alt="Cloudflare Pages" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

---

<a name="english"></a>
## English

### ✨ Overview

**UIcurio** is an open-source, lightning-fast curated catalog dedicated to high-craft UI component libraries, micro-interactions, animation primitives, and design engineering gems for modern developers and designers.

Unlike generic link aggregators, every item in UIcurio is manually tested, reviewed, tagged, and given genuine bilingual descriptions — no marketing fluff, no perishable metric hype.

### 🌟 Key Features

- ⚡️ **Blazing Fast & Lightweight**: Powered by **Astro 7** static-site generation paired with a zero-framework progressive enhancement island (`vanilla JS`). Zero heavy client-side bundles.
- 🏷️ **Multi-Faceted Filtering**: Filter seamlessly across 6 major categories and 4 orthogonal facets (`Function`, `Stack`, `Style`, `Scenario`).
- 🌐 **Full Bilingual Support**: Native English and Chinese descriptions, metadata, and localized UI out of the box.
- ⌨️ **Command Palette & Keyboard First**: Press <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> to launch the command palette; full IME composition handling prevents typing jitter during Asian language input.
- 📸 **Automated Screenshot Pipeline**: Built-in Playwright + Sharp pipeline captures standardized 16:10 high-resolution WebP site previews with multi-stage fallback handling.
- 🛡️ **Zero-Dangling Integrity Gate**: Strict pre-build verification (`scripts/validate-data.mjs`) ensures zero broken references, duplicate slugs, or missing assets.

---

### 🚀 Getting Started

#### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

#### Installation

```bash
# Clone the repository
git clone https://github.com/copofe/uicurio.git
cd uicurio

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit [http://localhost:4321](http://localhost:4321) in your browser.

#### Available Scripts

```bash
npm run dev                  # Start Astro development server
npm run build                # Validate data and build static bundle into dist/
npm run preview              # Preview production build locally
npm test                     # Run Vitest test suite for island core logic
npm run validate             # Run schema and integrity data gatekeeper
npm run shots                # Capture missing screenshots for all items
npm run shots:one -- <slug>  # Capture screenshot for a specific item
```

---

### 🤝 How to Submit a New Collection

We warmly welcome submissions from authors and community creators! To recommend a new UI library or component set:

1. **Fork & Branch**: Fork this repo and create your feature branch:
   ```bash
   git checkout -b add/my-component-lib
   ```
2. **Add Item Data**: Create `data/items/<slug>.json` (use kebab-case for the slug):
   ```json
   {
     "slug": "my-library",
     "name": {
       "en": "My Library",
       "zh": "My Library"
     },
     "description": {
       "en": "Concise core selling point (60-90 characters).",
       "zh": "地道流畅的中文亮点描述。"
     },
     "url": "https://example.com/",
     "repo": "https://github.com/user/repo",
     "category": "collections",
     "tags": [
       "function:animation",
       "stack:react",
       "style:design-engineer"
     ],
     "screenshot": "my-library.webp",
     "featured": false,
     "status": "published",
     "added": "2026-09-24",
     "content": {
       "en": "Detailed overview of the library...",
       "zh": "该组件库的详细背景与特性介绍..."
     },
     "components": ["Button", "Modal", "Drawer"]
   }
   ```
3. **Capture Cover Screenshot**:
   ```bash
   npm run shots:one -- my-library
   ```
   This automatically captures `public/assets/shots/my-library.webp` (16:10 WebP).
4. **Run Validation & Tests**:
   ```bash
   npm test && npm run validate
   ```
5. **Submit a Pull Request**: Commit your changes and open a PR on GitHub!

---

### 📂 Directory Structure

```text
├── data/                    # Pure JSON database
│   ├── categories/          # 6 root categories
│   ├── items/               # Hand-picked UI items (slug.json)
│   └── tags/                # Facet tags (function, stack, style, scenario)
├── public/                  # Static assets & WebP screenshots
│   └── assets/shots/        # 16:10 WebP cover screenshots
├── scripts/                 # Automation & tooling pipelines
│   ├── shots.mjs            # Playwright screenshot engine
│   ├── validate-data.mjs    # Data schema & integrity gatekeeper
│   └── gen-wordmark.mjs     # Vector wordmark generator
├── src/                     # Astro application source
│   ├── components/          # Astro UI components
│   ├── layouts/             # Page layouts
│   ├── pages/               # Multi-locale dynamic routes
│   ├── lib/                 # Core logic & Vitest test suites
│   └── scripts/island.js    # Progressive hydration island script
└── package.json
```

---

<a name="简体中文"></a>
## 简体中文

### ✨ 项目简介

**UIcurio** 是一个专注于收录高品质现代 Web UI 组件库、动效微交互、前沿设计工程资产与交互灵感的开源静态展馆。

不同于普通的资源导航，UIcurio 坚持「每一件都亲手试过，没有凑数」，所有收录条目均经过实测与人工提炼，配备中英双语介绍与纯正设计标签。

### 🌟 核心特性

- ⚡️ **纯静态极速体验**：基于 **Astro 7** 构建，采用轻量原生 JS 渐进增强岛架构，零沉重客户端框架依赖，极速秒开。
- 🏷️ **多维分面筛选**：支持按 6 大频道（合集、输入控件、文件代码、反馈加载、数据可视化、排版字体）与 4 组正交维度（功能、技术栈、风格、场景）进行交叉筛选。
- 🌐 **原生双语支持**：全站中英双语架构，包含深度本地化的文案、标签体系与多语言 SEO 站点地图。
- ⌨️ **命令面板与全键盘交互**：支持 <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> 快捷键呼出命令面板；深度适配中文输入法合成态，拼音输入过程中零抖动。
- 📸 **自动化首屏截图管线**：内置 Playwright + Sharp 无头抓取引擎，自动对齐 16:10 视口并压缩为 WebP 格式入库。
- 🛡️ **严格数据门禁校验**：构建前强制执行数据合法性检测，杜绝重复 slug、悬空标签与缺失封面。

---

### 🚀 快速上手

```bash
# 克隆仓库
git clone https://github.com/copofe/uicurio.git
cd uicurio

# 安装依赖
npm install

# 启动本地开发服务
npm run dev
```

在浏览器打开 [http://localhost:4321](http://localhost:4321) 即可体验。

#### 常用命令

```bash
npm run dev                  # 启动本地开发服务器
npm run build                # 校验数据并打包输出至 dist/
npm run preview              # 本地预览打包产物
npm test                     # 运行核心过滤逻辑单元测试 (Vitest)
npm run validate             # 执行数据合法性门禁检查
npm run shots                # 全量补充抓取缺失的截图
npm run shots:one -- <slug>  # 拍摄指定项目的封面截图
```

---

### 🤝 参与收录贡献

欢迎提交您自研或喜爱的开源 UI 组件库！收录流程简单规范：

1. **Fork 并创建分支**：`git checkout -b add/my-lib`
2. **新增藏品数据**：在 `data/items/<slug>.json` 中填入项目信息（确保 slug 为唯一的小写连字符格式）：
   - `category`：六选一（`collections` / `input-controls` / `files-code` / `loading-feedback` / `data-viz` / `text-typography`）
   - `tags`：从现有分面标签中选择，其中 `function:*` 功能标签至少选择 1 项。
   - `description`：中英文各一段（英文 60–90 字符，中文提炼稳定卖点，不写易过期的版本号或星数）。
3. **拍摄封面截图**：
   ```bash
   npm run shots:one -- <slug>
   ```
4. **运行本地校验**：
   ```bash
   npm test && npm run validate
   ```
   确保 0 errors 后提交并发起 Pull Request！

---

### 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。
