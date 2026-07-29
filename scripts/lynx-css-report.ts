// FILE: lynx-css-report.ts
// Purpose: Lynx portability report for the web stylesheet (P1-F6). Parses
//   index.css + tokens.css with PostCSS and grades every potentially
//   unsupported selector feature / property / at-rule against a curated Lynx
//   capability list, emitting ✅/🔧/🔀/❓ findings.
//
// Modes:
//   (default)      write the markdown report to scripts/reports/lynx-css-report.md
//   --baseline     rewrite scripts/lynx-css-report.baseline.json
//   --check        CI ratchet: fail when findings not present in the baseline
//                  appear (new unsupported usage must be a conscious decision,
//                  see synara-lynx plan 00 §0.3).
//
// The whitelist is curated from Lynx 4.x docs and the synara-lynx compat
// matrix (02-compat-matrix.md); update both when Lynx support changes.

import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const CSS_FILES = ["apps/web/src/index.css", "apps/web/src/tokens.css"];
const REPORT_PATH = path.join(REPO_ROOT, "scripts/reports/lynx-css-report.md");
const BASELINE_PATH = path.join(REPO_ROOT, "scripts/lynx-css-report.baseline.json");

type State = "🔀" | "🔧" | "⬆️" | "❓";

interface Finding {
  readonly key: string; // stable identity for baseline diffing
  readonly state: State;
  readonly kind: "selector" | "property" | "value" | "at-rule";
  readonly item: string;
  readonly context: string; // selector or declaration for humans
  readonly note: string;
}

const findings: Finding[] = [];
const seen = new Set<string>();

function add(f: Finding): void {
  if (seen.has(f.key)) return;
  seen.add(f.key);
  findings.push(f);
}

// --- selector features -------------------------------------------------------
const PSEUDO_ELEMENTS: Record<string, string> = {
  "::-webkit-scrollbar": "伪元素全无 — 需额外元素或裁剪",
  "::before": "伪元素全无 — 需额外元素",
  "::after": "伪元素全无 — 需额外元素",
  "::placeholder": "伪元素全无 — input placeholder 属性化处理",
  "::selection": "伪元素全无 — 文本选区属接受差异项",
  "::marker": "伪元素全无",
};
const BANNED_PSEUDO_CLASSES: Record<string, { state: State; note: string }> = {
  ":hover": { state: "⬆️", note: "桌面推上游 + 状态类替代（P0 已记录）" },
  ":focus-visible": { state: "🔧", note: "仅 :active 可用 — focus ring 属接受差异" },
  ":focus": { state: "🔧", note: "仅 :active 可用" },
  ":focus-within": { state: "🔧", note: "仅 :active 可用" },
  ":has": { state: "🔧", note: ":has() 无 — 结构改造" },
  ":nth-child": { state: "🔧", note: "伪类仅 :active — 结构/属性选择器替代" },
  ":nth-of-type": { state: "🔧", note: "伪类仅 :active" },
  ":first-child": { state: "🔧", note: "伪类仅 :active" },
  ":last-child": { state: "🔧", note: "伪类仅 :active" },
  ":not": { state: "❓", note: "未文档化 — 待验证" },
  ":disabled": { state: "🔧", note: "伪类仅 :active — data 属性/状态类替代" },
  ":checked": { state: "🔧", note: "伪类仅 :active" },
  ":empty": { state: "🔧", note: "伪类仅 :active" },
};

function scanSelector(selector: string): void {
  for (const [pseudo, note] of Object.entries(PSEUDO_ELEMENTS)) {
    if (selector.includes(pseudo)) {
      add({
        key: `sel:${pseudo}`,
        state: "🔧",
        kind: "selector",
        item: pseudo,
        context: selector.trim().slice(0, 120),
        note,
      });
    }
  }
  for (const [pseudo, { state, note }] of Object.entries(BANNED_PSEUDO_CLASSES)) {
    // match the pseudo-class token boundary so :focus doesn't eat :focus-visible
    const re = new RegExp(`${pseudo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![-\\w])`);
    if (re.test(selector)) {
      add({
        key: `sel:${pseudo}`,
        state,
        kind: "selector",
        item: `${pseudo}(…)`,
        context: selector.trim().slice(0, 120),
        note,
      });
    }
  }
  if (/\[[a-zA-Z-]+[*\^$|~]?=/.test(selector)) {
    add({
      key: "sel:attr",
      state: "❓",
      kind: "selector",
      item: "[data-*]/attr 选择器",
      context: selector.trim().slice(0, 120),
      note: "属性选择器 Lynx 支持未文档化 — P2 验证",
    });
  }
}

// --- properties / values -----------------------------------------------------
const PROP_RULES: Array<{
  match: (prop: string, value: string) => boolean;
  key: string;
  state: State;
  note: string;
}> = [
  {
    match: (p, v) =>
      (p === "overflow" || p === "overflow-x" || p === "overflow-y") &&
      (v.includes("scroll") || v.includes("auto")),
    key: "prop:overflow",
    state: "🔀",
    note: "overflow 仅 visible/hidden — scroll/auto 必须 scroll-view/list 重构",
  },
  {
    match: (p) => p === "backdrop-filter" || p === "-webkit-backdrop-filter",
    key: "prop:backdrop-filter",
    state: "🔧",
    note: "无 CSS 入口 — <blur-view> 元素替代；接受差异项",
  },
  {
    match: (p, v) => p === "background-clip" && v.includes("text"),
    key: "prop:bg-clip-text",
    state: "🔀",
    note: "background-clip:text 缺",
  },
  {
    match: (p) => p === "line-clamp" || p === "-webkit-line-clamp",
    key: "prop:line-clamp",
    state: "🔧",
    note: "多行截断走 text-maxline **属性**（非 CSS）",
  },
  {
    match: (p) => p === "text-transform",
    key: "prop:text-transform",
    state: "🔀",
    note: "text-transform 缺",
  },
  {
    match: (p) => p === "outline" || p === "outline-width" || p === "outline-style" || p === "outline-color" || p === "outline-offset",
    key: "prop:outline",
    state: "🔧",
    note: "outline 缺 — focus ring 接受差异/box-shadow 近似",
  },
  {
    match: (p) => p === "overflow-wrap" || p === "word-break",
    key: "prop:overflow-wrap",
    state: "🔀",
    note: "overflow-wrap/word-break 缺",
  },
  {
    match: (p) => p === "object-fit" || p === "object-position",
    key: "prop:object-fit",
    state: "🔀",
    note: "object-fit 缺 — image mode 属性替代",
  },
  {
    match: (p) => p === "cursor",
    key: "prop:cursor",
    state: "🔧",
    note: "cursor 部分支持 — 逐值核对",
  },
  {
    match: (p) => p === "filter",
    key: "prop:filter",
    state: "🔧",
    note: "filter 仅 blur/grayscale/brightness/contrast/saturate — 逐值核对",
  },
  {
    match: (p, v) => p === "display" && !["flex", "grid", "none", "linear", "relative"].includes(v.trim()),
    key: "prop:display",
    state: "🔧",
    note: "display 仅 linear/flex/grid/relative/none — 默认 linear 布局注意",
  },
  {
    match: (p, v) => (p === "align-items" || p === "align-self") && ["normal", "self-start", "self-end"].includes(v.trim()),
    key: "prop:align-normal",
    state: "🔧",
    note: "align normal/self-start/end 缺",
  },
  {
    match: (p, v) => p === "justify-content" && v.trim() === "space-evenly",
    key: "prop:space-evenly",
    state: "🔧",
    note: "space-evenly 缺",
  },
  {
    match: (p, v) => p === "aspect-ratio" && v.trim() === "auto",
    key: "prop:aspect-auto",
    state: "🔧",
    note: "aspect-ratio auto 缺",
  },
  {
    match: (p, v) => p === "transform-origin" && v.trim().split(/\s+/).length > 2,
    key: "prop:transform-origin-z",
    state: "🔧",
    note: "transform-origin z 轴缺",
  },
  {
    match: (_p, v) => /\b(inherit|initial|unset|revert)\b/.test(v),
    key: "prop:global-keywords",
    state: "🔧",
    note: "inherit/initial/unset 等全局关键字缺 — 显式值替代",
  },
  {
    match: (p) => p === "grid-template-rows" || p === "grid-template-columns",
    key: "prop:grid-template-anim",
    state: "🔀",
    note: "grid rows/cols 不可动画 — disclosureMotion 需 Lynx 重写（04 模式）",
  },
  {
    match: (_p, v) => v.includes("color-mix("),
    key: "prop:color-mix",
    state: "✅" as State,
    note: "color-mix Lynx 3.x 支持（tokens 依赖；若不达标需构建期展开）",
  },
];

// --- at-rules ----------------------------------------------------------------
function scanAtRule(name: string, params: string): void {
  if (name === "media") {
    add({
      key: `at:media:${params.trim()}`,
      state: "⬆️",
      kind: "at-rule",
      item: `@media ${params.trim()}`,
      context: params,
      note: "无媒体查询 — 构建期静态化（synara 4 处全为 prefers-reduced-motion）",
    });
  } else if (name === "supports") {
    add({
      key: "at:supports",
      state: "🔧",
      kind: "at-rule",
      item: "@supports",
      context: params,
      note: "未文档化 — 构建期展开",
    });
  } else if (name === "font-face") {
    add({
      key: "at:font-face",
      state: "🔧",
      kind: "at-rule",
      item: "@font-face",
      context: "jetbrains-mono variable",
      note: "3.4+ 支持但需 native font loader",
    });
  } else if (name === "property") {
    add({
      key: "at:property",
      state: "🔀",
      kind: "at-rule",
      item: "@property",
      context: params,
      note: "未支持 — 注册型自定义属性需替代方案",
    });
  }
}

// --- main ---------------------------------------------------------------------
const mode = process.argv.includes("--check")
  ? "check"
  : process.argv.includes("--baseline")
    ? "baseline"
    : "report";

for (const rel of CSS_FILES) {
  const css = fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
  const root = postcss.parse(css, { from: rel });
  root.walk((node) => {
    if (node.type === "rule") {
      for (const selector of node.selector.split(",")) scanSelector(selector);
    } else if (node.type === "decl") {
      const prop = node.prop.toLowerCase();
      const value = node.value.toLowerCase();
      // skip token definitions themselves (they define --vars; var() usages are fine)
      for (const rule of PROP_RULES) {
        if (rule.match(prop, value)) {
          add({
            key: rule.key,
            state: rule.state,
            kind: prop.startsWith("--") ? "value" : "property",
            item: prop,
            context: `${prop}: ${value}`.slice(0, 120),
            note: rule.note,
          });
        }
      }
    } else if (node.type === "atrule") {
      scanAtRule(node.name.toLowerCase(), node.params);
    }
  });
}

findings.sort((a, b) => a.key.localeCompare(b.key));

if (mode === "baseline") {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(findings.map((f) => f.key), null, 2) + "\n");
  console.log(`baseline written: ${findings.length} findings -> ${path.relative(REPO_ROOT, BASELINE_PATH)}`);
  process.exit(0);
}

if (mode === "check") {
  const baseline: string[] = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  const baselineSet = new Set(baseline);
  const added = findings.filter((f) => !baselineSet.has(f.key));
  const removed = baseline.filter((k) => !seen.has(k));
  if (added.length > 0) {
    console.error(`lynx-css-report: ${added.length} NEW unsupported finding(s) — decision required:`);
    for (const f of added) console.error(`  ${f.state} ${f.key}  ${f.context}  (${f.note})`);
    if (removed.length > 0) {
      console.error(`(${removed.length} finding(s) resolved — rerun with --baseline to shrink)`);
    }
    process.exit(1);
  }
  console.log(`lynx-css-report: OK (${findings.length} findings, all in baseline; ${removed.length} resolved)`);
  process.exit(0);
}

// report mode
const counts = new Map<string, number>();
for (const f of findings) counts.set(f.state, (counts.get(f.state) ?? 0) + 1);

const lines: string[] = [
  "# Lynx CSS 可移植性报告（机器生成）",
  "",
  `生成：node scripts/lynx-css-report.ts ｜ 输入：${CSS_FILES.join(", ")}`,
  `判定四态：✅ 直接可用 / 🔧 需适配 / 🔀 需重写 / ⬆️ 推上游 / ❓ 未文档化待验证`,
  "",
  "## 汇总",
  "",
  "| 状态 | 条目数 |",
  "|---|---|",
  ...[...counts.entries()].sort().map(([s, n]) => `| ${s} | ${n} |`),
  "",
  "## 明细",
  "",
  "| 状态 | 类别 | 条目 | 语境示例 | 方案 |",
  "|---|---|---|---|---|",
  ...findings.map(
    (f) => `| ${f.state} | ${f.kind} | \`${f.item}\` | \`${f.context.replace(/\|/g, "\\|")}\` | ${f.note} |`,
  ),
  "",
];
fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, lines.join("\n"));
console.log(`report written: ${findings.length} findings -> ${path.relative(REPO_ROOT, REPORT_PATH)}`);
