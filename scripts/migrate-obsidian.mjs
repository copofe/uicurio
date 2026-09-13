// 一次性迁移脚本：Obsidian「UI-Libs」三表 → 仓库内数据文件（票 03 定稿模型）
// 跑完即冻结：整数 id 永不再用，仅存 migrations/obsidian-id-map.json 备查。
import { mkdirSync, writeFileSync, rmSync } from "node:fs";

// 收录日期按 Obsidian 表格顺序重建（表格序 = 收藏先后）：末条 = 迁移日，逐日回溯。
// 真实日期若已知，直接改对应 data/items/<slug>.json 的 added 字段即可。
const MIGRATED = "2026-09-11";
const addedFor = (id) =>
  new Date(new Date(MIGRATED + "T00:00:00Z").getTime() - (20 - id) * 86400000)
    .toISOString()
    .slice(0, 10);

const categories = [
  {
    slug: "collections",
    parent: null,
    name: { en: "Collections", zh: "合集与套件" },
    description: {
      en: "Full libraries and copy-paste component collections — whole toolkits rather than single widgets.",
      zh: "整套库与复制即用组件集——是全套工具箱，不是单个小部件。",
    },
    order: 1,
  },
  {
    slug: "input-controls",
    parent: null,
    name: { en: "Input Controls", zh: "输入控件" },
    description: {
      en: "Widgets that take input: pickers, dials, card fields.",
      zh: "接输入的部件：取色器、旋钮、卡号输入。",
    },
    order: 2,
  },
  {
    slug: "files-code",
    parent: null,
    name: { en: "Files & Code", zh: "文件与代码" },
    description: {
      en: "Rendering and working with code, files and diffs.",
      zh: "代码、文件与 diff 的渲染和处理。",
    },
    order: 3,
  },
  {
    slug: "loading-feedback",
    parent: null,
    name: { en: "Loading & Feedback", zh: "加载与反馈" },
    description: {
      en: "Loaders, indicators and interaction feedback moments.",
      zh: "加载动画、进度指示与交互反馈。",
    },
    order: 4,
  },
  {
    slug: "data-viz",
    parent: null,
    name: { en: "Data Viz", zh: "数据可视化" },
    description: {
      en: "Charts and live data visualization.",
      zh: "图表与实时数据可视化。",
    },
    order: 5,
  },
  {
    slug: "text-typography",
    parent: null,
    name: { en: "Text & Typography", zh: "文本与排版" },
    description: {
      en: "Text and typography motion and rendering.",
      zh: "文本与排版的动效和渲染。",
    },
    order: 6,
  },
];

const tags = [
  // function
  ["diff", "function", { en: "diff", zh: "差异对比" }],
  ["file-tree", "function", { en: "file tree", zh: "文件树" }],
  [
    "loading-indicator",
    "function",
    { en: "loading indicator", zh: "加载指示" },
  ],
  ["card-input", "function", { en: "card input", zh: "卡号输入" }],
  ["color-picker", "function", { en: "color picker", zh: "取色器" }],
  ["chart", "function", { en: "chart", zh: "图表" }],
  ["animation", "function", { en: "animation", zh: "动画" }],
  ["3d", "function", { en: "3d", zh: "3D" }],
  ["pdf", "function", { en: "pdf", zh: "PDF" }],
  ["dial", "function", { en: "dial", zh: "旋钮" }],
  ["sound-effects", "function", { en: "sound effects", zh: "音效" }],
  ["text-animation", "function", { en: "text animation", zh: "文字动画" }],
  // scenario
  ["ai-native", "scenario", { en: "ai-native", zh: "AI 原生" }],
  ["realtime", "scenario", { en: "realtime", zh: "实时" }],
  // style
  ["cozy", "style", { en: "cozy", zh: "温馨治愈" }],
  ["design-engineer", "style", { en: "design-engineer", zh: "设计工程师风" }],
  // stack
  ["react", "stack", { en: "React", zh: "React" }],
  ["vue", "stack", { en: "Vue", zh: "Vue" }],
  ["svelte", "stack", { en: "Svelte", zh: "Svelte" }],
  ["solid", "stack", { en: "Solid", zh: "Solid" }],
  ["vanilla-js", "stack", { en: "vanilla JS", zh: "原生 JS" }],
  ["typescript", "stack", { en: "TypeScript", zh: "TypeScript" }],
  ["nextjs", "stack", { en: "Next.js", zh: "Next.js" }],
  ["tailwind", "stack", { en: "Tailwind CSS", zh: "Tailwind CSS" }],
  ["shadcn", "stack", { en: "shadcn/ui", zh: "shadcn/ui" }],
  ["threejs", "stack", { en: "Three.js", zh: "Three.js" }],
  ["webgl", "stack", { en: "WebGL", zh: "WebGL" }],
  ["canvas", "stack", { en: "Canvas", zh: "Canvas" }],
  ["web-audio", "stack", { en: "Web Audio", zh: "Web Audio" }],
  ["zero-dependency", "stack", { en: "zero-dependency", zh: "零依赖" }],
  ["motion", "stack", { en: "Motion", zh: "Motion" }],
];

// Obsidian Items 表 → slug 化（整数 id → slug 映射在文末冻结）
const items = [
  {
    id: 1,
    slug: "beautiful-ui",
    name: "Beautiful UI",
    cat: "collections",
    tags: ["scenario:ai-native"],
    url: "https://www.beautifului.dev/",
    repo: null,
    featured: false,
    desc: {
      en: "Curated components and patterns for AI-native interfaces.",
      zh: "面向 AI 原生界面的精选组件与模式库。",
    },
  },
  {
    id: 2,
    slug: "diffs",
    name: "Diffs",
    aliases: ["@pierre/diffs"],
    cat: "files-code",
    tags: ["function:diff"],
    url: "https://diffs.com/",
    repo: "https://github.com/pierrecomputer/pierre/tree/main/packages/diffs",
    featured: false,
    desc: {
      en: "Render code snippets and file diffs — unified/split views, merge conflicts, inline editing and annotations — built on Shiki.",
      zh: "基于 Shiki 的代码片段与文件 diff 渲染：统一/分栏视图、合并冲突、行内编辑与批注。",
    },
  },
  {
    id: 3,
    slug: "trees",
    name: "Trees",
    aliases: ["@pierre/trees"],
    cat: "files-code",
    tags: ["function:file-tree"],
    url: "https://trees.software/",
    repo: "https://github.com/pierrecomputer/pierre/tree/main/packages/trees",
    featured: false,
    desc: {
      en: "File-tree rendering with virtualization, Git status, drag-and-drop, search, context menus and built-in icon sets.",
      zh: "虚拟化文件树渲染：Git 状态、拖拽、搜索、右键菜单，内置图标集。",
    },
  },
  {
    id: 4,
    slug: "orbs",
    name: "Orbs",
    cat: "loading-feedback",
    tags: ["function:loading-indicator", "function:animation"],
    url: "https://libraries.dev/orbs",
    repo: "https://github.com/Jakubantalik/thinking-orbs",
    featured: false,
    desc: {
      en: "Animated thinking-orb loading indicator for processing and AI states.",
      zh: "「思考星球」动画加载指示器，为处理中 / AI 状态而生。",
    },
  },
  {
    id: 5,
    slug: "crd-ui",
    name: "crd-ui",
    cat: "input-controls",
    tags: [
      "function:card-input",
      "stack:react",
      "stack:vue",
      "stack:svelte",
      "stack:vanilla-js",
    ],
    url: "https://crd-ui.juanda.co/",
    repo: "https://github.com/JuandaGarcia/crd-ui",
    featured: true,
    desc: {
      en: "Dependency-free interactive credit/debit card components — brand detection, input masking, 3D flip; React, Vue, Svelte and vanilla JS.",
      zh: "零依赖交互银行卡输入组件：卡组织识别、输入掩码、3D 翻转；支持 React、Vue、Svelte 与原生 JS。",
    },
  },
  {
    id: 6,
    slug: "color-picker-paper",
    name: "Color Picker (Paper)",
    aliases: ["Paper color picker"],
    cat: "input-controls",
    tags: ["function:color-picker"],
    url: "https://invisibledetails.com/playground/color-picker",
    repo: null,
    featured: false,
    desc: {
      en: "Recreation of the Paper app's color picker; parses hex/RGB/HSL/HSB/display-p3/OKLCH and tolerates partial or malformed input.",
      zh: "Paper 应用取色器的复刻：解析 hex/RGB/HSL/HSB/display-p3/OKLCH，容错不完整或非法输入。",
    },
  },
  {
    id: 7,
    slug: "liveline",
    name: "Liveline",
    cat: "data-viz",
    tags: [
      "function:chart",
      "function:animation",
      "stack:react",
      "stack:canvas",
      "scenario:realtime",
    ],
    url: "https://benji.org/liveline",
    repo: "https://github.com/benjitaylor/liveline",
    featured: true,
    desc: {
      en: "Real-time animated line chart for React; canvas-rendered at 60fps for streaming data with line, multi-series and OHLC modes plus crosshair scrubbing; zero CSS imports.",
      zh: "React 实时动画折线图：canvas 60fps 渲染流式数据，支持单线、多序列与 OHLC 模式及十字线刷选；零 CSS 引入。",
    },
  },
  {
    id: 8,
    slug: "beui",
    name: "beUI",
    cat: "collections",
    tags: [
      "function:animation",
      "stack:react",
      "stack:nextjs",
      "stack:tailwind",
      "stack:shadcn",
      "stack:motion",
    ],
    url: "https://beui.dev",
    repo: "https://github.com/starc007/ui-components",
    featured: false,
    desc: {
      en: "Free, open-source animated components for React and Next.js built with Motion and Tailwind CSS; copy the source or install via the shadcn CLI.",
      zh: "免费开源的 React / Next.js 动效组件库，Motion + Tailwind CSS 构建；可复制源码或用 shadcn CLI 安装。",
    },
  },
  {
    id: 9,
    slug: "threeui",
    name: "ThreeUI",
    cat: "collections",
    tags: ["function:animation", "function:3d", "stack:threejs", "stack:webgl"],
    url: "https://threeui.com/ui-elements",
    repo: null,
    featured: false,
    desc: {
      en: "Interactive Three.js components, templates and shaders with polished motion, Canvas/WebGL effects and copy-ready source.",
      zh: "可交互的 Three.js 组件、模板与着色器合集：动效精致、Canvas/WebGL 特效，源码即取即用。",
    },
  },
  {
    id: 10,
    slug: "pdfcn",
    name: "pdfcn",
    cat: "files-code",
    tags: ["function:pdf", "stack:shadcn"],
    url: "https://www.pdfcn.dev",
    repo: "https://github.com/shadcn-labs/pdfcn",
    featured: false,
    desc: {
      en: "Beautifully designed, accessible and customizable PDF components built on Takumi and Forme; works with shadcn/ui.",
      zh: "基于 Takumi 与 Forme 构建的 PDF 组件集：美观、可访问、可定制，兼容 shadcn/ui。",
    },
  },
  {
    id: 11,
    slug: "dialkit",
    name: "DialKit",
    cat: "input-controls",
    tags: [
      "function:dial",
      "stack:react",
      "stack:solid",
      "stack:svelte",
      "stack:vue",
      "stack:vanilla-js",
    ],
    url: "https://www.dialkit.dev",
    repo: "https://github.com/joshpuckett/dialkit",
    featured: false,
    desc: {
      en: "Live dial controls for React, Solid, Svelte, Vue and vanilla JS; tune motion, layout, color and animation timing in place.",
      zh: "可实时调校的旋钮控件：支持 React、Solid、Svelte、Vue 与原生 JS，直接在界面里调运动、布局、色彩与动画时序。",
    },
  },
  {
    id: 12,
    slug: "cuelume",
    name: "Cuelume",
    cat: "loading-feedback",
    tags: [
      "function:sound-effects",
      "stack:web-audio",
      "stack:zero-dependency",
    ],
    url: "https://cuelume-site.pages.dev",
    repo: "https://github.com/Danilaa1/cuelume",
    featured: false,
    desc: {
      en: "Tiny dependency-free library of carefully designed interaction sounds, synthesized live with Web Audio.",
      zh: "小而美的交互音效库：零依赖，Web Audio 实时合成。",
    },
  },
  {
    id: 13,
    slug: "animal-island-ui",
    name: "Animal Island UI",
    cat: "collections",
    tags: ["style:cozy", "stack:react", "stack:typescript"],
    url: "https://guokaigdg.github.io/animal-island-ui",
    repo: "https://github.com/guokaigdg/animal-island-ui",
    featured: false,
    desc: {
      en: "Lightweight React + TypeScript component library (33 components) with an original cozy island-style design; WAI-ARIA APG accessible.",
      zh: "轻量 React + TypeScript 组件库（33 个组件），原创温馨海岛风设计，遵循 WAI-ARIA APG 无障碍标准。",
    },
  },
  {
    id: 14,
    slug: "math-curve-loaders",
    name: "Math Curve Loaders",
    cat: "loading-feedback",
    tags: ["function:loading-indicator", "function:animation"],
    url: "https://paidax01.github.io/math-curve-loaders",
    repo: "https://github.com/Paidax01/math-curve-loaders",
    featured: false,
    desc: {
      en: "Gallery of mathematical loading animations; formula-driven curve motion with live controls, code export and HTML download.",
      zh: "数学公式加载动画画廊：公式驱动的曲线运动，可实时调参、导出代码与 HTML。",
    },
  },
  {
    id: 15,
    slug: "spell-ui",
    name: "Spell UI",
    cat: "collections",
    tags: ["style:design-engineer", "stack:react", "stack:tailwind"],
    url: "https://spell.sh/",
    repo: "https://github.com/xxtomm/spell-ui",
    featured: false,
    desc: {
      en: "Refined, copy-paste React and Tailwind CSS components for design engineers — a large collection of high-quality components.",
      zh: "为设计工程师打造的 React + Tailwind CSS 组件集：精雕细琢、复制即用，量大质优。",
    },
  },
  {
    id: 16,
    slug: "calligraph",
    name: "Calligraph",
    cat: "text-typography",
    tags: [
      "style:design-engineer",
      "stack:react",
      "stack:motion",
      "function:text-animation",
    ],
    url: "https://calligraph.raphaelsalaja.com",
    repo: "https://github.com/raphaelsalaja/calligraph",
    featured: true,
    desc: {
      en: "Fluid text transitions powered by Motion; shared characters slide to new positions while entering and exiting characters fade; custom spring transitions; React 18+.",
      zh: "基于 Motion 的流畅文字转场：共有字符滑入新位置，进出字符淡入淡出；支持自定义弹簧动画；React 18+。",
    },
  },
  {
    id: 17,
    slug: "stepwise-ui",
    name: "Stepwise UI",
    cat: "collections",
    tags: ["stack:react", "stack:tailwind"],
    url: "https://ui.stepwise.studio",
    repo: "https://github.com/Stepwise-Studio/stepwise-ui",
    featured: false,
    desc: {
      en: "Growing collection of copy-paste components with its own CLI registry; plain React, Vite and Remix friendly; React 19, Tailwind CSS v4.",
      zh: "持续生长的复制即用组件集，带自有 CLI 仓库（npx stepwise-ui init/add）；对 React、Vite、Remix 友好；React 19 + Tailwind CSS v4。",
    },
  },
  {
    id: 18,
    slug: "opensource-ui",
    name: "Opensource UI",
    cat: "collections",
    tags: ["stack:react", "stack:typescript", "stack:nextjs", "stack:tailwind"],
    url: "https://opensourceui.in",
    repo: "https://github.com/bidyut10/opensourceui",
    featured: false,
    desc: {
      en: "Free, MIT-licensed copy-paste components for React and Next.js — 150+ production-ready components with live previews, built with TypeScript and Tailwind CSS v4.",
      zh: "MIT 协议的 React / Next.js 复制即用组件集：150+ 生产级组件、带实时预览，TypeScript + Tailwind CSS v4。",
    },
  },
  {
    id: 19,
    slug: "bencho",
    name: "Bencho",
    cat: "collections",
    tags: ["style:design-engineer", "stack:react", "stack:motion"],
    url: "https://bencho.dev",
    repo: null,
    featured: false,
    desc: {
      en: "Live component bench of interactive UI blocks — every block is live and adjustable; tune, bench, share, take; React + Motion.",
      zh: "活体组件试验台：每个 block 都是可调的活物——调一调、试一试、分享、带走；React + Motion。",
    },
  },
  {
    id: 20,
    slug: "spectrum-ui",
    name: "Spectrum UI",
    cat: "collections",
    tags: [
      "scenario:ai-native",
      "function:animation",
      "stack:react",
      "stack:typescript",
      "stack:nextjs",
      "stack:tailwind",
      "stack:shadcn",
      "stack:motion",
    ],
    url: "https://ui.spectrumhq.in",
    repo: "https://github.com/arihantcodes/spectrum-ui",
    featured: false,
    desc: {
      en: "Open-source, animation-ready React components and blocks for SaaS and AI apps, blending Aceternity UI, Magic UI and shadcn/ui; Next.js + Tailwind CSS + Motion.",
      zh: "为 SaaS 与 AI 应用打造的开源动效组件与区块集：融汇 Aceternity UI、Magic UI 与 shadcn/ui 之长；Next.js + Tailwind CSS + Motion。",
    },
  },
];

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
for (const c of categories)
  if (!SLUG_RE.test(c.slug)) throw new Error(`bad category slug ${c.slug}`);
for (const t of tags)
  if (!SLUG_RE.test(t[0])) throw new Error(`bad tag slug ${t[0]}`);
for (const it of items)
  if (!SLUG_RE.test(it.slug)) throw new Error(`bad item slug ${it.slug}`);

rmSync("data", { recursive: true, force: true });
mkdirSync("data/items", { recursive: true });
mkdirSync("data/categories", { recursive: true });
mkdirSync("data/_schema", { recursive: true });
for (const f of ["function", "stack", "style", "scenario"])
  mkdirSync(`data/tags/${f}`, { recursive: true });
mkdirSync("migrations", { recursive: true });

for (const c of categories) {
  writeFileSync(
    `data/categories/${c.slug}.json`,
    JSON.stringify(
      {
        slug: c.slug,
        parent: c.parent,
        name: c.name,
        description: c.description,
        order: c.order,
      },
      null,
      2,
    ) + "\n",
  );
}

const FACETS = ["function", "stack", "style", "scenario"];
for (const [slug, facet, name] of tags) {
  if (!FACETS.includes(facet)) throw new Error(`bad facet ${facet}`);
  writeFileSync(
    `data/tags/${facet}/${slug}.json`,
    JSON.stringify(
      {
        id: `${facet}:${slug}`,
        facet,
        slug,
        name,
      },
      null,
      2,
    ) + "\n",
  );
}

const idMap = {};
for (const it of items) {
  const validTags = it.tags.filter((t) =>
    tags.some(([s, f]) => `${f}:${s}` === t),
  );
  const missing = it.tags.filter((t) => !validTags.includes(t));
  if (missing.length)
    throw new Error(`item ${it.slug}: unknown tags ${missing}`);
  const cat = categories.find((c) => c.slug === it.cat);
  if (!cat) throw new Error(`item ${it.slug}: unknown category ${it.cat}`);
  writeFileSync(
    `data/items/${it.slug}.json`,
    JSON.stringify(
      {
        slug: it.slug,
        name: { en: it.name, zh: it.name },
        ...(it.aliases ? { aliases: it.aliases } : {}),
        description: it.desc,
        url: it.url,
        ...(it.repo ? { repo: it.repo } : {}),
        category: it.cat,
        tags: validTags,
        screenshot: `${it.slug}.webp`,
        featured: it.featured,
        status: "published",
        added: addedFor(it.id),
      },
      null,
      2,
    ) + "\n",
  );
  idMap[String(it.id)] = it.slug;
}
writeFileSync(
  "migrations/obsidian-id-map.json",
  JSON.stringify({ items: idMap, frozen: MIGRATED }, null, 2) + "\n",
);

console.log(
  `migrated: ${items.length} items, ${categories.length} categories, ${tags.length} tags → data/`,
);
