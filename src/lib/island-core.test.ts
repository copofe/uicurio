// island-core 的回归网：URL 编解码契约、跨分面过滤语义、分面计数、排序稳定性
import { describe, expect, it } from "vitest";
import {
  activeList,
  decodeFilters,
  emptySelection,
  encodeFilters,
  facetCount,
  matches,
  sortItems,
  type ItemLike,
} from "./island-core.ts";

const tagNames: Record<string, string> = {
  "function:chart": "图表",
  "function:diff": "diff",
  "stack:react": "React",
  "stack:vue": "Vue",
  "style:cozy": "温馨",
};

const items: ItemLike[] = [
  { name: "Liveline", desc: "实时折线图", cat: "data-viz", tags: ["function:chart", "stack:react"], added: "2026-09-11" },
  { name: "Diffs", desc: "代码 diff 渲染", cat: "files-code", tags: ["function:diff"], added: "2026-09-10" },
  { name: "crd-ui", desc: "银行卡输入组件", cat: "input-controls", tags: ["function:card-input", "stack:react", "stack:vue"], added: "2026-09-09" },
  { name: "Animal Island", desc: "温馨海岛风组件库", cat: "collections", tags: ["style:cozy", "stack:react"], added: "2026-09-08" },
];

describe("decodeFilters / encodeFilters", () => {
  it("解码完整查询串（%2B 与手输 + 均可）", () => {
    const f = decodeFilters("?f=stack.react+function.chart&q=%E6%8A%98%E7%BA%BF&sort=old");
    expect(f.pairs).toEqual([
      { facet: "stack", tag: "react" },
      { facet: "function", tag: "chart" },
    ]);
    expect(f.q).toBe("折线");
    expect(f.sort).toBe("old");
  });

  it("编码是解码的逆运算（round-trip，规范形态 %2B）", () => {
    const search = "?f=stack.react%2Bfunction.chart&q=%E6%8A%98%E7%BA%BF&sort=old";
    const f = decodeFilters(search);
    expect("?" + encodeFilters(f)).toBe(search);
  });

  it("空态编码为空串；sort=new 不写入", () => {
    expect(encodeFilters({ pairs: [], q: "", sort: "new" })).toBe("");
  });

  it("畸形 pair（无点/空段）被安全剔除", () => {
    const f = decodeFilters("?f=stack.+react+bogus");
    expect(f.pairs).toEqual([]);
  });
});

describe("matches", () => {
  const mk = (pairs: { facet: string; tag: string }[], q = "", channel: string | null = null) => {
    const sel = emptySelection();
    for (const p of pairs) sel[p.facet]?.add(p.tag);
    return { f: { pairs, q, sort: "new" as const }, sel, channel, tagNames };
  };

  it("频道不匹配直接排除", () => {
    expect(matches(items[0], mk([], "", "data-viz"))).toBe(true);
    expect(matches(items[0], mk([], "", "files-code"))).toBe(false);
  });

  it("q 命中名称/描述/标签显示名", () => {
    expect(matches(items[0], mk([], "liveline"))).toBe(true);
    expect(matches(items[0], mk([], "折线图"))).toBe(true);
    expect(matches(items[0], mk([], "React"))).toBe(true); // 标签名
    expect(matches(items[0], mk([], "zzz"))).toBe(false);
  });

  it("跨分面 AND：stack:react 与 function:chart 同时命中", () => {
    const ctx = mk([
      { facet: "stack", tag: "stack:react" },
      { facet: "function", tag: "function:chart" },
    ]);
    expect(matches(items[0], ctx)).toBe(true);
    expect(matches(items[2], ctx)).toBe(false); // 有 react 无 chart
  });

  it("同分面多选为 OR 语义", () => {
    const ctx = mk([
      { facet: "stack", tag: "stack:react" },
      { facet: "stack", tag: "stack:vue" },
    ]);
    expect(matches(items[0], ctx)).toBe(true); // react
    expect(matches(items[2], ctx)).toBe(true); // vue
  });
});

describe("facetCount", () => {
  it("计数排除自身 facet 约束", () => {
    const ctx = {
      f: { pairs: [], q: "", sort: "new" as const },
      sel: {
        function: new Set(["function:chart"]),
        stack: new Set(),
        style: new Set(),
        scenario: new Set(),
      } as Record<string, Set<string>>,
      channel: null,
      tagNames,
    };
    // 有 function:chart 约束时数 stack:react → 只剩 Liveline
    expect(facetCount(items, ctx, "stack", "stack:react")).toBe(1);
    // skip 只豁免 stack 自身约束：crd-ui 缺 function:chart，仍被排除
    expect(facetCount(items, ctx, "stack", "stack:vue")).toBe(0);
  });
});

describe("sortItems", () => {
  it("new = 最新在前；old 反转；同日保持稳定", () => {
    const sorted = sortItems(items, "new").map((x) => x.name);
    expect(sorted).toEqual(["Liveline", "Diffs", "crd-ui", "Animal Island"]);
    const old = sortItems(items, "old").map((x) => x.name);
    expect(old[0]).toBe("Animal Island");
  });
});
