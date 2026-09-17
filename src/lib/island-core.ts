// uicurio 岛的纯逻辑：过滤 / 排序 / URL 编解码。零 DOM，vitest 直测（island-core.test.ts）。
// 线上消费者：src/scripts/island.js（DOM 壳）。
// 线上契约：?f=facet.tagId+facet.tagId&q=…&sort=old —— 分享链接不可随意变更。

export const FACETS = ["function", "stack", "style", "scenario"] as const;
export type Facet = (typeof FACETS)[number];
export type SortKey = "new" | "old";

export interface ItemLike {
  name: string;
  desc: string;
  cat: string;
  tags: string[]; // 标签 id（facet:slug）
  added: string;
}

export type Selection = Record<string, Set<string>>; // facet → tag id 集合
export interface FilterPairs {
  pairs: { facet: string; tag: string }[];
  q: string;
  sort: SortKey;
}

export function emptySelection(): Selection {
  return {
    function: new Set(),
    stack: new Set(),
    style: new Set(),
    scenario: new Set(),
  };
}

/** 解析 ?f=facet.tag+facet.tag&q=…&sort=…；未知 facet/tag 的剔除由调用方校验 */
export function decodeFilters(search: string): FilterPairs {
  const p = new URLSearchParams(search);
  // URLSearchParams 会把字面 "+" 解码成空格——归一化回来，手输链接也能正确解析
  const pairs = (p.get("f") || "")
    .replace(/ /g, "+")
    .split("+")
    .filter(Boolean)
    .map((pair) => {
      const dot = pair.indexOf(".");
      if (dot <= 0 || dot === pair.length - 1) return null;
      return { facet: pair.slice(0, dot), tag: pair.slice(dot + 1) };
    })
    .filter((x): x is { facet: string; tag: string } => x !== null);
  return {
    pairs,
    q: p.get("q") ?? "",
    sort: p.get("sort") === "old" ? "old" : "new",
  };
}

/** decodeFilters 的逆运算：→ query 串（无 "?"；空则 ""） */
export function encodeFilters(f: FilterPairs): string {
  const p = new URLSearchParams();
  const fs = f.pairs.map((x) => `${x.facet}.${x.tag}`);
  if (fs.length) p.set("f", fs.join("+"));
  if (f.q) p.set("q", f.q);
  if (f.sort === "old") p.set("sort", "old");
  return p.toString();
}

export interface MatchCtx {
  f: FilterPairs;
  sel: Selection;
  channel: string | null; // 频道页 path 即频道；首页 null = 全部
  skipFacet?: string; // 分面计数时排除自身 facet
  tagNames: Record<string, string>; // tagId → 显示名（q 检索命中标签名）
}

/** 频道内过滤：跨分面 AND；q 命中名称/描述/标签显示名；skipFacet 排除自身 facet 约束 */
export function matches(
  item: ItemLike,
  ctx: {
    f: FilterPairs;
    sel: Selection;
    channel: string | null;
    skipFacet?: string;
    tagNames: Record<string, string>;
  },
): boolean {
  if (ctx.channel && item.cat !== ctx.channel) return false;
  if (ctx.f.q) {
    const hay =
      `${item.name} ${item.desc} ${item.tags.map((t) => ctx.tagNames[t] ?? t).join(" ")}`.toLowerCase();
    if (!hay.includes(ctx.f.q.toLowerCase())) return false;
  }
  for (const facet in ctx.sel) {
    if (facet === ctx.skipFacet || !ctx.sel[facet].size) continue;
    if (!item.tags.some((t) => ctx.sel[facet].has(t))) return false;
  }
  return true;
}

/** 分面计数：排除自身 facet 约束后，含该标签的条目数 */
export function facetCount(
  items: ItemLike[],
  ctx: {
    f: FilterPairs;
    sel: Selection;
    channel: string | null;
    tagNames: Record<string, string>;
  },
  facet: string,
  tag: string,
): number {
  let n = 0;
  for (const it of items) {
    if (!matches(it, { ...ctx, skipFacet: facet })) continue;
    if (it.tags.includes(tag)) n++;
  }
  return n;
}

/** 收录序排序：new = 最新在前。同日按 slug 确定性排序 */
export function sortItems<T extends { added: string; slug?: string }>(
  items: T[],
  sort: SortKey,
): T[] {
  return [...items].sort((a, b) => {
    if (a.added !== b.added) {
      const d = a.added < b.added ? 1 : -1;
      return sort === "new" ? d : -d;
    }
    const s = (a.slug || "").localeCompare(b.slug || "");
    return sort === "new" ? s : -s;
  });
}

/** 过滤 + 排序一步到位 */
export function activeList<T extends ItemLike>(
  items: T[],
  ctx: Parameters<typeof matches>[1],
  sort: SortKey,
): T[] {
  return sortItems(
    items.filter((it) => matches(it, ctx)),
    sort,
  );
}
