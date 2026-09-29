#!/usr/bin/env node

import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const requireFromApp = createRequire(import.meta.url);

export function resolveLynxtronRuntimePaths(
  packageJsonPath,
  platform = process.platform,
  exists = existsSync,
) {
  const pathApi = platform === "win32" ? path.win32 : path;
  const packageRoot = pathApi.dirname(packageJsonPath);
  const distRoot = pathApi.join(packageRoot, "dist");
  if (platform === "darwin") {
    const variantAppRoot = pathApi.join(distRoot, "devtool", "Lynxtron.app");
    const legacyAppRoot = pathApi.join(distRoot, "lynxtron.app");
    const appRoot = exists(pathApi.join(variantAppRoot, "Contents", "MacOS", "lynxtron"))
      ? variantAppRoot
      : legacyAppRoot;
    return {
      executable: pathApi.join(appRoot, "Contents", "MacOS", "lynxtron"),
      inspectorResourceCandidates: [
        pathApi.join(appRoot, "Contents", "Resources", "LynxDebugResources.bundle"),
        pathApi.join(appRoot, "Contents", "Resources", "LynxResources.bundle"),
      ],
    };
  }
  if (platform === "win32") {
    const variantExecutable = pathApi.join(distRoot, "devtool", "lynxtron.exe");
    const runtimeRoot = exists(variantExecutable) ? pathApi.join(distRoot, "devtool") : distRoot;
    return {
      executable: pathApi.join(runtimeRoot, "lynxtron.exe"),
      inspectorResourceCandidates: [pathApi.join(runtimeRoot, "resources", "logbox")],
    };
  }
  const variantExecutable = pathApi.join(distRoot, "devtool", "lynxtron");
  const runtimeRoot = exists(variantExecutable) ? pathApi.join(distRoot, "devtool") : distRoot;
  return {
    executable: pathApi.join(runtimeRoot, "lynxtron"),
    inspectorResourceCandidates: [pathApi.join(runtimeRoot, "resources", "logbox")],
  };
}

export function verifyLynxtronRuntime(paths, exists = existsSync) {
  const missing = [];
  if (!exists(paths.executable)) missing.push(`executable: ${paths.executable}`);
  if (!paths.inspectorResourceCandidates.some((filePath) => exists(filePath))) {
    missing.push(`inspectorResources: ${paths.inspectorResourceCandidates.join(" or ")}`);
  }
  if (missing.length > 0) {
    throw new Error(
      [
        "Lynxtron runtime installation is incomplete.",
        ...missing,
        "Run `bun install` from the repository root so trusted postinstall scripts execute.",
      ].join("\n"),
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const packageJsonPath = requireFromApp.resolve("@lynx-js/lynxtron/package.json");
  const paths = resolveLynxtronRuntimePaths(packageJsonPath);
  verifyLynxtronRuntime(paths);
  console.log(
    `[verify-lynxtron-runtime] runtime and inspector resources ready: ${paths.executable}`,
  );
}
