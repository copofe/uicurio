import sharp from "sharp";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const targetPath = join("public", "og.png");

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090a0f"/>
      <stop offset="100%" stop-color="#12131a"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="20%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#spot)"/>

  <!-- Subtle inner border -->
  <rect x="24" y="24" width="1152" height="582" rx="20" fill="none" stroke="#232533" stroke-width="1.5"/>

  <!-- Brand badge -->
  <g transform="translate(80, 80)">
    <rect width="44" height="44" rx="10" fill="#171822" stroke="#2c2e3e" stroke-width="1"/>
    <text x="22" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="24" font-weight="700" fill="#ffffff" text-anchor="middle">u</text>
    <text x="58" y="31" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="26" font-weight="700" fill="#ffffff" letter-spacing="-0.02em">uicurio</text>
    <rect x="168" y="10" width="170" height="26" rx="13" fill="#171822" stroke="#2c2e3e" stroke-width="1"/>
    <text x="253" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="11.5" font-weight="600" fill="#94a3b8" text-anchor="middle" letter-spacing="0.05em">CURATED DIRECTORY</text>
  </g>

  <!-- Main Headline -->
  <text x="80" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="52" font-weight="700" fill="#ffffff" letter-spacing="-0.03em">
    Hand-picked UI Libraries &amp;
  </text>
  <text x="80" y="310" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="52" font-weight="700" fill="#c7d2fe" letter-spacing="-0.03em">
    Design Engineering Gems
  </text>

  <!-- Subheading -->
  <text x="80" y="380" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="22" font-weight="400" fill="#94a3b8">
    精选高质感开源 UI 库 · 8,400+ 组件检索 · 零水合极速静态体验
  </text>

  <!-- Feature Pills -->
  <g transform="translate(80, 470)">
    <g transform="translate(0, 0)">
      <rect width="216" height="48" rx="24" fill="#14151e" stroke="#252736" stroke-width="1"/>
      <text x="108" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="15" font-weight="600" fill="#e2e8f0" text-anchor="middle">148 Curated Libraries</text>
    </g>
    <g transform="translate(232, 0)">
      <rect width="210" height="48" rx="24" fill="#14151e" stroke="#252736" stroke-width="1"/>
      <text x="105" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="15" font-weight="600" fill="#e2e8f0" text-anchor="middle">8,400+ Components</text>
    </g>
    <g transform="translate(458, 0)">
      <rect width="180" height="48" rx="24" fill="#14151e" stroke="#252736" stroke-width="1"/>
      <text x="90" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="15" font-weight="600" fill="#e2e8f0" text-anchor="middle">6 Topic Channels</text>
    </g>
    <g transform="translate(654, 0)">
      <rect width="180" height="48" rx="24" fill="#14151e" stroke="#252736" stroke-width="1"/>
      <text x="90" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="15" font-weight="600" fill="#e2e8f0" text-anchor="middle">Zero Dependency</text>
    </g>
  </g>
</svg>
`;

async function main() {
  await sharp(Buffer.from(svg)).png().toFile(targetPath);
  console.log("generated public/og.png");
}

main().catch(console.error);
