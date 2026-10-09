// Binds the browser globals an upstream `apps/web/src` file uses to the Lynx
// browser environment (`src/platform/browserEnvironment.lynx.ts`), so the file
// is compiled exactly as upstream wrote it. Lynx passes `window`, `document`,
// `navigator`, … into every bundle as wrapper parameters with no value; a real
// module binding of the same name shadows that parameter for the whole file,
// including `typeof window` probes and calls such as `window.setTimeout(...)`
// (which a DefinePlugin member replacement cannot rewrite).
//
// A loader and not ProvidePlugin, because ProvidePlugin applies to every module
// in the bundle: npm packages and Lynx-owned code must keep seeing the real
// runtime. The rule that mounts this loader limits it to `apps/web/src`.
//
// Which names: the file is parsed and bound with the TypeScript compiler, and a
// name is imported only when the module has a value reference to it that
// resolves to no binding of its own. A property name, a type position, a
// string, a comment, a re-export from another module or an identifier a nested
// scope declares is not such a reference. The decision reads no types, so it is
// the same for raw TS/TSX (the bundle) and for type-stripped output (Rstest
// strips upstream `.ts` before this loader runs).
//
// Where: after the directive prologue (`"use client"`, `'background only'`) and
// after a hashbang, on the same line as what precedes it. No line is added, so
// line numbers do not move; columns on that one line do, after the insertion.
//
// Source maps: when the build asks for them the loader returns one. With an
// incoming map (a loader ran before this one) its columns on the insertion line
// are shifted; without one, a map from the injected text to the upstream file
// is generated. Either way positions resolve to upstream's own text. Not
// verified against a live stack trace on PrimJS.
//
// SYNARA_BROWSER_ENV_TRACE=<file>: append one line per compiled file
// (`<names>\t<resource>`; `-` for none, `!name` for a browser-global name the
// file binds itself), to list which upstream files run on the environment.

import { appendFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isReferencePosition } from "./ts-identifier-position.mjs";

const ts = createRequire(import.meta.url)("typescript");

export const BROWSER_ENVIRONMENT_GLOBALS = Object.freeze([
  "window",
  "document",
  "navigator",
  "location",
  "localStorage",
  "sessionStorage",
  "crypto",
]);

export const BROWSER_ENVIRONMENT_MODULE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/platform/browserEnvironment.lynx.ts",
);

// No lib and no module resolution: the program holds this one file, so every
// name that resolves, resolves inside the file.
const COMPILER_OPTIONS = Object.freeze({
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  jsx: ts.JsxEmit.Preserve,
  allowJs: true,
  noLib: true,
  noResolve: true,
  noEmit: true,
  types: [],
});

function scriptKindOf(fileName) {
  if (fileName.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (/\.[cm]?jsx?$/.test(fileName)) return ts.ScriptKind.JSX;
  return ts.ScriptKind.TS;
}

function createSingleFileProgram(fileName, text) {
  const sourceFile = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.ESNext,
    true,
    scriptKindOf(fileName),
  );
  const host = {
    getSourceFile: (name) => (name === fileName ? sourceFile : undefined),
    getDefaultLibFileName: () => "lib.d.ts",
    writeFile: () => {},
    getCurrentDirectory: () => path.dirname(fileName),
    getCanonicalFileName: (name) => name,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    fileExists: (name) => name === fileName,
    readFile: (name) => (name === fileName ? text : undefined),
    directoryExists: () => true,
    getDirectories: () => [],
  };
  const program = ts.createProgram({ rootNames: [fileName], options: COMPILER_OPTIONS, host });
  return { program, sourceFile };
}

function isIntrinsicJsxTagName(node) {
  const parent = node.parent;
  return (
    (ts.isJsxOpeningElement(parent) ||
      ts.isJsxSelfClosingElement(parent) ||
      ts.isJsxClosingElement(parent)) &&
    parent.tagName === node &&
    /^[a-z]/.test(node.text)
  );
}

function isClassExtendsExpression(node) {
  const clause = node.parent;
  return (
    ts.isExpressionWithTypeArguments(node) &&
    ts.isHeritageClause(clause) &&
    clause.token === ts.SyntaxKind.ExtendsKeyword &&
    ts.isClassLike(clause.parent)
  );
}

function hasDeclareModifier(node) {
  return (
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword) ===
      true
  );
}

/** Inside syntax that type stripping removes (`typeof window` in a type, an interface, `declare`). */
function isErasedPosition(node) {
  for (let current = node.parent; current; current = current.parent) {
    // `class A extends window.Base` is the one type-node kind that is evaluated.
    if (ts.isTypeNode(current) && !isClassExtendsExpression(current)) return true;
    if (ts.isInterfaceDeclaration(current) || ts.isTypeAliasDeclaration(current)) return true;
    if (hasDeclareModifier(current)) return true;
  }
  return false;
}

/** `declare const window: …` names the global; it creates no binding at runtime. */
function isAmbientDeclaration(declaration) {
  return hasDeclareModifier(declaration) || isErasedPosition(declaration);
}

/** An identifier the emitted JavaScript evaluates: not a name, not a type. */
function isValueReference(node) {
  return isReferencePosition(node) && !isIntrinsicJsxTagName(node) && !isErasedPosition(node);
}

function resolvesInFile(checker, node) {
  const parent = node.parent;
  // `{ window }`: the identifier is both the property name and the value read.
  const symbol =
    ts.isShorthandPropertyAssignment(parent) && parent.name === node
      ? checker.getShorthandAssignmentValueSymbol(parent)
      : checker.getSymbolAtLocation(node);
  if (symbol === undefined) return false;
  const declarations = symbol.declarations ?? [];
  return declarations.length === 0 || !declarations.every(isAmbientDeclaration);
}

const NO_PLAN = Object.freeze({ bound: Object.freeze([]), shadowed: Object.freeze([]) });

function analyze(source, fileName, globals) {
  // Cheap gate: most files mention none of the names and are never parsed.
  const candidates = globals.filter((name) => source.includes(name));
  if (candidates.length === 0) return { plan: NO_PLAN, sourceFile: null };
  const wanted = new Set(candidates);
  const { program, sourceFile } = createSingleFileProgram(fileName, source);
  const checker = program.getTypeChecker();
  const unresolved = new Set();
  const shadowed = new Set();
  const visit = (node) => {
    if (ts.isIdentifier(node) && wanted.has(node.text) && isValueReference(node)) {
      (resolvesInFile(checker, node) ? shadowed : unresolved).add(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  const inOrder = (names) => globals.filter((name) => names.has(name));
  return { plan: { bound: inOrder(unresolved), shadowed: inOrder(shadowed) }, sourceFile };
}

/**
 * `bound`: the globals to import (a value reference no binding in the file
 * resolves). `shadowed`: globals' names the file binds itself somewhere; shown
 * in the trace, never imported for those references.
 */
export function planBrowserEnvironment(source, options = {}) {
  return analyze(
    source,
    options.fileName ?? "/module.tsx",
    options.globals ?? BROWSER_ENVIRONMENT_GLOBALS,
  ).plan;
}

/** Offset after a hashbang line and the directive prologue, and what must precede the import. */
function insertionPoint(sourceFile, source) {
  let lastDirective = null;
  for (const statement of sourceFile.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break;
    lastDirective = statement;
  }
  if (lastDirective) {
    return { offset: lastDirective.end, prefix: source[lastDirective.end - 1] === ";" ? "" : ";" };
  }
  const shebang = ts.getShebang(source);
  if (shebang === undefined) return { offset: 0, prefix: "" };
  const lineBreak = /^\r?\n/.exec(source.slice(shebang.length));
  return lineBreak
    ? { offset: shebang.length + lineBreak[0].length, prefix: "" }
    : { offset: shebang.length, prefix: "\n" };
}

/**
 * Returns the code with the import inserted, and where (`insertion` is null
 * when nothing was inserted): `line`/`column` are 0-based positions in
 * `source`, `length` the number of characters inserted there.
 */
export function transformBrowserEnvironment(source, options = {}) {
  const modulePath = options.modulePath ?? BROWSER_ENVIRONMENT_MODULE;
  const { plan, sourceFile } = analyze(
    source,
    options.fileName ?? "/module.tsx",
    options.globals ?? BROWSER_ENVIRONMENT_GLOBALS,
  );
  if (plan.bound.length === 0) return { code: source, plan, insertion: null };
  const specifier = JSON.stringify(modulePath.split(path.sep).join("/"));
  const { offset, prefix } = insertionPoint(sourceFile, source);
  const text = `${prefix}import { ${plan.bound.join(", ")} } from ${specifier};`;
  const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, offset);
  return {
    code: source.slice(0, offset) + text + source.slice(offset),
    plan,
    insertion: { offset, line, column: character, length: text.length },
  };
}

export function injectBrowserEnvironment(source, options = {}) {
  return transformBrowserEnvironment(source, options).code;
}

// ── source maps ──────────────────────────────────────────────────────

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function encodeVlq(value) {
  let rest = value < 0 ? (-value << 1) | 1 : value << 1;
  let encoded = "";
  do {
    const digit = rest & 31;
    rest >>>= 5;
    encoded += BASE64[rest > 0 ? digit | 32 : digit];
  } while (rest > 0);
  return encoded;
}

function decodeVlqSegment(segment) {
  const values = [];
  let value = 0;
  let shift = 0;
  for (const character of segment) {
    const digit = BASE64.indexOf(character);
    if (digit < 0) {
      throw new Error(`browser-environment-loader: invalid source map segment "${segment}"`);
    }
    value |= (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
      continue;
    }
    values.push(value & 1 ? -(value >>> 1) : value >>> 1);
    value = 0;
    shift = 0;
  }
  return values;
}

/**
 * Decodes `mappings` into lines of segments with absolute fields:
 * `[generatedColumn]` or `[generatedColumn, source, sourceLine, sourceColumn, name?]`.
 */
export function decodeMappings(mappings) {
  const absolute = [0, 0, 0, 0];
  return mappings.split(";").map((line) => {
    let generatedColumn = 0;
    return line
      .split(",")
      .filter(Boolean)
      .map((segment) => {
        const fields = decodeVlqSegment(segment);
        generatedColumn += fields[0];
        const decoded = [generatedColumn];
        for (let index = 1; index < fields.length; index += 1) {
          absolute[index - 1] += fields[index];
          decoded.push(absolute[index - 1]);
        }
        return decoded;
      });
  });
}

export function encodeMappings(lines) {
  const previous = [0, 0, 0, 0];
  return lines
    .map((segments) => {
      let previousColumn = 0;
      return segments
        .map((segment) => {
          let encoded = encodeVlq(segment[0] - previousColumn);
          previousColumn = segment[0];
          for (let index = 1; index < segment.length; index += 1) {
            encoded += encodeVlq(segment[index] - previous[index - 1]);
            previous[index - 1] = segment[index];
          }
          return encoded;
        })
        .join(",");
    })
    .join(";");
}

/** Start of every word and every punctuation character: one mapping each. */
const MAPPED_TOKEN = /[\w$]+|[^\s\w$]/g;

function byGeneratedColumn(left, right) {
  return left[0] - right[0];
}

/** A map from the injected code to `source` as it is on disk (no earlier loader). */
export function createInsertionSourceMap(source, resourcePath, insertion) {
  const lines = source.split("\n").map((text, line) => {
    const onInsertionLine = line === insertion.line;
    const segments = [];
    for (const match of text.matchAll(MAPPED_TOKEN)) {
      const moved = onInsertionLine && match.index >= insertion.column;
      segments.push([match.index + (moved ? insertion.length : 0), 0, line, match.index]);
    }
    // The inserted import maps to nothing in upstream's file.
    if (onInsertionLine) segments.push([insertion.column]);
    return segments.toSorted(byGeneratedColumn);
  });
  return {
    version: 3,
    sources: [resourcePath],
    sourcesContent: [source],
    names: [],
    mappings: encodeMappings(lines),
  };
}

/** The incoming map with the insertion applied to its generated columns. */
export function shiftSourceMap(map, insertion) {
  const lines = decodeMappings(map.mappings);
  while (lines.length <= insertion.line) lines.push([]);
  const segments = lines[insertion.line].map((segment) =>
    segment[0] >= insertion.column ? [segment[0] + insertion.length, ...segment.slice(1)] : segment,
  );
  segments.push([insertion.column]);
  lines[insertion.line] = segments.toSorted(byGeneratedColumn);
  return { ...map, mappings: encodeMappings(lines) };
}

/** Rspack loader entry; `this` is the loader context. */
function browserEnvironmentLoader(source, inputMap, meta) {
  const { code, plan, insertion } = transformBrowserEnvironment(source, {
    fileName: this.resourcePath,
  });
  const tracePath = process.env.SYNARA_BROWSER_ENV_TRACE;
  if (tracePath) {
    const names = [...plan.bound, ...plan.shadowed.map((name) => `!${name}`)].join(",") || "-";
    appendFileSync(tracePath, `${names}\t${this.resourcePath}\n`);
  }
  if (!insertion) {
    this.callback(null, source, inputMap, meta);
    return;
  }
  let map;
  if (inputMap) {
    const incoming = typeof inputMap === "string" ? JSON.parse(inputMap) : inputMap;
    // An indexed map (`sections`) has no top-level mappings to shift; passing it
    // on unchanged would be wrong on the insertion line, so it is dropped.
    map = typeof incoming.mappings === "string" ? shiftSourceMap(incoming, insertion) : undefined;
  } else if (this.sourceMap) {
    map = createInsertionSourceMap(source, this.resourcePath, insertion);
  }
  this.callback(null, code, map, meta);
}

export default browserEnvironmentLoader;
