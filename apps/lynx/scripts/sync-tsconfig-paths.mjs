// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Mirrors the Rspeedy `resolve.alias` table from lynx.config.ts into
// tsconfig.app.json `compilerOptions.paths`, so `tsc` resolves `~/…` /
// `@synara-web/…` exactly like the Lynx bundle does. lynx.config.ts stays the
// single source of truth; `--check` fails when tsconfig.app.json drifts.
//
// Deliberately not tsconfig.json: Rsbuild, Rspeedy and Rstest apply a root
// tsconfig.json's paths at runtime (ahead of resolve.alias), and the type-only
// entries below point at .d.ts files.
//
//   node scripts/sync-tsconfig-paths.mjs          # rewrite (bun run typecheck:sync-paths)
//   node scripts/sync-tsconfig-paths.mjs --check  # exit 1 on drift

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsconfigPath = path.join(appRoot, "tsconfig.app.json");

// Aliases that re-point a bare npm package to a runtime build/shim. TypeScript
// must keep resolving those packages' own declarations.
const RUNTIME_ONLY_ALIASES = new Set([
  "react$",
  "decode-named-character-reference$",
  "@tanstack/react-router$",
]);

// Packages the ReactLynx toolchain aliases for every module it compiles, so
// Web-tree files (whose own node_modules lack them) still resolve them.
const TOOLCHAIN_PACKAGES = ["@lynx-js/react"];

// Web-tree files would otherwise pick up apps/web's React 19 typings, whose
// ReactNode is incompatible with the React 18 typings ReactLynx is built on.
const TYPE_ONLY_PATHS = { react: ["./node_modules/@types/react"] };

function toTsconfigTarget(absolute) {
  const relative = path.relative(appRoot, absolute).split(path.sep).join("/");
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function aliasesToPaths(alias) {
  const paths = {};
  for (const [key, target] of Object.entries(alias)) {
    if (RUNTIME_ONLY_ALIASES.has(key)) continue;
    const mapped = toTsconfigTarget(target);
    if (key.endsWith("$")) {
      paths[key.slice(0, -1)] = [mapped];
    } else {
      paths[key] = [mapped];
      paths[`${key}/*`] = [`${mapped}/*`];
    }
  }
  Object.assign(paths, TYPE_ONLY_PATHS);
  for (const name of TOOLCHAIN_PACKAGES) {
    // The workspace symlink, not the realpath: bun's store path embeds a hash.
    const manifestPath = path.join(appRoot, "node_modules", name, "package.json");
    const { exports } = JSON.parse(readFileSync(manifestPath, "utf8"));
    for (const [subpath, conditions] of Object.entries(exports)) {
      if (typeof conditions !== "object" || typeof conditions.types !== "string") continue;
      const specifier = subpath === "." ? name : `${name}/${subpath.slice(2)}`;
      paths[specifier] = [
        toTsconfigTarget(path.join(path.dirname(manifestPath), conditions.types)),
      ];
    }
  }
  return Object.fromEntries(Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)));
}

async function main() {
  const check = process.argv.includes("--check");
  const originalLog = console.log;
  console.log = () => {}; // lynx.config.ts logs on import.
  let config;
  try {
    ({ default: config } = await import(pathToFileURL(path.join(appRoot, "lynx.config.ts")).href));
  } finally {
    console.log = originalLog;
  }
  const expected = aliasesToPaths(config.resolve?.alias ?? {});
  const source = readFileSync(tsconfigPath, "utf8");
  const tsconfig = JSON.parse(source);
  const actual = tsconfig.compilerOptions?.paths ?? {};
  if (JSON.stringify(actual) === JSON.stringify(expected)) return;
  if (check) {
    console.error(
      "apps/lynx/tsconfig.app.json paths are out of sync with lynx.config.ts resolve.alias.\n" +
        "Run: bun run typecheck:sync-paths (in apps/lynx).",
    );
    process.exit(1);
  }
  tsconfig.compilerOptions = { ...tsconfig.compilerOptions, paths: expected };
  writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);
  const oxfmt = path.join(appRoot, "../../node_modules/.bin/oxfmt");
  if (existsSync(oxfmt)) spawnSync(oxfmt, [tsconfigPath], { stdio: "ignore" });
  console.log(
    `Updated ${path.relative(process.cwd(), tsconfigPath)} (${Object.keys(expected).length} paths).`,
  );
}

await main();
