#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

import { generatedFileIsFresh, writeGeneratedFile } from "./format-generated.mjs";
import { readWebThemeFontSizes } from "./web-theme-font-sizes.logic.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");
const webRoot = path.resolve(workspaceRoot, "../..");
const sliceRoot = workspaceRoot;
const checkMode = process.argv.includes("--check");
const updateBaseline = process.argv.includes("--update-baseline");
const requireFromSlice = createRequire(path.join(sliceRoot, "package.json"));
const postcss = requireFromSlice("postcss");
const tailwindcss = requireFromSlice("tailwindcss");
const selectorParser = requireFromSlice("postcss-selector-parser");
const presetModule = requireFromSlice("@lynx-js/tailwind-preset");
const preset = presetModule.default ?? presetModule;
const typescriptPath = path.join(sliceRoot, "node_modules/typescript/lib/typescript.js");
const typescriptModule = await import(pathToFileURL(typescriptPath));
const ts = typescriptModule.default ?? typescriptModule;

const reuseReportPath = path.join(workspaceRoot, "plan/reports/p5-r1-reuse-baseline.json");
const manifestPath = path.join(workspaceRoot, "plan/reports/p5-r4-core-class-manifest.json");
const reportPath = path.join(workspaceRoot, "plan/reports/p5-r4-style-coverage.md");
const cssPath = path.join(sliceRoot, "src/generated/core-utilities.css");
const baselinePath = path.join(workspaceRoot, "plan/style-audit.baseline.json");
const threshold = 95;

const bareUtilities = new Set([
  "absolute",
  "antialiased",
  "block",
  "capitalize",
  "collapse",
  "container",
  "contents",
  "fixed",
  "flex",
  "grid",
  "hidden",
  "inline",
  "inline-block",
  "inline-flex",
  "inline-grid",
  "invisible",
  "italic",
  "lowercase",
  "relative",
  "shrink",
  "sr-only",
  "static",
  "sticky",
  "transform",
  "transition",
  "truncate",
  "underline",
  "uppercase",
  "visible",
]);

const unsupportedPatterns = [
  /(^|:)(hover|focus|focus-visible|focus-within|group-hover|group-focus|peer-hover):/,
  /^group-(hover|focus|focus-within|focus-visible)(?:\/[^:]+)?:/,
  /(^|:)(before|after|first|last|odd|even|only|empty):/,
  /(^|:)(sm|md|lg|xl|2xl|dark|motion-reduce|motion-safe|pointer-coarse):/,
  /(^|:)(data-|aria-|has-|not-|in-\[|supports-)/,
  /(^|:)(placeholder|file|selection|backdrop):/,
  /^\[&::/,
  /^\[&(?:_|>)/,
  /\[--[^:]+:calc\((?:max|min)\(/,
  /(^|:)(overflow-auto|overflow-x-auto|overflow-y-auto|overflow-scroll|overflow-x-scroll|overflow-y-scroll)$/,
  /(^|:)(outline-none|sr-only|contents)$/,
  /(^|:)(tabular-nums|select-none|list-none|uppercase|lowercase|capitalize)$/,
  /(^|:)(divide-[xy](?:-.+)?|divide-\[.+\])$/,
  /(^|:)line-clamp-(?:none|\d+)$/,
  /(^|:)overscroll(?:-[xy])?-(?:auto|contain|none)$/,
  /(^|:)backdrop-(?:blur|brightness|contrast|grayscale|hue-rotate|invert|opacity|saturate|sepia)(?:-.+)?$/,
  /(^|:)resize-(?:none|x|y)$/,
  // color-mix() is resolved to a token at build time (generate-color-mix-tokens);
  // `--account-accent` is set per element at runtime, so it has no token.
  /color-mix\([^)]*var\(--account-accent\)/,
];

const deterministicPatches = new Map([
  ["inline-flex", "display:flex"],
  ["inline-block", "display:flex"],
  ["inline", "display:flex"],
  ["block", "display:flex"],
  ["cursor-pointer", "cursor:pointer"],
  ["pointer-events-none", "pointer-events:none"],
  ["pointer-events-auto", "pointer-events:auto"],
  ["font-system-ui", "font-family:system-ui"],
  ["break-words", "word-break:break-word"],
  ["ring-sky-400/30", "box-shadow:0 0 0 1px rgba(56,189,248,0.3)"],
  ["ring-sky-400/60", "box-shadow:0 0 0 1px rgba(56,189,248,0.6)"],
]);

const utilityPrefixes = new Set([
  "accent",
  "align",
  "animate",
  "aspect",
  "backdrop",
  "basis",
  "bg",
  "border",
  "bottom",
  "box",
  "break",
  "col",
  "cursor",
  "delay",
  "divide",
  "drop",
  "duration",
  "end",
  "fill",
  "flex",
  "font",
  "gap",
  "grid",
  "grow",
  "h",
  "inset",
  "items",
  "justify",
  "leading",
  "left",
  "line",
  "list",
  "m",
  "max",
  "mb",
  "me",
  "min",
  "ml",
  "mr",
  "ms",
  "mt",
  "mx",
  "my",
  "object",
  "opacity",
  "order",
  "origin",
  "outline",
  "overflow",
  "overscroll",
  "p",
  "pb",
  "pe",
  "pl",
  "pointer",
  "pr",
  "ps",
  "pt",
  "px",
  "py",
  "resize",
  "right",
  "ring",
  "rotate",
  "rounded",
  "row",
  "scale",
  "select",
  "shadow",
  "shrink",
  "size",
  "space",
  "start",
  "stroke",
  "tabular",
  "text",
  "top",
  "touch",
  "tracking",
  "transition",
  "translate",
  "truncate",
  "w",
  "whitespace",
  "z",
]);

function isUtilityToken(token) {
  if (!token || /[\s"'`{};]/.test(token)) return false;
  return bareUtilities.has(token) || /[:\-[\]/@%]/.test(token);
}

function sourceKind(filePath) {
  return filePath.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : filePath.endsWith(".jsx")
      ? ts.ScriptKind.JSX
      : filePath.endsWith(".js")
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;
}

function staticStrings(node, output) {
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    output.push({ start: node.getStart(), end: node.getEnd(), text: node.text });
    return;
  }
  if (ts.isTemplateExpression(node)) {
    output.push({
      start: node.head.getStart(),
      end: node.head.getEnd(),
      text: node.head.text,
    });
    for (const span of node.templateSpans) {
      staticStrings(span.expression, output);
      output.push({
        start: span.literal.getStart(),
        end: span.literal.getEnd(),
        text: span.literal.text,
      });
    }
    return;
  }
  if (ts.isConditionalExpression(node)) {
    staticStrings(node.whenTrue, output);
    staticStrings(node.whenFalse, output);
    return;
  }
  if (ts.isBinaryExpression(node)) {
    if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      staticStrings(node.right, output);
      return;
    }
    staticStrings(node.left, output);
    staticStrings(node.right, output);
    return;
  }
  if (ts.isCallExpression(node)) {
    const callee = node.expression.getText();
    if (["cn", "cva", "clsx", "cx"].includes(callee)) {
      for (const argument of node.arguments) staticStrings(argument, output);
    }
    return;
  }
  ts.forEachChild(node, (child) => staticStrings(child, output));
}

function classStrings(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    sourceKind(filePath),
  );
  const strings = new Map();
  function collect(node) {
    const found = [];
    staticStrings(node, found);
    for (const item of found) {
      strings.set(`${item.start}:${item.end}:${item.text}`, item.text);
    }
  }
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      /(?:CLASS|ClassName)/.test(node.name.text) &&
      node.initializer
    ) {
      collect(node.initializer);
    }
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(sourceFile) === "className" &&
      node.initializer
    ) {
      collect(node.initializer);
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(sourceFile);
      if (["cn", "cva", "clsx", "cx"].includes(callee)) {
        for (const argument of node.arguments) collect(argument);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return [...strings.values()];
}

function extractManifest() {
  const reuseReport = JSON.parse(fs.readFileSync(reuseReportPath, "utf8"));
  const moduleScreens = new Map();
  const runtimePaths = new Set();
  for (const screen of reuseReport.screens) {
    for (const module of screen.modules) {
      if (module.classification === "EXCLUSIVE") continue;
      if (["SHARED", "PATCHED"].includes(module.currentReuse)) {
        runtimePaths.add(module.path);
      }
      const screens = moduleScreens.get(module.path) ?? new Set();
      screens.add(screen.id);
      moduleScreens.set(module.path, screens);
    }
  }
  const tokens = new Map();
  for (const [relativePath, screens] of moduleScreens) {
    const filePath = path.join(webRoot, relativePath);
    if (!fs.existsSync(filePath) || !/\.(ts|tsx|js|jsx)$/.test(filePath)) continue;
    for (const value of classStrings(filePath)) {
      for (const rawToken of value.split(/\s+/)) {
        const token = rawToken.trim();
        if (!isUtilityToken(token)) continue;
        const entry = tokens.get(token) ?? {
          token,
          occurrences: 0,
          files: new Set(),
          screens: new Set(),
        };
        entry.occurrences += 1;
        entry.files.add(relativePath);
        for (const screen of screens) entry.screens.add(screen);
        tokens.set(token, entry);
      }
    }
  }
  return [...tokens.values()]
    .map((entry) => ({
      token: entry.token,
      occurrences: entry.occurrences,
      files: [...entry.files].sort(),
      screens: [...entry.screens].sort(),
      runtime: [...entry.files].some((filePath) => runtimePaths.has(filePath)),
    }))
    .sort(
      (left, right) =>
        right.occurrences - left.occurrences || left.token.localeCompare(right.token),
    );
}

function semanticTheme() {
  const names = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "destructive-foreground",
    "border",
    "input",
    "ring",
    "sidebar",
    "sidebar-foreground",
    "sidebar-primary",
    "sidebar-primary-foreground",
    "sidebar-accent",
    "sidebar-accent-foreground",
    "sidebar-border",
    "sidebar-ring",
    "success",
    "success-foreground",
    "warning",
    "warning-foreground",
    "info",
    "info-foreground",
  ];
  return Object.fromEntries(names.map((name) => [name, `var(--${name})`]));
}

function splitVariants(token) {
  const parts = [];
  let start = 0;
  let squareDepth = 0;
  let parenDepth = 0;
  for (let index = 0; index < token.length; index += 1) {
    const character = token[index];
    if (character === "[") squareDepth += 1;
    if (character === "]") squareDepth -= 1;
    if (character === "(") parenDepth += 1;
    if (character === ")") parenDepth -= 1;
    if (character === ":" && squareDepth === 0 && parenDepth === 0) {
      parts.push(token.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(token.slice(start));
  return parts;
}

function escapeClass(token) {
  return token.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
}

const semanticRgb = {
  background: [252, 252, 252],
  foreground: [38, 38, 38],
  card: [255, 255, 255],
  "card-foreground": [38, 38, 38],
  popover: [255, 255, 255],
  "popover-foreground": [38, 38, 38],
  primary: [23, 23, 23],
  "primary-foreground": [255, 255, 255],
  secondary: [0, 0, 0],
  "secondary-foreground": [38, 38, 38],
  muted: [0, 0, 0],
  "muted-foreground": [104, 104, 104],
  accent: [0, 0, 0],
  "accent-foreground": [38, 38, 38],
  destructive: [239, 68, 68],
  "destructive-foreground": [185, 28, 28],
  border: [0, 0, 0],
  input: [0, 0, 0],
  ring: [163, 163, 163],
  sidebar: [255, 255, 255],
  "sidebar-foreground": [38, 38, 38],
  "sidebar-primary": [23, 23, 23],
  "sidebar-primary-foreground": [255, 255, 255],
  "sidebar-accent": [0, 0, 0],
  "sidebar-accent-foreground": [38, 38, 38],
  "sidebar-border": [0, 0, 0],
  "sidebar-ring": [163, 163, 163],
  success: [16, 185, 129],
  "success-foreground": [4, 120, 87],
  warning: [245, 158, 11],
  "warning-foreground": [180, 83, 9],
  info: [82, 111, 255],
  "info-foreground": [82, 111, 255],
};

function spacingValue(raw) {
  const number = Number(raw);
  return Number.isFinite(number) ? `${number * 4}px` : null;
}

function genericPatch(token) {
  const semantic = token.match(/^(text|bg|border|ring)-([a-z][a-z0-9-]*)\/(\d+)$/);
  if (semantic && semanticRgb[semantic[2]]) {
    const alpha = Math.min(100, Number(semantic[3])) / 100;
    const [red, green, blue] = semanticRgb[semantic[2]];
    const color = `rgba(${red},${green},${blue},${alpha})`;
    const property =
      semantic[1] === "text"
        ? "color"
        : semantic[1] === "bg"
          ? "background-color"
          : semantic[1] === "border"
            ? "border-color"
            : "box-shadow";
    return property === "box-shadow" ? `box-shadow:0 0 0 1px ${color}` : `${property}:${color}`;
  }
  const spacing = token.match(/^space-([xy])-([0-9.]+)$/);
  if (spacing) {
    const value = spacingValue(spacing[2]);
    if (value) return `gap:${value}`;
  }
  if (token === "font-heading" || token === "font-system-ui") {
    return "font-family:var(--font-ui-family)";
  }
  if (token === "font-chat-code" || token === "font-mono") {
    return "font-family:var(--font-chat-code-family)";
  }
  if (token === "whitespace-pre-wrap") return "white-space:pre-wrap";
  if (token === "ring-1") return "box-shadow:0 0 0 1px var(--ring)";
  if (token === "ring-2") return "box-shadow:0 0 0 2px var(--ring)";
  if (token === "ring-ring") return "box-shadow:0 0 0 1px var(--ring)";
  const cursor = token.match(
    /^cursor-(default|col-resize|row-resize|grab|grabbing|text|not-allowed|help|move)$/,
  );
  if (cursor) return `cursor:${cursor[1]}`;
  const size = token.match(/^size-([0-9.]+)$/);
  if (size) {
    const value = spacingValue(size[1]);
    if (value) return `width:${value};height:${value}`;
  }
  if (token === "overflow-clip") return "overflow:hidden";
  const shadow = token.match(/^shadow-(xs|sm|md|lg)(?:\/\d+)?$/);
  if (shadow) {
    const blur = { xs: 2, sm: 3, md: 6, lg: 12 }[shadow[1]];
    return `box-shadow:0 1px ${blur}px rgba(0,0,0,0.08)`;
  }
  const variableSize = token.match(/^(min-|max-)?([wh])-\(--([a-z0-9-]+)\)$/);
  if (variableSize) {
    const prefix = variableSize[1] ?? "";
    const axis = variableSize[2] === "w" ? "width" : "height";
    return `${prefix}${axis}:var(--${variableSize[3]})`;
  }
  const origin = token.match(/^origin-\(--([a-z0-9-]+)\)$/);
  if (origin) return `transform-origin:var(--${origin[1]})`;
  return null;
}

function likelyCustomClass(token) {
  if (!/^[a-z][a-z0-9-]+$/.test(token)) return false;
  if (bareUtilities.has(token)) return false;
  return !utilityPrefixes.has(token.split("-")[0]);
}

function variantPatch(token, declarationsForClass) {
  const parts = splitVariants(token);
  if (parts.length < 2) return null;
  const base = parts.at(-1);
  const variants = parts.slice(0, -1);
  if (
    variants.some(
      (variant) =>
        ["before", "after", "first", "last", "odd", "even", "only", "empty", "2xl"].includes(
          variant,
        ) ||
        variant.startsWith("has-") ||
        variant.startsWith("not-") ||
        variant.startsWith("in-[") ||
        variant.startsWith("pointer-coarse"),
    )
  ) {
    return null;
  }
  const declarations =
    declarationsForClass.get(base) ?? deterministicPatches.get(base) ?? genericPatch(base);
  if (!declarations) return null;
  const classSelector = `.${escapeClass(token)}`;
  const states = [];
  let ancestor = "";
  for (const variant of variants) {
    if (["sm", "md", "lg", "xl"].includes(variant)) continue;
    if (variant === "dark") {
      ancestor += ".dark ";
    } else if (variant === "group-hover") {
      ancestor += ".ui-hover ";
    } else if (variant === "hover") {
      states.push("ui-hover");
    } else if (variant === "focus" || variant === "focus-visible" || variant === "focus-within") {
      states.push("ui-focus");
    } else if (variant === "active") {
      states.push("ui-active");
    } else if (variant === "disabled" || variant === "has-disabled") {
      states.push("ui-disabled");
    } else if (variant.startsWith("data-")) {
      const state =
        variant.match(/state[=-]([a-z-]+)/)?.[1] ??
        variant.replace(/^data-(?:\[)?/, "").replace(/[\]=]/g, "-");
      states.push(`ui-${state.replace(/^-|-$/g, "")}`);
    } else if (variant.startsWith("aria-")) {
      states.push(`ui-${variant.slice("aria-".length)}`);
    } else {
      return null;
    }
  }
  const selector = `${ancestor}${classSelector}${states.map((state) => `.${state}`).join("")}`;
  return { selector, declarations, base };
}

function classNamesFromSelector(selector) {
  const names = [];
  try {
    selectorParser((root) => {
      root.walkClasses((classNode) => names.push(classNode.value));
    }).processSync(selector);
  } catch {
    return [];
  }
  return names;
}

function simpleClassName(selector) {
  try {
    const root = selectorParser().astSync(selector);
    if (root.nodes.length !== 1 || root.nodes[0].nodes.length !== 1) return null;
    const node = root.nodes[0].nodes[0];
    return node.type === "class" ? node.value : null;
  } catch {
    return null;
  }
}

function unsupported(token) {
  return unsupportedPatterns.some((pattern) => pattern.test(token));
}

async function generate() {
  const manifest = extractManifest();
  const allTokens = manifest.map((entry) => entry.token);
  const variantBases = allTokens
    .map((token) => splitVariants(token))
    .filter((parts) => parts.length > 1)
    .map((parts) => parts.at(-1));
  const contentTokens = [...new Set([...allTokens, ...variantBases])];
  const config = {
    presets: [typeof preset === "function" ? preset() : preset],
    content: [{ raw: `<view class="${contentTokens.join(" ")}"></view>` }],
    theme: {
      extend: {
        colors: semanticTheme(),
        // Upstream's typography scale (`text-ui`, `text-chat-meta`, …) lives in the
        // web app's Tailwind v4 `@theme`; this v3 config has to be told about it.
        fontSize: readWebThemeFontSizes(
          fs.readFileSync(path.join(webRoot, "apps/web/src/index.css"), "utf8"),
        ),
        fontFamily: {
          "system-ui": ["system-ui"],
          mono: ["var(--font-mono-family)"],
          sans: ["var(--font-ui-family)"],
        },
      },
    },
  };
  const generated = await postcss([tailwindcss(config)]).process("@tailwind utilities;", {
    from: undefined,
  });
  const unsupportedProperties = new Set([
    "-ms-overflow-style",
    "-webkit-app-region",
    "color-scheme",
    "contain",
    "font-variant-numeric",
    "list-style",
    "outline-offset",
    "scrollbar-width",
    "text-transform",
    "user-select",
  ]);
  const strippedPropertiesByClass = new Map();
  generated.root.walkDecls((declaration) => {
    if (unsupportedProperties.has(declaration.prop)) {
      const rule = declaration.parent;
      if (rule?.type === "rule") {
        for (const name of classNamesFromSelector(rule.selector)) {
          const properties = strippedPropertiesByClass.get(name) ?? new Set();
          properties.add(declaration.prop);
          strippedPropertiesByClass.set(name, properties);
        }
      }
      declaration.remove();
      return;
    }
    declaration.value = declaration.value.replace(
      /--spacing\(([-+]?[0-9]*\.?[0-9]+)\)/g,
      (_match, rawValue) => `${Number(rawValue) * 4}px`,
    );
    const transformFallbacks = {
      "--tw-tx": "0px",
      "--tw-ty": "0px",
      "--tw-tz": "0px",
      "--tw-rx": "0deg",
      "--tw-ry": "0deg",
      "--tw-rz": "0deg",
      "--tw-skx": "0deg",
      "--tw-sky": "0deg",
      "--tw-sx": "1",
      "--tw-sy": "1",
    };
    declaration.value = declaration.value.replace(
      /var\((--tw-(?:t[xyz]|r[xyz]|sk[xy]|s[xy]))\)/g,
      (_match, variable) => `var(${variable},${transformFallbacks[variable]})`,
    );
  });
  generated.root.walkRules((rule) => {
    if (rule.nodes.length === 0) rule.remove();
  });
  const generatedClasses = new Set();
  const declarationsForClass = new Map();
  generated.root.walkRules((rule) => {
    const names = classNamesFromSelector(rule.selector);
    for (const name of names) {
      generatedClasses.add(name);
      if (names.length === 1 && simpleClassName(rule.selector) === name) {
        declarationsForClass.set(name, rule.nodes.map((node) => node.toString()).join(";"));
      }
    }
  });

  const patchesByToken = new Map();
  const classified = manifest.map((entry) => {
    let status;
    let reason;
    const statePatch = variantPatch(entry.token, declarationsForClass);
    const generic = genericPatch(entry.token);
    if (!unsupported(entry.token) && generatedClasses.has(entry.token)) {
      status = "GENERATED";
      reason = "Tailwind v3 + Lynx preset/theme emitted the selector";
    } else if (deterministicPatches.has(entry.token)) {
      status = "PATCHED";
      reason = deterministicPatches.get(entry.token);
      patchesByToken.set(entry.token, {
        selector: `.${escapeClass(entry.token)}`,
        declarations: deterministicPatches.get(entry.token),
      });
    } else if (generic) {
      status = "PATCHED";
      reason = generic;
      patchesByToken.set(entry.token, {
        selector: `.${escapeClass(entry.token)}`,
        declarations: generic,
      });
    } else if (statePatch) {
      status = "PATCHED";
      reason = `state/responsive adapter over ${statePatch.base}`;
      patchesByToken.set(entry.token, statePatch);
    } else if (strippedPropertiesByClass.has(entry.token)) {
      status = "UNSUPPORTED";
      reason = `generated only platform-unsupported declaration(s): ${[
        ...strippedPropertiesByClass.get(entry.token),
      ].join(", ")}`;
    } else if (likelyCustomClass(entry.token)) {
      status = "CUSTOM";
      reason = "project component class; covered by authored CSS, not the utility denominator";
    } else if (unsupported(entry.token)) {
      status = "UNSUPPORTED";
      reason = "selector/media/overflow behavior has no direct Lynx equivalent";
    } else {
      status = "UNMAPPED";
      reason = "no generated selector or approved deterministic patch";
    }
    return { ...entry, status, reason };
  });
  const statusByToken = new Map(classified.map((entry) => [entry.token, entry.status]));
  const runtimeTokens = new Set(
    classified.filter((entry) => entry.runtime).map((entry) => entry.token),
  );

  generated.root.walkRules((rule) => {
    const names = classNamesFromSelector(rule.selector);
    if (
      names.length > 0 &&
      names.some((name) => statusByToken.get(name) !== "GENERATED" || !runtimeTokens.has(name))
    ) {
      rule.remove();
    }
  });
  generated.root.walkAtRules((atRule) => {
    if (atRule.nodes?.length === 0) atRule.remove();
  });

  const patchCss = [...patchesByToken.entries()]
    .filter(([token]) => runtimeTokens.has(token))
    .map(([, patch]) => patch)
    .map(({ selector, declarations }) => `${selector}{${declarations}}`)
    .join("\n");
  const css = [
    "/* Generated by scripts/style-audit.mjs. Do not edit directly. */",
    generated.root.toString().trim(),
    patchCss,
    "",
  ].join("\n");

  const auditEntries = classified.filter((entry) => entry.status !== "CUSTOM");
  const eligibleEntries = auditEntries.filter((entry) => entry.status !== "UNSUPPORTED");
  const surfaceWeighted = auditEntries.reduce((sum, entry) => sum + entry.occurrences, 0);
  const totalWeighted = eligibleEntries.reduce((sum, entry) => sum + entry.occurrences, 0);
  const coveredWeighted = eligibleEntries
    .filter((entry) => ["GENERATED", "PATCHED"].includes(entry.status))
    .reduce((sum, entry) => sum + entry.occurrences, 0);
  const coveragePercent = Number(((coveredWeighted / totalWeighted) * 100).toFixed(2));
  const statusSummary = Object.fromEntries(
    ["GENERATED", "PATCHED", "UNSUPPORTED", "UNMAPPED", "CUSTOM"].map((status) => {
      const entries = classified.filter((entry) => entry.status === status);
      return [
        status,
        {
          classes: entries.length,
          weighted: entries.reduce((sum, entry) => sum + entry.occurrences, 0),
        },
      ];
    }),
  );
  const output = {
    screenSet: JSON.parse(fs.readFileSync(reuseReportPath, "utf8")).screens.map(
      (screen) => screen.id,
    ),
    threshold,
    summary: {
      classes: auditEntries.length,
      customClasses: classified.length - auditEntries.length,
      surfaceWeighted,
      totalWeighted,
      coveredWeighted,
      coveragePercent,
      status: statusSummary,
      runtime: {
        classes: classified.filter((entry) => entry.runtime).length,
        weighted: classified
          .filter((entry) => entry.runtime)
          .reduce((sum, entry) => sum + entry.occurrences, 0),
      },
    },
    classes: classified,
  };
  const uncovered = classified
    .filter((entry) => ["UNSUPPORTED", "UNMAPPED"].includes(entry.status))
    .map((entry) => ({
      token: entry.token,
      occurrences: entry.occurrences,
      status: entry.status,
    }));
  const report = [
    "# P5-R4 core-screen style coverage",
    "",
    "Generated from the eligible module union of all six P5-R1 screen graphs.",
    "",
    `- Unique utility tokens: **${auditEntries.length}**`,
    `- Authored component classes excluded from the utility denominator: **${classified.length - auditEntries.length}**`,
    `- Extracted utility occurrences: **${surfaceWeighted}**`,
    `- Eligible occurrences (registered platform-unsupported utilities excluded): **${totalWeighted}**`,
    `- Covered by generated or deterministic patched CSS: **${coveredWeighted} (${coveragePercent}%)**`,
    `- Required threshold: **${threshold}%**`,
    `- Runtime CSS emission (currently physically shared modules only): **${output.summary.runtime.classes} classes / ${output.summary.runtime.weighted} source occurrences**`,
    "",
    "| Status | Classes | Weighted occurrences |",
    "|---|---:|---:|",
    ...Object.entries(statusSummary).map(
      ([status, value]) => `| ${status} | ${value.classes} | ${value.weighted} |`,
    ),
    "",
    "## Highest-weight uncovered classes",
    "",
    "| Class | Occurrences | Status |",
    "|---|---:|---|",
    ...uncovered
      .slice()
      .sort(
        (left, right) =>
          right.occurrences - left.occurrences || left.token.localeCompare(right.token),
      )
      .slice(0, 80)
      .map(
        (entry) =>
          `| \`${entry.token.replaceAll("|", "\\|")}\` | ${entry.occurrences} | ${entry.status} |`,
      ),
    "",
    "The full per-class file/screen provenance is in `p5-r4-core-class-manifest.json`.",
    "",
  ].join("\n");
  const baseline = {
    minimumCoveragePercent: coveragePercent,
    maximumUncoveredWeighted: totalWeighted - coveredWeighted,
    uncoveredTokens: uncovered.map((entry) => entry.token).sort(),
    maximumUnsupportedWeighted: statusSummary.UNSUPPORTED.weighted,
    unsupportedTokens: classified
      .filter((entry) => entry.status === "UNSUPPORTED")
      .map((entry) => entry.token)
      .sort(),
  };
  return {
    manifestText: `${JSON.stringify(output, null, 2)}\n`,
    reportText: report,
    css,
    baseline,
    output,
  };
}

function assertEqual(filePath, expected) {
  if (!generatedFileIsFresh(filePath, expected)) {
    throw new Error(`${path.relative(workspaceRoot, filePath)} is stale`);
  }
}

const result = await generate();
const belowThreshold = result.output.summary.coveragePercent < threshold;

if (checkMode) {
  assertEqual(manifestPath, result.manifestText);
  assertEqual(reportPath, result.reportText);
  assertEqual(cssPath, result.css);
  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  if (
    result.output.summary.coveragePercent < baseline.minimumCoveragePercent ||
    result.output.summary.totalWeighted - result.output.summary.coveredWeighted >
      baseline.maximumUncoveredWeighted
  ) {
    throw new Error("style coverage regressed below the recorded ratchet");
  }
  const addedUncovered = result.baseline.uncoveredTokens.filter(
    (token) => !baseline.uncoveredTokens.includes(token),
  );
  if (addedUncovered.length > 0) {
    throw new Error(`new uncovered utilities: ${addedUncovered.join(", ")}`);
  }
  const addedUnsupported = result.baseline.unsupportedTokens.filter(
    (token) => !baseline.unsupportedTokens.includes(token),
  );
  if (
    result.output.summary.status.UNSUPPORTED.weighted > baseline.maximumUnsupportedWeighted ||
    addedUnsupported.length > 0
  ) {
    throw new Error(`platform-unsupported utility surface grew: ${addedUnsupported.join(", ")}`);
  }
} else {
  writeGeneratedFile(manifestPath, result.manifestText);
  writeGeneratedFile(reportPath, result.reportText);
  writeGeneratedFile(cssPath, result.css);
  if (!belowThreshold && (updateBaseline || !fs.existsSync(baselinePath))) {
    writeGeneratedFile(baselinePath, `${JSON.stringify(result.baseline, null, 2)}\n`);
  }
}

console.log(
  JSON.stringify(
    {
      mode: checkMode ? "check" : "write",
      classes: result.output.summary.classes,
      weighted: result.output.summary.totalWeighted,
      coveragePercent: result.output.summary.coveragePercent,
      status: result.output.summary.status,
    },
    null,
    2,
  ),
);
if (belowThreshold) {
  throw new Error(
    `weighted coverage ${result.output.summary.coveragePercent}% is below ${threshold}%`,
  );
}
