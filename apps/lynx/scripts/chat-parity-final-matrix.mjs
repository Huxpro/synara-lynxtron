// Serial background acceptance audit. No launches from the default branch and
// no process outside this script's own launcher is stopped.
import { spawn } from "node:child_process";
import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
const index = process.argv.indexOf("--out");
if (index < 0 || !process.argv[index + 1]) throw Error("--out directory required");
const out = resolve(process.argv[index + 1]);
mkdirSync(out, { recursive: true });
const latest = resolve(".synara-desktop-comparison/runs/latest.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let launcher = null,
  exit = null;
async function stop() {
  if (!launcher) return;
  if (launcher.exitCode === null) launcher.kill("SIGINT");
  let timer;
  try {
    await Promise.race([
      exit,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error("Owned launcher did not exit")), 30000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
  launcher = null;
  exit = null;
}
process.once("SIGINT", () => void stop().finally(() => process.exit(130)));
process.once("SIGTERM", () => void stop().finally(() => process.exit(143)));
function launch(args, log) {
  const fd = openSync(log, "w");
  const child = spawn(process.execPath, args, { stdio: ["ignore", fd, fd], env: process.env });
  closeSync(fd);
  return child;
}
async function run(args, log) {
  const child = launch(args, log);
  return await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code));
  });
}
const summary = [];
try {
  for (const theme of ["dark", "light"])
    for (const [width, height] of [
      [1280, 820],
      [1440, 900],
    ])
      for (const font of [13, 16]) {
        const name = `${theme}-${width}-${font}`;
        let previous;
        try {
          previous = JSON.parse(readFileSync(latest)).runId;
        } catch {}
        launcher = launch(
          [
            "scripts/dev-electron-lynxtron.mjs",
            "--skip-build",
            "--theme",
            theme,
            "--width",
            String(width),
            "--height",
            String(height),
            "--chat-font-size",
            String(font),
            "--lynx-devtool-port",
            "18902",
          ],
          join(out, name + "-launcher.log"),
        );
        exit = new Promise((r) => launcher.once("exit", r));
        let certified;
        const deadline = Date.now() + 120000;
        while (Date.now() < deadline) {
          if (launcher.exitCode !== null) throw Error("Launcher failed: " + name);
          try {
            const c = JSON.parse(readFileSync(latest));
            if (c.runId !== previous && c.status === "certified") {
              certified = c;
              break;
            }
          } catch {}
          await sleep(300);
        }
        if (
          !certified ||
          certified.options.width !== width ||
          certified.options.height !== height ||
          certified.options.chatFontSize !== font ||
          certified.options.theme !== theme
        )
          throw Error("Configuration not certified: " + name);
        const entry = {
          name,
          runId: certified.runId,
          formatsExit: await run(
            [
              "scripts/message-formats-desktop.mjs",
              "--thread",
              "comparison-fixture-transcript-v2",
              "--out",
              join(out, name + "-formats"),
            ],
            join(out, name + "-formats.log"),
          ),
        };
        if (font === 13)
          entry.cellsExit = await run(
            ["scripts/comparison-cells.mjs", "--out", join(out, name + "-cells.json")],
            join(out, name + "-cells.log"),
          );
        summary.push(entry);
        writeFileSync(join(out, "runs.json"), JSON.stringify(summary, null, 2) + "\n");
        console.log(JSON.stringify(entry));
        if (entry.formatsExit !== 0 || (entry.cellsExit !== undefined && entry.cellsExit !== 0))
          throw Error("Harness failed; diagnose before another configuration: " + name);
        await stop();
      }
} finally {
  await stop();
}
if (
  summary.length !== 8 ||
  summary.some((e) => e.formatsExit !== 0 || (e.cellsExit !== undefined && e.cellsExit !== 0))
)
  process.exitCode = 1;
