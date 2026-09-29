// Run identity for the Electron ↔ Lynxtron comparison harness.
//
// A comparison cell is only certifiable when every observation in it comes from
// one known build and one known backend. This module owns the evidence that
// makes that checkable after the fact: the source identity a Native bundle was
// built from, the backend every Native socket is connected to, and a per-run
// manifest that records all of it together with the harness activity trail.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// Everything the Native bundle compiles from. apps/web is included because the
// Lynx app imports shared compositions from it.
export const NATIVE_BUNDLE_SOURCE_DIRS = Object.freeze([
  "apps/lynx/src",
  "apps/lynx/lynx.config.ts",
  "apps/lynx/rsbuild.config.ts",
  "apps/lynx/package.json",
  "apps/web/src",
  "packages/contracts/src",
  "packages/shared/src",
]);

export function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

export function sha256File(filePath) {
  return existsSync(filePath) ? sha256(readFileSync(filePath)) : null;
}

function git(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 1 << 28 });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
}

/**
 * Content identity of the Native bundle inputs: a digest over the path and
 * working-tree content of every non-test file under `sourcePaths` (tracked or
 * untracked). Equal digests mean the same inputs were compiled, whichever
 * commit records them; `commit` is informational only.
 */
export function sourceIdentity(root, sourcePaths = NATIVE_BUNDLE_SOURCE_DIRS) {
  // Tests never reach the bundle; excluding them keeps test-only edits from
  // invalidating an otherwise identical build.
  const paths = [...sourcePaths, ":(exclude,glob)**/*.test.*", ":(exclude,glob)**/*.spec.*"];
  const files = git(root, [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
    "--",
    ...paths,
  ])
    .split("\0")
    .filter(Boolean)
    .sort();
  const digest = createHash("sha256");
  let fileCount = 0;
  for (const file of files) {
    const filePath = join(root, file);
    if (!existsSync(filePath)) continue; // deleted in the working tree
    digest.update(`\0${file}\0`);
    digest.update(readFileSync(filePath));
    fileCount += 1;
  }
  const status = git(root, ["status", "--porcelain", "--", ...paths])
    .split("\n")
    .filter(Boolean);
  return {
    commit: git(root, ["rev-parse", "HEAD"]).trim(),
    dirtyFiles: status.length,
    fileCount,
    digest: digest.digest("hex"),
  };
}

export function nativeBundleHashes(lynxApp) {
  return {
    lynxBundle: sha256File(join(lynxApp, "main.lynx.bundle")),
    mainScript: sha256File(join(lynxApp, "main.js")),
  };
}

export function writeNativeBuildStamp(stampPath, stamp) {
  mkdirSync(dirname(stampPath), { recursive: true });
  writeFileSync(stampPath, `${JSON.stringify(stamp, null, 2)}\n`);
}

/**
 * A reused Native bundle is only valid for the exact sources it was built
 * from. Returns a list of reasons the current bundle must not be certified.
 */
export function nativeBuildStampProblems(stamp, currentSource, currentBundles) {
  if (!stamp) return ["no Native build stamp exists; run without --skip-build"];
  const problems = [];
  if (stamp.source?.digest !== currentSource.digest) {
    problems.push("Native sources changed since the bundle was built");
  }
  for (const [key, value] of Object.entries(currentBundles)) {
    if (stamp.bundles?.[key] !== value) problems.push(`${key} differs from the stamped build`);
  }
  return problems;
}

export function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function parseEndpoint(endpoint) {
  const match = endpoint.match(/^(\[[^\]]+\]|[^:]+):(\d+)$/);
  return match ? { host: match[1].replace(/^\[|\]$/g, ""), port: Number(match[2]) } : null;
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);

/**
 * Classifies established TCP sockets of the Native processes. Every outbound
 * loopback socket must reach the certified backend port; inbound DevTool
 * inspector sessions are ignored. `lsof -nP -iTCP -sTCP:ESTABLISHED` format.
 */
export function nativeBackendConnectionsFromLsof(output, { runtimePort, devtoolPort }) {
  const backend = [];
  const violations = [];
  const external = [];
  for (const line of output.split("\n")) {
    const match = line.match(/TCP (\S+)->(\S+) \(ESTABLISHED\)/);
    if (!match) continue;
    const local = parseEndpoint(match[1]);
    const remote = parseEndpoint(match[2]);
    if (!local || !remote) continue;
    const pid = Number(line.trim().split(/\s+/)[1]);
    if (devtoolPort !== null && local.port === devtoolPort) continue;
    const record = { pid, local: match[1], remote: match[2] };
    if (!LOOPBACK_HOSTS.has(remote.host)) external.push(record);
    else if (remote.port === runtimePort) backend.push(record);
    else violations.push(record);
  }
  return { backend, violations, external };
}

export function inspectNativeBackendConnections(pids, options) {
  if (pids.length === 0) return { backend: [], violations: [], external: [], pids };
  const result = spawnSync(
    "lsof",
    ["-nP", "-a", "-p", pids.join(","), "-iTCP", "-sTCP:ESTABLISHED"],
    { encoding: "utf8" },
  );
  return { ...nativeBackendConnectionsFromLsof(result.stdout ?? "", options), pids };
}

/** Chrome DevTools reports these when a reload/navigation destroys the context. */
export function isTransientCdpContextError(message) {
  return /Promise was collected|Execution context was destroyed|Cannot find context with specified id|Inspected target navigated or closed/i.test(
    String(message ?? ""),
  );
}

export function createRunManifest({ runId, options, paths }) {
  return {
    version: 1,
    runId,
    startedAt: new Date().toISOString(),
    status: "running",
    options,
    stateRoot: paths.stateRoot,
    phases: [],
    activity: [],
    children: [],
  };
}

export function recordPhase(run, phase, details = {}) {
  run.phases.push({ phase, at: new Date().toISOString(), ...details });
}

export function writeRunManifest(runsDir, run) {
  mkdirSync(runsDir, { recursive: true });
  const content = `${JSON.stringify(run, null, 2)}\n`;
  writeFileSync(join(runsDir, `${run.runId}.json`), content);
  writeFileSync(join(runsDir, "latest.json"), content);
}
