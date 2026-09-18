// uicurio 岛的纯逻辑：过滤 / 排序 / URL 编解码。零 DOM，vitest 直测（island-core.test.ts）。
// 线上消费者：src/scripts/island.js（DOM 壳）。
// 线上契约：?f=facet.tagId+facet.tagId&q=…&sort=old —— 分享链接不可随意变更。

export const FACETS = ["function", "stack", "style", "scenario"] as const;
export type Facet = (typeof FACETS)[number];
export type SortKey = "new" | "old";

export interface ItemLike {
  slug?: string;
  name: string;
  altName?: string;
  desc: string;
  altDesc?: string;
  components?: string[];
  repo?: string | null;
  content?: string; // 详情正文（弹窗深度解析文本；入检索索引）
  cat: string;
  tags: string[]; // 标签 id（facet:slug）
  added: string;
}

export type TagMetaLike =
  | string
  | { name?: string; altName?: string; slug?: string };

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
  tagNames: Record<string, TagMetaLike>; // tagId → 显示名或完整元数据
}

/** 文本归一化三变体：原始小写 / 分隔符转空格 / 去空白紧凑。中英混排空格互通（k线 ↔ K 线、AI原生 ↔ AI 原生） */
export interface HayVariants {
  raw: string;
  normalized: string;
  compact: string;
}

export function hayVariants(text: string): HayVariants {
  const raw = text.toLowerCase();
  const normalized = raw.replace(/[-_./]/g, " ");
  const compact = normalized.replace(/\s+/g, "");
  return { raw, normalized, compact };
}

/** 查询分词：多词 AND；纯分隔符词（如单独的 "-"）剔除，避免退化为全匹配 */
export function queryTokens(q: string): string[] {
  return (q || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t && t.replace(/[-_./\s]/g, "") !== "");
}

/** 单个查询词对归一化 haystack 的命中判断 */
export function hayMatches(hay: HayVariants, token: string): boolean {
  const t = hayVariants(token);
  return (
    hay.raw.includes(t.raw) ||
    hay.normalized.includes(t.normalized) ||
    hay.compact.includes(t.compact)
  );
}

/** 构造条目的全文本检索索引（双语名/描述/正文、Slug、Repo、组件列表；不检索 tag） */
function buildHaystack(item: ItemLike): HayVariants {
  const parts: string[] = [
    item.name || "",
    item.altName || "",
    item.slug || "",
    item.desc || "",
    item.altDesc || "",
    item.repo || "",
    item.content || "",
  ];

  if (Array.isArray(item.components)) {
    for (const c of item.components) parts.push(c);
  }

  return hayVariants(parts.join(" "));
}

/** 查询词匹配判断：支持多词 AND 分词、标点归一化（crd-ui 与 crd ui 互通）、中英混排去空格互通与双语穿透；不搜 tag */
export function itemMatchesQuery(item: ItemLike, q: string): boolean {
  const tokens = queryTokens(q);
  if (!tokens.length) return true;
  const hay = buildHaystack(item);
  return tokens.every((token) => hayMatches(hay, token));
}

/** 频道内过滤：跨分面 AND；q 命中名称/描述/双语/组件/仓库（不搜 tag）；skipFacet 排除自身 facet 约束 */
export function matches(
  item: ItemLike,
  ctx: {
    f: FilterPairs;
    sel: Selection;
    channel: string | null;
    skipFacet?: string;
    tagNames: Record<string, TagMetaLike>;
  },
): boolean {
  if (ctx.channel && item.cat !== ctx.channel) return false;
  if (ctx.f.q && !itemMatchesQuery(item, ctx.f.q)) return false;
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
    tagNames: Record<string, TagMetaLike>;
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

/** 检索相关度评分（用于搜索时的排序优化；不评分 tag） */
function scoreItem(item: ItemLike, q: string): number {
  if (!q || !q.trim()) return 0;
  const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let total = 0;
  const slug = (item.slug || "").toLowerCase();
  const name = (item.name || "").toLowerCase();
  const altName = (item.altName || "").toLowerCase();
  const desc = (item.desc || "").toLowerCase();
  const altDesc = (item.altDesc || "").toLowerCase();
  const content = (item.content || "").toLowerCase();

  for (const t of tokens) {
    // 1. Slug & Name 精准 / 前缀 / 包含匹配
    if (slug === t || name === t || altName === t) total += 100;
    else if (slug.startsWith(t) || name.startsWith(t) || altName.startsWith(t))
      total += 60;
    else if (name.includes(t) || altName.includes(t) || slug.includes(t))
      total += 40;

    // 2. 描述匹配
    if (desc.includes(t) || altDesc.includes(t)) total += 15;

    // 3. 组件名称匹配
    if (Array.isArray(item.components)) {
      if (item.components.some((c) => c.toLowerCase().includes(t))) total += 8;
    }

    // 4. 详情正文匹配（权重最低，仅作兜底召回）
    if (content.includes(t)) total += 5;
  }
  return total;
}

/** 排序：若提供 q，按相关度评分从高到低排序；同分或无 q 时按收录日期排序（new = 最新在前） */
export function sortItems<
  T extends {
    added: string;
    slug?: string;
    name?: string;
    altName?: string;
    desc?: string;
    altDesc?: string;
    tags?: string[];
    components?: string[];
  },
>(items: T[], sort: SortKey, q = ""): T[] {
  return [...items].sort((a, b) => {
    if (q && q.trim()) {
      const scoreA = scoreItem(a as any, q);
      const scoreB = scoreItem(b as any, q);
      if (scoreA !== scoreB) return scoreB - scoreA;
    }
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
    ctx.f.q,
  );
}
