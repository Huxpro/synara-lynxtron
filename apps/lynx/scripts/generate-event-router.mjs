#!/usr/bin/env node

// Generates `src/generated/eventRouter.generated.tsx` from upstream's
// `apps/web/src/routes/__root.tsx` (plan/shared-state-architecture.md, Step 2).
//
// Upstream keeps its session-sync engine, `EventRouter`, inside the web route
// shell, which cannot compile for Lynx (DOM elements, router component layer).
// Upstream files are read-only, so instead of moving the function this script
// extracts it deterministically: `EventRouter` plus exactly the file-local
// declarations it closes over, verbatim, with only the import specifiers
// rewritten to the `~/…` form Lynx resolves. Scope resolution is done by the
// TypeScript checker, so nothing is matched by name or line number.
//
// Browser globals are the one thing the extracted code cannot take from an
// import: Lynx injects `window`, `document`, … into the background bundle with
// no value, so a member read throws. The generator therefore checks every use
// of such a global. Members listed in `EVENT_ROUTER_GLOBAL_PORTS` are served by
// a Lynx module bound to the same name in the generated file (the body stays
// verbatim); any other use stops the generator.
//
//   node scripts/generate-event-router.mjs          # rewrite the generated file
//   node scripts/generate-event-router.mjs --check  # exit 1 when it drifted
//
// The script fails (and writes nothing) when upstream's shape changes in a way
// it does not understand: a root that is missing, an identifier that resolves
// to nothing, an import form it cannot re-emit (attributes), a side-effect
// import that is not listed as ignorable, module-level code outside the
// extraction that uses or assigns a binding inside it, or a browser global
// (or a member of one) that no Lynx port provides.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

import { generatedFileIsFresh, writeGeneratedFile } from "./format-generated.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const lynxRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(lynxRoot, "../..");

export const EVENT_ROUTER_SOURCE = "apps/web/src/routes/__root.tsx";
export const EVENT_ROUTER_OUTPUT = "apps/lynx/src/generated/eventRouter.generated.tsx";
export const EVENT_ROUTER_ROOTS = Object.freeze(["EventRouter"]);
/**
 * Bare `import "…"` specifiers in the upstream file that are known not to
 * matter to the extracted code (for example a stylesheet for the route shell).
 * Empty today; any other side-effect import stops the generator.
 */
export const EVENT_ROUTER_IGNORED_SIDE_EFFECT_IMPORTS = Object.freeze([]);
/**
 * Browser globals that have no value on the Lynx background thread. The
 * extracted code may not reference them, except through a port below.
 */
export const EVENT_ROUTER_BROWSER_GLOBALS = Object.freeze([
  "window",
  "document",
  "navigator",
  "location",
  "localStorage",
  "sessionStorage",
]);
/**
 * Global → the Lynx module (relative to the generated file) whose `exportName`
 * is bound to the global's name, and the only members the extracted code may
 * use on it. Adding a member means adding it to that module too.
 */
export const EVENT_ROUTER_GLOBAL_PORTS = Object.freeze({
  window: Object.freeze({
    module: "../platform/windowTimers",
    exportName: "lynxWindowTimers",
    members: Object.freeze(["setTimeout", "clearTimeout", "setInterval", "clearInterval"]),
  }),
});
const WEB_SOURCE_ROOT = "apps/web/src";

export class EventRouterGenerationError extends Error {
  constructor(message) {
    super(`generate-event-router: ${message}`);
    this.name = "EventRouterGenerationError";
  }
}

function fail(message) {
  throw new EventRouterGenerationError(message);
}

/** Identifier positions that name a member or label instead of referencing a binding. */
function isReferencePosition(node) {
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent)) return parent.name !== node;
  if (ts.isQualifiedName(parent)) return parent.right !== node;
  if (ts.isPropertyAssignment(parent)) return parent.name !== node;
  if (ts.isBindingElement(parent)) return parent.propertyName !== node;
  if (
    ts.isPropertySignature(parent) ||
    ts.isPropertyDeclaration(parent) ||
    ts.isMethodDeclaration(parent) ||
    ts.isMethodSignature(parent) ||
    ts.isGetAccessorDeclaration(parent) ||
    ts.isSetAccessorDeclaration(parent) ||
    ts.isEnumMember(parent) ||
    ts.isNamedTupleMember(parent)
  ) {
    return parent.name !== node;
  }
  if (ts.isJsxAttribute(parent)) return parent.name !== node;
  if (
    ts.isLabeledStatement(parent) ||
    ts.isBreakStatement(parent) ||
    ts.isContinueStatement(parent)
  ) {
    return false;
  }
  if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) return false;
  if (ts.isMetaProperty(parent)) return false;
  return true;
}

function topLevelStatementOf(node, sourceFile) {
  let current = node;
  while (current.parent && current.parent !== sourceFile) current = current.parent;
  return current.parent === sourceFile ? current : null;
}

function lineOf(node, sourceFile) {
  return ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile)).line + 1;
}

function createProgramForSource(sourceFileName, sourceText) {
  const options = {
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.Preserve,
    lib: ["lib.es2023.d.ts", "lib.dom.d.ts"],
    types: [],
    noResolve: true,
    noEmit: true,
    skipLibCheck: true,
  };
  const host = ts.createCompilerHost(options, true);
  const readDefault = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, ...rest) =>
    fileName === sourceFileName
      ? ts.createSourceFile(fileName, sourceText, languageVersion, true, ts.ScriptKind.TSX)
      : readDefault(fileName, languageVersion, ...rest);
  const fileExistsDefault = host.fileExists.bind(host);
  host.fileExists = (fileName) => fileName === sourceFileName || fileExistsDefault(fileName);
  const readFileDefault = host.readFile.bind(host);
  host.readFile = (fileName) =>
    fileName === sourceFileName ? sourceText : readFileDefault(fileName);
  const program = ts.createProgram({ rootNames: [sourceFileName], options, host });
  return { program, sourceFile: program.getSourceFile(sourceFileName) };
}

/** The local binding names a top-level statement introduces. */
function declaredNames(statement) {
  if (ts.isVariableStatement(statement)) {
    const names = [];
    const collect = (name) => {
      if (ts.isIdentifier(name)) names.push(name.text);
      else
        for (const element of name.elements)
          if (!ts.isOmittedExpression(element)) collect(element.name);
    };
    for (const declaration of statement.declarationList.declarations) collect(declaration.name);
    return names;
  }
  if (
    (ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement)) &&
    statement.name
  ) {
    return [statement.name.text];
  }
  return [];
}

function rewriteSpecifier(specifier, sourcePath) {
  if (!specifier.startsWith(".")) return specifier;
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), specifier));
  if (!resolved.startsWith(`${WEB_SOURCE_ROOT}/`)) {
    fail(`relative import "${specifier}" leaves ${WEB_SOURCE_ROOT} and cannot be rewritten`);
  }
  return `~/${resolved.slice(WEB_SOURCE_ROOT.length + 1)}`;
}

/**
 * Pure extraction. `sourcePath` is the repo-relative POSIX path of the
 * upstream file (it anchors relative import rewriting and the header).
 */
export function extractEventRouter({
  sourceText,
  sourcePath = EVENT_ROUTER_SOURCE,
  roots = EVENT_ROUTER_ROOTS,
  allowedSideEffectImports = EVENT_ROUTER_IGNORED_SIDE_EFFECT_IMPORTS,
  browserGlobals = EVENT_ROUTER_BROWSER_GLOBALS,
  globalPorts = EVENT_ROUTER_GLOBAL_PORTS,
}) {
  const sourceFileName = path.posix.join("/", sourcePath);
  const { program, sourceFile } = createProgramForSource(sourceFileName, sourceText);
  const checker = program.getTypeChecker();

  const statementByName = new Map();
  for (const statement of sourceFile.statements) {
    for (const name of declaredNames(statement)) statementByName.set(name, statement);
  }

  const included = new Set();
  /** ImportDeclaration → Set of binding nodes (ImportClause | NamespaceImport | ImportSpecifier). */
  const usedImportBindings = new Map();
  const queue = [];
  for (const root of roots) {
    const statement = statementByName.get(root);
    if (!statement || !ts.isFunctionDeclaration(statement)) {
      fail(`function ${root} was not found at the top level of ${sourcePath}`);
    }
    queue.push(statement);
  }

  const unresolved = [];
  /** Global name → true, for every ported browser global the extraction uses. */
  const usedGlobalPorts = new Set();
  const unportedGlobalUses = [];
  // A browser global is an identifier the checker resolves outside this file
  // (the DOM lib); a local binding of the same name is an ordinary reference.
  const noteBrowserGlobalUse = (node, symbol) => {
    if (!browserGlobals.includes(node.text)) return;
    if ((symbol.declarations ?? []).some((d) => d.getSourceFile() === sourceFile)) return;
    const parent = node.parent;
    // `typeof window` reads no member and is safe on Lynx.
    if (ts.isTypeOfExpression(parent)) return;
    const member =
      ts.isPropertyAccessExpression(parent) && parent.expression === node ? parent.name.text : null;
    const port = globalPorts[node.text];
    if (port && member !== null && port.members.includes(member)) {
      usedGlobalPorts.add(node.text);
      return;
    }
    unportedGlobalUses.push(
      `${member === null ? node.text : `${node.text}.${member}`} (${sourcePath}:${lineOf(node, sourceFile)})`,
    );
  };
  while (queue.length > 0) {
    const statement = queue.pop();
    if (included.has(statement)) continue;
    included.add(statement);
    const visit = (node) => {
      if (ts.isIdentifier(node) && isReferencePosition(node)) {
        const symbol = ts.isShorthandPropertyAssignment(node.parent)
          ? checker.getShorthandAssignmentValueSymbol(node.parent)
          : checker.getSymbolAtLocation(node);
        if (!symbol) {
          unresolved.push(`${node.text} (${sourcePath}:${lineOf(node, sourceFile)})`);
        } else {
          noteBrowserGlobalUse(node, symbol);
          for (const declaration of symbol.declarations ?? []) {
            if (declaration.getSourceFile() !== sourceFile) continue; // lib global
            const owner = topLevelStatementOf(declaration, sourceFile);
            if (!owner) continue;
            if (ts.isImportDeclaration(owner)) {
              const bindings = usedImportBindings.get(owner) ?? new Set();
              bindings.add(declaration);
              usedImportBindings.set(owner, bindings);
            } else if (ts.isImportEqualsDeclaration(owner) || ts.isExportDeclaration(owner)) {
              fail(
                `${node.text} is bound by an unsupported statement at ${sourcePath}:${lineOf(owner, sourceFile)}`,
              );
            } else if (owner !== statement) {
              queue.push(owner);
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(statement);
  }
  if (unresolved.length > 0) {
    fail(`closed-over identifiers that resolve to nothing: ${[...new Set(unresolved)].join(", ")}`);
  }
  if (unportedGlobalUses.length > 0) {
    fail(
      `browser globals with no value on Lynx: ${[...new Set(unportedGlobalUses)].join(", ")}; ` +
        `provide the member through a Lynx module and list it in EVENT_ROUTER_GLOBAL_PORTS`,
    );
  }

  // Module initialization the extraction would silently drop. Symbol traversal
  // keeps declarations, so anything else that runs at module load and can change
  // what the extracted code sees has to stop the generator instead.
  const symbolOwner = (node) => {
    const symbol = ts.isShorthandPropertyAssignment(node.parent)
      ? checker.getShorthandAssignmentValueSymbol(node.parent)
      : checker.getSymbolAtLocation(node);
    for (const declaration of symbol?.declarations ?? []) {
      if (declaration.getSourceFile() !== sourceFile) continue;
      const owner = topLevelStatementOf(declaration, sourceFile);
      if (owner && included.has(owner)) return owner;
    }
    return null;
  };
  const isWriteTarget = (node) => {
    let target = node;
    while (
      ts.isParenthesizedExpression(target.parent) ||
      ts.isNonNullExpression(target.parent) ||
      ts.isAsExpression(target.parent)
    ) {
      target = target.parent;
    }
    const parent = target.parent;
    if (ts.isBinaryExpression(parent)) {
      return (
        parent.left === target &&
        parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment
      );
    }
    if (ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent)) {
      return (
        parent.operator === ts.SyntaxKind.PlusPlusToken ||
        parent.operator === ts.SyntaxKind.MinusMinusToken
      );
    }
    return false;
  };
  const isDeclarationStatement = (statement) =>
    ts.isVariableStatement(statement) ||
    ts.isFunctionDeclaration(statement) ||
    ts.isClassDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isEnumDeclaration(statement) ||
    ts.isModuleDeclaration(statement);
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const specifier = statement.moduleSpecifier.text;
      if (!statement.importClause && !allowedSideEffectImports.includes(specifier)) {
        fail(
          `side-effect import "${specifier}" at ${sourcePath}:${lineOf(statement, sourceFile)} would be dropped; ` +
            `decide whether Lynx needs it, then list it in EVENT_ROUTER_IGNORED_SIDE_EFFECT_IMPORTS`,
        );
      }
      if (usedImportBindings.has(statement) && (statement.attributes ?? statement.assertClause)) {
        fail(
          `import of "${specifier}" at ${sourcePath}:${lineOf(statement, sourceFile)} has import attributes, which are not re-emitted`,
        );
      }
      continue;
    }
    if (included.has(statement)) continue;
    const executable = !isDeclarationStatement(statement) && !ts.isExportDeclaration(statement);
    const inspect = (node) => {
      if (ts.isIdentifier(node) && isReferencePosition(node)) {
        const owner = symbolOwner(node);
        if (owner && (executable || isWriteTarget(node))) {
          fail(
            `top-level statement at ${sourcePath}:${lineOf(statement, sourceFile)} ` +
              `${executable ? "uses" : "assigns to"} extracted binding ${node.text} and would be dropped`,
          );
        }
      }
      ts.forEachChild(node, inspect);
    };
    inspect(statement);
  }

  const importLines = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const bindings = usedImportBindings.get(statement);
    if (!bindings) continue;
    const clause = statement.importClause;
    const specifier = rewriteSpecifier(statement.moduleSpecifier.text, sourcePath);
    const parts = [];
    if (clause.name && bindings.has(clause)) parts.push(clause.name.text);
    if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
      if (bindings.has(clause.namedBindings)) {
        parts.push(`* as ${clause.namedBindings.name.text}`);
      }
    } else if (clause.namedBindings) {
      const elements = clause.namedBindings.elements
        .filter((element) => bindings.has(element))
        .map((element) => element.getText(sourceFile));
      if (elements.length > 0) parts.push(`{ ${elements.join(", ")} }`);
    }
    if (parts.length === 0) {
      fail(`could not re-emit the import of "${statement.moduleSpecifier.text}"`);
    }
    importLines.push(
      `import ${clause.isTypeOnly ? "type " : ""}${parts.join(", ")} from ${JSON.stringify(specifier)};`,
    );
  }

  // Bound after upstream's imports, under the global's own name, so the body
  // below stays verbatim and resolves the name to the Lynx module.
  const portLines = Object.keys(globalPorts)
    .filter((name) => usedGlobalPorts.has(name))
    .map((name) => {
      const port = globalPorts[name];
      const binding = port.exportName === name ? name : `${port.exportName} as ${name}`;
      return `import { ${binding} } from ${JSON.stringify(port.module)};`;
    });

  const declarations = sourceFile.statements
    .filter((statement) => included.has(statement))
    .map((statement) => ({
      names: declaredNames(statement),
      line: lineOf(statement, sourceFile),
      endLine: ts.getLineAndCharacterOfPosition(sourceFile, statement.getEnd()).line + 1,
      text: statement.getFullText(sourceFile).trim(),
    }));
  // Upstream may export a declaration (for its own tests); it is carried over
  // verbatim. Only roots that are not exported yet get the trailing export.
  const isExported = (statement) =>
    ts.canHaveModifiers(statement) &&
    (ts.getModifiers(statement) ?? []).some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
  const rootsToExport = roots.filter((root) => !isExported(statementByName.get(root)));

  const text = [
    `// GENERATED by apps/lynx/scripts/generate-event-router.mjs from`,
    `// ${sourcePath}. Do not hand-edit: change upstream, or the`,
    `// generator, then run \`node scripts/generate-event-router.mjs\` in apps/lynx.`,
    `// Contents: ${roots.join(", ")} and the file-local declarations it closes over,`,
    `// verbatim; only import specifiers are rewritten.`,
    ...(portLines.length > 0
      ? [
          `// Browser globals Lynx has no value for are bound to Lynx modules below`,
          `// (EVENT_ROUTER_GLOBAL_PORTS): ${Object.keys(globalPorts)
            .filter((name) => usedGlobalPorts.has(name))
            .join(", ")}.`,
        ]
      : []),
    "",
    ...importLines,
    ...portLines,
    "",
    declarations.map((declaration) => declaration.text).join("\n\n"),
    "",
    ...(rootsToExport.length > 0 ? [`export { ${rootsToExport.join(", ")} };`, ""] : []),
  ].join("\n");

  return {
    text,
    declarations: declarations.map(({ names, line, endLine }) => ({ names, line, endLine })),
    imports: importLines,
    globalPorts: portLines,
  };
}

/** Runs the generator against files on disk. Returns a process exit code. */
export function runEventRouterGenerator({
  check = false,
  sourceFile = path.join(repoRoot, EVENT_ROUTER_SOURCE),
  outputFile = path.join(repoRoot, EVENT_ROUTER_OUTPUT),
  log = console.log,
  logError = console.error,
} = {}) {
  let result;
  try {
    result = extractEventRouter({ sourceText: fs.readFileSync(sourceFile, "utf8") });
  } catch (error) {
    if (!(error instanceof EventRouterGenerationError)) throw error;
    logError(error.message);
    return 1;
  }
  const relativeOutput = path.relative(repoRoot, outputFile).split(path.sep).join("/");
  if (check) {
    if (!generatedFileIsFresh(outputFile, result.text)) {
      logError(
        `generate-event-router: ${relativeOutput} is stale; run \`node scripts/generate-event-router.mjs\` in apps/lynx`,
      );
      return 1;
    }
    log(
      `generate-event-router: ${relativeOutput} is up to date (${result.declarations.length} declarations)`,
    );
    return 0;
  }
  writeGeneratedFile(outputFile, result.text);
  log(
    JSON.stringify(
      {
        output: relativeOutput,
        mode: "write",
        declarations: result.declarations.map(
          ({ names, line, endLine }) => `${names.join(",")}:${line}-${endLine}`,
        ),
        imports: result.imports.length,
      },
      null,
      2,
    ),
  );
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runEventRouterGenerator({ check: process.argv.includes("--check") }));
}
