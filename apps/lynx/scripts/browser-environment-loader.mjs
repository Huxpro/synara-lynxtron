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
// The import is prepended on the first line without a line break, so source
// maps and error line numbers of the upstream file do not move.
//
// SYNARA_BROWSER_ENV_TRACE=<file>: append one line per injected file
// (`<names>\t<resource>`), to list which upstream files run on the environment.

import { appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const COMMENTS_AND_STRINGS =
  /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g;

/** Drop comments and plain string contents, keep template literals' `${…}` code. */
function codeOnly(source) {
  return source.replace(COMMENTS_AND_STRINGS, (match) => {
    if (match[0] !== "`") return " ";
    const expressions = match.match(/\$\{[^}]*\}/g);
    return expressions ? expressions.join(" ") : " ";
  });
}

function referencePattern(name) {
  // Not a member (`x.window`, `x?.window`) and not part of a longer identifier.
  // An object key or a type member (`window: …`) also matches: the scan errs
  // toward binding, because an unused binding costs nothing and a missed one
  // leaves the file on the valueless global.
  return new RegExp(`(?<![.\\w$])${name}(?![\\w$])`);
}

function declarationPattern(name) {
  return new RegExp(
    `(?:\\b(?:const|let|var|function|class)\\s+${name}\\b)|` +
      `(?:\\b(?:const|let|var)\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*=)|` +
      `(?:\\bimport\\b[^;]*?\\b${name}\\b[^;]*?\\bfrom\\b)`,
  );
}

/**
 * Splits the referenced globals into the ones to bind and the ones the file
 * declares itself (`const location = useLocation()`, a parameter-less local
 * `document`, …). A text scan cannot tell such a binding from the global, and a
 * module-level one would collide with the import, so a declared name is left
 * alone and reported.
 */
export function planBrowserEnvironment(source, globals = BROWSER_ENVIRONMENT_GLOBALS) {
  const code = codeOnly(source);
  const bound = [];
  const declared = [];
  for (const name of globals) {
    if (!referencePattern(name).test(code)) continue;
    (declarationPattern(name).test(code) ? declared : bound).push(name);
  }
  return { bound, declared };
}

export function injectBrowserEnvironment(source, options = {}) {
  const modulePath = options.modulePath ?? BROWSER_ENVIRONMENT_MODULE;
  const { bound } = planBrowserEnvironment(source, options.globals);
  if (bound.length === 0) return source;
  const specifier = JSON.stringify(modulePath.split(path.sep).join("/"));
  return `import { ${bound.join(", ")} } from ${specifier};${source}`;
}

/** Rspack loader entry; `this` is the loader context. */
function browserEnvironmentLoader(source) {
  const { bound, declared } = planBrowserEnvironment(source);
  const tracePath = process.env.SYNARA_BROWSER_ENV_TRACE;
  if (tracePath) {
    const names = [...bound, ...declared.map((name) => `!${name}`)].join(",") || "-";
    appendFileSync(tracePath, `${names}\t${this.resourcePath}\n`);
  }
  return injectBrowserEnvironment(source);
}

export default browserEnvironmentLoader;
