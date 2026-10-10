#!/usr/bin/env node
// FILE: apps/lynx/scripts/upstream-parallel-copies.mjs
// Purpose: drift guard for logic the fork keeps a second copy of.
//
// The fork used to move declarations out of upstream files into fork modules
// (`*.logic.ts`, `@synara/shared/*`) and make the upstream file import them, so
// Web and Lynx shared one copy. Those upstream files are byte-identical to
// upstream again, which leaves the fork module as a parallel copy that only
// Lynx reads. A parallel copy drifts silently when upstream changes its own.
//
// `plan/upstream-parallel-copies.json` records, per upstream file, the
// top-level declarations that have a fork copy and a hash of their upstream
// text. `--check` recomputes the hash and fails when upstream changed, renamed
// or removed one of them: re-sync the fork copy (or better, replace it with a
// generated extract or a direct import and drop the entry), then `--update`.
//
// Logic that upstream keeps inline in a component has no top-level name to
// hash. An entry lists such statements under `fragments`: each must still be
// in the upstream file, compared with whitespace removed. A fragment that is
// gone is drift; `--update` does not record fragments, they are edited by hand
// together with the fork copy.
//
//   node scripts/upstream-parallel-copies.mjs --check
//   node scripts/upstream-parallel-copies.mjs --update

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { writeGeneratedFile } from "./format-generated.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
export const PARALLEL_COPIES_MANIFEST = "apps/lynx/plan/upstream-parallel-copies.json";

const ts = createRequire(import.meta.url)("typescript");

export class ParallelCopyError extends Error {}

/** Text of each named top-level declaration, in the order the names are given. */
export function declarationTexts(sourceText, fileName, symbols) {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const byName = new Map();
  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement)
    ) {
      if (statement.name) byName.set(statement.name.text, statement.getText(sourceFile));
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          byName.set(declaration.name.text, statement.getText(sourceFile));
        }
      }
    }
  }
  return symbols.map((symbol) => {
    const text = byName.get(symbol);
    if (text === undefined) {
      throw new ParallelCopyError(
        `${fileName}: top-level declaration ${symbol} is gone (renamed, removed or no longer top-level)`,
      );
    }
    return text;
  });
}

export function hashDeclarations(sourceText, fileName, symbols) {
  const hash = createHash("sha256");
  for (const text of declarationTexts(sourceText, fileName, symbols)) hash.update(`${text}\n`);
  return hash.digest("hex");
}

const withoutWhitespace = (text) => text.replace(/\s+/g, "");

/** The entry's `fragments` that the upstream file no longer contains. */
export function missingFragments(sourceText, fragments = []) {
  const source = withoutWhitespace(sourceText);
  return fragments.filter((fragment) => !source.includes(withoutWhitespace(fragment)));
}

/** Problems for one manifest entry; empty when upstream still matches. */
export function checkEntry(entry, sourceText) {
  const copies = entry.copies.join(", ") || "the fork copy";
  const fragmentProblems = missingFragments(sourceText, entry.fragments).map(
    (fragment) => `${entry.upstream}: upstream no longer has \`${fragment}\`; re-sync ${copies}`,
  );
  try {
    const actual = hashDeclarations(sourceText, entry.upstream, entry.symbols);
    if (actual === entry.sha256) return fragmentProblems;
    return [
      `${entry.upstream}: upstream changed ${entry.symbols.join(", ")}; re-sync ${copies}`,
      ...fragmentProblems,
    ];
  } catch (error) {
    if (!(error instanceof ParallelCopyError)) throw error;
    return [`${error.message}; fork copy: ${entry.copies.join(", ") || "unknown"}`];
  }
}

export function runParallelCopies({
  update = false,
  manifestFile = path.join(repoRoot, PARALLEL_COPIES_MANIFEST),
  root = repoRoot,
  log = console.log,
  logError = console.error,
} = {}) {
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  if (update) {
    const entries = manifest.entries.map((entry) => ({
      ...entry,
      sha256: hashDeclarations(
        readFileSync(path.join(root, entry.upstream), "utf8"),
        entry.upstream,
        entry.symbols,
      ),
    }));
    // Formatted as the repo formatter leaves it, so `fmt:check` stays green.
    writeGeneratedFile(manifestFile, `${JSON.stringify({ ...manifest, entries }, null, 2)}\n`);
    log(`upstream-parallel-copies: recorded ${entries.length} entries`);
    return 0;
  }
  const problems = manifest.entries.flatMap((entry) =>
    checkEntry(entry, readFileSync(path.join(root, entry.upstream), "utf8")),
  );
  if (problems.length > 0) {
    logError(
      `upstream-parallel-copies: ${problems.length} fork copy(ies) are behind upstream:\n  ${problems.join("\n  ")}\n` +
        "Re-sync each copy, then run `node scripts/upstream-parallel-copies.mjs --update` in apps/lynx.",
    );
    return 1;
  }
  log(`upstream-parallel-copies: ${manifest.entries.length} entries match upstream`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runParallelCopies({ update: process.argv.includes("--update") }));
}
