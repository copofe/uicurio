// uicurio 渐进增强岛（自 v2-app 移植）：过滤/搜索/排序/FLIP 重排/命令面板/移动抽屉。
// 服务端已渲染全量卡片（SEO 零损失）；本脚本接管交互，URL 双向同步。
(() => {
  const dataEl = document.getElementById("dir-data");
  if (!dataEl) return;
  let U;
  try {
    U = JSON.parse(dataEl.textContent || "{}");
  } catch (e) {
    console.error("directory payload invalid", e);
    return;
  }
  const S = U.strings || {};
  const PAGE = U.page === "gallery" ? "gallery" : "info";
  const LOCALE = U.locale;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const go = (path) => {
    if (typeof path === "string" && path.startsWith("/")) location.assign(path);
  };
  const itemURL = (slug) => `/${LOCALE}/item/${encodeURIComponent(slug)}/`;
  const catURL = (slug) =>
    `/${LOCALE}/collections/${encodeURIComponent(slug)}/`;
  const tagPageURL = (tagId) =>
    `/${LOCALE}/tags/${encodeURIComponent(tagId.split(":")[1])}/`;

  /* ── 基础工具 ── */
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const icon = (name, size) => {
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
      const child = document.createElementNS(
        "http://www.w3.org/2000/svg",
        m ? m[1] : "path",
      );
      for (const a of chunk.trim().match(/([a-z-]+)="([^"]*)"/g) || []) {
        const kv = a.match(/([a-z-]+)="([^"]*)"/);
        child.setAttribute(kv[1], kv[2]);
      }
      svg.appendChild(child);
    }
    return svg;
  };
  const hi = (text, q) => {
    const out = document.createDocumentFragment();
    if (!q) {
      out.appendChild(document.createTextNode(text));
      return out;
    }
    const lower = text.toLowerCase();
    const ql = q.toLowerCase();
    let i = 0;
    let hit;
    while ((hit = lower.indexOf(ql, i)) !== -1) {
      if (hit > i) out.appendChild(document.createTextNode(text.slice(i, hit)));
      out.appendChild(el("mark", null, text.slice(hit, hit + q.length)));
      i = hit + q.length;
    }
    if (i < text.length)
      out.appendChild(document.createTextNode(text.slice(i)));
    return out;
  };
  const debounce = (fn, ms) => {
    let t;
    return function (...a) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, a), ms);
    };
  };

  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("uicurio.theme", t);
    } catch {
      /* 私密模式 */
    }
  }

  /* ── 卡片 ── */
  function cardEl(item, stagger) {
    const card = el("article", "card");
    card.dataset.slug = item.slug;
    card.dataset.tags = item.tags.join(" ");
    card.dataset.text = `${item.name} ${item.desc}`.toLowerCase();
    card.style.setProperty("--stagger", stagger || 0);

    const wrap = el("div", "media-wrap");
    const link = el("a", "card-link enter");
    link.href = itemURL(item.slug);
    link.setAttribute("aria-label", `${item.name} · 详情`);
    const media = el("div", "card-media");
    const cover = el("div", "cover");
    const img = el("img");
    img.src = `/assets/shots/${item.shot}`;
    img.alt = item.name;
    img.loading = "lazy";
    img.decoding = "async";
    cover.appendChild(img);
    media.appendChild(cover);
    link.appendChild(media);
    wrap.appendChild(link);

    if (item.url) {
      const out = el("a", "go");
      out.href = item.url;
      out.target = "_blank";
      out.rel = "noopener";
      out.setAttribute("aria-label", `Visit ${item.name}`);
      out.appendChild(icon("aur", 14));
      wrap.appendChild(out);
    }
    card.appendChild(wrap);

    const title = el("h3", "card-title");
    const tl = el("a", "card-titlelink");
    tl.href = itemURL(item.slug);
    tl.appendChild(el("span", null, item.name));
    title.appendChild(tl);
    const cat = U.categories.find((c) => c.slug === item.cat);
    title.appendChild(el("span", "cat", cat ? cat.name : ""));
    card.appendChild(title);
    card.appendChild(el("p", "card-desc", item.desc));
    return card;
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
  };
  const tagFacet = (t) => (U.tags[t] ? U.tags[t].facet : null);
  const tagName = (t) => (U.tags[t] ? U.tags[t].name : t);

  function matches(item, skipFacet) {
    if (U.channel && item.cat !== U.channel) return false;
    if (state.q) {
      const hay =
        `${item.name} ${item.desc} ${item.tags.map(tagName).join(" ")}`.toLowerCase();
      if (!hay.includes(state.q.toLowerCase())) return false;
    }
    for (const f in state.sel) {
      if (f === skipFacet || !state.sel[f].size) continue;
      if (!item.tags.some((t) => state.sel[f].has(t))) return false;
    }
    return true;
  }
  function facetCount(tag) {
    let n = 0;
    for (const it of U.items)
      if (it.tags.includes(tag) && matches(it, tagFacet(tag))) n++;
    return n;
  }
  function activeList() {
    const arr = U.items.filter((it) => matches(it, null));
    arr.sort((a, b) => {
      const d = a.added < b.added ? 1 : a.added > b.added ? -1 : 0;
      return state.sort === "new" ? d : -d;
    });
    return arr;
  }

  /* ── URL 双向同步 ── */
  function readURL() {
    const p = new URLSearchParams(location.search);
    for (const pair of (p.get("f") || "").split("+")) {
      if (!pair) continue;
      const kv = pair.split(".");
      if (kv.length === 2 && U.tags[kv[1]] && U.tags[kv[1]].facet === kv[0])
        state.sel[kv[0]].add(kv[1]);
    }
    state.q = p.get("q") || "";
    if (p.get("sort") === "old") state.sort = "old";
  }
  function writeURL() {
    const p = new URLSearchParams();
    const fs = [];
    for (const f in state.sel)
      for (const t of state.sel[f]) fs.push(`${f}.${t}`);
    if (fs.length) p.set("f", fs.join("+"));
    if (state.q) p.set("q", state.q);
    if (state.sort === "old") p.set("sort", "old");
    const qs = p.toString();
    try {
      history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
    } catch {
      /* file:// 容错 */
    }
    // 语言链接跟随最新过滤态
    for (const a of $$("[data-lang]")) {
      const code = a.dataset.lang;
      const path = location.pathname.startsWith(`/${LOCALE}/`)
        ? location.pathname.replace(`/${LOCALE}/`, `/${code}/`)
        : `/${code}/`;
      a.href = path + (qs ? `?${qs}` : "");
    }
  }

  /* ── 抽屉 / 遮罩（含语言行）── */
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
    list.setAttribute("aria-label", S.pgChannels || "Channels");
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
    b.setAttribute(
      "aria-pressed",
      state.sel[meta.facet].has(tag) ? "true" : "false",
    );
    b.appendChild(el("span", "t", meta.name));
    b.appendChild(el("span", "n", "0"));
    b.addEventListener("click", () => {
      if (b.getAttribute("aria-disabled") === "true") return;
      toggleTag(tag);
    });
    return b;
  }

  function toggleTag(tag) {
    const f = tagFacet(tag);
    if (state.sel[f].has(tag)) state.sel[f].delete(tag);
    else state.sel[f].add(tag);
    refresh();
  }

  function buildTopbar() {
    const burger = $(".topbar .menu-btn");
    if (burger) burger.addEventListener("click", openDrawer);
    const searchBtn = $(".topbar .search-btn");
    if (searchBtn)
      searchBtn.addEventListener("click", () => openPalette(searchBtn));
  }

  function buildScrimAndPanels() {
    buildScrim();
    buildDrawer();
    buildPalette();
  }

  function buildDrawer() {
    drawer = el("aside", "drawer");
    drawer.setAttribute("aria-label", "Navigation & filters");
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");

    const head = el("div", "drawer-head");
    const brandLink = el("a", "brand");
    brandLink.href = `/${LOCALE}/`;
    brandLink.setAttribute("aria-label", "uicurio — home");
    brandLink.appendChild(
      new DOMParser().parseFromString(
        '<svg class="wordmark" viewBox="0 0 96 34" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 15.5 C6 20, 7 24.5, 9.5 25.2 C11.5 25.7, 13.5 20.5, 14 15.5"></path><path d="M14 15.5 C14 20, 14.5 24, 16.5 24.8 C18.2 25.3, 19.6 23.4, 20.6 21.4"></path><path d="M24.5 16.5 C24 20, 24 23.5, 24.7 25.5"></path><path d="M26.6 10.6 L26.9 10.3"></path><path d="M38.5 15.8 C34 14.5, 30.5 17.5, 30.3 21 C30.1 24.5, 33.5 26.8, 38.5 25.6"></path><path d="M43.5 15.5 C43 20, 44 24.5, 46.5 25.2 C48.5 25.7, 50.5 20.5, 51 15.5"></path><path d="M51 15.5 C51 20, 51.5 24, 53.5 24.8 C55.3 25.4, 57.5 23, 58.6 20.4"></path><path d="M63 26.5 C62.5 22, 62.3 18, 62.8 14.8"></path><path d="M62.8 18.5 C64.5 16.6, 67.6 16.1, 69.4 17.2"></path><path d="M74 16.5 C73.6 20, 73.6 23.5, 74.3 25.5"></path><path d="M76.1 10.6 L76.4 10.3"></path><path d="M86.2 15.7 C83 15.4, 80 17.7, 80 20.8 C80 24.1, 82.9 26.3, 85.8 25.7 C88.8 25.1, 90.4 22.4, 89.9 19.7 C89.4 17.1, 87.1 15.6, 84.9 16.3"></path></svg>',
        "image/svg+xml",
      ).documentElement,
    );
    head.appendChild(brandLink);
    const langs = el("div", "langs");
    langs.setAttribute("aria-label", "Language");
    for (const [code, label] of [
      ["en", "EN"],
      ["zh", "中文"],
    ]) {
      const a = el("a", null, label);
      a.dataset.lang = code;
      if (code === LOCALE) a.setAttribute("aria-current", "page");
      langs.appendChild(a);
    }
    head.appendChild(langs);
    const themeBtn = el("button", "iconbtn");
    themeBtn.type = "button";
    themeBtn.setAttribute("data-theme-toggle", "");
    themeBtn.setAttribute("aria-label", S.themeLabel || "Theme");
    const sun = icon("sun", 15);
    sun.classList.add("i-sun");
    const moon = icon("moon", 15);
    moon.classList.add("i-moon");
    themeBtn.appendChild(sun);
    themeBtn.appendChild(moon);
    head.appendChild(themeBtn);
    const close = el("button", "iconbtn");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.appendChild(icon("x", 18));
    close.addEventListener("click", closeAll);
    head.appendChild(close);
    drawer.appendChild(head);

    const body = el("div", "drawer-body");
    const chBlock = el("div");
    chBlock.appendChild(el("p", "side-label", S.pgChannels || "Channels"));
    channelRows(chBlock);
    body.appendChild(chBlock);
    if (PAGE === "gallery") {
      const fBlock = el("div");
      facetGroups(fBlock);
      body.appendChild(fBlock);
    }
    drawer.appendChild(body);

    const foot = el("div", "drawer-foot");
    const wipe = el("button", "btn btn-ghost");
    wipe.type = "button";
    wipe.textContent = S.drawerClear || "Clear";
    wipe.addEventListener("click", () => clearAll());
    foot.appendChild(wipe);
    const done = el("button", "btn btn-solid");
    done.type = "button";
    done.appendChild(el("span", "grow", S.showResults || "Show"));
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
        if (
          !drawer.classList.contains("open") &&
          !(palette && palette.classList.contains("open"))
        )
          scrim.hidden = true;
      }, 240);
    }
  }

  function clearAll() {
    state.q = "";
    for (const f in state.sel) state.sel[f].clear();
    const input = $(".searchbox input");
    if (input) {
      input.value = "";
      $(".searchbox").classList.remove("has-value");
    }
    refresh();
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
    pInput.placeholder = S.palettePh || "Search…";
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
      .filter(
        (it) =>
          !ql ||
          `${it.name} ${it.desc} ${it.tags.map(tagName).join(" ")}`
            .toLowerCase()
            .includes(ql),
      )
      .slice(0, 6);
    if (items.length) {
      const g = { label: S.pgItems || "Items", rows: [] };
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
    const chans = U.categories.filter(
      (c) => !ql || c.name.toLowerCase().includes(ql),
    );
    if (chans.length) {
      const g2 = { label: S.pgChannels || "Channels", rows: [] };
      for (const c of chans)
        g2.rows.push({
          kind: "channel",
          slug: c.slug,
          name: c.name,
          meta: String(U.items.filter((i) => i.cat === c.slug).length),
        });
      rows.push(g2);
    }
    const tags = Object.keys(U.tags)
      .filter((t) => !ql || U.tags[t].name.toLowerCase().includes(ql))
      .slice(0, 8);
    if (tags.length) {
      const g3 = { label: S.pgTags || "Filters", rows: [] };
      for (const t of tags) {
        const on = state.sel[tagFacet(t)]
          ? state.sel[tagFacet(t)].has(t)
          : false;
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

  const catName = (slug) => {
    const c = U.categories.find((x) => x.slug === slug);
    return c ? c.name : slug;
  };

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
    if (!count)
      pList.appendChild(
        el("div", "palette-empty", S.paletteEmpty || "No matches."),
      );
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
      else if (
        top + act.offsetHeight >
        pList.scrollTop + pList.clientHeight - 8
      )
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
        go(
          n >= 2
            ? tagPageURL(r.tag)
            : itemURL(U.items.find((i) => i.tags.includes(r.tag)).slug),
        );
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
        const typing =
          t &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.isContentEditable);
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

  /* ── 画廊同步 ── */
  function chipSync() {
    for (const b of $$(".chip[data-tag]")) {
      const tag = b.dataset.tag;
      const meta = U.tags[tag];
      if (!meta) continue;
      const n = facetCount(tag);
      const on = state.sel[meta.facet].has(tag);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-disabled", n === 0 && !on ? "true" : "false");
      const nn = b.querySelector(".n");
      if (nn) nn.textContent = String(n);
    }
  }

  function activeBarSync() {
    const bar = $("#activebar");
    if (!bar) return;
    bar.replaceChildren();
    let chips = 0;
    if (state.q) {
      bar.appendChild(
        fchipEl(S.fchipQ, `“${state.q}”`, () => {
          state.q = "";
          const input = $(".searchbox input");
          if (input) input.value = "";
          $(".searchbox").classList.remove("has-value");
          refresh();
        }),
      );
      chips++;
    }
    for (const f in state.sel) {
      for (const t of state.sel[f]) {
        const facet = f;
        const tag = t;
        const fname =
          (U.facets.find((x) => x.key === facet) || {}).name || facet;
        bar.appendChild(
          fchipEl(fname, tagName(tag), () => {
            state.sel[facet].delete(tag);
            refresh();
          }),
        );
        chips++;
      }
    }
    if (chips) {
      const wipe = el("button", "wipe", S.clearAll || "Clear all");
      wipe.type = "button";
      wipe.addEventListener("click", clearAll);
      bar.appendChild(wipe);
      bar.hidden = false;
    } else {
      bar.hidden = true;
    }

    function fchipEl(grp, val, onRemove) {
      const c = el("span", "fchip");
      c.appendChild(el("span", "grp", grp));
      c.appendChild(el("span", null, val));
      const b = el("button");
      b.type = "button";
      b.setAttribute("aria-label", `Remove ${val}`);
      b.appendChild(icon("x", 11));
      b.addEventListener("click", onRemove);
      c.appendChild(b);
      return c;
    }
  }

  function gridSync(list) {
    const grid = $("#dir-grid");
    const empty = $("#dir-empty");
    const count = $("#resultcount");
    if (count) {
      count.replaceChildren();
      count.appendChild(el("strong", null, String(list.length)));
      count.appendChild(document.createTextNode(` / ${U.items.length}`));
    }
    if (!list.length) {
      grid.hidden = true;
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    grid.hidden = false;

    const before = new Map();
    for (const c of $$(".card", grid))
      before.set(c.dataset.slug, c.getBoundingClientRect().top);

    grid.replaceChildren();
    list.forEach((it, i) => grid.appendChild(cardEl(it, Math.min(i, 8))));

    if (!REDUCED) {
      requestAnimationFrame(() => {
        for (const card of $$(".card", grid)) {
          const prev = before.get(card.dataset.slug);
          const now = card.getBoundingClientRect().top;
          if (prev != null && Math.abs(prev - now) > 2) {
            const inner = card.querySelector(".card-link");
            if (inner) {
              inner.classList.remove("enter");
              inner.style.transform = `translateY(${prev - now}px)`;
              inner.classList.add("flip");
              requestAnimationFrame(() => {
                inner.style.transform = "";
                setTimeout(() => {
                  inner.classList.remove("flip");
                  inner.style.transform = "";
                }, 220);
              });
            }
          }
        }
      });
    }
  }

  function drawerCountSync(list) {
    if (!drawer) return;
    const line = drawer.querySelector(".count-line");
    if (line) line.textContent = `${list.length} `;
  }

  function refresh() {
    const list = activeList();
    chipSync();
    activeBarSync();
    gridSync(list);
    drawerCountSync(list);
    writeURL();
  }

  function buildToolbar() {
    const input = $("#dir-search");
    if (input) {
      if (state.q) {
        input.value = state.q;
        $(".searchbox").classList.add("has-value");
      }
      input.addEventListener(
        "input",
        debounce(() => {
          state.q = input.value.trim();
          $(".searchbox").classList.toggle("has-value", !!input.value);
          refresh();
        }, 120),
      );
      const clear = $(".searchbox .clear");
      if (clear)
        clear.addEventListener("click", () => {
          input.value = "";
          state.q = "";
          $(".searchbox").classList.remove("has-value");
          refresh();
          input.focus();
        });
    }
    for (const b of $$(".sortseg button")) {
      b.setAttribute(
        "aria-pressed",
        b.dataset.sort === state.sort ? "true" : "false",
      );
      b.addEventListener("click", () => {
        if (state.sort === b.dataset.sort) return;
        state.sort = b.dataset.sort;
        try {
          localStorage.setItem("uicurio.sort", state.sort);
        } catch {
          /* 私密模式 */
        }
        for (const x of $$(".sortseg button"))
          x.setAttribute(
            "aria-pressed",
            x.dataset.sort === state.sort ? "true" : "false",
          );
        refresh();
      });
    }
    const fbtn = $(".filterbtn");
    if (fbtn) fbtn.addEventListener("click", openDrawer);
    const emptyClear = $("#dir-empty-clear");
    if (emptyClear) emptyClear.addEventListener("click", clearAll);
    const kbdHint = $(".searchbox .kbd");
    if (kbdHint) kbdHint.addEventListener("click", () => openPalette(kbdHint));
  }

  /* ── 启动 ── */
  // 侧栏静态 chips（服务端渲染）绑定开关；零计数的置灰拦截
  for (const b of $$(".sidebar .chip[data-tag]")) {
    b.addEventListener("click", () => {
      if (b.getAttribute("aria-disabled") === "true") return;
      toggleTag(b.dataset.tag);
    });
  }
  try {
    const saved = localStorage.getItem("uicurio.sort");
    if (saved === "old") state.sort = "old";
  } catch {
    /* 首次 */
  }
  readURL();
  buildScrimAndPanels();
  buildTopbar();
  bindPaletteKeys();
  // 主题切换 + 语言链接重写（侧栏底部与抽屉头共用 data-* 钩子）
  for (const b of $$("[data-theme-toggle]"))
    b.addEventListener("click", () =>
      applyTheme(
        document.documentElement.dataset.theme === "dark" ? "light" : "dark",
      ),
    );
  for (const a of $$("[data-lang]")) {
    const code = a.dataset.lang;
    const path = location.pathname.startsWith(`/${LOCALE}/`)
      ? location.pathname.replace(`/${LOCALE}/`, `/${code}/`)
      : `/${code}/`;
    a.href = path + location.search;
  }
  buildToolbar();
  if (PAGE === "gallery") refresh();
})();
