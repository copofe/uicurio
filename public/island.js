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
    // 招牌细节：主题切换时字标重画一遍（antfu animated-svg-logo 技法）
    for (const svg of $$(".wordmark")) {
      svg.classList.remove("play");
      void svg.getBoundingClientRect();
      svg.classList.add("play");
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
      new DOMParser().parseFromString("<svg class=\"wordmark play\" viewBox=\"-3 -92.0 117.0 125.4\" fill=\"currentColor\" aria-hidden=\"true\"><g transform=\"translate(0.00, 82) scale(0.048828, -0.048828)\"><path pathLength=\"1\" style=\"--i:0\" d=\"M60 632L60 632Q61 636 61 640Q60 646 56.5 649.5Q53 653 47 656Q46 657 42.5 658Q39 659 36 660Q33 661 31 660Q29 659 23.5 649.5Q18 640 13 630Q8 620 6 617Q-11 582 -18 546Q-25 498 17 479Q50 470 78 488Q106 506 126 531Q120 488 131.5 445Q143 402 193 396Q238 398 280.5 426Q323 454 373 506Q405 543 411.5 547.5Q418 552 421 559Q421 563 416.5 563.5Q412 564 410 560Q372 505 312 454Q252 403 192 399Q164 403 157 431Q150 459 151 483Q152 504 155 525Q155 526 155 526Q157 537 159.5 548.5Q162 560 166 570Q170 580 171.5 586.5Q173 593 172 599Q171 604 166.5 609.5Q162 615 156 618Q150 621 146 618Q141 615 137.5 601.5Q134 588 131.5 572.5Q129 557 128 549Q128 548 128 547Q111 525 82 501.5Q53 478 24 486Q12 490 10 504Q8 518 13 537Q16 547 19 557Q24 572 30.5 587.5Q37 603 47 615Q51 620 54 623.5Q57 627 60 632Z\"/></g><g transform=\"translate(0.00, 82) scale(0.048828, -0.048828)\"><path pathLength=\"1\" style=\"--i:1\" d=\"M39 621L39 621Q42 629 37 639Q31 644 19 644Q7 644 4 636Q-10 583 -16 529Q-21 487 -9.5 447.5Q2 408 51 402Q102 403 147.5 444.5Q193 486 233 547Q242 555 242 559Q242 563 240 562Q237 559 231 548Q198 496 151 451Q104 406 50 406Q27 407 19 430.5Q11 454 12 487Q13 514 17 541Q19 552 21.5 564Q24 576 39 621ZM58 671L58 671Q59 672 60 673Q63 676 65 679Q68 683 70.5 690Q73 697 72 703Q72 704 71 706.5Q70 709 67.5 712.5Q65 716 60.5 717.5Q56 719 53 720Q53 720 53 720Q47 721 44 720Q41 719 38 713Q34 706 32 697Q30 688 33 681Q42 667 58 671Z\"/></g><g transform=\"translate(0.00, 82) scale(0.048828, -0.048828)\"><path pathLength=\"1\" style=\"--i:2\" d=\"M103 614L103 614Q104 623 99 631Q83 658 51 654Q39 650 28 638Q16 627 6 611Q-8 587 -16 553.5Q-24 520 -15 491.5Q-6 463 31 455Q61 452 98 460.5Q135 469 155 478Q214 503 267 540Q294 552 297.5 554Q301 556 301 560Q302 562 300.5 565.5Q299 569 297 569L296 569Q295 569 268 550Q212 511 149 485Q74 454 32 462Q15 465 9.5 481Q4 497 8 518Q14 548 29 577Q45 605 64 620Q64 620 64 620Q69 623 74 625.5Q79 628 83 628Q86 627 87 625Q88 623 88 621Q88 618 89 616Q90 614 92 613Q98 612 103 614Z\"/></g><g transform=\"translate(0.00, 82) scale(0.048828, -0.048828)\"><path pathLength=\"1\" style=\"--i:3\" d=\"M60 632L60 632Q61 636 61 640Q60 646 56.5 649.5Q53 653 47 656Q46 657 42.5 658Q39 659 36 660Q33 661 31 660Q29 659 23.5 649.5Q18 640 13 630Q8 620 6 617Q-11 582 -18 546Q-25 498 17 479Q50 470 78 488Q106 506 126 531Q120 488 131.5 445Q143 402 193 396Q238 398 280.5 426Q323 454 373 506Q405 543 411.5 547.5Q418 552 421 559Q421 563 416.5 563.5Q412 564 410 560Q372 505 312 454Q252 403 192 399Q164 403 157 431Q150 459 151 483Q152 504 155 525Q155 526 155 526Q157 537 159.5 548.5Q162 560 166 570Q170 580 171.5 586.5Q173 593 172 599Q171 604 166.5 609.5Q162 615 156 618Q150 621 146 618Q141 615 137.5 601.5Q134 588 131.5 572.5Q129 557 128 549Q128 548 128 547Q111 525 82 501.5Q53 478 24 486Q12 490 10 504Q8 518 13 537Q16 547 19 557Q24 572 30.5 587.5Q37 603 47 615Q51 620 54 623.5Q57 627 60 632Z\"/></g><g transform=\"translate(0.00, 82) scale(0.048828, -0.048828)\"><path pathLength=\"1\" style=\"--i:4\" d=\"M370 566Q369 565 363 552Q342 509 296 443.5Q250 378 199.5 324Q149 270 117 270Q108 275 106.5 300Q105 325 112 386Q119 447 111.5 482Q104 517 61 530Q50 532 40 534Q30 535 21 537Q16 538 15 543.5Q14 549 16.5 559Q19 569 23 579.5Q27 590 30 599Q33 608 32 613Q31 618 17.5 622Q4 626 2 623Q-3 613 -6 603Q-7 599 -8 595Q-11 580 -12.5 564Q-14 548 -8 540Q-4 536 6.5 532.5Q17 529 23 528Q75 519 83.5 492.5Q92 466 86 427.5Q80 389 79 356Q78 323 85.5 295.5Q93 268 117 266Q152 269 202.5 321Q253 373 297.5 436Q342 499 367 549Q370 551 372 554.5Q374 558 374 560Q374 566 370 566Z\"/></g><g transform=\"translate(0.00, 82) scale(0.048828, -0.048828)\"><path pathLength=\"1\" style=\"--i:5\" d=\"M39 621L39 621Q42 629 37 639Q31 644 19 644Q7 644 4 636Q-10 583 -16 529Q-21 487 -9.5 447.5Q2 408 51 402Q102 403 147.5 444.5Q193 486 233 547Q242 555 242 559Q242 563 240 562Q237 559 231 548Q198 496 151 451Q104 406 50 406Q27 407 19 430.5Q11 454 12 487Q13 514 17 541Q19 552 21.5 564Q24 576 39 621ZM58 671L58 671Q59 672 60 673Q63 676 65 679Q68 683 70.5 690Q73 697 72 703Q72 704 71 706.5Q70 709 67.5 712.5Q65 716 60.5 717.5Q56 719 53 720Q53 720 53 720Q47 721 44 720Q41 719 38 713Q34 706 32 697Q30 688 33 681Q42 667 58 671Z\"/></g><g transform=\"translate(0.00, 82) scale(0.048828, -0.048828)\"><path pathLength=\"1\" style=\"--i:6\" d=\"M51 658L51 658Q48 656 43.5 652.5Q39 649 36 646Q11 621 -3 584.5Q-17 548 -25 514Q-33 484 -31 453Q-29 422 4 409Q17 405 31 413Q48 422 63 446Q81 474 92.5 517.5Q104 561 89 590Q94 587 99 584Q114 575 134 567Q173 553 218.5 548Q264 543 298 552Q323 556 323 561Q321 564 305 558Q263 545 209 551.5Q155 558 117 576Q100 585 85 595Q84 596 83 596Q83 595 83 594.5Q83 594 84 594Q91 585 93 574Q95 563 94 552Q93 527 83 498.5Q73 470 60 449Q45 425 28 416Q17 409 6 412Q-5 416 -7 432Q-9 448 -6.5 465.5Q-4 483 -2 491Q10 549 41 599Q42 601 47 605Q81 629 77 636Q74 644 70 648Q65 654 60 656.5Q55 659 51 658Z\"/></g></svg>", "image/svg+xml").documentElement,
    );
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
  for (const sel of $$("[data-lang-select]")) {
    sel.value = LOCALE;
    sel.addEventListener("change", () => {
      const code = sel.value;
      const path = location.pathname.startsWith(`/${LOCALE}/`)
        ? location.pathname.replace(`/${LOCALE}/`, `/${code}/`)
        : `/${code}/`;
      location.assign(path + location.search);
    });
  }
  buildToolbar();
  if (PAGE === "gallery") refresh();
})();
