import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import browserEnvironmentLoader, {
  BROWSER_ENVIRONMENT_GLOBALS,
  BROWSER_ENVIRONMENT_MODULE,
  createInsertionSourceMap,
  decodeMappings,
  injectBrowserEnvironment,
  planBrowserEnvironment,
  shiftSourceMap,
  transformBrowserEnvironment,
} from "./browser-environment-loader.mjs";

const ts = createRequire(import.meta.url)("typescript");

const ENV = "/env.ts";
const IMPORT = (names) => `import { ${names} } from "${ENV}";`;
const inject = (source, fileName = "/module.tsx") =>
  injectBrowserEnvironment(source, { modulePath: ENV, fileName });
const bound = (source, fileName = "/module.tsx") =>
  planBrowserEnvironment(source, { fileName }).bound;

function parse(source, fileName = "/module.tsx") {
  return ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true);
}

/** The directive prologue as the parser sees it. */
function directivesOf(source, fileName) {
  const directives = [];
  for (const statement of parse(source, fileName).statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break;
    directives.push(statement.expression.text);
  }
  return directives;
}

/** What Rstest's pre-loader hands this loader for an upstream `.ts` file. */
function stripTypes(source, fileName, sourceMap = false) {
  return ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      sourceMap,
    },
  });
}

/** Original position a generated position maps to: the last segment at or before it. */
function originalPositionOf(map, line, column) {
  const segments = decodeMappings(map.mappings)[line] ?? [];
  let found = null;
  for (const segment of segments) {
    if (segment[0] > column) break;
    found = segment;
  }
  if (!found || found.length === 1) return null;
  return { line: found[2], column: found[3] + (column - found[0]) };
}

function positionOf(text, needle) {
  const offset = text.indexOf(needle);
  assert.notEqual(offset, -1, `"${needle}" not found`);
  const before = text.slice(0, offset).split("\n");
  return { line: before.length - 1, column: before.at(-1).length };
}

// ── which names ──────────────────────────────────────────────────────

test("binds only the globals a file references, on the first line", () => {
  const source = 'import { a } from "./a";\nexport const w = window.innerWidth + a;\n';
  assert.equal(inject(source), `${IMPORT("window")}${source}`);
  assert.equal(inject(source).split("\n").length, source.split("\n").length);
});

test("covers typeof probes, called members, shorthand, JSX and several globals", () => {
  const source =
    'if (typeof window !== "undefined") window.setTimeout(() => document.title, 0);\n' +
    "export const p = navigator.platform + localStorage.getItem(k) + sessionStorage.length;\n" +
    "export const o = { location };\n" +
    "export const A = () => <a title={crypto.randomUUID()} />;\n";
  assert.deepEqual(bound(source), [...BROWSER_ENVIRONMENT_GLOBALS]);
});

test("ignores comments, strings, member names, property keys and re-exports", () => {
  for (const source of [
    "// window.open is not used\n/* document */\nexport const a = 1;\n",
    "export const b = a.window + a?.document + 'localStorage' + \"navigator\";\n",
    "export const c = { window: 1, document: 2 };\n",
    'export { window, document as location } from "./other";\n',
    "export const d = globalThis.window ?? self.navigator;\n",
    "label: for (;;) break label;\nexport const windowTitle = 1;\n",
  ]) {
    assert.equal(inject(source), source, source);
  }
});

test("ignores type positions, which type stripping removes", () => {
  for (const source of [
    "export type W = typeof window;\n",
    "export interface A { window: number; location: typeof location }\n",
    "export function f(target: typeof document): void {}\n",
    "interface B extends window.Base {}\nexport const b = 1 as unknown as B;\n",
    'import type { location } from "./types";\nexport type L = typeof location;\n',
  ]) {
    assert.equal(inject(source, "/module.ts"), source, source);
  }
});

test("binds a value used through a cast, a non-null assertion or a class heritage", () => {
  assert.deepEqual(bound("export const a = (window as unknown as { x: 1 }).x;"), ["window"]);
  assert.deepEqual(bound("export const a = navigator!.platform satisfies string;"), ["navigator"]);
  assert.deepEqual(bound("export class A extends window.Base {}"), ["window"]);
});

test("a nested declaration does not hide a module-level use of the global", () => {
  const source =
    "function f() { const window = {}; return window; }\nexport const x = window.localStorage;\n";
  assert.deepEqual(planBrowserEnvironment(source), { bound: ["window"], shadowed: ["window"] });
  assert.equal(inject(source), `${IMPORT("window")}${source}`);
});

test("a nested declaration alone needs no binding", () => {
  for (const source of [
    "export function f() { const location = useLocation(); return location.pathname; }\n",
    "export const f = (window) => window.id;\n",
    "export function g(document = 1) { return document; }\n",
    "try { run(); } catch (location) { report(location); }\n",
    "export function h() { var navigator; return navigator; }\n",
    'import crypto from "node:crypto";\nexport const id = crypto.randomUUID();\n',
  ]) {
    assert.equal(inject(source), source, source);
  }
});

test("a renamed property or import is not a declaration of the global's name", () => {
  assert.deepEqual(
    bound("const { window: other } = obj;\nexport const y = window.innerWidth + other;"),
    ["window"],
  );
  assert.deepEqual(
    bound(
      'import { window as other } from "./other";\nexport const y = window.innerWidth + other;',
    ),
    ["window"],
  );
});

test("a module-level declaration is never imported over", () => {
  for (const source of [
    "const x = 1, window = {};\nexport { window, x };\n",
    "const { location, history } = source;\nexport const p = location.href + history.length;\n",
    "export function document() {}\nexport const d = document();\n",
    "export enum navigator { A }\nexport const n = navigator.A;\n",
  ]) {
    assert.equal(inject(source, "/module.ts"), source, source);
  }
});

test("an ambient declaration names the global and is bound", () => {
  const source = "declare const window: { a: number };\nexport const a = window.a;\n";
  assert.deepEqual(bound(source, "/module.ts"), ["window"]);
  assert.deepEqual(bound(stripTypes(source, "/module.ts").outputText, "/module.ts"), ["window"]);
});

test("finds globals inside template expressions, however nested", () => {
  assert.deepEqual(bound("export const t = `x ${ ok ? {} : window.location }`;"), ["window"]);
  assert.deepEqual(bound("export const t = `a ${ `b ${ { k: document.title }.k }` }`;"), [
    "document",
  ]);
  assert.deepEqual(bound('export const t = `x ${"window"} ${`document`}`;'), []);
});

test("binds a global that only appears in a conditional branch", () => {
  assert.deepEqual(bound("export const w = ok ? window : undefined;"), ["window"]);
});

// ── where ────────────────────────────────────────────────────────────

test("keeps the directive prologue a prologue", () => {
  for (const [source, fileName] of [
    ['"use client";\nexport const x = window.a;\n', "/a.tsx"],
    ['"use client"\nexport const x = window.a;\n', "/a.tsx"],
    ["'background only';\n'use strict';\nexport const x = document.b;\n", "/a.ts"],
    ['// header\n\n"main thread"; export const x = navigator.c;\n', "/a.ts"],
  ]) {
    const output = inject(source, fileName);
    assert.notEqual(output, source);
    assert.deepEqual(directivesOf(output, fileName), directivesOf(source, fileName), source);
    assert.ok(directivesOf(output, fileName).length > 0);
    assert.equal(output.split("\n").length, source.split("\n").length);
    const afterDirectives = parse(output, fileName).statements[
      directivesOf(output, fileName).length
    ];
    assert.ok(ts.isImportDeclaration(afterDirectives), source);
  }
});

test("keeps a hashbang on the first line", () => {
  const source = '#!/usr/bin/env node\n"use strict";\nexport const x = window.a;\n';
  const output = inject(source, "/a.ts");
  assert.ok(output.startsWith('#!/usr/bin/env node\n"use strict";import { window }'));
  const plain = "#!/usr/bin/env node\nexport const x = window.a;\n";
  assert.equal(
    inject(plain, "/a.ts"),
    `#!/usr/bin/env node\n${IMPORT("window")}export const x = window.a;\n`,
  );
});

test("a function-body directive is left where it is", () => {
  const source = 'export function f() {\n  "background only";\n  return window.a;\n}\n';
  assert.equal(inject(source), `${IMPORT("window")}${source}`);
});

// ── source maps ──────────────────────────────────────────────────────

test("without an incoming map, positions resolve to upstream's text", () => {
  const source =
    '"use client";\nconst a = 1;\nexport function f() {\n  throw new Error(window.name);\n}\n';
  const { code, insertion } = transformBrowserEnvironment(source, { modulePath: ENV });
  const map = createInsertionSourceMap(source, "/a.tsx", insertion);
  assert.deepEqual(map.sourcesContent, [source]);
  for (const needle of ['"use client"', "const a", "throw new Error", "window.name"]) {
    const generated = positionOf(code, needle);
    assert.deepEqual(
      originalPositionOf(map, generated.line, generated.column),
      positionOf(source, needle),
    );
  }
  // The inserted import itself maps to nothing.
  const inserted = positionOf(code, "import { window }");
  assert.equal(originalPositionOf(map, inserted.line, inserted.column + 3), null);
});

test("without directives, the first line's columns still resolve", () => {
  const source = "export const a = window.name; export const b = document.title;\n";
  const { code, insertion } = transformBrowserEnvironment(source, { modulePath: ENV });
  const map = createInsertionSourceMap(source, "/a.ts", insertion);
  const generated = positionOf(code, "document.title");
  assert.deepEqual(
    originalPositionOf(map, 0, generated.column),
    positionOf(source, "document.title"),
  );
});

test("with an incoming map, a thrown statement still resolves to the original file", () => {
  // The Rstest order: types are stripped first, then this loader runs on the
  // output with the stripper's map.
  const original =
    "interface Options {\n  readonly name: string;\n}\n\n" +
    "export const first = (options: Options): string => window.name + options.name;\n" +
    "export function fail(options: Options): never {\n" +
    "  throw new Error(document.title + options.name);\n}\n";
  const stripped = stripTypes(original, "/a.ts", true);
  const strippedCode = stripped.outputText.replace(/\n\/\/# sourceMappingURL=.*\n?$/, "\n");
  const incoming = JSON.parse(stripped.sourceMapText);
  const { code, insertion } = transformBrowserEnvironment(strippedCode, { modulePath: ENV });
  assert.ok(insertion);
  const composed = shiftSourceMap(incoming, insertion);
  for (const needle of ["window.name", "throw new Error", "document.title"]) {
    const generated = positionOf(code, needle);
    const before = positionOf(strippedCode, needle);
    assert.deepEqual(
      originalPositionOf(composed, generated.line, generated.column),
      originalPositionOf(incoming, before.line, before.column),
      needle,
    );
    assert.equal(
      originalPositionOf(composed, generated.line, generated.column).line,
      positionOf(original, needle).line,
      needle,
    );
  }
});

test("the loader returns code and map through the callback", () => {
  const run = (source, context, inputMap) => {
    let result;
    browserEnvironmentLoader.call(
      {
        resourcePath: "/a.ts",
        sourceMap: false,
        ...context,
        callback: (...args) => (result = args),
      },
      source,
      inputMap,
      { meta: true },
    );
    return result;
  };
  const source = "export const a = window.name;\n";
  const untouched = run("export const a = 1;\n", {}, { version: 3, mappings: "AAAA" });
  assert.deepEqual(untouched, [
    null,
    "export const a = 1;\n",
    { version: 3, mappings: "AAAA" },
    { meta: true },
  ]);
  const [, codeWithoutMap, noMap, meta] = run(source, {});
  assert.ok(codeWithoutMap.startsWith("import { window }"));
  assert.equal(noMap, undefined);
  assert.deepEqual(meta, { meta: true });
  const [, , generatedMap] = run(source, { sourceMap: true });
  assert.deepEqual(generatedMap.sources, ["/a.ts"]);
  const incoming = { version: 3, sources: ["/a.ts"], names: [], mappings: "AAAA,MAAM" };
  const [, , composedObject] = run(source, {}, incoming);
  const [, , composedString] = run(source, {}, JSON.stringify(incoming));
  assert.deepEqual(composedObject, composedString);
  // An indexed map cannot be shifted; it is dropped, never passed on unchanged.
  const [, , indexed] = run(source, {}, { version: 3, sections: [] });
  assert.equal(indexed, undefined);
  assert.deepEqual(
    decodeMappings(composedObject.mappings)[0].map((segment) => segment[0]),
    [0, codeWithoutMap.length - source.length, codeWithoutMap.length - source.length + 6],
  );
});

// ── the environment module and the real corpus ───────────────────────

test("the environment module exports every name the loader binds", () => {
  const moduleSource = readFileSync(BROWSER_ENVIRONMENT_MODULE, "utf8");
  for (const name of BROWSER_ENVIRONMENT_GLOBALS) {
    assert.match(moduleSource, new RegExp(`^export const ${name}\\b`, "m"), name);
  }
  const declared = moduleSource
    .slice(moduleSource.indexOf("export const BROWSER_ENVIRONMENT_GLOBALS"))
    .match(/"([a-zA-Z]+)"/g)
    .map((entry) => entry.slice(1, -1));
  assert.deepEqual(declared, [...BROWSER_ENVIRONMENT_GLOBALS]);
});

const webSourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web/src");

/** Every upstream source file the rule could compile (tests and declarations excluded). */
function upstreamSourceFiles(directory = webSourceRoot) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "test" && entry.name !== "__tests__")
        files.push(...upstreamSourceFiles(absolute));
    } else if (/\.tsx?$/.test(entry.name) && !/\.(test|browser|d)\.tsx?$/.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

/**
 * Module-level declarations of `name` in `text`. With the import in place there
 * must be exactly one: the import specifier. (The checker's own "conflicts with
 * local declaration" diagnostic needs the imported module to resolve, so the
 * declarations are counted instead.)
 */
function moduleLevelDeclarations(fileName, text, name) {
  const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.ESNext, true);
  const program = ts.createProgram({
    rootNames: [fileName],
    options: { noLib: true, noResolve: true, noEmit: true, jsx: ts.JsxEmit.Preserve, types: [] },
    host: {
      getSourceFile: (candidate) => (candidate === fileName ? sourceFile : undefined),
      getDefaultLibFileName: () => "lib.d.ts",
      writeFile: () => {},
      getCurrentDirectory: () => path.dirname(fileName),
      getCanonicalFileName: (candidate) => candidate,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
      fileExists: (candidate) => candidate === fileName,
      readFile: (candidate) => (candidate === fileName ? text : undefined),
    },
  });
  const meanings = ts.SymbolFlags.Value | ts.SymbolFlags.Alias;
  return program
    .getTypeChecker()
    .getSymbolsInScope(sourceFile.endOfFileToken, meanings)
    .filter((symbol) => symbol.name === name)
    .flatMap((symbol) => symbol.declarations ?? [])
    .map((declaration) => ts.SyntaxKind[declaration.kind]);
}

test("the collision check sees a second module-level declaration", () => {
  const colliding = `${IMPORT("window")}const window = 1;\nexport { window };\n`;
  assert.equal(moduleLevelDeclarations("/a.ts", colliding, "window").length, 2);
  const hoisted = `${IMPORT("window")}if (ok) { var window = 1; }\n`;
  assert.equal(moduleLevelDeclarations("/a.ts", hoisted, "window").length, 2);
  const nested = `${IMPORT("window")}function f() { const window = 1; return window; }\n`;
  assert.deepEqual(moduleLevelDeclarations("/a.ts", nested, "window"), ["ImportSpecifier"]);
});

test("upstream corpus: every browser value reference is bound, nothing collides, directives survive", () => {
  const files = upstreamSourceFiles();
  let injected = 0;
  let withDirectives = 0;
  for (const fileName of files) {
    const source = readFileSync(fileName, "utf8");
    const relative = path.relative(webSourceRoot, fileName);
    const { code, plan } = transformBrowserEnvironment(source, { fileName });
    // Rstest strips upstream `.ts` (not `.tsx`) before the loader; both orders must agree.
    if (fileName.endsWith(".ts")) {
      const stripped = stripTypes(source, fileName).outputText;
      assert.deepEqual(planBrowserEnvironment(stripped, { fileName }).bound, plan.bound, relative);
    }
    if (plan.bound.length === 0) {
      assert.equal(code, source, relative);
      continue;
    }
    injected += 1;
    // After the import, no browser-global value reference is left unresolved…
    const after = planBrowserEnvironment(code, { fileName });
    assert.deepEqual(after.bound, [], relative);
    for (const name of plan.bound) assert.ok(after.shadowed.includes(name), `${relative}: ${name}`);
    // …the import collides with no binding of the file…
    for (const name of plan.bound) {
      assert.deepEqual(
        moduleLevelDeclarations(fileName, code, name),
        ["ImportSpecifier"],
        relative,
      );
    }
    // …the prologue is intact and no line moved.
    const directives = directivesOf(source, fileName);
    if (directives.length > 0) withDirectives += 1;
    assert.deepEqual(directivesOf(code, fileName), directives, relative);
    assert.equal(code.split("\n").length, source.split("\n").length, relative);
  }
  // Guards against the walk silently matching nothing.
  assert.ok(files.length > 500, `only ${files.length} upstream files found`);
  assert.ok(injected > 100, `only ${injected} files received a binding`);
  assert.ok(withDirectives > 0, "no injected upstream file starts with a directive");
});
