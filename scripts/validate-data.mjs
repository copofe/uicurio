// 构建期数据门禁（票 03 定稿）：零依赖，错误阻断、警告放行。
// 与 data/_schema/*.schema.json 对应；schema 是给人和编辑器看的，这里是强制执行。
import { readdirSync, readFileSync, existsSync } from "node:fs";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const URL_RE = /^https:\/\/[^\s"<>]+$/;
const FACETS = ["function", "stack", "style", "scenario"];
const errors = [];
const warnings = [];
const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    throw new Error(`invalid JSON in ${p}: ${e.message}`);
  }
};

// —— 加载 ——
const categories = readdirSync("data/categories")
  .filter((f) => f.endsWith(".json"))
  .map((f) => readJson(`data/categories/${f}`));
const tagFiles = [];
for (const facet of FACETS) {
  if (!existsSync(`data/tags/${facet}`)) continue;
  for (const f of readdirSync(`data/tags/${facet}`).filter((x) =>
    x.endsWith(".json"),
  ))
    tagFiles.push(readJson(`data/tags/${facet}/${f}`));
}
const itemFiles = readdirSync("data/items").filter((f) => f.endsWith(".json"));
const items = itemFiles.map((f) => readJson(`data/items/${f}`));

// —— 唯一性 ——
for (const [kind, list] of [
  ["category", categories],
  ["tag", tagFiles],
  ["item", items],
]) {
  const seen = new Set();
  for (const e of list) {
    if (seen.has(e.slug)) errors.push(`duplicate ${kind} slug: ${e.slug}`);
    seen.add(e.slug);
    if (!SLUG_RE.test(e.slug)) errors.push(`${kind} slug malformed: ${e.slug}`);
  }
}

// —— category 实体 ——
for (const c of categories) {
  for (const k of ["slug", "name", "description", "order"])
    if (!(k in c)) errors.push(`category ${c.slug}: missing ${k}`);
  for (const k of ["name", "description"]) {
    if (!c[k]?.en || !c[k]?.zh)
      errors.push(`category ${c.slug}: ${k} must have en+zh`);
  }
}

// —— tag 实体 ——
const tagIds = new Set();
for (const t of tagFiles) {
  if (!FACETS.includes(t.facet))
    errors.push(`tag ${t.slug}: bad facet ${t.facet}`);
  if (t.id !== `${t.facet}:${t.slug}`)
    errors.push(`tag ${t.slug}: id must be facet:slug`);
  if (!t.name?.en || !t.name?.zh)
    errors.push(`tag ${t.slug}: name must have en+zh`);
  tagIds.add(t.id);
}

// —— item 实体 ——
const catSlugs = new Set(categories.map((c) => c.slug));
const usedTags = new Set();
const usedCats = new Set();
for (const it of items) {
  for (const k of [
    "slug",
    "name",
    "description",
    "url",
    "category",
    "tags",
    "status",
    "added",
  ]) {
    if (!(k in it)) errors.push(`item ${it.slug}: missing ${k}`);
  }
  if (!it.name?.en || !it.name?.zh)
    errors.push(`item ${it.slug}: name must have en+zh`);
  if (!it.description?.en)
    errors.push(`item ${it.slug}: description.en required`);
  if (it.status === "published" && !it.description?.zh)
    errors.push(`item ${it.slug}: published requires description.zh`);
  if (!URL_RE.test(it.url ?? ""))
    errors.push(`item ${it.slug}: url must be https URL`);
  if (it.repo && !URL_RE.test(it.repo))
    errors.push(`item ${it.slug}: repo must be https URL`);
  if (catSlugs.has(it.category)) usedCats.add(it.category);
  else errors.push(`item ${it.slug}: unknown category ${it.category}`);
  if (!Array.isArray(it.tags) || it.tags.length < 1)
    errors.push(`item ${it.slug}: tags[] with ≥1 required`);
  for (const t of it.tags ?? []) {
    if (tagIds.has(t)) usedTags.add(t);
    else errors.push(`item ${it.slug}: dangling tag ${t}`);
  }
  if (it.screenshot && it.screenshot !== `${it.slug}.webp`)
    warnings.push(`item ${it.slug}: screenshot filename convention mismatch`);
}

// —— 悬空 / 空引用警告 ——
for (const t of tagFiles)
  if (!usedTags.has(t.id)) warnings.push(`tag never referenced: ${t.id}`);
for (const c of categories)
  if (!usedCats.has(c.slug))
    warnings.push(`category with zero items: ${c.slug}`);
for (const f of itemFiles)
  if (!existsSync(`public/assets/shots/${f.replace(".json", ".webp")}`))
    warnings.push(
      `screenshot missing: public/assets/shots/${f.replace(".json", ".webp")}`,
    );

for (const e of errors) console.error(`✗ ${e}`);
for (const w of warnings) console.log(`⚠ ${w}`);
console.log(
  `validated: ${items.length} items / ${categories.length} categories / ${tagFiles.length} tags — ${errors.length} errors, ${warnings.length} warnings`,
);
process.exit(errors.length ? 1 : 0);
