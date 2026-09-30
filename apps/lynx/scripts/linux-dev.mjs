#!/usr/bin/env node
// Linux development harness for the Lynx client.
//
//   node scripts/linux-dev.mjs server [--origin URL]   Synara backend on :58090
//   node scripts/linux-dev.mjs native [--background]   dist/desktop on Linux Lynxtron
//   node scripts/linux-dev.mjs native --watch          ...and relaunch on every template rebuild
//   node scripts/linux-dev.mjs status | stop
//
// Lynxtron renders windowless on Linux. The native run presents into an X11
// window (starting Xvfb when $DISPLAY is unset) and writes every frame to
// .runtime/linux-dev/frame.ppm; drive and inspect it with native-devtool.mjs.

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "../..");
const stateDir = path.join(appRoot, ".runtime", "linux-dev");
const SERVER_PORT = 58090;
const DEFAULT_WEB_ORIGIN = "http://localhost:8080";
const XVFB_DISPLAY = ":97";

export function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const flags = new Map();
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith("--")) continue;
    const next = rest[index + 1];
    if (next === undefined || next.startsWith("--")) {
      flags.set(arg.slice(2), true);
    } else {
      flags.set(arg.slice(2), next);
      index += 1;
    }
  }
  return { command, flags };
}

function statePath(name) {
  return path.join(stateDir, name);
}

function readPid(name) {
  try {
    const pid = Number(fs.readFileSync(statePath(`${name}.pid`), "utf8"));
    process.kill(pid, 0);
    return pid;
  } catch {
    return null;
  }
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function stopProcess(name) {
  const pid = readPid(name);
  if (pid === null) return false;
  process.kill(pid, "SIGTERM");
  // The server releases its database lifecycle lock only once it has exited.
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (!isAlive(pid)) break;
    await delay(200);
  }
  if (isAlive(pid)) process.kill(pid, "SIGKILL");
  fs.rmSync(statePath(`${name}.pid`), { force: true });
  return true;
}

function startDetached(name, command, args, options) {
  fs.mkdirSync(stateDir, { recursive: true });
  const log = fs.openSync(statePath(`${name}.log`), "w");
  const child = spawn(command, args, {
    ...options,
    detached: true,
    stdio: ["ignore", log, log],
  });
  child.unref();
  fs.writeFileSync(statePath(`${name}.pid`), String(child.pid));
  return child.pid;
}

async function waitForPort(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const open = await new Promise((resolve) => {
      const socket = net.connect({ host: "127.0.0.1", port }, () => {
        socket.end();
        resolve(true);
      });
      socket.on("error", () => resolve(false));
    });
    if (open) return true;
    await delay(250);
  }
  return false;
}

async function startServer(flags) {
  await stopProcess("server");
  if (await waitForPort(SERVER_PORT, 200)) {
    throw new Error(`Port ${SERVER_PORT} is already in use by another process; stop it first.`);
  }
  const origin = String(flags.get("origin") ?? DEFAULT_WEB_ORIGIN);
  const home = path.join(stateDir, "synara-home");
  fs.mkdirSync(home, { recursive: true });
  const pid = startDetached("server", "bun", ["run", "src/index.ts", "--dev-url", origin], {
    cwd: path.join(repoRoot, "apps", "server"),
    env: {
      ...process.env,
      SYNARA_PORT: String(SERVER_PORT),
      SYNARA_HOST: "127.0.0.1",
      SYNARA_NO_BROWSER: "1",
      SYNARA_HOME: home,
      SYNARA_AUTO_BOOTSTRAP_PROJECT_FROM_CWD: "1",
    },
  });
  if (!(await waitForPort(SERVER_PORT, 60_000))) {
    throw new Error(
      `Synara server did not listen on :${SERVER_PORT}; see ${statePath("server.log")}`,
    );
  }
  console.log(`server pid ${pid} on ws://127.0.0.1:${SERVER_PORT} (trusted web origin ${origin})`);
}

function hasCommand(name) {
  return spawnSync("sh", ["-c", `command -v ${name}`], { stdio: "ignore" }).status === 0;
}

async function ensureDisplay() {
  if (process.env.DISPLAY) return process.env.DISPLAY;
  if (!hasCommand("Xvfb")) {
    console.warn("No $DISPLAY and no Xvfb: running headless (frames still go to frame.ppm).");
    return null;
  }
  if (readPid("xvfb") === null) {
    startDetached(
      "xvfb",
      "Xvfb",
      [XVFB_DISPLAY, "-screen", "0", "1600x1000x24", "-nolisten", "tcp"],
      {},
    );
    await delay(1000);
  }
  return XVFB_DISPLAY;
}

export function resolveLynxtronBinary(env = process.env) {
  if (env.LYNXTRON_BIN) return env.LYNXTRON_BIN;
  return path.join(appRoot, "node_modules", "@lynx-js", "lynxtron", "dist", "devtool", "lynxtron");
}

async function startNative(flags) {
  const app = path.join(appRoot, "dist", "desktop");
  if (!fs.existsSync(path.join(app, "main.lynx.bundle"))) {
    throw new Error(
      "dist/desktop is missing: run `bun run build` (or rspeedy + rsbuild desktop builds) first",
    );
  }
  if (!(await waitForPort(SERVER_PORT, 500))) {
    console.warn(
      `No Synara server on :${SERVER_PORT}; start one with \`node scripts/linux-dev.mjs server\`.`,
    );
  }
  await stopProcess("native");
  const display = await ensureDisplay();
  const env = {
    ...process.env,
    SYNARA_ENABLE_DEVTOOL: process.env.SYNARA_ENABLE_DEVTOOL ?? "1",
    SYNARA_LYNX_USER_DATA_DIR: path.join(stateDir, "lynx-userdata"),
    LYNXTRON_FRAME_DUMP: statePath("frame.ppm"),
    ...(display ? { DISPLAY: display } : {}),
  };
  const binary = resolveLynxtronBinary();
  if (flags.get("watch")) return watchNative(binary, app, env);
  if (flags.get("background")) {
    const pid = startDetached("native", binary, [app], { env });
    console.log(
      `native pid ${pid}${display ? ` on DISPLAY=${display}` : ""}; log ${statePath("native.log")}`,
    );
    return;
  }
  const child = spawn(binary, [app], { env, stdio: "inherit" });
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(statePath("native.pid"), String(child.pid));
  child.on("exit", (code) => process.exit(code ?? 1));
}

// Native edit loop: `rspeedy build --watch` rebuilds the production template
// (development templates do not decode in the Lynxtron engine), and every new
// template is copied into dist/desktop and the native app is relaunched.
async function watchNative(binary, app, env) {
  const outputBundle = path.join(appRoot, "output", "bundle", "lynx", "main.lynx.bundle");
  const appBundle = path.join(app, "main.lynx.bundle");
  const launch = async () => {
    await stopProcess("native");
    const pid = startDetached("native", binary, [app], { env });
    console.log(`[linux-dev] native pid ${pid}; log ${statePath("native.log")}`);
  };
  const builder = spawn("bun", ["run", "rspeedy", "build", "--environment", "lynx", "--watch"], {
    cwd: appRoot,
    stdio: "inherit",
  });
  const shutdown = async () => {
    builder.kill("SIGTERM");
    await stopProcess("native");
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  builder.on("exit", (code) => {
    console.error(`[linux-dev] rspeedy exited (${code})`);
    void shutdown();
  });

  let lastMtime = 0;
  await launch();
  for (;;) {
    await delay(500);
    let stat;
    try {
      stat = fs.statSync(outputBundle);
    } catch {
      continue;
    }
    if (stat.mtimeMs === lastMtime) continue;
    // Let the writer finish before copying.
    await delay(300);
    if (fs.statSync(outputBundle).mtimeMs !== stat.mtimeMs) continue;
    const first = lastMtime === 0;
    lastMtime = stat.mtimeMs;
    fs.copyFileSync(outputBundle, appBundle);
    if (!first) {
      console.log("[linux-dev] template rebuilt; relaunching native app");
      await launch();
    }
  }
}

async function status() {
  for (const name of ["server", "native", "xvfb"]) {
    const pid = readPid(name);
    console.log(`${name.padEnd(6)} ${pid === null ? "stopped" : `pid ${pid}`}`);
  }
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command === "server") return startServer(flags);
  if (command === "native") return startNative(flags);
  if (command === "status") return status();
  if (command === "stop") {
    for (const name of ["native", "server", "xvfb"]) await stopProcess(name);
    return;
  }
  console.log(
    fs
      .readFileSync(fileURLToPath(import.meta.url), "utf8")
      .split("\n")
      .slice(1, 12)
      .join("\n"),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
