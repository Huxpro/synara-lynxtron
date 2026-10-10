// FILE: platform/browserEnvironmentBranchGuards.lynx.test.ts
// Purpose: with the browser environment injected, `typeof window` is always
//   defined for upstream `apps/web/src` source on Lynx. A few upstream branches
//   behind that probe were deliberately off on Lynx while the fork still edited
//   the files (`getDocument() !== null`). The files are byte-identical to
//   upstream again, so the branches are on for any Lynx caller. There is none
//   today; this test fails when one appears, before the behaviour ships.
//   See docs/architecture-principles.md, "还原一个 Lynx 会执行的上游文件之前".

import { describe, expect, it } from "@rstest/core";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const lynxSourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Upstream exports whose `typeof window !== "undefined"` branch has no Lynx
 * implementation behind it. Before importing one from Lynx, give it a Lynx
 * module replacement (lynx.config.ts) and remove it from this list.
 */
const UPSTREAM_EXPORTS_WITHOUT_A_LYNX_BRANCH = [
  // lib/projectReactQuery.ts: enabled only "in a browser"; the two lookups feed
  // upstream's DOM file preview and markdown links.
  "projectResolveWorkspaceFileReferenceQueryOptions",
  "projectResolveOutOfRootFileReferenceQueryOptions",
  // hooks: per-frame animation and throttling keyed on `typeof window`.
  "useSmoothStreamedText",
  "useThrottledStreamingValue",
] as const;

function listSourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "generated" || entry.name === "node_modules") continue;
      files.push(...listSourceFiles(entryPath));
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
}

describe("upstream branches the browser environment turns on", () => {
  it("no Lynx module calls an upstream export whose browser branch Lynx does not implement", () => {
    const files = listSourceFiles(lynxSourceRoot);
    expect(files.length).toBeGreaterThan(100);
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const name of UPSTREAM_EXPORTS_WITHOUT_A_LYNX_BRANCH) {
        if (new RegExp(`\\b${name}\\b`).test(text)) {
          offenders.push(`${path.relative(lynxSourceRoot, file)}: ${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
