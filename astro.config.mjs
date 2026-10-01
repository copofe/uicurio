import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// 预先建立条目 slug -> added 映射，供 sitemap 注入真实收录日期 lastmod
const itemAddedMap = new Map();
try {
  const files = readdirSync(join("data", "items")).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const raw = JSON.parse(readFileSync(join("data", "items", f), "utf-8"));
    if (raw.slug && raw.added) {
      itemAddedMap.set(raw.slug, raw.added);
    }
  }
} catch (e) {
  console.warn("[sitemap] failed to load item dates:", e);
}

export default defineConfig({
  site: "https://uicurio.shinji.me",
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en",
          zh: "zh",
        },
      },
      serialize(item) {
        const itemMatch = item.url.match(/\/item\/([a-z0-9-]+)\/?$/);
        if (itemMatch) {
          const slug = itemMatch[1];
          const added = itemAddedMap.get(slug);
          if (added) {
            item.lastmod = new Date(added);
          }
          item.changefreq = "weekly";
          item.priority = 0.8;
          return item;
        }
        if (item.url.includes("/collections/") || item.url.includes("/tags/")) {
          item.changefreq = "daily";
          item.priority = 0.7;
          return item;
        }
        item.changefreq = "daily";
        item.priority = 1.0;
        return item;
      },
    }),
  ],
  i18n: {
    locales: ["en", "zh"],
    defaultLocale: "en",
    prefixDefaultLocale: true,
  },
});
