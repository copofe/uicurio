// 一次性工具：从 Caveat-600 提取 "uicurio" 的专业字形轮廓 → 生成手绘风 SVG 字标
// 产出的 path 数据内联进 Sidebar.astro / Base.astro / public/island.js（用完即冻结）
import { createRequire } from "node:module";
const fontkit = createRequire(import.meta.url)("fontkit");
import { writeFileSync } from "node:fs";

const font = fontkit.openSync("fonts-tmp/dattebayo.ttf");

const TEXT = "uicurio";
const SIZE = 100;
const BASELINE = 82;

// fontkit.layout：GPOS kerning 内建；字形在字体单位坐标系（y 向上）
const run = font.layout(TEXT);
const s = SIZE / font.unitsPerEm;
const ADV = run.advanceWidth;
const ASC = font.ascent * s;
const DESC = -font.descent * s;
let body = "";

run.glyphs.forEach((glyph, i) => {
  const pos = run.positions[i];
  let p = glyph.path.toSVG();
  if (!p.startsWith("<path")) p = `<path d="${p}"/>`;
  p = p.replace("<path", `<path pathLength="1" style="--i:${i}"`);
  if (p.includes("NaN")) throw new Error(`glyph ${i} path has NaN`);
  // 字体单位（y 向上）→ 页面坐标：平移到基线，缩放并翻转 y
  body += `<g transform="translate(${(pos.xOffset * s).toFixed(2)}, ${BASELINE}) scale(${s.toFixed(6)}, -${s.toFixed(6)})">${p}</g>`;
});

const PAD = 3;
const W = (ADV * s + PAD * 2).toFixed(1);
const H = (ASC + DESC + PAD * 2).toFixed(1);
const viewBox = `${-PAD} ${(-PAD - ASC).toFixed(1)} ${W} ${H}`;
const svg = `<svg class="wordmark play" viewBox="${viewBox}" fill="currentColor" aria-hidden="true">${body}</svg>`;

writeFileSync("fonts-tmp/wordmark.svg", svg);
console.log("viewBox:", viewBox);

console.log("--- wordmark.svg 已写出 ---");
