#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { generatedFileIsFresh, writeGeneratedFile } from "./format-generated.mjs";
import { countLynxOwnedQueries } from "./query-ownership.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");
const checkMode = process.argv.includes("--check");
const configArgument = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
const configPath = configArgument
  ? path.resolve(process.cwd(), configArgument)
  : path.join(workspaceRoot, "plan/reuse-audit.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const webRoot = path.resolve(workspaceRoot, config.webRoot);
const lynxRoot = path.resolve(workspaceRoot, config.lynxRoot);
const webSourceRoot = path.join(webRoot, "apps/web/src");
const typescriptPath = path.join(lynxRoot, "node_modules/typescript/lib/typescript.js");
const typescriptModule = await import(pathToFileURL(typescriptPath));
const ts = typescriptModule.default ?? typescriptModule;

// The bundle rewrites a few resolved Web resources to Lynx files regardless
// of how they were imported (`lynxResourceReplacements` in lynx.config.ts, the
// resource-path twin of `resolve.alias`). Mirror it so the audit graph only
// claims a Web module is SHARED when the bundle really compiles it.
const lynxConfigLog = console.log;
console.log = () => {}; // lynx.config.ts logs on import.
let lynxResourceReplacements;
try {
  ({ lynxResourceReplacements } = await import(
    pathToFileURL(path.join(lynxRoot, "lynx.config.ts")).href
  ));
} finally {
  console.log = lynxConfigLog;
}
const lynxResourceReplacementByWebPath = new Map(
  lynxResourceReplacements.map((entry) => [
    path.join(webSourceRoot, entry.webSource),
    path.join(lynxRoot, entry.lynxSource),
  ]),
);

function applyLynxResourceReplacement(resolved) {
  if (!resolved) return resolved;
  return lynxResourceReplacementByWebPath.get(resolved) ?? resolved;
}

const sourceExtensions = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".web.tsx",
  ".web.ts",
  ".browser.tsx",
  ".browser.ts",
];
const lynxSourceExtensions = [".lynx.tsx", ".lynx.ts", ".tsx", ".ts", ".jsx", ".js"];
const parseCache = new Map();

function unixPath(value) {
  return value.split(path.sep).join("/");
}

function relativeTo(root, value) {
  return unixPath(path.relative(root, value));
}

function isSourceFile(value) {
  return sourceExtensions.some((extension) => value.endsWith(extension));
}

function resolveSourceCandidate(base, extensions = sourceExtensions) {
  const candidates = [];
  if (isSourceFile(base)) {
    candidates.push(base);
  } else {
    for (const extension of extensions) candidates.push(`${base}${extension}`);
    for (const extension of extensions) {
      candidates.push(path.join(base, `index${extension}`));
    }
  }
  return candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
}

function resolveWebImport(specifier, importer) {
  if (specifier.startsWith("~/")) {
    return resolveSourceCandidate(path.join(webSourceRoot, specifier.slice(2)));
  }
  if (specifier.startsWith(".")) {
    return resolveSourceCandidate(path.resolve(path.dirname(importer), specifier));
  }
  return null;
}

function resolveLynxImport(specifier, importer) {
  if (specifier === "~/platform/storage") {
    return resolveSourceCandidate(
      path.join(lynxRoot, "src/platform/storage"),
      lynxSourceExtensions,
    );
  }
  if (specifier === "~/platform/env") {
    return resolveSourceCandidate(path.join(lynxRoot, "src/platform/env"), lynxSourceExtensions);
  }
  if (specifier === "~/hooks/useTheme") {
    return resolveSourceCandidate(
      path.join(lynxRoot, "src/adapters/useTheme"),
      lynxSourceExtensions,
    );
  }
  if (specifier === "~/nativeApi") {
    return resolveSourceCandidate(
      path.join(lynxRoot, "src/adapters/nativeApi"),
      lynxSourceExtensions,
    );
  }
  const lynxUiPrimitive = specifier.match(
    /^~\/components\/ui\/(button|input|dialog|menu|tooltip|scroll-area|collapsible|command|kbd|toast)$/,
  );
  if (lynxUiPrimitive) {
    return resolveSourceCandidate(
      path.join(lynxRoot, `src/components/ui/${lynxUiPrimitive[1]}`),
      lynxSourceExtensions,
    );
  }
  const elementAdapter = specifier.match(
    /^~\/components\/(?:settings\/|chat\/)?(SettingsSectionElements|SettingsRowElements|AppShellFrameElements|SidebarPrimaryActionElements|SidebarPrimaryNavigationElements|CenteredEmptyLandingElements|CenteredEmptyLandingStackElements|SidebarListSectionHeaderElements|SidebarProjectSummaryElements|SidebarThreadIdentityElements|SidebarSearchPaletteElements|SidebarChatsSectionElements|SidebarProjectsSectionElements|ChatSurfaceHeaderFrameElements|ChatSurfaceHeaderIdentityElements|EditorRailAddMenuCompositionElements)$/,
  );
  if (elementAdapter) {
    return resolveSourceCandidate(
      path.join(lynxRoot, `src/adapters/${elementAdapter[1]}`),
      lynxSourceExtensions,
    );
  }
  if (specifier === "~/composerDraftStore") {
    return resolveSourceCandidate(
      path.join(lynxRoot, "src/adapters/composerDraftStore"),
      lynxSourceExtensions,
    );
  }
  if (specifier === "@tanstack/react-router") {
    return resolveSourceCandidate(
      path.join(lynxRoot, "src/adapters/reactRouter"),
      lynxSourceExtensions,
    );
  }
  if (specifier === "~/components/SynaraLogo") {
    return resolveSourceCandidate(
      path.join(lynxRoot, "src/adapters/SynaraLogo"),
      lynxSourceExtensions,
    );
  }
  if (specifier.startsWith("@synara-web/")) {
    return applyLynxResourceReplacement(
      resolveSourceCandidate(
        path.join(webSourceRoot, specifier.slice("@synara-web/".length)),
        lynxSourceExtensions,
      ),
    );
  }
  if (specifier.startsWith("~/")) {
    return applyLynxResourceReplacement(
      resolveSourceCandidate(path.join(webSourceRoot, specifier.slice(2)), lynxSourceExtensions),
    );
  }
  if (specifier.startsWith(".")) {
    return applyLynxResourceReplacement(
      resolveSourceCandidate(path.resolve(path.dirname(importer), specifier), lynxSourceExtensions),
    );
  }
  return null;
}

// ── Lynx parallel-implementation ratchet ─────────────────────────────────
// The shared state layer replaces the Lynx-only client/read-model/polling code
// step by step (plan/shared-state-architecture.md). These counts may only go
// down; `--check` fails when any of them rises above the recorded baseline.

function listLynxSourceFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name) && !/\.test\.(tsx?|jsx?)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  return files.sort();
}

function countParallelImplementationSites(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const useQueryCallSites = countLynxOwnedQueries(text, filePath);
  let refetchIntervalSites = 0;
  function visit(node) {
    if (
      (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "refetchInterval"
    ) {
      refetchIntervalSites += 1;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return { useQueryCallSites, refetchIntervalSites };
}

function measureLynxParallelImplementation() {
  const lynxSourceRoot = path.join(lynxRoot, "src");
  const synaraClientPath = path.join(lynxSourceRoot, "data/synaraClient.lynx.ts");
  const routerPath = path.join(lynxSourceRoot, "app/router.tsx");
  let synaraClientImporters = 0;
  let useQueryCallSites = 0;
  let refetchIntervalSites = 0;
  for (const filePath of listLynxSourceFiles(lynxSourceRoot)) {
    if (filePath !== synaraClientPath) {
      const importsClient = parseModule(filePath).imports.some(
        (specifier) => resolveLynxImport(specifier, filePath) === synaraClientPath,
      );
      if (importsClient) synaraClientImporters += 1;
    }
    const sites = countParallelImplementationSites(filePath);
    useQueryCallSites += sites.useQueryCallSites;
    refetchIntervalSites += sites.refetchIntervalSites;
  }
  const routerText = fs.readFileSync(routerPath, "utf8");
  const routerTsxLines = routerText.split("\n").length - (routerText.endsWith("\n") ? 1 : 0);
  return { synaraClientImporters, useQueryCallSites, refetchIntervalSites, routerTsxLines };
}

const lynxParallelImplementation = {
  baseline: config.parallelImplementationBaseline ?? null,
  current: measureLynxParallelImplementation(),
};

function moduleSpecifiers(sourceFile) {
  const specifiers = [];
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length > 0 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return [...new Set(specifiers)];
}

function codeLines(text, scriptKind) {
  const sourceFile = ts.createSourceFile(
    "count.ts",
    text,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
  const lines = new Set();
  scanner.setScriptTarget(ts.ScriptTarget.Latest);
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const start = scanner.getTokenPos();
    const end = scanner.getTextPos();
    const startLine = ts.getLineAndCharacterOfPosition(sourceFile, start).line;
    const endLine = ts.getLineAndCharacterOfPosition(sourceFile, Math.max(start, end - 1)).line;
    for (let line = startLine; line <= endLine; line += 1) lines.add(line + 1);
    token = scanner.scan();
  }
  return lines.size;
}

function parseModule(filePath) {
  const cached = parseCache.get(filePath);
  if (cached) return cached;
  const text = fs.readFileSync(filePath, "utf8");
  const scriptKind = filePath.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : filePath.endsWith(".jsx")
      ? ts.ScriptKind.JSX
      : filePath.endsWith(".js")
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, scriptKind);
  const parsed = {
    imports: moduleSpecifiers(sourceFile),
    loc: codeLines(text, scriptKind),
  };
  parseCache.set(filePath, parsed);
  return parsed;
}

function buildGraph(entries, root, resolver) {
  const queue = entries.map((entry) => path.resolve(root, entry));
  const modules = new Map();
  const external = new Set();
  const unresolved = new Set();
  while (queue.length > 0) {
    const filePath = queue.shift();
    if (modules.has(filePath)) continue;
    if (!fs.existsSync(filePath)) {
      unresolved.add(relativeTo(root, filePath));
      continue;
    }
    const parsed = parseModule(filePath);
    const dependencies = [];
    for (const specifier of parsed.imports) {
      if (/\.(css|scss|sass|less)(\?.*)?$/.test(specifier)) continue;
      const resolved = resolver(specifier, filePath);
      if (resolved) {
        dependencies.push(resolved);
        if (!modules.has(resolved)) queue.push(resolved);
      } else if (
        specifier.startsWith(".") ||
        specifier.startsWith("~/") ||
        specifier.startsWith("@synara-web/")
      ) {
        unresolved.add(`${relativeTo(root, filePath)} -> ${specifier}`);
      } else {
        external.add(specifier);
      }
    }
    modules.set(filePath, {
      filePath,
      loc: parsed.loc,
      imports: parsed.imports,
      dependencies,
    });
  }
  return { modules, external, unresolved };
}

function matchesRule(relativePath, rule) {
  if (rule.exact) return relativePath === rule.exact;
  if (rule.prefix) return relativePath.startsWith(rule.prefix);
  if (rule.regex) return new RegExp(rule.regex).test(relativePath);
  return false;
}

function targetClassification(relativePath, module) {
  for (const rule of config.classificationRules) {
    if (matchesRule(relativePath, rule)) {
      return { classification: rule.classification, reason: rule.reason };
    }
  }
  const hardDependency = module.imports.find((specifier) =>
    config.hardIslandPackages.some(
      (packageName) => specifier === packageName || specifier.startsWith(`${packageName}/`),
    ),
  );
  if (hardDependency) {
    return {
      classification: "EXCLUSIVE",
      reason: `direct hard-island dependency: ${hardDependency}`,
    };
  }
  return {
    classification: "SHARED",
    reason: "ordinary feature composition/logic; adapter differences belong below this module",
  };
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

const lynxGraph = buildGraph(config.lynxEntries, lynxRoot, resolveLynxImport);
const lynxPhysicalFiles = new Set(
  [...lynxGraph.modules.keys()].map((value) => fs.realpathSync(value)),
);
const patchedSources = new Set(config.patchedSources ?? []);
const outputPath = path.resolve(workspaceRoot, config.outputJson);
const existingOutput = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
  : null;
const generatedAt =
  checkMode && existingOutput?.generatedAt
    ? existingOutput.generatedAt
    : process.env.SOURCE_DATE_EPOCH
      ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
      : new Date().toISOString();
const screens = [];

for (const screen of config.screens) {
  const graph = buildGraph(screen.webEntries, webRoot, resolveWebImport);
  const modules = [...graph.modules.values()]
    .filter((module) => module.filePath.startsWith(webSourceRoot))
    .map((module) => {
      const relativePath = relativeTo(webRoot, module.filePath);
      const target = targetClassification(relativePath, module);
      const physicalShared = lynxPhysicalFiles.has(fs.realpathSync(module.filePath));
      const patched = patchedSources.has(relativePath);
      return {
        path: relativePath,
        loc: module.loc,
        classification: target.classification,
        reason: target.reason,
        currentReuse: physicalShared ? "SHARED" : patched ? "PATCHED" : "UNMAPPED",
        dependencies: module.dependencies
          .filter((dependency) => dependency.startsWith(webSourceRoot))
          .map((dependency) => relativeTo(webRoot, dependency))
          .sort(),
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
  const eligible = modules.filter((module) => module.classification !== "EXCLUSIVE");
  const reused = eligible.filter((module) => ["SHARED", "PATCHED"].includes(module.currentReuse));
  const eligibleLoc = sum(eligible, (module) => module.loc);
  const reusedLoc = sum(reused, (module) => module.loc);
  const classSummary = Object.fromEntries(
    ["SHARED", "PATCHED", "SPLIT", "EXCLUSIVE"].map((classification) => {
      const matching = modules.filter((module) => module.classification === classification);
      return [
        classification,
        {
          modules: matching.length,
          loc: sum(matching, (module) => module.loc),
        },
      ];
    }),
  );
  screens.push({
    id: screen.id,
    label: screen.label,
    route: screen.route,
    reference: screen.reference,
    webEntries: screen.webEntries,
    lynxConceptualEntries: screen.lynxConceptualEntries,
    graph: {
      modules: modules.length,
      loc: sum(modules, (module) => module.loc),
      externalImports: [...graph.external].sort(),
      unresolvedImports: [...graph.unresolved].sort(),
    },
    targetClassification: classSummary,
    eligible: {
      modules: eligible.length,
      loc: eligibleLoc,
    },
    currentReuse: {
      modules: reused.length,
      loc: reusedLoc,
      modulePercent:
        eligible.length === 0 ? 0 : Number(((reused.length / eligible.length) * 100).toFixed(2)),
      locPercent: eligibleLoc === 0 ? 0 : Number(((reusedLoc / eligibleLoc) * 100).toFixed(2)),
      gatePercent:
        eligible.length === 0 || eligibleLoc === 0
          ? 0
          : Number(
              Math.min(
                (reused.length / eligible.length) * 100,
                (reusedLoc / eligibleLoc) * 100,
              ).toFixed(2),
            ),
    },
    modules,
  });
}

const output = {
  schemaVersion: 1,
  generatedAt,
  config: relativeTo(workspaceRoot, configPath),
  metric: {
    scope: "apps/web/src TS/TSX reachable from configured route/shell entries",
    numerator: "same physical source modules plus declared deterministic PATCHED sources",
    denominator: "all reachable modules except approved EXCLUSIVE hard islands",
    gate: "minimum(module reuse %, LOC reuse %)",
    targetPercent: config.targetPercent ?? 70,
  },
  screenSet: config.screenSet,
  lynxGraph: {
    entries: config.lynxEntries,
    modules: lynxGraph.modules.size,
    externalImports: [...lynxGraph.external].sort(),
    unresolvedImports: [...lynxGraph.unresolved].sort(),
  },
  lynxParallelImplementation,
  screens,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const outputText = `${JSON.stringify(output, null, 2)}\n`;

const markdown = [
  `# ${config.reportTitle ?? "Source reuse report"}`,
  "",
  `Generated: ${generatedAt}`,
  "",
  "This file is generated by `bun run --cwd apps/lynx audit:reuse`. Do not hand-edit.",
  "",
  "## Metric",
  "",
  `- Scope: ${output.metric.scope}.`,
  `- Numerator: ${output.metric.numerator}.`,
  `- Denominator: ${output.metric.denominator}.`,
  `- Gate: ${output.metric.gate}; Phase 5/6 target ${output.metric.targetPercent}%.`,
  "- `UNMAPPED` is a current-state audit result, not a fifth target classification.",
  "",
  "## Screen set",
  "",
  "| Screen | Web route/reference | Graph modules / LOC | Eligible modules / LOC | Current module reuse | Current LOC reuse | Gate |",
  "|---|---|---:|---:|---:|---:|---:|",
  ...screens.map(
    (screen) =>
      `| ${screen.label} | \`${screen.route}\` · ${screen.reference} | ${screen.graph.modules} / ${screen.graph.loc} | ${screen.eligible.modules} / ${screen.eligible.loc} | ${screen.currentReuse.modules} (${screen.currentReuse.modulePercent}%) | ${screen.currentReuse.loc} (${screen.currentReuse.locPercent}%) | **${screen.currentReuse.gatePercent}%** |`,
  ),
  "",
  "## Target classification summary",
  "",
  "| Screen | SHARED | PATCHED | SPLIT | EXCLUSIVE |",
  "|---|---:|---:|---:|---:|",
  ...screens.map((screen) => {
    const value = (key) =>
      `${screen.targetClassification[key].modules} / ${screen.targetClassification[key].loc}`;
    return `| ${screen.label} | ${value("SHARED")} | ${value("PATCHED")} | ${value("SPLIT")} | ${value("EXCLUSIVE")} |`;
  }),
  "",
  "Values are `modules / LOC`. The full per-module classification, reason, dependency list, and",
  `unresolved/external import evidence live in \`${relativeTo(path.dirname(outputPath), outputPath)}\`.`,
  "",
  "## Lynx parallel implementation (ratchet: may only decrease)",
  "",
  "| Counter | Baseline | Current |",
  "|---|---:|---:|",
  ...Object.entries(lynxParallelImplementation.current).map(
    ([key, value]) =>
      `| \`${key}\` | ${lynxParallelImplementation.baseline?.[key] ?? "—"} | ${value} |`,
  ),
  "",
  "- `synaraClientImporters`: non-test files under `src/` whose static or dynamic imports resolve to `data/synaraClient.lynx.ts`.",
  "- `useQueryCallSites`: queries Lynx owns under `src/` (non-test), as `scripts/query-ownership.mjs` counts them: definitions with `queryKey` and `queryFn`, and query consumers whose options are not provably an imported upstream factory with non-data overrides.",
  "- `refetchIntervalSites`: `refetchInterval` option sites under `src/` (non-test).",
  "- `routerTsxLines`: raw line count of `src/app/router.tsx`.",
  "",
  "## Current-state interpretation",
  "",
  ...(
    config.interpretation ?? [
      "Current reuse is based only on physical source identity or declared deterministic PATCHED sources.",
      "Conceptual counterparts and same-name copies remain UNMAPPED.",
    ]
  ).map((line) => `- ${line}`),
].join("\n");

const markdownPath = path.resolve(workspaceRoot, config.outputMarkdown);
const markdownText = `${markdown}\n`;
if (checkMode) {
  const mismatches = [];
  if (!generatedFileIsFresh(outputPath, outputText)) {
    mismatches.push(relativeTo(workspaceRoot, outputPath));
  }
  if (!generatedFileIsFresh(markdownPath, markdownText)) {
    mismatches.push(relativeTo(workspaceRoot, markdownPath));
  }
  if (mismatches.length > 0) {
    console.error(`reuse audit is stale: ${mismatches.join(", ")}`);
    process.exit(1);
  }
  const baseline = lynxParallelImplementation.baseline;
  if (!baseline) {
    console.error("reuse audit: parallelImplementationBaseline is missing from the config");
    process.exit(1);
  }
  const regressions = Object.entries(lynxParallelImplementation.current).filter(
    ([key, value]) => typeof baseline[key] === "number" && value > baseline[key],
  );
  if (regressions.length > 0) {
    console.error(
      `lynx parallel implementation grew: ${regressions
        .map(([key, value]) => `${key}=${value} (baseline ${baseline[key]})`)
        .join(", ")}`,
    );
    process.exit(1);
  }
} else {
  writeGeneratedFile(outputPath, outputText);
  writeGeneratedFile(markdownPath, markdownText);
}

console.log(
  JSON.stringify(
    {
      outputJson: relativeTo(workspaceRoot, outputPath),
      outputMarkdown: relativeTo(workspaceRoot, markdownPath),
      mode: checkMode ? "check" : "write",
      screens: screens.map((screen) => ({
        id: screen.id,
        modules: screen.graph.modules,
        eligible: screen.eligible.modules,
        gatePercent: screen.currentReuse.gatePercent,
      })),
    },
    null,
    2,
  ),
);

if (config.enforceTarget) {
  const failedScreens = screens.filter(
    (screen) => screen.currentReuse.gatePercent < output.metric.targetPercent,
  );
  if (failedScreens.length > 0) {
    console.error(
      `reuse gate failed: ${failedScreens
        .map((screen) => `${screen.id}=${screen.currentReuse.gatePercent}%`)
        .join(", ")}; target=${output.metric.targetPercent}%`,
    );
    process.exit(1);
  }
}
