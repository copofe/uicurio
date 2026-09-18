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
let only = null;
let SETTLE_MS = 2500; // 默认稳态等待；顽固动画页用 --settle <ms> 覆盖
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--settle") {
    SETTLE_MS = parseInt(args[++i], 10);
    continue;
  }
  if (args[i] === "--") continue;
  if (only === null) only = args[i];
}
mkdirSync("public/assets/shots", { recursive: true });

const items = readdirSync("data/items")
  .filter((f) => f.endsWith(".json"))
  .map((f) => readJson(`data/items/${f}`));
const targets = only
  ? items.filter((i) => i.slug === only)
  : items.filter((i) => !existsSync(`public/assets/shots/${i.slug}.webp`));
if (!targets.length) {
  console.log("nothing to capture");
  process.exit(0);
}

import net from "node:net";

// 代理探测：若配置的代理端口无服务响应，则自动回退为直连，避免无代理环境下全局挂起
async function detectProxy(proxyUrl) {
  if (!proxyUrl || proxyUrl === "none" || proxyUrl === "direct") return null;
  try {
    const { hostname, port } = new URL(proxyUrl);
    return await new Promise((resolve) => {
      const socket = net.createConnection(
        { host: hostname, port: Number(port) },
        () => {
          socket.destroy();
          resolve(proxyUrl);
        },
      );
      socket.setTimeout(600);
      socket.on("timeout", () => {
        socket.destroy();
        resolve(null);
      });
      socket.on("error", () => {
        socket.destroy();
        resolve(null);
      });
    });
  } catch {
    return null;
  }
}

const configuredProxy = process.env.SHOTS_PROXY ?? "http://127.0.0.1:7890";
const activeProxy = await detectProxy(configuredProxy);
if (!activeProxy && configuredProxy) {
  console.log(`[shots] 代理 ${configuredProxy} 未启动，已自动切换为直连`);
}
const browser = await chromium.launch(
  activeProxy ? { proxy: { server: activeProxy } } : {},
);
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
      await page.waitForTimeout(SETTLE_MS);
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
      .toFile(`public/assets/shots/${item.slug}.webp`);
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
