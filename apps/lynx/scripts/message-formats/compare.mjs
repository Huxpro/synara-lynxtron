// Web original vs Lynx for Web, from two merged captures: row heights, then
// every text block matched by its text with the size and style deltas, then
// the blocks only one client drew.
//
// usage: node compare.mjs <out dir> <label> <theme>
import { readFileSync } from "node:fs";
const [dir, label, theme] = process.argv.slice(2);
const load = (c) => JSON.parse(readFileSync(`${dir}/${label}-${c}-${theme}.json`, "utf8"));
const web = load("web"),
  lynx = load("lynx");
const key = (t) => t.t.replace(/\s+/g, "").slice(0, 60);
console.log(`scrollHeight web=${web.extras.scrollHeight} lynx=${lynx.extras.scrollHeight}`);
console.log("\n== ROWS web");
for (const r of web.rows)
  console.log(
    String(r.kind).padEnd(14),
    String(r.role ?? "").padEnd(10),
    String(r.h).padStart(7),
    r.text.slice(0, 60),
  );
console.log("\n== ROWS lynx");
for (const r of lynx.rows) console.log(String(r.h).padStart(7), r.text.slice(0, 60));
const lynxBy = new Map();
for (const t of lynx.texts) {
  const k = key(t);
  if (!lynxBy.has(k)) lynxBy.set(k, []);
  lynxBy.get(k).push(t);
}
const used = new Set();
console.log("\n== TEXT BLOCKS (web → lynx)");
const px = (v) => Math.round(parseFloat(v) * 10) / 10;
for (const w of web.texts) {
  const cands = lynxBy.get(key(w)) ?? [];
  const l = cands.find((c) => !used.has(c));
  if (!l) {
    console.log(`WEB-ONLY  [${w.tag}] ${w.fs}/${w.fw} ${w.w}x${w.h} "${w.t.slice(0, 70)}"`);
    continue;
  }
  used.add(l);
  const d = [];
  if (Math.abs(w.x - l.x) > 1) d.push(`x ${w.x}→${l.x}`);
  if (Math.abs(w.w - l.w) > 2) d.push(`w ${w.w}→${l.w}`);
  if (Math.abs(w.h - l.h) > 1) d.push(`h ${w.h}→${l.h}`);
  if (px(w.fs) !== px(l.fs)) d.push(`fs ${w.fs}→${l.fs}`);
  if (w.fw !== l.fw) d.push(`fw ${w.fw}→${l.fw}`);
  if (w.color !== l.color) d.push(`color ${w.color}→${l.color}`);
  if (w.lh !== l.lh) d.push(`lh ${w.lh}→${l.lh}`);
  if (w.ff !== l.ff) d.push(`ff ${w.ff}→${l.ff}`);
  console.log(`${d.length ? "DIFF " : "ok   "} [${w.tag}] "${w.t.slice(0, 50)}" ${d.join("; ")}`);
}
for (const l of lynx.texts)
  if (!used.has(l))
    console.log(`LYNX-ONLY ${l.fs}/${l.fw} ${l.w}x${l.h} [${l.cls}] "${l.t.slice(0, 70)}"`);
