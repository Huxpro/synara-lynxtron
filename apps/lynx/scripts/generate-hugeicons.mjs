#!/usr/bin/env node

// Generates `src/generated/hugeicons.generated.ts` from upstream's
// `apps/web/src/lib/hugeicons.tsx` and the re-export list of `lib/icons.tsx`.
//
// Upstream inlines its Hugeicons as DOM `<svg>` JSX, which cannot enter the Lynx
// bundle; a Lynx `<svg>` takes the drawing as a string. This script evaluates
// upstream's module with a JSX factory that writes markup instead of elements,
// calls every exported icon once, and stores the markup under the name the app
// uses for it (`Home07Icon as HomeIcon` in icons.tsx → `HomeIcon`). The paths,
// stroke widths, solid variants, rotations and mirrors are therefore upstream's
// own, and an icon upstream redraws reaches Lynx on the next generation.
//
//   node scripts/generate-hugeicons.mjs          # rewrite the generated file
//   node scripts/generate-hugeicons.mjs --check  # exit 1 when it drifted
//
// It fails (and writes nothing) when the module starts to import a runtime value,
// when an export is not an icon component, or when an icon renders an element
// other than the drawing ones below.

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

import { generatedFileIsFresh, writeGeneratedFile } from "./format-generated.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const SCRIPT_NAME = "generate-hugeicons.mjs";

export const HUGEICONS_SOURCE = "apps/web/src/lib/hugeicons.tsx";
export const HUGEICONS_ALIAS_SOURCE = "apps/web/src/lib/icons.tsx";
export const HUGEICONS_OUTPUT = "apps/lynx/src/generated/hugeicons.generated.ts";

const DRAWING_ELEMENTS = new Set(["svg", "g", "path", "circle", "rect", "line", "ellipse"]);
const ATTRIBUTE_NAMES = {
  strokeWidth: "stroke-width",
  strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin",
  strokeDasharray: "stroke-dasharray",
  fillRule: "fill-rule",
  clipRule: "clip-rule",
};
// Accessibility and test hooks of the DOM element; the Lynx `<svg>` carries its own.
const DROPPED_ATTRIBUTE = /^(?:key|role|aria-.*|data-.*)$/;

export class HugeiconsGenerationError extends Error {}

function escapeAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function renderElement(tag, props, ...children) {
  if (typeof tag !== "string" || !DRAWING_ELEMENTS.has(tag)) {
    throw new HugeiconsGenerationError(
      `an icon renders <${typeof tag === "string" ? tag : "a component"}>, which this generator does not know how to write as SVG markup`,
    );
  }
  const attributes = Object.entries(props ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .filter(([name]) => !DROPPED_ATTRIBUTE.test(name))
    .map(([name, value]) => ` ${ATTRIBUTE_NAMES[name] ?? name}="${escapeAttribute(value)}"`)
    .join("");
  const body = children.flat(Infinity).filter((child) => typeof child === "string");
  return body.length > 0
    ? `<${tag}${attributes}>${body.join("")}</${tag}>`
    : `<${tag}${attributes}/>`;
}

/** `{ localName: exportedName[] }` for `export { A as B, C } from "./hugeicons"` in icons.tsx. */
export function readHugeiconAliases(aliasSourceText) {
  const sourceFile = ts.createSourceFile(
    "icons.tsx",
    aliasSourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const aliases = new Map();
  for (const statement of sourceFile.statements) {
    if (
      !ts.isExportDeclaration(statement) ||
      !statement.moduleSpecifier ||
      statement.moduleSpecifier.text !== "./hugeicons" ||
      !statement.exportClause ||
      !ts.isNamedExports(statement.exportClause)
    ) {
      continue;
    }
    for (const element of statement.exportClause.elements) {
      if (element.isTypeOnly) continue;
      const source = (element.propertyName ?? element.name).text;
      aliases.set(source, [...(aliases.get(source) ?? []), element.name.text]);
    }
  }
  return aliases;
}

/** Pure generation from the two upstream source texts. */
export function generateHugeicons({ sourceText, aliasSourceText }) {
  const transpiled = ts.transpileModule(sourceText, {
    fileName: "hugeicons.tsx",
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
      jsxFactory: "__hugeiconElement",
      // Type-only imports are erased; a runtime import would need a real module.
      verbatimModuleSyntax: false,
    },
  });
  if (/\brequire\(/.test(transpiled.outputText)) {
    throw new HugeiconsGenerationError(
      `${HUGEICONS_SOURCE} now imports a runtime value; teach ${SCRIPT_NAME} how to provide it`,
    );
  }
  const moduleExports = {};
  vm.runInNewContext(transpiled.outputText, {
    exports: moduleExports,
    __hugeiconElement: renderElement,
  });

  const aliases = readHugeiconAliases(aliasSourceText);
  const icons = {};
  for (const [exportName, component] of Object.entries(moduleExports)) {
    if (typeof component !== "function") {
      throw new HugeiconsGenerationError(
        `${HUGEICONS_SOURCE} exports \`${exportName}\`, which is not an icon component`,
      );
    }
    const markup = component({});
    if (typeof markup !== "string" || !/^<svg[\s/>]/.test(markup)) {
      throw new HugeiconsGenerationError(`\`${exportName}\` did not render an <svg>`);
    }
    // The app's names for the icon; an icon icons.tsx does not re-export keeps its own.
    for (const name of aliases.get(exportName) ?? [exportName]) {
      if (icons[name] !== undefined) {
        throw new HugeiconsGenerationError(`two Hugeicons are exported as \`${name}\``);
      }
      icons[name] = markup;
    }
  }
  for (const source of aliases.keys()) {
    if (!(source in moduleExports)) {
      throw new HugeiconsGenerationError(
        `${HUGEICONS_ALIAS_SOURCE} re-exports \`${source}\`, which ${HUGEICONS_SOURCE} does not export`,
      );
    }
  }
  const names = Object.keys(icons).toSorted();
  if (names.length === 0) {
    throw new HugeiconsGenerationError(`${HUGEICONS_SOURCE} exports no icons`);
  }
  const lines = names.map((name) => `  ${name}: ${JSON.stringify(icons[name])},`).join("\n");
  const text = `// GENERATED by apps/lynx/scripts/${SCRIPT_NAME} from
// ${HUGEICONS_SOURCE} (named as ${HUGEICONS_ALIAS_SOURCE} re-exports them).
// Do not edit: change the generator, then run \`node scripts/${SCRIPT_NAME}\` in apps/lynx.
// Paths are verbatim from @hugeicons/core-free-icons (MIT), as upstream inlines them.

/** SVG markup of upstream's Hugeicons, keyed by the name \`~/lib/icons\` exports. */
export const HUGEICON_SVG = {
${lines}
} as const;

export type HugeiconName = keyof typeof HUGEICON_SVG;
`;
  return { text, names };
}

/** Runs the generator against files on disk. Returns a process exit code. */
export function runHugeiconsGenerator({
  check = false,
  sourceFile = path.join(repoRoot, HUGEICONS_SOURCE),
  aliasSourceFile = path.join(repoRoot, HUGEICONS_ALIAS_SOURCE),
  outputFile = path.join(repoRoot, HUGEICONS_OUTPUT),
  log = console.log,
  logError = console.error,
} = {}) {
  let result;
  try {
    result = generateHugeicons({
      sourceText: fs.readFileSync(sourceFile, "utf8"),
      aliasSourceText: fs.readFileSync(aliasSourceFile, "utf8"),
    });
  } catch (error) {
    if (!(error instanceof HugeiconsGenerationError)) throw error;
    logError(`generate-hugeicons: ${error.message}`);
    return 1;
  }
  const relativeOutput = path.relative(repoRoot, outputFile).split(path.sep).join("/");
  if (check) {
    if (!generatedFileIsFresh(outputFile, result.text)) {
      logError(
        `generate-hugeicons: ${relativeOutput} is stale; run \`node scripts/${SCRIPT_NAME}\` in apps/lynx`,
      );
      return 1;
    }
    log(`generate-hugeicons: ${relativeOutput} is up to date (${result.names.length} icons)`);
    return 0;
  }
  writeGeneratedFile(outputFile, result.text);
  log(JSON.stringify({ output: relativeOutput, mode: "write", icons: result.names.length }));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runHugeiconsGenerator({ check: process.argv.includes("--check") }));
}
