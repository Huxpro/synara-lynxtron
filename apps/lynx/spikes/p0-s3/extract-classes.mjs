#!/usr/bin/env node
// P0-S3 step 1: extract Tailwind-ish class usage from Synara web app .tsx files.
// Sources scanned: className="..." / className='...' / className={...}, and
// cn(...), cva(...), clsx(...), cx(...) call regions. All string literals and
// template-literal static parts inside those regions are treated as class
// strings. Precision is secondary to coverage of the high-frequency set.

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = "/Users/bytedance/github/synara/apps/web/src";
const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));

const files = execSync(
  `find ${JSON.stringify(SRC)} -name '*.tsx' -not -name '*.test.*' -not -name '*.browser.*'`,
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

const counts = new Map();
const addClasses = (str) => {
  for (const tok of str.split(/\s+/)) {
    const t = tok.trim();
    if (!t) continue;
    counts.set(t, (counts.get(t) || 0) + 1);
  }
};

// --- tiny scanner -----------------------------------------------------------
// readQuoted: src[i] is `'` `"` or backtick. Returns { end, texts[] } where
// texts are the literal chunks (template literals: static parts only).
function readQuoted(src, i) {
  const q = src[i];
  const texts = [];
  let buf = "";
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === "\\") {
      buf += src[j + 1] ?? "";
      j += 2;
      continue;
    }
    if (q === "`" && c === "$" && src[j + 1] === "{") {
      texts.push(buf);
      buf = "";
      j = skipGroup(src, j + 1, "{", "}") + 1;
      continue;
    }
    if (c === q) {
      texts.push(buf);
      return { end: j, texts };
    }
    buf += c;
    j += 1;
  }
  texts.push(buf);
  return { end: j, texts };
}

// skipGroup: src[i] is `open`; returns index of matching `close`, skipping
// nested groups, strings, template literals, and comments.
function skipGroup(src, i, open, close) {
  let depth = 0;
  let j = i;
  while (j < src.length) {
    const c = src[j];
    if (c === "/" && src[j + 1] === "/") {
      const nl = src.indexOf("\n", j);
      j = nl === -1 ? src.length : nl + 1;
      continue;
    }
    if (c === "/" && src[j + 1] === "*") {
      const e = src.indexOf("*/", j + 2);
      j = e === -1 ? src.length : e + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      j = readQuoted(src, j).end + 1;
      continue;
    }
    if (c === open) depth += 1;
    else if (c === close) {
      depth -= 1;
      if (depth === 0) return j;
    }
    j += 1;
  }
  return j;
}

// collectStrings: scan region [start,end) and return every string literal
// content (template literals: static parts only).
function collectStrings(src, start, end, out = []) {
  let j = start;
  while (j < end) {
    const c = src[j];
    if (c === "/" && src[j + 1] === "/") {
      const nl = src.indexOf("\n", j);
      j = nl === -1 || nl > end ? end : nl + 1;
      continue;
    }
    if (c === "/" && src[j + 1] === "*") {
      const e = src.indexOf("*/", j + 2);
      j = e === -1 || e > end ? end : e + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const r = readQuoted(src, j);
      for (const t of r.texts) out.push(t);
      j = Math.min(r.end + 1, end);
      continue;
    }
    j += 1;
  }
  return out;
}

const CALL_RE = /\b(?:cn|cva|clsx|cx)\s*\(/g;

let regionCount = 0;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");

  // className="..." / className='...'
  for (const m of src.matchAll(/className\s*=\s*(["'])/g)) {
    const r = readQuoted(src, m.index + m[0].length - 1);
    for (const t of r.texts) addClasses(t);
    regionCount += 1;
  }

  // className={ ... }
  for (const m of src.matchAll(/className\s*=\s*\{/g)) {
    const openIdx = m.index + m[0].length - 1;
    const closeIdx = skipGroup(src, openIdx, "{", "}");
    for (const t of collectStrings(src, openIdx + 1, closeIdx)) addClasses(t);
    regionCount += 1;
  }

  // cn(...) / cva(...) / clsx(...) / cx(...)
  CALL_RE.lastIndex = 0;
  for (const m of src.matchAll(CALL_RE)) {
    const openIdx = m.index + m[0].length - 1;
    const closeIdx = skipGroup(src, openIdx, "(", ")");
    for (const t of collectStrings(src, openIdx + 1, closeIdx)) addClasses(t);
    regionCount += 1;
  }
}

// Filter to tailwind-ish tokens: must contain `-`, `:`, `[`, or be a bare
// utility keyword. Drops plain words ("primary", component names, etc.).
const BARE = new Set([
  "flex", "inline-flex", "grid", "inline-grid", "block", "inline-block",
  "inline", "hidden", "contents", "relative", "absolute", "fixed", "sticky",
  "static", "grow", "shrink", "truncate", "italic", "underline", "antialiased",
  "uppercase", "lowercase", "capitalize", "sr-only", "invisible", "visible",
  "collapse", "container", "transform", "transition", "animate-none",
]);

const sorted = [...counts.entries()]
  .filter(([tok]) => {
    if (/[:\-[\]/@%]/.test(tok)) return true;
    return BARE.has(tok);
  })
  .filter(([tok]) => !/^[a-zA-Z0-9_]+$/.test(tok) || BARE.has(tok))
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

const TOP_N = 500;
const top = sorted.slice(0, TOP_N);

fs.writeFileSync(
  path.join(OUT_DIR, "classes-with-counts.txt"),
  sorted.map(([t, c]) => `${c}\t${t}`).join("\n") + "\n",
);
fs.writeFileSync(
  path.join(OUT_DIR, "classes.txt"),
  top.map(([t]) => t).join("\n") + "\n",
);

console.log(`files scanned: ${files.length}`);
console.log(`regions scanned: ${regionCount}`);
console.log(`unique tailwind-ish tokens: ${sorted.length}`);
console.log(`top-${TOP_N} written to classes.txt`);
console.log(`total occurrences across all tokens: ${sorted.reduce((s, [, c]) => s + c, 0)}`);
console.log(`occurrences covered by top-${TOP_N}: ${top.reduce((s, [, c]) => s + c, 0)}`);
