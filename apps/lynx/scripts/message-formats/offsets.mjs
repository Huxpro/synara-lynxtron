// Vertical offsets of the text blocks that follow an anchor block, per client.
// Row tops move in the virtualized Web transcript; offsets inside one step do
// not, so this is the spacing check: a block gap that differs shows as a step
// in the delta column.
//
// usage: node offsets.mjs <web step .raw> <lynx step .raw> <anchor text> [count]
import { readFileSync } from "node:fs";
const [webFile, lynxFile, anchor, count = "40"] = process.argv.slice(2);
const load = (f) => JSON.parse(JSON.parse(readFileSync(f, "utf8").trim()));
const norm = (s) => s.replace(/\s+/g, "");
const pick = (d) => {
  const i = d.texts.findIndex((t) => norm(t.t).startsWith(norm(anchor)));
  if (i < 0) throw new Error("anchor missing in " + d.client);
  const base = d.texts[i];
  return d.texts.slice(i, i + Number(count) * 2).map((t) => ({
    k: norm(t.t).slice(0, 40),
    t: t.t.slice(0, 40),
    dy: Math.round((t.y - base.y) * 10) / 10,
    x: t.x,
    w: t.w,
    h: t.h,
  }));
};
const w = pick(load(webFile)),
  l = pick(load(lynxFile));
const lm = new Map();
for (const t of l) if (!lm.has(t.k)) lm.set(t.k, t);
let n = 0;
for (const t of w) {
  const m = lm.get(t.k);
  if (!m) {
    console.log(`web-only      ${String(t.dy).padStart(7)}  x${t.x} ${t.w}x${t.h} ${t.t}`);
    continue;
  }
  console.log(
    `${String(t.dy).padStart(7)} ${String(m.dy).padStart(7)}  Δy=${String(Math.round((m.dy - t.dy) * 10) / 10).padStart(6)}  x ${t.x}/${m.x}  h ${t.h}/${m.h}  ${t.t}`,
  );
  if (++n >= Number(count)) break;
}
