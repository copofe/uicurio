// 条目内容区的单一渲染源：详情页（Astro 构建期 SSR）与画廊弹窗（岛运行时）共用同一份标记。
// 返回 HTML 字符串（全部插值经 esc 转义）。两表面的差异留在共享区之外：
//   详情页独有 —— 头部导航（回首页/语言/主题/返回）、翻页数据、页脚；
//   弹窗独有  —— 悬浮关闭 X、跟随当前筛选的动态翻页（经 bodySuffix / 运行时追加挂进 .sheet-body）。
// 行为分层靠渐进增强：标签芯片与相关卡在详情页是普通链接，在弹窗里被事件委托拦截转为筛选/换片。

export interface ItemTagView {
    id: string;
    name: string;
    href: string;
}

export interface ItemView {
    slug: string;
    name: string;
    desc: string;
    url: string;
    repo: string | null;
    shot: string;
    content: string;
    components: string[];
    catName: string;
    catHref: string;
    tags: ItemTagView[];
}

export interface RelatedItemView {
    slug: string;
    name: string;
    shot: string;
    catSlug: string;
    tagIds: string[];
}

const ENTITIES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

export function esc(s: string): string {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

export function hostOf(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
}

/** 同柜推荐唯一算法：同频道优先，不足 n 补同标签，排除自身，封顶 n */
export function pickRelated<T extends RelatedItemView>(
    all: T[],
    current: T,
    n = 3,
): T[] {
    const alts = all.filter(
        (x) => x.slug !== current.slug && x.catSlug === current.catSlug,
    );
    if (alts.length < n) {
        for (const x of all) {
            if (alts.length >= n) break;
            if (x.slug === current.slug || alts.includes(x)) continue;
            if (x.tagIds.some((tg) => current.tagIds.includes(tg)))
                alts.push(x);
        }
    }
    return alts.slice(0, n);
}

const EXTERNAL_SVG =
    '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';

/**
 * 渲染条目内容区：署名行 → 封面 → 正文（描述/包含组件/深度解析/标签/分隔线/同柜推荐）。
 * bodySuffix 追加在 .sheet-body 末尾（详情页放 SSR 翻页器；弹窗运行时另行挂动态翻页）。
 */
export function renderItemContent(
    view: ItemView,
    related: RelatedItemView[],
    locale: string,
    bodySuffix = "",
): string {
    const zh = locale === "zh";
    const name = esc(view.name);

    const tagsHtml = view.tags
        .map(
            (t) =>
                `<a class="sheet-tag-chip" href="${esc(t.href)}" data-tag-id="${esc(t.id)}">#${esc(t.name)}</a>`,
        )
        .join("");

    const componentsHtml =
        view.components.length > 0
            ? `<div class="sheet-components-section">
        <div class="sheet-components-header">
          <h4 class="sheet-components-title">${zh ? "包含组件" : "Included Components"}</h4>
          <span class="sheet-components-count">${view.components.length}</span>
        </div>
        <div class="sheet-components-list">
          ${view.components.map((c) => `<span class="sheet-component-pill">${esc(c)}</span>`).join("")}
        </div>
      </div>`
            : "";

    const relatedHtml =
        related.length > 0
            ? `<div class="sheet-related-section">
        <div class="sheet-related-head">
          <div class="sheet-related-head-left">
            <div>
              <h3>${zh ? `更多「${esc(view.catName)}」精选推荐` : `More in ${esc(view.catName)}`}</h3>
              <span class="sheet-related-sub">${zh ? "来自同一频道分类的高品质设计与工程藏品" : "Curated design &amp; engineering picks from this channel"}</span>
            </div>
          </div>
          <a class="sheet-related-all" href="${esc(view.catHref)}">${zh ? "浏览频道全部 ↗" : "Browse all ↗"}</a>
        </div>
        <div class="sheet-related-grid">
          ${related
              .map(
                  (r) =>
                      `<a class="sheet-related-card" href="/${zh ? "zh" : "en"}/item/${esc(r.slug)}/" data-related-slug="${esc(r.slug)}">
              <div class="sheet-related-thumb"><img src="/assets/shots/${esc(r.shot)}" alt="${esc(r.name)}" loading="lazy" decoding="async" width="400" height="250" /></div>
              <span class="sheet-related-title">${esc(r.name)}</span>
            </a>`,
              )
              .join("")}
        </div>
      </div>`
            : "";

    return `<div class="sheet-stage-intro">
      <div class="sheet-byline">
        <div class="sheet-author">
          <div class="sheet-author-meta">
            <h1 class="sheet-author-name">${name}</h1>
            <div class="sheet-author-sub">
              <a href="${esc(view.catHref)}">${esc(view.catName)}</a>
            </div>
          </div>
        </div>
        <div class="sheet-byline-links">
          <a class="sheet-pill-link" href="${esc(view.url)}" target="_blank" rel="noopener">${EXTERNAL_SVG}<span>${esc(hostOf(view.url))}</span></a>
          ${view.repo ? `<a class="sheet-pill-link" href="${esc(view.repo)}" target="_blank" rel="noopener"><span>GitHub ↗</span></a>` : ""}
        </div>
      </div>
    </div>
    <div class="sheet-cover">
      <a href="${esc(view.url)}" target="_blank" rel="noopener" title="${esc(view.url)} · ${name}">
        <img src="/assets/shots/${esc(view.shot)}" alt="${name}" width="1600" height="1000" />
      </a>
    </div>
    <div class="sheet-body">
      <p class="sheet-desc">${esc(view.desc)}</p>
      ${componentsHtml}
      ${view.content ? `<p class="sheet-content-text">${esc(view.content)}</p>` : ""}
      <div class="sheet-tags">${tagsHtml}</div>
      <hr class="sheet-divider" />
      ${relatedHtml}
      ${bodySuffix}
    </div>`;
}
