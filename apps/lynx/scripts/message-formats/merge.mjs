// Merges the per-scroll-step measurements of one capture into one document
// (the Web transcript is virtualized, so no single step has every row).
//
// usage: node merge.mjs <out dir> <label>-<client>-<theme>
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const [dir, prefix] = process.argv.slice(2);
const files = readdirSync(dir)
  .filter((f) => f.startsWith(prefix + ".") && f.endsWith(".raw"))
  .sort((a, b) => Number(a.split(".").at(-2)) - Number(b.split(".").at(-2)));
const merged = {
  rows: new Map(),
  texts: new Map(),
  images: new Map(),
  buttons: new Map(),
  extras: null,
  client: null,
};
for (const f of files) {
  let d;
  try {
    d = JSON.parse(JSON.parse(readFileSync(`${dir}/${f}`, "utf8").trim()));
  } catch (e) {
    console.error("bad", f);
    continue;
  }
  if (d.error) {
    console.error(f, d.error);
    continue;
  }
  merged.client = d.client;
  merged.extras = { ...d.extras, images: undefined, buttons: undefined, sample: undefined };
  for (const r of d.rows) {
    const k = `${r.kind}|${r.text}`;
    const p = merged.rows.get(k);
    if (!p || r.h > p.h) merged.rows.set(k, { ...r, order: p?.order ?? merged.rows.size });
  }
  for (const t of d.texts) {
    const k = `${t.t}|${Math.round(t.w)}|${Math.round(t.h)}`;
    if (!merged.texts.has(k)) merged.texts.set(k, { ...t, order: merged.texts.size });
  }
  for (const t of d.extras.images ?? []) {
    const k = `${Math.round(t.y / 4)}:${Math.round(t.x)}`;
    if (!merged.images.has(k)) merged.images.set(k, t);
  }
  for (const t of d.extras.buttons ?? []) {
    const k = `${t.label}@${Math.round(t.y / 4)}:${Math.round(t.x)}`;
    if (!merged.buttons.has(k)) merged.buttons.set(k, t);
  }
}
const sort = (m) => [...m.values()].sort((a, b) => a.y - b.y || a.x - b.x);
const out = {
  client: merged.client,
  extras: merged.extras,
  rows: [...merged.rows.values()],
  texts: [...merged.texts.values()],
  images: sort(merged.images),
  buttons: sort(merged.buttons),
};
writeFileSync(`${dir}/${prefix}.json`, JSON.stringify(out, null, 1));
console.log(
  prefix,
  "rows",
  out.rows.length,
  "texts",
  out.texts.length,
  "images",
  out.images.length,
  "scrollHeight",
  out.extras?.scrollHeight,
);
