// 一次性工具：生成字标动画效果对比页 prototype/wordmark.html
// 三种字体（Dattebayo / La Belle Aurore / Great Vibes）× 四种「写出来」路线，同页对比
import { createRequire } from "node:module";
const fontkit = createRequire(import.meta.url)("fontkit");
import { writeFileSync } from "node:fs";

const FONTS = [
  {
    file: "fonts-tmp/dattebayo.ttf",
    key: "dattebayo",
    label: "Dattebayo · 马克笔签名",
  },
  {
    file: "fonts-tmp/La-Belle-Aurore.ttf",
    key: "aurore",
    label: "La Belle Aurore · 细钢笔手写",
  },
  {
    file: "fonts-tmp/Great-Vibes.ttf",
    key: "vibes",
    label: "Great Vibes · 优雅连笔书法",
  },
];
const TEXT = "uicurio";

const variants = FONTS.map(({ file, key, label }) => {
  const font = fontkit.openSync(file);
  const run = font.layout(TEXT);
  const s = 100 / font.unitsPerEm;
  const xs = run.positions.map((pos) => pos.xOffset * s);
  const letters = [];
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  run.glyphs.forEach((glyph, i) => {
    const bb = glyph.bbox;
    if (
      [bb.minX, bb.minY, bb.maxX, bb.maxY].some(
        (v) => v === undefined || Number.isNaN(v),
      )
    )
      throw new Error(key + " glyph " + i + " bbox bad");
    const dd = glyph.path
      .toSVG()
      .replace(/^<path /, "")
      .replace(/\/>$/, "");
    if (dd.includes("NaN")) throw new Error(key + " glyph " + i + " NaN");
    letters.push(dd);
    minX = Math.min(minX, (run.positions[i].xOffset + bb.minX) * s);
    maxX = Math.max(maxX, (run.positions[i].xOffset + bb.maxX) * s);
    minY = Math.min(minY, -bb.maxY * s);
    maxY = Math.max(maxY, -bb.minY * s);
  });

  const PAD = 4;
  const viewBox = `${(minX - PAD).toFixed(1)} ${(minY - PAD).toFixed(1)} ${(maxX - minX + PAD * 2).toFixed(1)} ${(maxY - minY + PAD * 2).toFixed(1)}`;
  return { key, label, viewBox, s, xs, letters };
});

const dataObj = Object.fromEntries(
  variants.map((v) => [
    v.key,
    {
      label: v.label,
      viewBox: v.viewBox,
      s: v.s,
      xs: v.xs,
      letters: v.letters,
    },
  ]),
);
const dataLiteral = JSON.stringify(dataObj).replace(/</g, "\\u003c");

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>uicurio 字标效果对比 · prototype</title>
<style>
  :root { --bg:#fff; --ink:#171717; --t2:#6f6f6f; --border:#ececee; --s2:#f5f5f5; }
  * { box-sizing:border-box; margin:0; padding:0 }
  body { font-family:Inter,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif; background:var(--bg); color:var(--ink); padding:40px 32px 80px }
  h1 { font-size:22px; font-weight:600; letter-spacing:-.02em }
  .note { color:var(--t2); font-size:13px; margin:6px 0 28px }
  .panel { border:1px solid var(--border); border-radius:12px; padding:22px 24px 16px; margin-bottom:22px }
  .panel h2 { font-size:14px; font-weight:600 }
  .panel .desc { font-size:12.5px; color:var(--t2); margin:3px 0 6px }
  .stage { background:var(--bg); padding:18px 12px 6px; border-radius:8px }
  .stage svg { height:88px; width:auto; max-width:100%; display:block; overflow:visible }
  .meta { display:flex; align-items:center; gap:10px; margin-top:8px }
  .replay { font-size:12.5px; background:var(--s2); padding:5px 14px; border-radius:999px }
  .replay:hover { background:#e9e9eb }
  .dark-toggle { margin-left:auto }
  body.dark { --bg:#101012; --ink:#f0f0f2; --t2:#a0a0a8; --border:#2a2a30; --s2:#1b1b1f }

  /* 基础隐藏态：描边未画、填充未上 */
  [data-anim="trace"] path {
    fill-opacity:0; stroke:var(--ink); stroke-width:2.2; stroke-linecap:round; stroke-linejoin:round;
    stroke-dasharray:1; stroke-dashoffset:1;
  }
  [data-anim="thin"] path {
    fill-opacity:0; stroke:var(--ink); stroke-width:.9; stroke-linecap:round; stroke-linejoin:round;
    stroke-dasharray:1; stroke-dashoffset:1;
  }
  [data-anim="sweep"] .wrap { clip-path: inset(-30% 100% -30% -2%) }
  [data-anim="fade"] .gl { opacity:0 }

  /* 播放闸门：.stage.replay 出现时才动 */
  .stage.replay[data-anim="trace"] path {
    animation:
      a-draw .55s cubic-bezier(.3,.7,.2,1) forwards,
      a-ink .4s cubic-bezier(.3,.7,.2,1) forwards;
    animation-delay: calc(var(--i) * 110ms), calc(var(--i) * 110ms + 420ms);
  }
  .stage.replay[data-anim="thin"] path {
    animation:
      a-draw .5s cubic-bezier(.3,.7,.2,1) forwards,
      a-ink .45s cubic-bezier(.3,.7,.2,1) forwards;
    animation-delay: calc(var(--i) * 100ms), calc(var(--i) * 100ms + 380ms);
  }
  @keyframes a-draw { to { stroke-dashoffset:0 } }
  @keyframes a-ink { to { fill-opacity:1 } }

  .stage.replay[data-anim="sweep"] .wrap {
    animation: a-sweep .9s cubic-bezier(.4,0,.2,1) forwards;
  }
  @keyframes a-sweep { to { clip-path: inset(-30% -2% -30% -2%) } }

  .stage.replay[data-anim="fade"] .gl {
    animation: a-fade .45s ease forwards;
    animation-delay: calc(var(--i) * 110ms);
  }
  @keyframes a-fade { from { opacity:0 } to { opacity:1 } }

  @media (prefers-reduced-motion: reduce) {
    .stage.replay * { animation: none !important }
    [data-anim="trace"] path, [data-anim="thin"] path {
      stroke-dashoffset:0 !important; fill-opacity:1 !important;
    }
    [data-anim="sweep"] .wrap { clip-path:none !important }
    [data-anim="fade"] .gl { opacity:1 !important }
  }
</style>
</head>
<body>
  <h1>uicurio 字标 · 四种「写出来」的效果对比</h1>
  <p class="note">同一种 Dattebayo 风格字标，四种动画路线 + 三种字体气质。每面板独立重播；右上角切暗色底检查观感。选定后在正式站落地。</p>
  <div id="panels"></div>

  <!--WORDMARK_DATA-->
  <script>
    const PANELS = [
      { font: "dattebayo", anim: "trace", desc: "路线 1（当前站上）：轮廓描画 → 填充浮现。能看到双线勾边再上墨" },
      { font: "dattebayo", anim: "sweep", desc: "路线 2：遮罩扫显。填充字形像被马克笔从左到右扫出来，无描线过程" },
      { font: "aurore",    anim: "thin",  desc: "路线 3：细钢笔字体（La Belle Aurore）+ 描画。笔画细，近乎真实书写" },
      { font: "vibes",     anim: "trace", desc: "路线 4：优雅连笔书法（Great Vibes）+ 描画。字形最华丽" },
    ];
    // 安全渲染：DOMParser 解析后 replaceChildren（不经 innerHTML 赋值）
    const mount = (el, html) => el.replaceChildren(...new DOMParser().parseFromString("<body>" + html + "</body>", "text/html").body.childNodes);

    const panelsEl = document.getElementById("panels");
    PANELS.forEach(({ font, anim, desc }) => {
      const d = WORDMARK_DATA[font];
      let body = "";
      d.letters.forEach((dd, i) => {
        body += '<g transform="translate(' + d.xs[i].toFixed(2) + ', 0) scale(' + d.s.toFixed(6) + ', -' + d.s.toFixed(6) + ')"><path ' + dd + ' pathLength="1" style="--i:' + i + '"></path></g>';
      });
      const sec = document.createElement("section");
      sec.className = "panel";
      mount(sec,
        '<h2>' + d.label + '</h2>' +
        '<p class="desc">' + desc + '</p>' +
        '<div class="stage replay" data-anim="' + anim + '"><svg class="play" viewBox="' + d.viewBox + '" fill="currentColor" aria-hidden="true">' + body + '</svg></div>' +
        '<div class="meta"><button class="replay" type="button">\\u21bb \\u91cd\\u64ad</button></div>');
      panelsEl.appendChild(sec);
    });

    function replayAll() {
      document.querySelectorAll(".stage").forEach((st) => {
        st.classList.remove("replay");
        void st.getBoundingClientRect();
        st.classList.add("replay");
      });
    }
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("replay")) replayAll();
    });
    const dk = document.createElement("button");
    dk.className = "replay dark-toggle";
    dk.textContent = "\\u263e \\u6697\\u8272\\u5e95\\u9884\\u89c8";
    dk.addEventListener("click", () => document.body.classList.toggle("dark"));
    document.body.appendChild(dk);
    replayAll();
  </script>
</body>
</html>`;

writeFileSync(
  "prototype/wordmark.html",
  html.replace(
    "<!--WORDMARK_DATA-->",
    "<script>const WORDMARK_DATA = " + dataLiteral + ";</script>",
  ),
);
console.log("prototype/wordmark.html 已生成：", variants.length, "种字标路线");
