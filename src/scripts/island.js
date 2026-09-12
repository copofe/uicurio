// uicurio 岛：DOM 壳。纯逻辑（过滤/排序/URL 编解码）在 src/lib/island-core.ts（vitest 直测）。
// DOM 契约注册表：本文件与 Astro 模板之间的全部挂钩集中在 SEL——改 id/钩子只动 SEL 与对应模板。
import { decodeFilters, encodeFilters, facetCount, matches, sortItems } from "../lib/island-core.ts";

/* ── DOM 契约注册表 ── */
const SEL = {
  data: "#dir-data",
  grid: "#dir-grid",
  search: "#dir-search",
  searchBox: ".searchbox",
  searchClear: ".searchbox .clear",
  count: "#resultcount",
  empty: "#dir-empty",
  emptyClear: "#dir-empty-clear",
  sortButtons: ".sortseg button",
  chips: ".chip[data-tag]",
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
    layers: '<path d="m12 2 10 6.5L12 15 2 8.5 12 2Z"/><path d="m2 13.5 10 6.5 10-6.5"/>',
    tag: '<path d="M12 2H4a2 2 0 0 0-2 2v8l9.3 9.3a1.7 1.7 0 0 0 2.4 0l7.6-7.6a1.7 1.7 0 0 0 0-2.4L12 2Z"/><circle cx="7.5" cy="7.5" r="1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
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
  for (const chunk of P[name].split("/>")) {
    if (!chunk) continue;
    const m = chunk.trim().match(/^<([a-z]+)/);
    const child = document.createElementNS("http://www.w3.org/2000/svg", m ? m[1] : "path");
    for (const a of chunk.trim().match(/([a-z-]+)="([^"]*)"/g) || []) {
      const kv = a.match(/([a-z-]+)="([^"]*)"/);
      child.setAttribute(kv[1], kv[2]);
    }
    svg.appendChild(child);
  }
  return svg;
}

function hi(text, q) {
  const out = document.createDocumentFragment();
  if (!q) {
    out.appendChild(document.createTextNode(text));
    return out;
  }
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  let i = 0;
  for (;;) {
    const hit = lower.indexOf(ql, i);
    if (hit === -1) break;
    if (hit > i) out.appendChild(document.createTextNode(text.slice(i, hit)));
    out.appendChild(el("mark", null, text.slice(hit, hit + q.length)));
    i = hit + q.length;
  }
  if (i < text.length) out.appendChild(document.createTextNode(text.slice(i)));
  return out;
}

const debounce = (fn, ms) => {
  let t;
  return function (...a) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, a), ms);
  };
};

/* ── 字标（手绘 SVG，gen-wordmark.mjs 产出）── */

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

/** 契约断言：载荷形状不符 = 构建期与岛的隐式契约断了，宁可整岛不启用也不带病运行 */
function payloadOk(u) {
  const itemOk = (i) => !!i && !!i.slug && !!i.name && typeof i.desc === "string" && Array.isArray(i.tags) && typeof i.shot === "string" && typeof i.added === "string";
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
  sel: { function: new Set(), stack: new Set(), style: new Set(), scenario: new Set() },
  q: "",
  sort: "new",
};
const cardNodes = new Map(); // slug → SSR 卡片节点（单一渲染源：CardV2.astro；岛只复用/排序/隐藏）

function initCardNodes() {
  const grid = $(SEL.grid);
  if (!grid) return;
  for (const n of $$(SEL.grid + " .card")) cardNodes.set(n.dataset.slug, n);
}

const selPairs = () => {
  const pairs = [];
  for (const facet in state.sel) {
    for (const t of state.sel[facet]) pairs.push({ facet, tag: t });
  }
  return pairs;
};
const tagNames = () => Object.fromEntries(Object.entries(U.tags).map(([id, t]) => [id, t.name]));
const ctx = (skipFacet) => ({
  f: { pairs: selPairs(), q: state.q, sort: state.sort },
  sel: state.sel,
  channel: U.channel,
  skipFacet,
  tagNames: tagNames(),
});

/* ── URL 双向同步（编码解码走 island-core）── */
function readURL() {
  const f = decodeFilters(location.search);
  for (const { facet, tag } of f.pairs) {
    if (U.tags[tag] && U.tags[tag].facet === facet) state.sel[facet].add(tag);
  }
  state.q = f.q;
  if (f.sort === "old") state.sort = "old";
}

function writeURL() {
  const qs = encodeFilters({ pairs: selPairs(), q: state.q, sort: state.sort });
  try {
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
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
  // 招牌细节：主题切换时字标重画一遍（antfu animated-svg-logo 技法）
  for (const svg of $$(SEL.wordmark)) {
    svg.classList.remove("play");
    void svg.getBoundingClientRect();
    svg.classList.add("play");
  }
}

/* ── URL 构造 ── */
const homeURL = () => `/${LOCALE}/`;
const itemURL = (slug) => `/${LOCALE}/item/${encodeURIComponent(slug)}/`;
const catURL = (slug) => `/${LOCALE}/collections/${encodeURIComponent(slug)}/`;
const tagPageURL = (tagId) => `/${LOCALE}/tags/${encodeURIComponent(tagId.split(":")[1])}/`;
const go = (path) => {
  if (typeof path === "string" && path.startsWith("/")) location.assign(path);
};

/* ── 藏品卡网格：SSR 节点复用（单一渲染源在 CardV2.astro，岛不建卡）── */
function gridSync(list) {
  const grid = $(SEL.grid);
  const empty = $(SEL.empty);
  const visible = new Set(list.map((i) => i.slug));

  // FLIP before：当前可见卡的纵坐标
  const before = new Map();
  for (const n of cardNodes.values()) {
    if (!n.classList.contains("hidden")) before.set(n.dataset.slug, n.getBoundingClientRect().top);
  }
  // 重排：可见卡按序移动；不在结果集的隐藏
  for (const item of list) {
    const n = cardNodes.get(item.slug);
    n.classList.remove("hidden");
    grid.appendChild(n);
  }
  for (const [slug, n] of cardNodes) {
    if (!visible.has(slug)) n.classList.add("hidden");
  }
  // FLIP after：位移 > 2px 的卡做回位动画（新显卡的 rect 为 0，自动跳过）
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
}

function countSync(list) {
  const c = $(SEL.count);
  if (!c) return;
  c.replaceChildren();
  c.appendChild(el("strong", null, String(list.length)));
  c.appendChild(document.createTextNode(` / ${U.items.length}`));
}

function drawerCountSync(list) {
  const line = $(SEL.drawerCount);
  if (line) line.textContent = `${list.length} `;
}

function toggleTag(tag) {
  const facet = U.tags[tag].facet;
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
  const list = sortItems(
    U.items.filter((i) => matches(i, ctx())),
    state.sort
  );
  chipSync();
  countSync(list);
  gridSync(list);
  drawerCountSync(list);
  writeURL();
}

/* ── 遮罩 / 抽屉 / 命令面板 ── */
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
    if (U.channel && c.slug === U.channel) a.setAttribute("aria-current", "page");
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
  for (const f of U.facets) {
    const group = el("div", "facet-group");
    group.dataset.facet = f.key;
    group.appendChild(el("p", "side-label", f.name));
    const row = el("div", "chiprow");
    for (const t of Object.keys(U.tags)) {
      if (U.tags[t].facet !== f.key) continue;
      row.appendChild(chipEl(t));
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
  b.setAttribute("aria-pressed", state.sel[meta.facet].has(tag) ? "true" : "false");
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
  brandLink.setAttribute("aria-label", "uicurio — home");
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
  if (drawer && drawer.classList.contains("open")) {
    drawer.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (palette && palette.classList.contains("open")) closePalette();
  if (scrim) {
    scrim.classList.remove("open");
    setTimeout(() => {
      if (!drawer.classList.contains("open") && !(palette && palette.classList.contains("open"))) scrim.hidden = true;
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
  pInput.addEventListener("input", debounce(renderPalette, 90));
  head.appendChild(pInput);
  head.appendChild(el("kbd", null, "esc"));
  palette.appendChild(head);

  pList = el("div", "palette-list");
  pList.setAttribute("role", "listbox");
  palette.appendChild(pList);

  const foot = el("div", "palette-foot");
  for (const pair of [
    ["↑↓", "选择"],
    [null, "enter", "打开"],
    ["esc", "关闭"],
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
  const items = U.items
    .filter((it) => !ql || `${it.name} ${it.desc} ${it.tags.map((t) => tagName(t)).join(" ")}`.toLowerCase().includes(ql))
    .slice(0, 6);
  if (items.length) {
    const g = { label: S.pgItems, rows: [] };
    for (const it of items) g.rows.push({ kind: "item", slug: it.slug, name: it.name, meta: catName(it.cat), cover: it.shot, q: ql });
    rows.push(g);
  }
  const chans = U.categories.filter((c) => !ql || c.name.toLowerCase().includes(ql));
  if (chans.length) {
    const g2 = { label: S.pgChannels, rows: [] };
    for (const c of chans) g2.rows.push({ kind: "channel", slug: c.slug, name: c.name, meta: String(U.items.filter((i) => i.cat === c.slug).length) });
    rows.push(g2);
  }
  const tags = Object.keys(U.tags)
    .filter((t) => !ql || U.tags[t].name.toLowerCase().includes(ql))
    .slice(0, 8);
  if (tags.length) {
    const g3 = { label: S.pgTags, rows: [] };
    for (const t of tags) {
      const on = state.sel[tagFacet(t)] ? state.sel[tagFacet(t)].has(t) : false;
      g3.rows.push({ kind: "tag", tag: t, name: U.tags[t].name, meta: on ? S.pSelected : S.pAdd });
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
        ic.appendChild(icon(r.kind === "channel" ? "layers" : "tag", 14));
        row.appendChild(ic);
        const nm = el("span", "p-name");
        nm.appendChild(hi(r.name, r.q));
        row.appendChild(nm);
      }
      row.appendChild(el("span", "p-meta", r.meta));
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
const tagName = (t) => (U.tags[t] ? U.tags[t].name : t);

function runRowAt(r) {
  if (r.kind === "item") {
    go(itemURL(r.slug));
  } else if (r.kind === "channel") {
    go(catURL(r.slug));
  } else if (r.kind === "tag") {
    if (PAGE === "gallery") {
      toggleTag(r.tag);
      closeAll();
    } else {
      const n = U.items.filter((i) => i.tags.includes(r.tag)).length;
      go(n >= 2 ? tagPageURL(r.tag) : itemURL(U.items.find((i) => i.tags.includes(r.tag)).slug));
    }
  }
}

function bindPaletteKeys() {
  document.addEventListener("keydown", (e) => {
    const open = palette.classList.contains("open");
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (open) closeAll();
      else openPalette();
      return;
    }
    if (e.key === "/" && !open) {
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (!typing) {
        e.preventDefault();
        openPalette();
      }
      return;
    }
    if (e.key === "Escape" && open) {
      e.preventDefault();
      closeAll();
    }
  });
}

/* ── 画廊同步：SSR 节点复用 ── */


/* ── 顶栏绑定 ── */
function buildTopbar() {
  const burger = $(SEL.menuBtn);
  if (burger) burger.addEventListener("click", openDrawer);
  const searchBtn = $(SEL.searchBtn);
  if (searchBtn) searchBtn.addEventListener("click", () => openPalette(searchBtn));
}

/* ── 工具行绑定 ── */
function buildToolbar() {
  const input = $(SEL.search);
  if (input) {
    if (state.q) {
      input.value = state.q;
      $(SEL.searchBox).classList.add("has-value");
    }
    input.addEventListener("input", debounce(() => {
      state.q = input.value.trim();
      $(SEL.searchBox).classList.toggle("has-value", !!input.value);
      refresh();
    }, 120));
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
  for (const b of $$(SEL.sortButtons)) {
    b.setAttribute("aria-pressed", b.dataset.sort === state.sort ? "true" : "false");
    b.addEventListener("click", () => {
      if (state.sort === b.dataset.sort) return;
      state.sort = b.dataset.sort;
      try {
        localStorage.setItem("uicurio.sort", state.sort);
      } catch {
        /* 私密模式 */
      }
      for (const x of $$(SEL.sortButtons)) x.setAttribute("aria-pressed", x.dataset.sort === state.sort ? "true" : "false");
      refresh();
    });
  }
  const fbtn = $(".filterbtn");
  if (fbtn) fbtn.addEventListener("click", openDrawer);
  const emptyClear = $(SEL.emptyClear);
  if (emptyClear) emptyClear.addEventListener("click", clearFiltersAndRefresh);
  const kbdHint = $(".searchbox .kbd");
  if (kbdHint) kbdHint.addEventListener("click", () => openPalette(kbdHint));
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
  buildDrawer();
  buildPalette();
  buildTopbar();
  bindPaletteKeys();
  for (const b of $$(SEL.themeToggle)) {
    b.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  }
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
  document.addEventListener("click", (e) => {
    const chip = e.target && e.target.closest ? e.target.closest(SEL.chips) : null;
    if (!chip || chip.getAttribute("aria-disabled") === "true") return;
    toggleTag(chip.dataset.tag);
  });
  if (PAGE === "gallery") {
    try {
      const saved = localStorage.getItem("uicurio.sort");
      if (saved === "old") state.sort = "old";
    } catch {
      /* 私密模式 */
    }
    if (state.sort !== "old" && state.sort !== "new") state.sort = "new";
    const f = decodeFilters(location.search);
    for (const { facet, tag } of f.pairs) {
      if (U.tags[tag] && U.tags[tag].facet === facet) state.sel[facet].add(tag);
    }
    if (f.q) state.q = f.q;
    buildToolbar();
    refresh();
  }
}
