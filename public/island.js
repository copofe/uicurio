// 渐进增强岛：服务端已渲染全量卡片（SEO 零损失）；本脚本只做过滤/搜索/计数/URL 同步。
(() => {
  const dataEl = document.getElementById("dir-data");
  const grid = document.getElementById("dir-grid");
  if (!dataEl || !grid) return;
  let data;
  try {
    data = JSON.parse(dataEl.textContent || "{}");
  } catch (e) {
    console.error("directory payload invalid", e);
    return;
  }
  const tagFacet = new Map(data.tags.map((t) => [t.id, t.facet]));
  const state = { f: new Set(), q: "" };

  // URL → state
  const sp = new URLSearchParams(location.search);
  for (const t of (sp.get("f") || "").split(",").filter(Boolean))
    state.f.add(t);
  state.q = (sp.get("q") || "").toLowerCase();

  const cards = new Map();
  for (const el of grid.querySelectorAll(".card"))
    cards.set(el.dataset.slug, el);

  const boxFor = (id) =>
    document.querySelector(`input[data-filter="${CSS.escape(id)}"]`);
  const matches = (item, skipFacet) => {
    if (
      !item.name.toLowerCase().includes(state.q) &&
      !item.desc.toLowerCase().includes(state.q)
    )
      return false;
    for (const t of state.f) {
      if (skipFacet && tagFacet.get(t) === skipFacet) continue;
      if (!item.tags.includes(t)) return false;
    }
    return true;
  };

  function apply(push) {
    let visible = 0;
    for (const item of data.items) {
      const on = matches(item, null);
      cards.get(item.slug)?.classList.toggle("hidden", !on);
      if (on) visible++;
    }
    // 分面计数：不计入本 facet 自身的选中
    for (const t of data.tags) {
      const n = data.items.filter((i) => matches(i, t.facet)).length;
      const el = document.querySelector(`[data-count="${CSS.escape(t.id)}"]`);
      if (el) el.textContent = String(n);
      const box = boxFor(t.id);
      box
        ?.closest("label")
        ?.classList.toggle("off", n === 0 && !state.f.has(t.id));
    }
    document.getElementById("dir-count").textContent = String(visible);
    document.getElementById("dir-empty").style.display = visible
      ? "none"
      : "block";
    document.getElementById("dir-clear").style.display =
      state.f.size || state.q ? "inline-block" : "none";
    for (const t of state.f) {
      const b = boxFor(t);
      if (b) b.checked = true;
    }
    if (push) {
      const p = new URLSearchParams();
      if (state.f.size) p.set("f", [...state.f].join(","));
      if (state.q) p.set("q", state.q);
      history.replaceState(null, "", p.size ? `?${p}` : location.pathname);
    }
  }

  for (const box of document.querySelectorAll("input[data-filter]")) {
    box.addEventListener("change", () => {
      const id = box.dataset.filter;
      if (box.checked) state.f.add(id);
      else state.f.delete(id);
      apply(true);
    });
  }
  let timer;
  document.getElementById("dir-search")?.addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.q = e.target.value.toLowerCase();
      apply(true);
    }, 120);
  });
  document.getElementById("dir-clear")?.addEventListener("click", () => {
    state.f.clear();
    state.q = "";
    for (const b of document.querySelectorAll("input[data-filter]"))
      b.checked = false;
    const s = document.getElementById("dir-search");
    if (s) s.value = "";
    apply(true);
  });
  apply(false);
})();
