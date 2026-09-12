import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://uicurio.shinji.me",
  integrations: [sitemap()],
  i18n: {
    locales: ["en", "zh"],
    defaultLocale: "en",
    prefixDefaultLocale: true,
  },
});
