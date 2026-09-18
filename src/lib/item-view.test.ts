// item-view 的回归网：HTML 转义、同柜推荐唯一算法、渲染契约（双端共享标记的关键锚点）
import { describe, expect, it } from "vitest";
import {
  esc,
  pickRelated,
  renderItemContent,
  type ItemView,
  type RelatedItemView,
} from "./item-view.ts";

const mkView = (over: Partial<ItemView> = {}): ItemView => ({
  slug: "alpha",
  name: "Alpha",
  desc: "demo",
  url: "https://alpha.dev",
  repo: "https://github.com/x/alpha",
  shot: "alpha.webp",
  content: "body text",
  components: ["Button"],
  catName: "输入控件",
  catHref: "/zh/collections/input-controls/",
  tags: [{ id: "stack:react", name: "React", href: "/zh/tags/react/" }],
  ...over,
});

describe("esc", () => {
  it("转义 HTML 特殊字符", () => {
    expect(esc(`<a href="x">&'`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;",
    );
  });
});

describe("pickRelated", () => {
  const mk = (
    slug: string,
    catSlug: string,
    tagIds: string[],
  ): RelatedItemView => ({
    slug,
    name: slug,
    shot: `${slug}.webp`,
    catSlug,
    tagIds,
  });
  const current = mk("alpha", "input", ["stack:react"]);
  const all = [
    current,
    mk("beta", "input", []),
    mk("gamma", "input", []),
    mk("delta", "data-viz", ["stack:react"]),
    mk("epsilon", "data-viz", []),
  ];

  it("同频道优先，不足补同标签，排除自身，封顶 3", () => {
    expect(pickRelated(all, current).map((x) => x.slug)).toEqual([
      "beta",
      "gamma",
      "delta",
    ]);
  });

  it("同频道足够时不再跨频道补位", () => {
    const rich = [
      current,
      mk("b1", "input", []),
      mk("b2", "input", []),
      mk("b3", "input", []),
      mk("delta", "data-viz", ["stack:react"]),
    ];
    expect(pickRelated(rich, current).every((x) => x.catSlug === "input")).toBe(
      true,
    );
  });

  it("单条目无推荐", () => {
    expect(pickRelated([current], current)).toEqual([]);
  });
});

describe("renderItemContent", () => {
  const view = mkView();
  const related: RelatedItemView[] = [
    {
      slug: "beta",
      name: "Beta",
      shot: "beta.webp",
      catSlug: "input",
      tagIds: [],
    },
  ];

  it("双端标记契约：署名行/封面/正文/标签/相关卡的关键锚点齐全", () => {
    const html = renderItemContent(view, related, "zh");
    expect(html).toContain('class="sheet-author-name"');
    expect(html).toContain('class="sheet-cover"');
    expect(html).toContain('class="sheet-desc"');
    expect(html).toContain('data-tag-id="stack:react"');
    expect(html).toContain('data-related-slug="beta"');
    expect(html).toContain('class="sheet-components-section"');
    expect(html).toContain("GitHub ↗");
  });

  it("插值全部转义：名称含 HTML 时不产生可执行标记", () => {
    const evil = renderItemContent(
      mkView({ name: `<script>alert(1)</script>` }),
      related,
      "en",
    );
    expect(evil).not.toContain("<script>");
    expect(evil).toContain("&lt;script&gt;");
  });

  it("可选区块：无 repo 无组件无正文时不输出对应区块；bodySuffix 落在 sheet-body 内", () => {
    const html = renderItemContent(
      mkView({ repo: null, components: [], content: "" }),
      related,
      "en",
      '<nav class="sheet-pager"></nav>',
    );
    expect(html).not.toContain("sheet-components-section");
    expect(html).not.toContain("sheet-content-text");
    expect(html).not.toContain("GitHub ↗");
    const bodyStart = html.indexOf('class="sheet-body"');
    const pagerPos = html.indexOf('class="sheet-pager"');
    const closePos = html.lastIndexOf("</div>");
    expect(pagerPos).toBeGreaterThan(bodyStart);
    expect(pagerPos).toBeLessThan(closePos);
  });

  it("语言差异：zh/en 各取对应文案", () => {
    expect(renderItemContent(view, [], "zh")).toContain("包含组件");
    expect(renderItemContent(view, [], "en")).toContain("Included Components");
  });
});
