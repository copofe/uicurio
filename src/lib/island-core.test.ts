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
  type TagMetaLike,
} from "./island-core.ts";

const tagNames: Record<string, TagMetaLike> = {
  "function:card-input": {
    name: "卡号输入",
    altName: "card input",
    slug: "card-input",
  },
  "function:chart": "图表",
  "function:diff": "diff",
  "stack:react": "React",
  "stack:vue": "Vue",
  "style:cozy": "温馨",
};

const items: ItemLike[] = [
  {
    name: "Liveline",
    desc: "实时折线图",
    cat: "data-viz",
    tags: ["function:chart", "stack:react"],
    added: "2026-09-11",
  },
  {
    name: "Diffs",
    desc: "代码 diff 渲染",
    cat: "files-code",
    tags: ["function:diff"],
    added: "2026-09-10",
  },
  {
    slug: "crd-ui",
    name: "crd-ui",
    altName: "crd-ui",
    desc: "极具质感的支付表单银行卡交互组件：支持 React/Vue/Svelte",
    altDesc:
      "A credit & debit card component for payment forms in React and Vue",
    components: ["CVV / CVC with Auto-flip", "Interactive 3D Card Preview"],
    repo: "https://github.com/JuandaGarcia/crd-ui",
    cat: "input-controls",
    tags: ["function:card-input", "stack:react", "stack:vue"],
    added: "2026-09-09",
  },
  {
    name: "Animal Island",
    desc: "温馨海岛风组件库",
    cat: "collections",
    tags: ["style:cozy", "stack:react"],
    added: "2026-09-08",
  },
];

describe("decodeFilters / encodeFilters", () => {
  it("解码完整查询串（%2B 与手输 + 均可）", () => {
    const f = decodeFilters(
      "?f=stack.react+function.chart&q=%E6%8A%98%E7%BA%BF&sort=old",
    );
    expect(f.pairs).toEqual([
      { facet: "stack", tag: "react" },
      { facet: "function", tag: "chart" },
    ]);
    expect(f.q).toBe("折线");
    expect(f.sort).toBe("old");
  });

  it("编码是解码的逆运算（round-trip，规范形态 %2B）", () => {
    const search =
      "?f=stack.react%2Bfunction.chart&q=%E6%8A%98%E7%BA%BF&sort=old";
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
  const mk = (
    pairs: { facet: string; tag: string }[],
    q = "",
    channel: string | null = null,
  ) => {
    const sel = emptySelection();
    for (const p of pairs) sel[p.facet]?.add(p.tag);
    return { f: { pairs, q, sort: "new" as const }, sel, channel, tagNames };
  };

  it("频道不匹配直接排除", () => {
    expect(matches(items[0], mk([], "", "data-viz"))).toBe(true);
    expect(matches(items[0], mk([], "", "files-code"))).toBe(false);
  });

  it("q 命中名称/描述/双语/组件/仓库", () => {
    expect(matches(items[0], mk([], "liveline"))).toBe(true);
    expect(matches(items[0], mk([], "折线图"))).toBe(true);
    expect(matches(items[0], mk([], "zzz"))).toBe(false);
  });

  it("q 不搜 tag：仅有 tag 但名称/描述中未出现的词不被搜索命中", () => {
    // items[0] (Liveline) 拥有 stack:react 标签，但名称与描述中均无 React
    expect(matches(items[0], mk([], "React"))).toBe(false);
    // items[2] (crd-ui) 描述中明确写有 React，因此命中
    expect(matches(items[2], mk([], "React"))).toBe(true);
  });

  it("q 支持连字符与空格互通搜索 (crd-ui 与 crd ui)", () => {
    expect(matches(items[2], mk([], "crd ui"))).toBe(true);
    expect(matches(items[2], mk([], "crd-ui"))).toBe(true);
    expect(matches(items[2], mk([], "crd"))).toBe(true);
  });

  it("q 支持英文核心词穿透检索中文条目 (card, credit, payment)", () => {
    expect(matches(items[2], mk([], "card"))).toBe(true);
    expect(matches(items[2], mk([], "credit"))).toBe(true);
    expect(matches(items[2], mk([], "payment"))).toBe(true);
    expect(matches(items[2], mk([], "银行卡"))).toBe(true);
  });

  it("q 支持组件名与仓库名检索 (cvv, JuandaGarcia)", () => {
    expect(matches(items[2], mk([], "cvv"))).toBe(true);
    expect(matches(items[2], mk([], "JuandaGarcia"))).toBe(true);
  });

  it("q 支持多词 AND 分词检索 (react card, 3d 银行卡)", () => {
    expect(matches(items[2], mk([], "react card"))).toBe(true);
    expect(matches(items[2], mk([], "3d 银行卡"))).toBe(true);
    expect(matches(items[2], mk([], "react chart"))).toBe(false);
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
