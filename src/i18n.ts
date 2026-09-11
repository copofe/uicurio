// 双语文案字典：构建期取用，零运行时
export const ui = {
  en: {
    tagline: "a curio cabinet of hand-picked UI libraries",
    homeIntro:
      "Every piece tried by hand, none filler. Filters below; new gems added as I find them.",
    browse: "Browse",
    all: "All libraries",
    search: "Search",
    filter: "Filters",
    function: "Function",
    stack: "Stack",
    style: "Style",
    scenario: "Scenario",
    clearFilters: "Clear filters",
    results: "libraries",
    alternatives: "Alternatives — same function",
    visitSite: "Visit site",
    source: "Source",
    added: "Added",
    featured: "Featured",
    categories: "Categories",
    curatedBy:
      "Curated by hand. Hosted static, no tracking beyond outbound clicks.",
  },
  zh: {
    tagline: "个人严选的 UI 库珍品柜",
    homeIntro: "每一件都亲手试过，没有凑数。下方可过滤，发现新宝随时收录。",
    browse: "浏览",
    all: "全部",
    search: "搜索",
    filter: "筛选",
    function: "功能",
    stack: "技术栈",
    style: "风格",
    scenario: "场景",
    clearFilters: "清除筛选",
    results: "个库",
    alternatives: "同功能替代品",
    visitSite: "访问官网",
    source: "源码",
    added: "收录于",
    featured: "精选",
    categories: "频道",
    curatedBy: "手工严选，纯静态托管；除出站点击外无任何跟踪。",
  },
} as const;
export type Locale = keyof typeof ui;
export const LOCALES: Locale[] = ["en", "zh"];
