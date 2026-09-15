// 一次性工具：从 Dattebayo 提取 "uicurio" 的专业字形轮廓 → 生成手绘风 SVG 字标
// 产出的 path 数据内联进 Sidebar.astro / Base.astro / public/island.js（用完即冻结）
import { createRequire } from "node:module";
const fontkit = createRequire(import.meta.url)("fontkit");
import { writeFileSync, readFileSync } from "node:fs";

const font = fontkit.openSync("fonts-tmp/Carattere-Regular.ttf");

const TEXT = "Uicurio";
const SIZE = 100;
const PAD = 3;

// fontkit.layout：GPOS kerning 内建；字形在字体单位坐标系（y 向上）
const run = font.layout(TEXT);
const s = SIZE / font.unitsPerEm;
let body = "";
let x0 = Infinity,
  y0 = Infinity,
  x1 = -Infinity,
  y1 = -Infinity; // 最终坐标（y 向下）
let cumX = 0; // 累计位移：positions[].xOffset 只是微调，前进量在 xAdvance

run.glyphs.forEach((glyph, i) => {
  const pos = run.positions[i];
  const placeX = cumX;
  let p = glyph.path.toSVG();
  if (!p.startsWith("<path")) p = `<path d="${p}"/>`;
  p = p.replace("<path", `<path pathLength="1" style="--i:${i}"`);
  if (p.includes("NaN")) throw new Error(`glyph ${i} path has NaN`);
  // 墨迹边界：字形局部坐标(y 向上) → 最终坐标(x 右移, y 翻转向下)
  const bb = glyph.bbox;
  if (
    [bb.minX, bb.minY, bb.maxX, bb.maxY].some(
      (v) => v === undefined || Number.isNaN(v),
    )
  )
    throw new Error(`glyph ${i} bbox bad: ${JSON.stringify(bb)}`);
  x0 = Math.min(x0, placeX + bb.minX * s);
  x1 = Math.max(x1, placeX + bb.maxX * s);
  y0 = Math.min(y0, -bb.maxY * s);
  y1 = Math.max(y1, -bb.minY * s);
  // 基线 y=0：先平移到字位，再缩放并翻转 y
  body += `<g transform="translate(${placeX.toFixed(2)}, 0) scale(${s.toFixed(6)}, -${s.toFixed(6)})">${p}</g>`;
  cumX += pos.xAdvance * s;
});

const viewBox = `${(x0 - PAD).toFixed(1)} ${(y0 - PAD).toFixed(1)} ${(x1 - x0 + PAD * 2).toFixed(1)} ${(y1 - y0 + PAD * 2).toFixed(1)}`;
const svg = `<svg class="wordmark play" viewBox="${viewBox}" fill="currentColor" aria-hidden="true">${body}</svg>`;

writeFileSync("fonts-tmp/wordmark.svg", svg);

// --write：把新字标直写三个落点（侧栏 / 顶栏 / 岛克隆源），消除手动粘贴环节
if (process.argv.includes("--write")) {
  for (const p of ["src/components/Sidebar.astro", "src/layouts/Base.astro"]) {
    const src = readFileSync(p, "utf8");
    const i = src.indexOf('<svg class="wordmark');
    if (i === -1) throw new Error(p + " 字标块未找到");
    const j = src.indexOf("</svg>", i) + "</svg>".length;
    writeFileSync(p, src.slice(0, i) + svg + src.slice(j));
    console.log("written:", p);
  }
}
console.log("viewBox:", viewBox);
console.log("--- wordmark.svg 已写出 ---");
