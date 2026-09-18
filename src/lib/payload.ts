// 岛数据载荷：给渐进增强脚本的全量上下文（藏品全集 + 频道 + 标签 + 本地化字符串）
import { items, categories, tags } from "./data";
import { ui, type Locale } from "../i18n";

export function buildPayload(
  locale: Locale,
  page: "gallery" | "info",
  channel: string | null,
) {
  const t = ui[locale];
  const L = (o: any) => o?.[locale] ?? o?.en ?? "";
  const altLocale = locale === "zh" ? "en" : "zh";
  const altL = (o: any) => o?.[altLocale] ?? "";
  return {
    locale,
    page,
    channel,
    categories: categories.map((c: any) => ({ slug: c.slug, name: L(c.name) })),
    facets: [
      { key: "function", name: t.function },
      { key: "stack", name: t.stack },
      { key: "style", name: t.style },
      { key: "scenario", name: t.scenario },
    ],
    tags: Object.fromEntries(
      tags.map((x: any) => [
        x.id,
        {
          facet: x.facet,
          name: L(x.name),
          altName: altL(x.name),
          slug: x.slug || "",
        },
      ]),
    ),
    items: items.map((i: any) => ({
      slug: i.slug,
      name: L(i.name),
      altName: altL(i.name),
      desc: L(i.description),
      altDesc: altL(i.description),
      content: L(i.content) || "",
      components: i.components || [],
      cat: i.category,
      tags: i.tags,
      url: i.url,
      repo: i.repo ?? null,
      added: i.added,
      shot: i.screenshot,
    })),
    strings: t,
  };
}
