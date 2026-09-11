// 封面截图管线（票 02 定稿）：Playwright 本地截官网首屏 → sharp 转 WebP 入库。
// 入口：npm run shots（全量，跳过已有）/ npm run shots:one -- <slug>（单条重拍）
import { readdirSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import sharp from "sharp";

const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    throw new Error(`invalid JSON in ${p}: ${e.message}`);
  }
};

const args = process.argv.slice(2);
const only = args[0] && args[0] !== "--" ? args[0] : (args[1] ?? null);
mkdirSync("assets/shots", { recursive: true });

const items = readdirSync("data/items")
  .filter((f) => f.endsWith(".json"))
  .map((f) => readJson(`data/items/${f}`));
const targets = only
  ? items.filter((i) => i.slug === only)
  : items.filter((i) => !existsSync(`assets/shots/${i.slug}.webp`));
if (!targets.length) {
  console.log("nothing to capture");
  process.exit(0);
}

const PROXY = process.env.SHOTS_PROXY ?? "http://127.0.0.1:7890";
const browser = await chromium.launch({ proxy: { server: PROXY } });
const ok = [];
const failed = [];
const CONCURRENCY = 3;

async function capture(item) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  try {
    try {
      await page.goto(item.url, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(2500);
    } catch {
      // 二级策略：networkidle 超时（长轮询/分析脚本不断发请求的站）→ DOM 就绪 + 固定稳态等待
      try {
        await page.goto(item.url, {
          waitUntil: "domcontentloaded",
          timeout: 45_000,
        });
        await page.waitForTimeout(6000);
      } catch {
        // 三级策略：慢站（TTFB 25s+）→ 只要导航 committed 就开始等稳态
        await page.goto(item.url, { waitUntil: "commit", timeout: 60_000 });
        await page.waitForTimeout(10_000);
      }
    }
    const buf = await page.screenshot({ type: "png" });
    await sharp(buf)
      .resize({ width: 1600 })
      .webp({ quality: 78 })
      .toFile(`assets/shots/${item.slug}.webp`);
    ok.push(item.slug);
    console.log(`✓ ${item.slug}`);
  } catch (e) {
    failed.push([item.slug, String(e).slice(0, 120)]);
    console.log(`✗ ${item.slug}: ${String(e).slice(0, 120)}`);
  } finally {
    await page.close();
  }
}

const queue = [...targets];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await capture(queue.shift());
    return true;
  }),
);
await browser.close();
if (failed.length) {
  for (const [slug, msg] of failed) console.log(`RETRY-NEEDED ${slug}: ${msg}`);
  process.exit(1);
}
console.log(`captured ${ok.length}/${targets.length}`);
