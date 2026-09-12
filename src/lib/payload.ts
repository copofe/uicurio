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
      tags.map((x: any) => [x.id, { facet: x.facet, name: L(x.name) }]),
    ),
    items: items.map((i: any) => ({
      slug: i.slug,
      name: L(i.name),
      desc: L(i.description),
      cat: i.category,
      tags: i.tags,
      url: i.url,
      repo: i.repo ?? null,
      added: i.added,
      shot: i.screenshot,
    })),
    strings: {
      searchPh: t.searchPh,
      resultsSuffix: t.resultsSuffix,
      clearAll: t.clearAll,
      emptyText: t.emptyText,
      emptyClear: t.emptyClear,
      showResults: t.showResults,
      drawerClear: t.drawerClear,
      sortNew: t.sortNew,
      sortOld: t.sortOld,
      fchipQ: t.fchipQ,
      fchipChannel: t.fchipChannel,
      pgItems: t.pgItems,
      pgChannels: t.pgChannels,
      pgTags: t.pgTags,
      palettePh: t.palettePh,
      paletteEmpty: t.paletteEmpty,
      pAdd: t.pAdd,
      pSelected: t.pSelected,
    },
  };
}
