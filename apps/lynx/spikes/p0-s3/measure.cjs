#!/usr/bin/env node
// measure.cjs — Tailwind v3 + @lynx-js/tailwind-preset coverage measurement
// v2 – simplified, more robust extraction

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");

const DIR = __dirname;

// ---- 1. Load class lists ----------------------------------------------------
const classes = fs
  .readFileSync(path.join(DIR, "classes.txt"), "utf8")
  .trim()
  .split("\n")
  .filter(Boolean);

const countsRaw = fs
  .readFileSync(path.join(DIR, "classes-with-counts.txt"), "utf8")
  .trim()
  .split("\n")
  .filter(Boolean);
const counts = new Map();
for (const line of countsRaw) {
  const [cnt, ...rest] = line.split("\t");
  counts.set(rest.join("\t"), Number(cnt));
}

const totalWeighted = classes.reduce((s, c) => s + (counts.get(c) || 0), 0);
console.log(`Classes to test: ${classes.length}`);
console.log(`Total weighted occurrences: ${totalWeighted}`);

// ---- 2. Build Tailwind config -----------------------------------------------
const lynxMod = require("@lynx-js/tailwind-preset");
const preset = lynxMod.default || lynxMod;
const presetConfig = typeof preset === "function" ? preset() : preset;

const config = {
  presets: [presetConfig],
  content: [],
  prefix: "",
  important: false,
};

// ---- 3. Create temp content file --------------------------------------------
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tw-measure-"));
const contentFile = path.join(tempDir, "content.html");
const contentHtml = `<div class="${classes.join(" ")}"></div>`;
fs.writeFileSync(contentFile, contentHtml, "utf8");
config.content = [contentFile];

// ---- 4. Process with Tailwind -----------------------------------------------
const inputCSS = `@tailwind base;\n@tailwind utilities;\n`;

async function main() {
  const start = Date.now();

  let result;
  try {
    result = await postcss([tailwindcss(config)]).process(inputCSS, {
      from: undefined,
    });
  } catch (err) {
    console.error("Tailwind processing error:", err.message);
    process.exit(1);
  }

  const elapsed = Date.now() - start;
  const outputCSS = result.css;
  const outputSize = outputCSS.length;

  console.log(`\nTailwind processing: ${elapsed}ms, output size: ${outputSize} bytes`);

  if (outputSize < 500) {
    console.log("WARNING: Output CSS is very small! Output:");
    console.log(outputCSS);
  }

  // ---- 5. Extract generated class tokens ------------------------------------
  // Strategy: find all `.IDENT` sequences in the CSS selector portions only.
  // We strip declaration values (everything inside {...}) first.
  
  // 1. Remove all { ... } blocks (declarations) – keep only selectors
  let selectorsOnly = outputCSS;
  // Remove strings inside the CSS to avoid matching in content values
  selectorsOnly = selectorsOnly.replace(/['"][^'"]*['"]/g, "");
  // Remove { ... } blocks iteratively to handle nesting
  while (/{[^}]*}/.test(selectorsOnly)) {
    selectorsOnly = selectorsOnly.replace(/{[^}]*}/g, "");
  }
  // Now remaining: selectors, at-rule names, commas, whitespace
  // Extract all .XXX patterns
  const selectorClasses = new Set();
  
  // Use a state machine to extract class names from selectors
  let i = 0;
  while (i < selectorsOnly.length) {
    if (selectorsOnly[i] === ".") {
      i++;
      let cls = "";
      // Read until we hit a separator (whitespace, {, }, :, [, >, +, ~, ,, #)
      while (i < selectorsOnly.length) {
        const ch = selectorsOnly[i];
        if (ch === "\\") {
          // Escape sequence: include the backslash and the next character
          cls += ch;
          i++;
          if (i < selectorsOnly.length) {
            cls += selectorsOnly[i];
            i++;
          }
          continue;
        }
        if (/[\s{}:#[\]>.~+,]/.test(ch)) break;
        cls += ch;
        i++;
      }
      if (cls) {
        // Unescape: replace \X with X
        const unescaped = cls.replace(/\\(.)/g, "$1");
        selectorClasses.add(unescaped);
      }
    } else {
      i++;
    }
  }

  console.log(`Unique class tokens extracted from output: ${selectorClasses.size}`);

  // Debug: print all extracted classes
  const extractedArr = [...selectorClasses].sort();
  console.log(`\nAll extracted tokens (first 30):`);
  for (let i = 0; i < Math.min(30, extractedArr.length); i++) {
    console.log(`  [${i}] ${extractedArr[i]}`);
  }

  // Check specific classes
  const debugChecks = [
    "flex", "items-center", "shrink-0", "min-w-0", "text-muted-foreground",
    "truncate", "gap-2", "flex-col", "w-full", "size-3.5",
    "hover:bg-accent", "dark:bg-input/32", "data-[state=open]:bg-accent",
    "focus-visible:outline-none", "sm:flex", "transition-colors",
    "before:content-['']", "rounded-full",
    "text-[11px]", "w-[1px]", "px-2",
    "animate-spin", "line-clamp-3",
  ];
  console.log("\nDebug checks:");
  for (const dc of debugChecks) {
    const found = selectorClasses.has(dc);
    console.log(`  ${found ? "✅" : "❌"} ${dc}`);
  }

  // List what failed among the known-to-be-common classes
  console.log("\nCommon classes that failed:");
  let failCount = 0;
  for (const dc of debugChecks) {
    if (!selectorClasses.has(dc)) {
      console.log(`  ❌ ${dc}  (count: ${counts.get(dc) || 0})`);
      failCount++;
    }
  }
  console.log(`  (${failCount}/${debugChecks.length} failed)`);

  // ---- 6. Classify results --------------------------------------------------
  const WARN_PATTERNS = [
    /^hover:/, /^focus:/, /^focus-visible:/, /^active:/,
    /^disabled:/, /^group-hover:/, /^group-.*:/,
    /^dark:/, /^sm:/, /^md:/, /^lg:/, /^xl:/, /^2xl:/,
    /^motion-reduce:/, /^motion-safe:/,
    /^before:/, /^after:/,
    /^first:/, /^last:/, /^odd:/, /^even:/,
    /^not-/, /^has-/,
    /^data-/,
    /^pointer-coarse:/,
    /^supports-/,
    /^aria-/,
    /^print:/,
    /^portrait:/, /^landscape:/,
    /^placeholder:/,
    /^file:/,
    /^open:/,
    /^read-only:/,
    /^indeterminate:/,
    /^checked:/,
    /^selected:/,
    /^default:/,
    /^required:/,
    /^valid:/, /^invalid:/,
    /^in-range:/, /^out-of-range:/,
    /^target:/,
    /^only:/,
    /^empty:/,
    /^optional:/,
    /^enabled:/,
    /^selection:/,
    /^marker:/,
    /^backdrop:/,
  ];

  const passed = [];
  const warned = [];
  const failed = [];

  for (const cls of classes) {
    if (selectorClasses.has(cls)) {
      const isWarned = WARN_PATTERNS.some((p) => p.test(cls));
      if (isWarned) warned.push(cls);
      else passed.push(cls);
    } else {
      failed.push(cls);
    }
  }

  const passedW = passed.reduce((s, c) => s + (counts.get(c) || 0), 0);
  const warnedW = warned.reduce((s, c) => s + (counts.get(c) || 0), 0);
  const failedW = failed.reduce((s, c) => s + (counts.get(c) || 0), 0);

  console.log(`\n=== RESULTS ===`);
  console.log(`Total:                    ${classes.length} classes  (${totalWeighted} weighted)`);
  console.log(`✅ Generated (safe):      ${passed.length} (${((passed.length / classes.length) * 100).toFixed(1)}%)  w:${passedW} (${((passedW / totalWeighted) * 100).toFixed(1)}%)`);
  console.log(`⚠️  Generated (warn):     ${warned.length} (${((warned.length / classes.length) * 100).toFixed(1)}%)  w:${warnedW} (${((warnedW / totalWeighted) * 100).toFixed(1)}%)`);
  console.log(`❌ Not generated:         ${failed.length} (${((failed.length / classes.length) * 100).toFixed(1)}%)  w:${failedW} (${((failedW / totalWeighted) * 100).toFixed(1)}%)`);
  
  const genAny = passed.length + warned.length;
  const genAnyW = passedW + warnedW;
  console.log(`\n--- Absolute pass rate ---`);
  console.log(`Class-level: ${genAny}/${classes.length} = ${((genAny / classes.length) * 100).toFixed(1)}%`);
  console.log(`Weighted:    ${genAnyW}/${totalWeighted} = ${((genAnyW / totalWeighted) * 100).toFixed(1)}%`);

  // Failed sorted by weight
  const failedSorted = failed
    .map((c) => ({ class: c, count: counts.get(c) || 0 }))
    .sort((a, b) => b.count - a.count);
  console.log(`\n--- ❌ Top 20 Failed (by weight) ---`);
  for (let i = 0; i < Math.min(20, failedSorted.length); i++) {
    console.log(`  ${String(failedSorted[i].count).padStart(5)}\t${failedSorted[i].class}`);
  }

  // ---- 7. Write report.json -------------------------------------------------
  const twPkg = JSON.parse(
    fs.readFileSync(path.join(DIR, "node_modules", "tailwindcss", "package.json"), "utf8")
  );
  const lynxPkg = JSON.parse(
    fs.readFileSync(
      path.join(DIR, "node_modules", "@lynx-js", "tailwind-preset", "package.json"),
      "utf8"
    )
  );

  const report = {
    meta: {
      tool: "measure.cjs — Tailwind v3 + @lynx-js/tailwind-preset coverage measurement",
      timestamp: new Date().toISOString(),
      totalClasses: classes.length,
      totalWeighted,
      tailwindVersion: twPkg.version,
      presetVersion: lynxPkg.version,
    },
    summary: {
      generated: {
        count: genAny,
        weighted: genAnyW,
        pct: +((genAny / classes.length) * 100).toFixed(1),
        weightedPct: +((genAnyW / totalWeighted) * 100).toFixed(1),
      },
      notGenerated: {
        count: failed.length,
        weighted: failedW,
        pct: +((failed.length / classes.length) * 100).toFixed(1),
        weightedPct: +((failedW / totalWeighted) * 100).toFixed(1),
      },
      generatedSafe: {
        count: passed.length,
        weighted: passedW,
      },
      generatedWarned: {
        count: warned.length,
        weighted: warnedW,
      },
    },
    classifications: {
      passed: passed.map((c) => ({ class: c, count: counts.get(c) || 0 })),
      warned: warned.map((c) => ({ class: c, count: counts.get(c) || 0 })),
      failed: failed.map((c) => ({ class: c, count: counts.get(c) || 0 })),
    },
  };

  fs.writeFileSync(path.join(DIR, "report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log("\nReport written to report.json");

  // ---- 8. Cleanup -----------------------------------------------------------
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(`\nTotal time: ${Date.now() - start}ms`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
