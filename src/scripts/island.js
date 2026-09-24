// uicurio 岛：DOM 壳。纯逻辑（过滤/排序/URL 编解码）在 src/lib/island-core.ts（vitest 直测）。
// DOM 契约注册表：本文件与 Astro 模板之间的全部挂钩集中在 SEL——改 id/钩子只动 SEL 与对应模板。
import {
  decodeFilters,
  encodeFilters,
  facetCount,
  hayMatches,
  hayVariants,
  itemMatchesQuery,
  matches,
  queryTokens,
  sortItems,
} from "../lib/island-core.ts";
import { pickRelated, renderItemContent } from "../lib/item-view.ts";

/* ── DOM 契约注册表 ── */
const SEL = {
  data: "#dir-data",
  grid: "#dir-grid",
  search: "#dir-search",
  searchBox: ".searchbox",
  searchClear: ".searchbox .clear",
  empty: "#dir-empty",
  emptyClear: "#dir-empty-clear",
  sortToggle: ".sorttoggle",
  activeFiltersBar: "#dir-active-filters",
  activeFiltersList: "#dir-active-filters .active-filters-list",
  activeFiltersClear: "#dir-active-clear",
  chips: ".chip[data-tag]",
  facetToggle: "[data-facet-toggle]",
  tagFilter: "[data-tag-filter]",
  moreToggle: "[data-more-toggle]",
  menuBtn: ".topbar .menu-btn",
  searchBtn: ".topbar .search-btn",
  themeToggle: "[data-theme-toggle]",
  langSelect: "[data-lang-select]",
  drawerCount: ".drawer .count-line",
  wordmark: ".wordmark",
};

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function icon(name, size) {
  const P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.5-4.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    aur: '<path d="M7 17 17 7M8 7h9v9"/>',
    enter: '<path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/>',
    layers:
      '<path d="m12 2 10 6.5L12 15 2 8.5 12 2Z"/><path d="m2 13.5 10 6.5 10-6.5"/>',
    tag: '<path d="M12 2H4a2 2 0 0 0-2 2v8l9.3 9.3a1.7 1.7 0 0 0 2.4 0l7.6-7.6a1.7 1.7 0 0 0 0-2.4L12 2Z"/><circle cx="7.5" cy="7.5" r="1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    dice: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M12 12h.01M8 8h.01M16 8h.01M8 16h.01M16 16h.01"/>',
    globe:
      '<circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    media:
      '<rect width="18" height="14" x="3" y="5" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    list: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    arrowLeft: '<path d="m15 18-6-6 6-6"/>',
    arrowRight: '<path d="m9 18 6-6-6-6"/>',
    external:
      '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>',
  };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", size || 16);
  svg.setAttribute("height", size || 16);
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  for (const chunk of (P[name] || P.search).split("/>")) {
    if (!chunk) continue;
    const m = chunk.trim().match(/^<([a-z]+)/);
    const child = document.createElementNS(
      "http://www.w3.org/2000/svg",
      m ? m[1] : "path",
    );
    for (const a of chunk.trim().match(/([a-z0-9-]+)="([^"]*)"/g) || []) {
      const kv = a.match(/([a-z0-9-]+)="([^"]*)"/);
      if (kv) child.setAttribute(kv[1], kv[2]);
    }
    svg.appendChild(child);
  }
  return svg;
}

function hi(text, q) {
  const out = document.createDocumentFragment();
  if (!q || !text) {
    out.appendChild(document.createTextNode(text || ""));
    return out;
  }
  const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    out.appendChild(document.createTextNode(text));
    return out;
  }
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  for (const part of parts) {
    if (tokens.includes(part.toLowerCase())) {
      out.appendChild(el("mark", null, part));
    } else if (part) {
      out.appendChild(document.createTextNode(part));
    }
  }
  return out;
}

const debounce = (fn, ms) => {
  let t;
  return function (...a) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, a), ms);
  };
};

/* ── 载荷（岛 ↔ 构建期契约）── */
let U = null;
let LOCALE = "en";
let PAGE = "info";
let S = {};

function loadPayload() {
  const node = $(SEL.data);
  if (!node) return null;
  try {
    return JSON.parse(node.textContent || "{}");
  } catch (e) {
    console.error("[island] 载荷 JSON 非法", e);
    return null;
  }
}

function payloadOk(u) {
  const itemOk = (i) =>
    !!i &&
    !!i.slug &&
    !!i.name &&
    typeof i.desc === "string" &&
    Array.isArray(i.tags) &&
    typeof i.shot === "string" &&
    typeof i.added === "string";
  return (
    !!u &&
    Array.isArray(u.items) &&
    u.items.length > 0 &&
    u.items.every(itemOk) &&
    Array.isArray(u.categories) &&
    u.categories.every((c) => !!c && !!c.slug && !!c.name) &&
    !!u.tags &&
    !!u.strings &&
    typeof u.channel !== "undefined" &&
    typeof u.page === "string" &&
    typeof u.locale === "string"
  );
}

/* ── 状态 ── */
const state = {
  sel: {
    function: new Set(),
    stack: new Set(),
    style: new Set(),
    scenario: new Set(),
  },
  q: "",
  sort: "new",
  activePreviewSlug: null,
  sheetReturnURL: null,
};
const cardNodes = new Map(); // slug → SSR 卡片节点

function initCardNodes() {
  const grid = $(SEL.grid);
  if (!grid) return;
  for (const n of $$(`${SEL.grid} .card`)) {
    cardNodes.set(n.dataset.slug, n);
  }
}

const selPairs = () => {
  const pairs = [];
  for (const facet in state.sel) {
    for (const t of state.sel[facet]) pairs.push({ facet, tag: t });
  }
  return pairs;
};
const tagNames = () => U.tags;
const ctx = (skipFacet) => ({
  f: { pairs: selPairs(), q: state.q, sort: state.sort },
  sel: state.sel,
  channel: U.channel,
  skipFacet,
  tagNames: tagNames(),
});

/* ── URL 构造与双向同步（编码解码走 island-core）── */
const homeURL = () => `/${LOCALE}/`;
const itemURL = (slug) => `/${LOCALE}/item/${encodeURIComponent(slug)}/`;
const catURL = (slug) => `/${LOCALE}/collections/${encodeURIComponent(slug)}/`;
const tagPageURL = (tagId) =>
  `/${LOCALE}/tags/${encodeURIComponent(tagId.split(":")[1])}/`;
const getGalleryBase = () => {
  if (PAGE === "gallery") {
    return U && U.channel ? catURL(U.channel) : homeURL();
  }
  return location.pathname;
};
const go = (path) => {
  if (typeof path === "string" && path.startsWith("/")) location.assign(path);
};

function readURL() {
  const f = decodeFilters(location.search);
  for (const { facet, tag } of f.pairs) {
    if (U.tags[tag] && U.tags[tag].facet === facet) state.sel[facet].add(tag);
  }
  state.q = f.q;
  state.sort = f.sort === "old" ? "old" : "new";
}

function writeURL() {
  if (state.activePreviewSlug) return;
  const qs = encodeFilters({ pairs: selPairs(), q: state.q, sort: state.sort });
  const base = getGalleryBase();
  try {
    history.replaceState(null, "", qs ? `${base}?${qs}` : base);
  } catch {
    /* file:// 容错 */
  }
}

/* ── 主题 ── */
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem("uicurio.theme", t);
  } catch {
    /* 私密模式 */
  }
  for (const svg of $$(SEL.wordmark)) {
    svg.classList.remove("play");
    void svg.getBoundingClientRect();
    svg.classList.add("play");
  }
}

/* ── Toast 提示 ── */
let toastWrap = null;
let toastTimer = null;
function showToast(msg) {
  if (!toastWrap) {
    toastWrap = el("div", "toast-wrap");
    document.body.appendChild(toastWrap);
  }
  toastWrap.replaceChildren();
  const toast = el("div", "toast");
  toast.appendChild(icon("check", 14));
  toast.appendChild(document.createTextNode(msg));
  toastWrap.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 200);
  }, 2200);
}

/* ── 已选条件栏同步 ── */
function activeFiltersSync() {
  const bar = $(SEL.activeFiltersBar);
  const listEl = $(SEL.activeFiltersList);
  if (!bar || !listEl) return;

  listEl.replaceChildren();
  let count = 0;

  for (const facet in state.sel) {
    for (const tag of state.sel[facet]) {
      const meta = U.tags[tag];
      if (!meta) continue;
      const pill = el("span", "active-filter-pill");
      pill.appendChild(document.createTextNode(meta.name));
      const del = el("button", "pill-del", "×");
      del.type = "button";
      del.setAttribute("aria-label", `Remove ${meta.name}`);
      del.addEventListener("click", () => toggleTag(tag));
      pill.appendChild(del);
      listEl.appendChild(pill);
      count++;
    }
  }

  bar.hidden = count === 0;
}

/* ── 藏品卡网格：SSR 节点复用 ── */
function currentActiveList() {
  return sortItems(
    U.items.filter((i) => matches(i, ctx())),
    state.sort,
    state.q,
  );
}

function gridSync(list) {
  const grid = $(SEL.grid);
  const empty = $(SEL.empty);
  if (!grid || !empty) return;
  const visible = new Set(list.map((i) => i.slug));

  const before = new Map();
  for (const n of cardNodes.values()) {
    if (!n.classList.contains("hidden"))
      before.set(n.dataset.slug, n.getBoundingClientRect().top);
  }
  for (const item of list) {
    const n = cardNodes.get(item.slug);
    if (n) {
      n.classList.remove("hidden");
      grid.appendChild(n);
    }
  }
  for (const [slug, n] of cardNodes) {
    if (!visible.has(slug)) n.classList.add("hidden");
  }
  if (!REDUCED) {
    requestAnimationFrame(() => {
      for (const n of cardNodes.values()) {
        if (n.classList.contains("hidden")) continue;
        const prev = before.get(n.dataset.slug);
        const now = n.getBoundingClientRect().top;
        if (prev == null || Math.abs(prev - now) <= 2) continue;
        const link = n.querySelector(".card-link");
        if (!link) continue;
        link.classList.remove("enter");
        link.style.transform = `translateY(${prev - now}px)`;
        link.classList.add("flip");
        requestAnimationFrame(() => {
          link.style.transform = "";
          setTimeout(() => {
            link.classList.remove("flip");
            link.style.transform = "";
          }, 220);
        });
      }
    });
  }
  grid.toggleAttribute("hidden", list.length === 0);
  empty.hidden = list.length > 0;
  if (list.length === 0) {
    const emptyHint = empty.querySelector(".empty-cross-channel");
    if (state.q && U.channel) {
      const globalCount = U.items.filter((i) =>
        matches(i, { ...ctx(), channel: null }),
      ).length;
      if (globalCount > 0) {
        let hintEl = emptyHint;
        if (!hintEl) {
          hintEl = el("div", "empty-cross-channel");
          hintEl.style.marginTop = "14px";
          empty.appendChild(hintEl);
        }
        hintEl.replaceChildren();
        const p = el(
          "p",
          null,
          LOCALE === "zh"
            ? `当前频道无结果，但在全站找到 ${globalCount} 件匹配藏品：`
            : `No results in current channel, but found ${globalCount} ${globalCount === 1 ? "match" : "matches"} across all channels:`,
        );
        p.style.fontSize = "0.9rem";
        p.style.opacity = "0.85";
        p.style.marginBottom = "8px";
        const a = el(
          "a",
          "btn btn-primary",
          LOCALE === "zh" ? "查看全站搜索结果" : "View all results",
        );
        a.href = `/${LOCALE}/?q=${encodeURIComponent(state.q)}`;
        a.style.display = "inline-block";
        hintEl.appendChild(p);
        hintEl.appendChild(a);
      } else if (emptyHint) {
        emptyHint.remove();
      }
    } else if (emptyHint) {
      emptyHint.remove();
    }
  }
}

function chipSync() {
  for (const b of $$(SEL.chips)) {
    const id = b.dataset.tag;
    const meta = U.tags[id];
    if (!meta) continue;
    const n = facetCount(U.items, ctx(meta.facet), meta.facet, id);
    const on = state.sel[meta.facet].has(id);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.setAttribute("aria-disabled", n === 0 && !on ? "true" : "false");
    const nn = b.querySelector(".n");
    if (nn) nn.textContent = String(n);
  }

  // 同步分面标题上的已选激活角标
  for (const facet in state.sel) {
    const count = state.sel[facet].size;
    for (const badge of $$(`[data-facet-badge="${facet}"]`)) {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    }
  }

  // 若折叠溢出区内有选中的标签，自动展开保证可见
  for (const group of $$(".facet-group")) {
    const overflow = group.querySelector(".chiprow-overflow");
    const moreBtn = group.querySelector(SEL.moreToggle);
    if (overflow && moreBtn) {
      const hasActive = Array.from(overflow.querySelectorAll(SEL.chips)).some(
        (c) => c.getAttribute("aria-pressed") === "true",
      );
      if (hasActive && overflow.hidden) {
        overflow.hidden = false;
        const t = moreBtn.querySelector(".t");
        if (t) t.textContent = S.showLessTags || "Less";
      }
    }
  }
}

function drawerCountSync(list) {
  const line = $(SEL.drawerCount);
  if (line) line.textContent = `${list.length} `;
}

function toggleTag(tag) {
  const facet = U.tags[tag]?.facet;
  if (!facet) return;
  if (state.sel[facet].has(tag)) state.sel[facet].delete(tag);
  else state.sel[facet].add(tag);
  refresh();
}

function clearFiltersAndRefresh() {
  for (const f in state.sel) state.sel[f].clear();
  state.q = "";
  const input = $(SEL.search);
  if (input) {
    input.value = "";
    $(SEL.searchBox).classList.remove("has-value");
  }
  refresh();
}

function refresh() {
  const list = currentActiveList();
  chipSync();
  gridSync(list);
  activeFiltersSync();
  drawerCountSync(list);
  writeURL();
}

function randomPick() {
  const list = currentActiveList();
  const pool = list.length ? list : U.items;
  if (!pool.length) return;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  if (PAGE === "gallery") {
    openSheet(picked.slug);
  } else {
    go(itemURL(picked.slug));
  }
}

/* ── 居中大画布剧场弹窗 (Dribbble-style Showcase Modal) ── */
let sheetScrim = null;
let sheetPanel = null;
let sheetFloatPrev = null;
let sheetFloatNext = null;
let sheetFloatClose = null;

function buildSheet() {
  sheetScrim = el("div", "sheet-scrim");
  // 点击遮罩外围背景关闭弹窗
  sheetScrim.addEventListener("click", (e) => {
    if (e.target === sheetScrim) closeSheet();
  });

  // 悬浮左右翻页微控件 (Dribbble 标志性悬浮导航)
  sheetFloatPrev = el("button", "sheet-float-nav sheet-float-prev");
  sheetFloatPrev.type = "button";
  sheetFloatPrev.setAttribute("aria-label", "Previous (←)");
  sheetFloatPrev.title = "Previous (←)";
  sheetFloatPrev.appendChild(icon("arrowLeft", 20));

  sheetFloatNext = el("button", "sheet-float-nav sheet-float-next");
  sheetFloatNext.type = "button";
  sheetFloatNext.setAttribute("aria-label", "Next (→)");
  sheetFloatNext.title = "Next (→)";
  sheetFloatNext.appendChild(icon("arrowRight", 20));

  // 悬浮关闭（头部导航已移除，关闭是唯一常驻控件；不复用 .sheet-float-nav，那个 <1360px 会隐藏）
  sheetFloatClose = el("button", "sheet-float-close");
  sheetFloatClose.type = "button";
  sheetFloatClose.setAttribute("aria-label", S.close || "Close");
  sheetFloatClose.title = `${S.close || "Close"} (Esc)`;
  sheetFloatClose.appendChild(icon("x", 18));
  sheetFloatClose.addEventListener("click", () => closeSheet());

  sheetPanel = el("article", "sheet-panel");
  sheetPanel.setAttribute("role", "dialog");
  sheetPanel.setAttribute("aria-modal", "true");
  sheetPanel.setAttribute("aria-label", S.preview || "Preview");
  // 阻止弹窗内部点击冒泡关闭
  sheetPanel.addEventListener("click", (e) => e.stopPropagation());

  sheetScrim.appendChild(sheetFloatPrev);
  sheetScrim.appendChild(sheetFloatNext);
  sheetScrim.appendChild(sheetFloatClose);
  sheetScrim.appendChild(sheetPanel);
  document.body.appendChild(sheetScrim);
}

function openSheet(slug, fromPopState = false) {
  const item = U.items.find((i) => i.slug === slug);
  if (!item) return;

  const wasOpen = sheetPanel && sheetPanel.classList.contains("open");
  if (!wasOpen) {
    state.sheetReturnURL = location.pathname + location.search + location.hash;
  }
  lastFocus = document.activeElement;
  state.activePreviewSlug = slug;

  const activeList = currentActiveList();
  const idx = activeList.findIndex((i) => i.slug === slug);
  const prevItem = idx > 0 ? activeList[idx - 1] : null;
  const nextItem =
    idx >= 0 && idx < activeList.length - 1 ? activeList[idx + 1] : null;

  // 联动更新悬浮翻页按钮状态
  if (prevItem) {
    sheetFloatPrev.disabled = false;
    sheetFloatPrev.title = `← ${S.pagerPrev || "Previous"}: ${prevItem.name}`;
    sheetFloatPrev.setAttribute("aria-label", sheetFloatPrev.title);
    sheetFloatPrev.onclick = (e) => {
      e.stopPropagation();
      openSheet(prevItem.slug);
    };
  } else {
    sheetFloatPrev.disabled = true;
    sheetFloatPrev.title = S.pagerPrev || "Previous";
    sheetFloatPrev.setAttribute("aria-label", sheetFloatPrev.title);
    sheetFloatPrev.onclick = null;
  }

  if (nextItem) {
    sheetFloatNext.disabled = false;
    sheetFloatNext.title = `${nextItem.name} · ${S.pagerNext || "Next"} →`;
    sheetFloatNext.setAttribute("aria-label", sheetFloatNext.title);
    sheetFloatNext.onclick = (e) => {
      e.stopPropagation();
      openSheet(nextItem.slug);
    };
  } else {
    sheetFloatNext.disabled = true;
    sheetFloatNext.title = S.pagerNext || "Next";
    sheetFloatNext.setAttribute("aria-label", sheetFloatNext.title);
    sheetFloatNext.onclick = null;
  }

  // 内容区（署名行→封面→正文→同柜推荐）由 item-view.ts 单一渲染源生成，与详情页共用同一模板

  const view = itemViewOf(item);
  const related = pickRelated(U.items.map(itemViewOf), view);
  // 共享渲染器输出的全部插值均经 item-view esc() 转义（数据为策展受控内容）
  const fragment = document
    .createRange()
    .createContextualFragment(renderItemContent(view, related, LOCALE));
  sheetPanel.replaceChildren(fragment);

  // 行为委托：相关卡→换片（拦截导航）；标签芯片→关闭并切换筛选（详情页则自然导航）
  sheetPanel.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const rel = e.target.closest
      ? e.target.closest("[data-related-slug]")
      : null;
    if (rel) {
      e.preventDefault();
      openSheet(rel.getAttribute("data-related-slug"));
      return;
    }
    const tagChip = e.target.closest ? e.target.closest("[data-tag-id]") : null;
    if (tagChip) {
      e.preventDefault();
      closeSheet();
      toggleTag(tagChip.getAttribute("data-tag-id"));
    }
  });

  const body = sheetPanel.querySelector(".sheet-body");
  body.appendChild(buildSheetPager(prevItem, nextItem));

  // 打开动效与视口重置
  if (sheetPanel) sheetPanel.scrollTop = 0;
  sheetScrim.scrollTop = 0;
  sheetScrim.classList.add("open");
  sheetPanel.classList.add("open");
  document.body.style.overflow = "hidden";

  // URL push / replace state
  if (fromPopState !== true) {
    try {
      if (wasOpen) {
        history.replaceState({ preview: slug }, "", itemURL(slug));
      } else {
        history.pushState({ preview: slug }, "", itemURL(slug));
      }
    } catch {}
  }
}

/** 弹窗底部翻页器：跟随当前筛选列表的动态上一件/下一件（详情页的翻页器是 SSR 的，不入共享区） */
function buildSheetPager(prevItem, nextItem) {
  const pager = el("nav", "sheet-pager");
  const prevPagerBtn = el("button", "sheet-pager-btn");
  prevPagerBtn.type = "button";
  prevPagerBtn.appendChild(icon("arrowLeft", 14));
  const prevText = prevItem
    ? `${S.pagerPrev || "Previous"}: ${prevItem.name}`
    : S.pagerPrev || "Previous";
  prevPagerBtn.appendChild(el("span", null, prevText));
  if (prevItem) {
    prevPagerBtn.addEventListener("click", () => openSheet(prevItem.slug));
  } else {
    prevPagerBtn.disabled = true;
  }
  pager.appendChild(prevPagerBtn);

  const nextPagerBtn = el("button", "sheet-pager-btn");
  nextPagerBtn.type = "button";
  const nextText = nextItem
    ? `${nextItem.name} · ${S.pagerNext || "Next"}`
    : S.pagerNext || "Next";
  nextPagerBtn.appendChild(el("span", null, nextText));
  nextPagerBtn.appendChild(icon("arrowRight", 14));
  if (nextItem) {
    nextPagerBtn.addEventListener("click", () => openSheet(nextItem.slug));
  } else {
    nextPagerBtn.disabled = true;
  }
  pager.appendChild(nextPagerBtn);
  return pager;
}

function closeSheet(fromPopState = false) {
  if (!sheetPanel || !sheetPanel.classList.contains("open")) return;
  sheetPanel.classList.remove("open");
  sheetScrim.classList.remove("open");
  document.body.style.overflow = "";
  state.activePreviewSlug = null;

  if (fromPopState === true) {
    state.sheetReturnURL = null;
  } else {
    const qs = encodeFilters({
      pairs: selPairs(),
      q: state.q,
      sort: state.sort,
    });
    const fallback = qs ? `${getGalleryBase()}?${qs}` : getGalleryBase();
    const returnURL = state.sheetReturnURL || fallback;
    state.sheetReturnURL = null;
    try {
      history.replaceState(null, "", returnURL);
    } catch {}
  }

  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

/* ── 遮罩 / 抽屉 / 快捷键弹窗 / 命令面板 ── */
let scrim;
let drawer;
let palette;
let lastFocus = null;

function buildScrim() {
  scrim = el("div", "scrim");
  scrim.hidden = true;
  scrim.addEventListener("click", closeAll);
  document.body.appendChild(scrim);
}

function channelRows(container) {
  const list = el("nav", "navlist");
  list.setAttribute("aria-label", S.pgChannels);
  for (const c of U.categories) {
    const n = U.items.filter((i) => i.cat === c.slug).length;
    const a = el("a", "navrow");
    a.href = catURL(c.slug);
    if (U.channel && c.slug === U.channel)
      a.setAttribute("aria-current", "page");
    const dot = el("i", "dot");
    dot.setAttribute("aria-hidden", "true");
    a.appendChild(dot);
    a.appendChild(el("span", null, c.name));
    a.appendChild(el("span", "count", String(n)));
    list.appendChild(a);
  }
  container.appendChild(list);
}

function facetGroups(container) {
  // 移动端抽屉内的标签搜索
  const searchWrap = el("div", "side-tag-filter-wrap");
  const searchBox = el("div", "side-tag-search");
  searchBox.appendChild(icon("search", 13));
  const searchInput = el("input");
  searchInput.type = "search";
  searchInput.placeholder = S.filterTagsPh || "Filter tags…";
  searchInput.dataset.tagFilter = "";
  searchInput.setAttribute("aria-label", S.filterTagsPh || "Filter tags…");
  searchBox.appendChild(searchInput);
  searchWrap.appendChild(searchBox);
  container.appendChild(searchWrap);

  for (const f of U.facets) {
    const group = el("div", "facet-group");
    group.dataset.facet = f.key;
    const head = el("button", "facet-head");
    head.type = "button";
    head.dataset.facetToggle = f.key;
    head.appendChild(el("span", "side-label", f.name));
    const badge = el("span", "facet-active-badge", "0");
    badge.dataset.facetBadge = f.key;
    badge.hidden = true;
    head.appendChild(badge);
    head.appendChild(icon("arrowRight", 12)).classList.add("facet-arrow");
    head.addEventListener("click", () => {
      group.classList.toggle("collapsed");
    });
    group.appendChild(head);

    const facetTagKeys = Object.keys(U.tags)
      .filter((t) => U.tags[t].facet === f.key)
      .sort((a, b) => {
        const countA = U.items.filter((i) => i.tags.includes(a)).length;
        const countB = U.items.filter((i) => i.tags.includes(b)).length;
        return countB - countA;
      });

    const INITIAL_LIMIT = 6;
    const initialTags = facetTagKeys.slice(0, INITIAL_LIMIT);
    const moreTags = facetTagKeys.slice(INITIAL_LIMIT);

    const row = el("div", "chiprow");
    for (const t of initialTags) row.appendChild(chipEl(t));

    if (moreTags.length > 0) {
      const overflow = el("div", "chiprow-overflow");
      overflow.hidden = true;
      for (const t of moreTags) overflow.appendChild(chipEl(t));
      row.appendChild(overflow);

      const moreBtn = el("button", "chip chip-more");
      moreBtn.type = "button";
      moreBtn.dataset.moreToggle = "";
      moreBtn.dataset.moreCount = String(moreTags.length);
      moreBtn.appendChild(
        el("span", "t", `+${moreTags.length} ${S.showMoreTags || "more"}`),
      );
      row.appendChild(moreBtn);
    }

    group.appendChild(row);
    container.appendChild(group);
  }
}

function chipEl(tag) {
  const meta = U.tags[tag];
  const b = el("button", "chip");
  b.type = "button";
  b.dataset.tag = tag;
  b.setAttribute(
    "aria-pressed",
    state.sel[meta.facet].has(tag) ? "true" : "false",
  );
  b.appendChild(el("span", "t", meta.name));
  b.appendChild(el("span", "n", "0"));
  return b;
}

function buildDrawer() {
  drawer = el("aside", "drawer");
  drawer.setAttribute("aria-label", S.pgChannels);
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-modal", "true");

  const head = el("div", "drawer-head");
  const brandLink = el("a", "brand");
  brandLink.href = homeURL();
  brandLink.setAttribute("aria-label", "Uicurio — home");
  const wm = document.querySelector(SEL.wordmark);
  if (wm) brandLink.appendChild(wm.cloneNode(true));
  head.appendChild(brandLink);
  const langSel = el("select", "langsel");
  langSel.setAttribute("aria-label", "Language");
  langSel.dataset.langSelect = "";
  for (const [code, label] of [
    ["en", "English"],
    ["zh", "中文"],
  ]) {
    const opt = el("option", null, label);
    opt.value = code;
    if (code === LOCALE) opt.selected = true;
    langSel.appendChild(opt);
  }
  head.appendChild(langSel);
  const themeBtn = el("button", "iconbtn");
  themeBtn.type = "button";
  themeBtn.setAttribute("data-theme-toggle", "");
  themeBtn.setAttribute("aria-label", S.themeLabel);
  themeBtn.appendChild(icon("sun", 15)).classList.add("i-sun");
  themeBtn.appendChild(icon("moon", 15)).classList.add("i-moon");
  head.appendChild(themeBtn);
  const close = el("button", "iconbtn");
  close.type = "button";
  close.setAttribute("aria-label", "Close");
  close.appendChild(icon("x", 18));
  close.addEventListener("click", closeAll);
  head.appendChild(close);
  drawer.appendChild(head);

  const drawerBody = el("div", "drawer-body");
  const chBlock = el("div");
  chBlock.appendChild(el("p", "side-label", S.pgChannels));
  channelRows(chBlock);
  drawerBody.appendChild(chBlock);
  if (PAGE === "gallery") {
    const fBlock = el("div");
    facetGroups(fBlock);
    drawerBody.appendChild(fBlock);
  }
  drawer.appendChild(drawerBody);

  const foot = el("div", "drawer-foot");
  const wipe = el("button", "btn btn-ghost");
  wipe.type = "button";
  wipe.textContent = S.drawerClear;
  wipe.addEventListener("click", clearFiltersAndRefresh);
  foot.appendChild(wipe);
  const done = el("button", "btn btn-solid");
  done.type = "button";
  done.appendChild(el("span", "grow", S.showResults));
  done.appendChild(el("span", "count-line", ""));
  done.addEventListener("click", closeAll);
  foot.appendChild(done);
  drawer.appendChild(foot);

  document.body.appendChild(drawer);
}

function openDrawer() {
  lastFocus = document.activeElement;
  drawer.classList.add("open");
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add("open"));
  document.body.style.overflow = "hidden";
  const first = drawer.querySelector("button, a");
  if (first) first.focus();
}

function closeAll() {
  closeSheet();
  if (drawer && drawer.classList.contains("open")) {
    drawer.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (palette && palette.classList.contains("open")) closePalette();
  if (scrim) {
    scrim.classList.remove("open");
    setTimeout(() => {
      if (
        !drawer.classList.contains("open") &&
        !(palette && palette.classList.contains("open"))
      )
        scrim.hidden = true;
    }, 240);
  }
}

/* ── 命令面板 ── */
let pInput;
let pList;
let pRows = [];
let pIndex = 0;
let pOpener = null;

function buildPalette() {
  palette = el("div", "palette");
  palette.setAttribute("role", "dialog");
  palette.setAttribute("aria-modal", "true");
  palette.setAttribute("aria-label", "Command palette");

  const head = el("div", "palette-head");
  head.appendChild(icon("search", 16));
  pInput = document.createElement("input");
  pInput.type = "text";
  pInput.placeholder = S.palettePh;
  pInput.setAttribute("aria-label", "Command palette");
  pInput.setAttribute("role", "combobox");
  pInput.setAttribute("aria-expanded", "false");
  pInput.addEventListener("input", debounce(renderPalette, 80));
  head.appendChild(pInput);
  head.appendChild(el("kbd", null, "esc"));
  palette.appendChild(head);

  pList = el("div", "palette-list");
  pList.setAttribute("role", "listbox");
  palette.appendChild(pList);

  const foot = el("div", "palette-foot");
  for (const pair of [
    ["↑↓", LOCALE === "zh" ? "选择" : "Navigate"],
    [null, "enter", LOCALE === "zh" ? "打开" : "Open"],
    ["esc", LOCALE === "zh" ? "关闭" : "Close"],
  ]) {
    const s = el("span");
    if (pair[0]) s.appendChild(el("kbd", null, pair[0]));
    else s.appendChild(icon("enter", 12));
    s.appendChild(document.createTextNode(pair[pair.length - 1]));
    foot.appendChild(s);
  }
  palette.appendChild(foot);
  document.body.appendChild(palette);

  pInput.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveP(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveP(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      runP();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeAll();
    }
  });
}

function openPalette(opener) {
  pOpener = opener || document.activeElement;
  palette.classList.add("open");
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add("open"));
  pInput.value = "";
  renderPalette();
  pInput.focus();
}

function closePalette() {
  palette.classList.remove("open");
  pInput.setAttribute("aria-expanded", "false");
  if (pOpener && pOpener.focus) pOpener.focus();
}

function paletteData(q) {
  const rows = [];
  const ql = (q || "").toLowerCase();

  // 动作指令 Actions
  const actionList = [
    {
      kind: "action",
      act: "theme",
      name: S.actTheme || "Toggle theme",
      ico: "sun",
      meta: "Action",
    },
    {
      kind: "action",
      act: "random",
      name: S.actRandom || "Random pick",
      ico: "dice",
      meta: "Action",
    },
    {
      kind: "action",
      act: "clear",
      name: S.actClear || "Clear all filters",
      ico: "x",
      meta: "Action",
    },
    {
      kind: "action",
      act: "lang",
      name: S.actLang || "Switch language",
      ico: "globe",
      meta: "Action",
    },
  ];

  const matchedActions = actionList.filter(
    (a) => !ql || a.name.toLowerCase().includes(ql) || a.act.includes(ql),
  );
  if (matchedActions.length) {
    rows.push({ label: S.actions || "Actions", rows: matchedActions });
  }

  // 藏品 Items（不搜 tag，搜名称/描述/双语/组件/仓库）
  const items = sortItems(
    U.items.filter((it) => itemMatchesQuery(it, q)),
    "new",
    q,
  ).slice(0, 8);
  if (items.length) {
    const g = { label: S.pgItems, rows: [] };
    for (const it of items)
      g.rows.push({
        kind: "item",
        slug: it.slug,
        name: it.name,
        meta: catName(it.cat),
        cover: it.shot,
        q: ql,
      });
    rows.push(g);
  }

  // 频道 Channels（与主检索同一套归一化：分隔符/中英混排空格互通）
  const chans = U.categories.filter((c) => {
    if (!ql) return true;
    const chanHay = hayVariants(`${c.slug} ${c.name}`);
    return queryTokens(ql).every((tok) => hayMatches(chanHay, tok));
  });
  if (chans.length) {
    const g2 = { label: S.pgChannels, rows: [] };
    for (const c of chans)
      g2.rows.push({
        kind: "channel",
        slug: c.slug,
        name: c.name,
        meta: String(U.items.filter((i) => i.cat === c.slug).length),
      });
    rows.push(g2);
  }

  // 标签 Tags（与主检索同一套归一化）
  const tags = Object.keys(U.tags)
    .filter((t) => {
      if (!ql) return true;
      const tag = U.tags[t];
      const tagHay = hayVariants(
        `${t} ${tag.name} ${tag.altName || ""} ${tag.slug || ""}`,
      );
      return queryTokens(ql).every((tok) => hayMatches(tagHay, tok));
    })
    .slice(0, 8);
  if (tags.length) {
    const g3 = { label: S.pgTags, rows: [] };
    for (const t of tags) {
      const on = state.sel[tagFacet(t)] ? state.sel[tagFacet(t)].has(t) : false;
      g3.rows.push({
        kind: "tag",
        tag: t,
        name: U.tags[t].name,
        meta: on ? S.pSelected : S.pAdd,
      });
    }
    rows.push(g3);
  }
  return rows;
}

function renderPalette() {
  const q = pInput.value.trim();
  const data = paletteData(q);
  pList.replaceChildren();
  pRows = [];
  let count = 0;
  for (const g of data) {
    pList.appendChild(el("div", "palette-group", g.label));
    for (const r of g.rows) {
      const row = el("button", "prow");
      row.type = "button";
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", "false");
      if (r.kind === "item") {
        const thumb = el("span", "thumb");
        const img = el("img");
        img.src = `/assets/shots/${r.cover}`;
        img.alt = "";
        img.loading = "lazy";
        thumb.appendChild(img);
        row.appendChild(thumb);
        const nm = el("span", "p-name");
        nm.appendChild(hi(r.name, r.q));
        row.appendChild(nm);
      } else {
        const ic = el("span", "p-ico");
        const paletteIcon =
          r.kind === "action" ? r.ico : r.kind === "channel" ? "layers" : "tag";
        ic.appendChild(icon(paletteIcon, 14));
        row.appendChild(ic);
        const nm = el("span", "p-name");
        nm.appendChild(hi(r.name, r.q));
        row.appendChild(nm);
      }
      row.appendChild(
        el("span", r.kind === "action" ? "p-action" : "p-meta", r.meta),
      );
      row.addEventListener("click", () => runRowAt(r));
      pList.appendChild(row);
      pRows.push({ data: r, node: row });
      count++;
    }
  }
  if (!count) pList.appendChild(el("div", "palette-empty", S.paletteEmpty));
  pIndex = 0;
  paintP();
}

function paintP() {
  pRows.forEach((r, i) => {
    r.node.classList.toggle("active", i === pIndex);
    r.node.setAttribute("aria-selected", i === pIndex ? "true" : "false");
  });
  const act = pRows[pIndex] && pRows[pIndex].node;
  if (act) {
    if (!act.id) act.id = `prow-${pIndex}`;
    pInput.setAttribute("aria-activedescendant", act.id);
    const top = act.offsetTop;
    if (top < pList.scrollTop + 8) pList.scrollTop = top - 8;
    else if (top + act.offsetHeight > pList.scrollTop + pList.clientHeight - 8)
      pList.scrollTop = top + act.offsetHeight - pList.clientHeight + 8;
  }
}

function moveP(d) {
  if (!pRows.length) return;
  pIndex = (pIndex + d + pRows.length) % pRows.length;
  paintP();
}

function runP() {
  if (pRows[pIndex]) runRowAt(pRows[pIndex].data);
}

const catName = (slug) => {
  const c = U.categories.find((x) => x.slug === slug);
  return c ? c.name : slug;
};
const tagFacet = (t) => (U.tags[t] ? U.tags[t].facet : null);
/** 载荷条目 → 共享渲染器视图（item-view.ts 的 ItemView） */
const itemViewOf = (i) => ({
  slug: i.slug,
  name: i.name,
  desc: i.desc,
  url: i.url,
  repo: i.repo || null,
  shot: i.shot,
  content: i.content || "",
  components: i.components || [],
  catName: catName(i.cat),
  catHref: catURL(i.cat),
  tags: (i.tags || []).map((id) => ({
    id,
    name: U.tags[id] ? U.tags[id].name : id,
    href: `/${LOCALE}/tags/${(U.tags[id] && U.tags[id].slug) || id.split(":")[1]}/`,
  })),
});

function runRowAt(r) {
  if (r.kind === "action") {
    closeAll();
    if (r.act === "theme") {
      applyTheme(
        document.documentElement.dataset.theme === "dark" ? "light" : "dark",
      );
    } else if (r.act === "lang") {
      const other = LOCALE === "en" ? "zh" : "en";
      const path = location.pathname.startsWith(`/${LOCALE}/`)
        ? location.pathname.replace(`/${LOCALE}/`, `/${other}/`)
        : `/${other}/`;
      location.assign(path + location.search);
    } else if (r.act === "random") {
      randomPick();
    } else if (r.act === "clear") {
      clearFiltersAndRefresh();
    }
  } else if (r.kind === "item") {
    if (PAGE === "gallery") {
      closeAll();
      openSheet(r.slug);
    } else {
      go(itemURL(r.slug));
    }
  } else if (r.kind === "channel") {
    go(catURL(r.slug));
  } else if (r.kind === "tag") {
    if (PAGE === "gallery") {
      toggleTag(r.tag);
      closeAll();
    } else {
      const n = U.items.filter((i) => i.tags.includes(r.tag)).length;
      go(
        n >= 2
          ? tagPageURL(r.tag)
          : itemURL(U.items.find((i) => i.tags.includes(r.tag)).slug),
      );
    }
  }
}

function bindGlobalKeys() {
  document.addEventListener("keydown", (e) => {
    const isPaletteOpen = palette && palette.classList.contains("open");
    const isDrawerOpen = drawer && drawer.classList.contains("open");
    const isSheetOpen = sheetPanel && sheetPanel.classList.contains("open");
    const isAnyOverlayOpen = isPaletteOpen || isDrawerOpen || isSheetOpen;

    // 忽略所有附带 Cmd / Ctrl / Alt 的修饰键组合，避免抢占浏览器系统级行为
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    // Escape 关闭浮层
    if (e.key === "Escape" && isAnyOverlayOpen) {
      e.preventDefault();
      closeAll();
      return;
    }

    const t = e.target;
    const isTyping =
      t &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable);

    if (isTyping) return;

    // 弹窗内左右切换
    if (isSheetOpen) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const activeList = currentActiveList();
        const idx = activeList.findIndex(
          (i) => i.slug === state.activePreviewSlug,
        );
        if (idx > 0) openSheet(activeList[idx - 1].slug);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const activeList = currentActiveList();
        const idx = activeList.findIndex(
          (i) => i.slug === state.activePreviewSlug,
        );
        if (idx >= 0 && idx < activeList.length - 1)
          openSheet(activeList[idx + 1].slug);
      }
      return;
    }

    // 详情页键盘左右翻页
    if (PAGE === "info" && !isAnyOverlayOpen) {
      if (e.key === "ArrowLeft") {
        const older = $(
          ".sheet-float-prev, .sheet-pager a.sheet-pager-prev, .pager a:not(.next)",
        );
        if (older) older.click();
      } else if (e.key === "ArrowRight") {
        const newer = $(
          ".sheet-float-next, .sheet-pager a.sheet-pager-next, .pager a.next",
        );
        if (newer) newer.click();
      }
    }
  });
}

/* ── 顶栏绑定 ── */
function buildTopbar() {
  const burger = $(SEL.menuBtn);
  if (burger) burger.addEventListener("click", openDrawer);
  const searchBtn = $(SEL.searchBtn);
  if (searchBtn)
    searchBtn.addEventListener("click", () => openPalette(searchBtn));
}

/* ── 工具行绑定 ── */
function buildToolbar() {
  const input = $(SEL.search);
  if (input) {
    if (state.q) {
      input.value = state.q;
      $(SEL.searchBox).classList.add("has-value");
    }
    input.addEventListener(
      "input",
      debounce(() => {
        state.q = input.value.trim();
        $(SEL.searchBox).classList.toggle("has-value", !!input.value);
        refresh();
      }, 120),
    );
    const clear = $(SEL.searchClear);
    if (clear)
      clear.addEventListener("click", () => {
        input.value = "";
        state.q = "";
        $(SEL.searchBox).classList.remove("has-value");
        refresh();
        input.focus();
      });
  }

  const sortBtn = $(SEL.sortToggle);
  if (sortBtn) {
    const paintSort = () => {
      sortBtn.dataset.sort = state.sort;
      const t = sortBtn.querySelector(".t");
      if (t) t.textContent = state.sort === "old" ? S.sortOld : S.sortNew;
    };
    paintSort();
    sortBtn.addEventListener("click", () => {
      state.sort = state.sort === "new" ? "old" : "new";
      paintSort();
      refresh();
    });
  }

  // 清空已选条件
  const activeClear = $(SEL.activeFiltersClear);
  if (activeClear)
    activeClear.addEventListener("click", clearFiltersAndRefresh);

  const fbtn = $(".filterbtn");
  if (fbtn) fbtn.addEventListener("click", openDrawer);

  const emptyClear = $(SEL.emptyClear);
  if (emptyClear) emptyClear.addEventListener("click", clearFiltersAndRefresh);
}

/* ── 侧栏分面手风琴与标签搜索绑定 ── */
function buildSidebarAccordions() {
  for (const btn of $$(SEL.facetToggle)) {
    btn.addEventListener("click", () => {
      const group = btn.closest(".facet-group");
      if (group) {
        group.classList.toggle("collapsed");
        btn.setAttribute(
          "aria-expanded",
          group.classList.contains("collapsed") ? "false" : "true",
        );
      }
    });
  }

  // "+N 展开" 按钮委派
  document.addEventListener("click", (e) => {
    const moreBtn =
      e.target && e.target.closest ? e.target.closest(SEL.moreToggle) : null;
    if (moreBtn) {
      e.preventDefault();
      const group = moreBtn.closest(".facet-group");
      if (group) {
        const overflow = group.querySelector(".chiprow-overflow");
        if (overflow) {
          overflow.hidden = !overflow.hidden;
          const t = moreBtn.querySelector(".t");
          const count = moreBtn.dataset.moreCount || "";
          if (t) {
            t.textContent = overflow.hidden
              ? `+${count} ${S.showMoreTags || "more"}`
              : S.showLessTags || "Less";
          }
        }
      }
    }
  });

  // 侧栏标签即时检索过滤
  const tagFilterInputs = $$(SEL.tagFilter);
  for (const input of tagFilterInputs) {
    input.addEventListener(
      "input",
      debounce(() => {
        const q = input.value.trim().toLowerCase();
        for (const group of $$(".facet-group")) {
          let matchInGroup = 0;
          const chips = Array.from(group.querySelectorAll(SEL.chips));
          for (const chip of chips) {
            const t =
              chip.querySelector(".t")?.textContent?.toLowerCase() || "";
            const isMatch = !q || t.includes(q);
            chip.style.display = isMatch ? "" : "none";
            if (isMatch) matchInGroup++;
          }
          const overflow = group.querySelector(".chiprow-overflow");
          const moreBtn = group.querySelector(SEL.moreToggle);
          if (q) {
            if (overflow) overflow.hidden = false;
            if (moreBtn) moreBtn.style.display = "none";
            group.classList.remove("collapsed");
            group.style.display = matchInGroup > 0 ? "" : "none";
          } else {
            if (overflow) overflow.hidden = true;
            if (moreBtn) {
              moreBtn.style.display = "";
              const t = moreBtn.querySelector(".t");
              const count = moreBtn.dataset.moreCount || "";
              if (t) t.textContent = `+${count} ${S.showMoreTags || "more"}`;
            }
            group.style.display = "";
          }
        }
      }, 70),
    );
  }
}

/* ── 启动 ── */
U = loadPayload();
if (!U || !payloadOk(U)) {
  console.error("[island] 载荷形状不符——构建期与岛的契约断了，岛停用");
} else {
  LOCALE = U.locale;
  PAGE = U.page;
  S = U.strings;

  readURL();
  initCardNodes();
  buildScrim();
  buildSheet();
  buildDrawer();
  buildPalette();
  buildTopbar();
  buildSidebarAccordions();
  bindGlobalKeys();

  // 浏览器前进/后退 popstate 联动
  window.addEventListener("popstate", (e) => {
    if (e.state && e.state.preview) {
      openSheet(e.state.preview, true);
    } else if (sheetPanel && sheetPanel.classList.contains("open")) {
      closeSheet(true);
    }
  });

  // 主题切换
  for (const b of $$(SEL.themeToggle)) {
    b.addEventListener("click", () =>
      applyTheme(
        document.documentElement.dataset.theme === "dark" ? "light" : "dark",
      ),
    );
  }

  // 语言切换
  for (const sel of $$(SEL.langSelect)) {
    if (!sel.value) sel.value = LOCALE;
    sel.addEventListener("change", () => {
      const code = sel.value;
      const path = location.pathname.startsWith(`/${LOCALE}/`)
        ? location.pathname.replace(`/${LOCALE}/`, `/${code}/`)
        : `/${code}/`;
      location.assign(path + location.search);
    });
  }

  // 卡片点击与委托
  document.addEventListener("click", (e) => {
    // 复制链接委派
    const copyBtn =
      e.target && e.target.closest ? e.target.closest("[data-copy-url]") : null;
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      const url = copyBtn.dataset.copyUrl;
      if (url) {
        navigator.clipboard.writeText(url).then(() => {
          showToast(S.copied || "Link copied!");
        });
      }
      return;
    }

    // 标签 Chip 委派
    const chip =
      e.target && e.target.closest ? e.target.closest(SEL.chips) : null;
    if (chip && chip.getAttribute("aria-disabled") !== "true") {
      toggleTag(chip.dataset.tag);
      return;
    }

    // 卡片内链点击拦截 -> 唤起 Slide-over Sheet (保留中键/Cmd点击新标签打开)
    if (PAGE === "gallery") {
      const cardLink =
        e.target && e.target.closest
          ? e.target.closest(".card-link, .card-titlelink")
          : null;
      if (
        cardLink &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        e.button === 0
      ) {
        const card = cardLink.closest(".card");
        if (card && card.dataset.slug) {
          e.preventDefault();
          openSheet(card.dataset.slug);
        }
      }
    }
  });

  if (PAGE === "gallery") {
    const f = decodeFilters(location.search);
    for (const { facet, tag } of f.pairs) {
      if (U.tags[tag] && U.tags[tag].facet === facet) state.sel[facet].add(tag);
    }
    if (f.q) state.q = f.q;
    state.sort = f.sort === "old" ? "old" : "new";
    buildToolbar();
    refresh();
  }
}
