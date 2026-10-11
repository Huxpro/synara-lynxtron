// Exercise the normal server configuration watcher; never inject a renderer toast.
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, sep, join } from "node:path";
import {
  openBackend,
  openElectronDriver,
  openNativeDriver,
  readCertifiedRun,
  waitFor,
} from "../../../scripts/comparison-workflow.mjs";
import { measureProbes } from "../../../scripts/comparison-measure.mjs";
import { electronScreenshot, nativeScreenshot } from "../../../scripts/comparison-colours.mjs";

const outIndex = process.argv.indexOf("--out");
if (outIndex < 0) throw new Error("Pass --out <directory>");
const out = resolve(process.argv[outIndex + 1]);
mkdirSync(out, { recursive: true });
const run = readCertifiedRun();
const backend = await openBackend(run);
let restore;
let electron;
let native;
try {
  const config = await backend.request("server.getConfig", {});
  const path = resolve(config.keybindingsConfigPath);
  if (!path.startsWith(resolve(run.stateRoot) + sep))
    throw new Error("Refusing a config outside the owned comparison home");
  const existed = existsSync(path);
  const original = existed ? readFileSync(path) : null;
  restore = () => {
    if (existed) writeFileSync(path, original);
    else rmSync(path, { force: true });
  };
  electron = await openElectronDriver(run.options.electronCdpPort);
  native = await openNativeDriver(run.native.devtool.port);
  // A syntax error in this isolated operator config produces the same config
  // issue event in both consumers via the ordinary server watcher.
  writeFileSync(path, "{ invalid-comparison-keybindings\n");
  for (const driver of [electron, native])
    await waitFor(() => driver.find({ label: "Dismiss toast" }), {
      timeoutMs: 20000,
      label: "server config warning toast",
    });
  const probes = [
    ["surface", "[data-toast-root]", ".LynxToast"],
    ["title", "[data-slot=toast-title]", ".LynxToastTitle"],
    ["description", "[data-slot=toast-description]", ".LynxToastDescription"],
    ["dismiss", "[aria-label='Dismiss toast']", ".LynxToastClose"],
    ["action", "[data-slot=toast-action]", ".LynxToastAction"],
  ].map(([id, e, n]) => ({
    id,
    role: "toast",
    edge: "top",
    electron: { selector: e },
    native: {
      selector: n,
      ...(id === "action" ? { near: { x: run.options.width / 2 - 150, y: 80 } } : {}),
    },
  }));
  const measured = await measureProbes(probes, run);
  const results = measured.map((row) => {
    const deltas =
      row.electron && row.native
        ? Object.fromEntries(
            ["x", "y", "width", "height"].map((key) => [
              key,
              +(row.native.box[key] - row.electron.box[key]).toFixed(2),
            ]),
          )
        : null;
    return {
      ...row,
      deltas,
      within2px: deltas && Object.values(deltas).every((value) => Math.abs(value) <= 2),
    };
  });
  writeFileSync(join(out, "electron.png"), await electronScreenshot(electron));
  writeFileSync(join(out, "native.png"), await nativeScreenshot(run.native.devtool.port));
  // A real dismissal must remove the warning on each surface independently.
  for (const driver of [electron, native]) {
    await driver.tap({ label: "Dismiss toast" });
    await waitFor(async () => !(await driver.find({ label: "Dismiss toast" })), {
      label: "toast dismissal",
    });
  }
  writeFileSync(
    join(out, "report.json"),
    JSON.stringify(
      {
        runId: run.runId,
        trigger: "isolated keybindings config syntax error through server watcher",
        results,
        dismissedBoth: true,
      },
      null,
      2,
    ) + "\n",
  );
  if (results.some((row) => !row.within2px)) process.exitCode = 1;
  console.log(
    JSON.stringify(results.map(({ id, deltas, within2px }) => ({ id, deltas, within2px }))),
  );
} finally {
  restore?.();
  electron?.close();
  native?.close();
  backend.close();
}
