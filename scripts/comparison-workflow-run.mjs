// usage: node scripts/comparison-workflow-run.mjs <J1…> [--renderer electron|native|both] [--out file]
//
// Runs a workflow against the latest certified comparison run and writes the
// verified steps (timings, backend facts) as JSON evidence.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import {
  openBackend,
  openElectronDriver,
  openNativeDriver,
  readCertifiedRun,
} from "./comparison-workflow.mjs";
import { WORKFLOWS } from "./comparison-workflows.mjs";

const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : fallback;
};
const workflowName = argv[0];
const workflow = WORKFLOWS[workflowName];
if (!workflow)
  throw new Error(`Unknown workflow ${workflowName}; known: ${Object.keys(WORKFLOWS)}`);
const renderers =
  option("--renderer", "both") === "both" ? ["electron", "native"] : [option("--renderer")];

const run = readCertifiedRun();
const backend = await openBackend(run);
const report = {
  workflow: workflowName,
  runId: run.runId,
  startedAt: new Date().toISOString(),
  renderers: {},
};
let failed = false;
for (const renderer of renderers) {
  const driver =
    renderer === "electron"
      ? await openElectronDriver(run.options.electronCdpPort)
      : await openNativeDriver(run.native.devtool.port);
  const steps = [];
  const step = async (name, action) => {
    const startedAt = Date.now();
    try {
      const detail = await action();
      steps.push({ name, ok: true, ms: Date.now() - startedAt, ...(detail ? { detail } : {}) });
      console.log(`[${workflowName}:${renderer}] ✓ ${name} (${Date.now() - startedAt}ms)`);
      return detail;
    } catch (error) {
      steps.push({
        name,
        ok: false,
        ms: Date.now() - startedAt,
        error: String(error?.message ?? error),
      });
      console.log(`[${workflowName}:${renderer}] ✗ ${name}: ${error?.message ?? error}`);
      throw error;
    }
  };
  // The other renderer, for checks that span clients (opened on demand).
  let peer = null;
  const openPeer = async () => {
    peer ??=
      renderer === "electron"
        ? await openNativeDriver(run.native.devtool.port)
        : await openElectronDriver(run.options.electronCdpPort);
    return peer;
  };
  try {
    const result = await workflow({ driver, backend, step, run, openPeer });
    report.renderers[renderer] = { ok: true, steps, result };
  } catch (error) {
    failed = true;
    report.renderers[renderer] = { ok: false, steps, error: String(error?.message ?? error) };
  } finally {
    driver.close();
    peer?.close();
  }
}
report.endedAt = new Date().toISOString();
backend.close();
const out = option("--out");
if (out) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
}
process.exit(failed ? 1 : 0);
