// 数据层：读仓库根 data/（票 03 定稿模型）。构建期执行，零运行时。
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    throw new Error(`invalid JSON in ${p}: ${(e as Error).message}`);
  }
};
const FACETS = ["function", "stack", "style", "scenario"] as const;
export type Facet = (typeof FACETS)[number];

export const categories = readdirSync(join("data", "categories"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => read(join("data", "categories", f)))
  .sort((a: any, b: any) => a.order - b.order);

export const tags = FACETS.flatMap((facet) =>
  existsSync(join("data", "tags", facet))
    ? readdirSync(join("data", "tags", facet))
        .filter((f) => f.endsWith(".json"))
        .map((f) => read(join("data", "tags", facet, f)))
    : [],
);

export const items = readdirSync(join("data", "items"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => read(join("data", "items", f)))
  .sort((a: any, b: any) => {
    if (a.added !== b.added) return a.added < b.added ? 1 : -1;
    return (a.slug || "").localeCompare(b.slug || "");
  });

export const tagById = new Map(tags.map((t: any) => [t.id, t]));
export const itemsInCategory = (cat: string) =>
  items.filter((i: any) => i.category === cat);
export const itemsWithTag = (tagId: string) =>
  items.filter((i: any) => i.tags.includes(tagId));
export const featured = items.filter((i: any) => i.featured);

// 票 08 门槛：tag 页 ≥2 条、组合页 ≥3 条才生成
export const TAG_MIN = 2;
export const COMBO_MIN = 3;

// 条目页 Alternatives：同首个 function 标签的其他条目
export function alternatives(item: any) {
  const fnTags = item.tags.filter((t: string) => t.startsWith("function:"));
  return items.filter(
    (x: any) =>
      x.slug !== item.slug && x.tags.some((t: string) => fnTags.includes(t)),
  );
}

export const tagCount = (tagId: string) => itemsWithTag(tagId).length;

/** 频道计数索引：建一次，三处调用点（两页 + 岛）共用 */
export const categoriesWithCount = categories.map((c: any) => ({
  ...c,
  count: itemsInCategory(c.slug).length,
}));
