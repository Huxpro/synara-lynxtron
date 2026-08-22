import { spawn, spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createConnection } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");

export const DEFAULT_DESKTOP_COMPARISON_OPTIONS = Object.freeze({
  threadId: "lynx-landing-thread-1787254540864-987357febecef",
  width: 1079,
  height: 803,
  webPort: 8891,
  electronCdpPort: 9223,
  lynxDevtoolPort: 8902,
  skipBuild: false,
});

function parsePositiveInteger(raw, flag) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${flag} requires a positive integer.`);
  }
  return value;
}

export function parseDesktopComparisonArgs(argv) {
  const options = { ...DEFAULT_DESKTOP_COMPARISON_OPTIONS };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--skip-build") {
      options.skipBuild = true;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined) {
      throw new Error(`Missing value for ${argument}.`);
    }
    if (argument === "--thread") {
      options.threadId = value.trim();
    } else if (argument === "--width") {
      options.width = parsePositiveInteger(value, argument);
    } else if (argument === "--height") {
      options.height = parsePositiveInteger(value, argument);
    } else if (argument === "--web-port") {
      options.webPort = parsePositiveInteger(value, argument);
    } else if (argument === "--electron-cdp-port") {
      options.electronCdpPort = parsePositiveInteger(value, argument);
    } else if (argument === "--lynx-devtool-port") {
      options.lynxDevtoolPort = parsePositiveInteger(value, argument);
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
    index += 1;
  }
  if (!options.threadId) {
    throw new Error("--thread requires a non-empty thread id.");
  }
  return options;
}

export function resolveDesktopComparisonPaths(root = repositoryRoot) {
  const stateRoot = join(root, ".synara-desktop-comparison");
  const seedHome = join(root, ".synara-pr84");
  const electronHome = join(stateRoot, "electron");
  const electronUserDataDir = join(stateRoot, "electron-profile");
  const lynxUserDataDir = join(stateRoot, "lynx");
  return {
    root,
    stateRoot,
    seedHome,
    electronHome,
    electronUserDataDir,
    electronWindowState: join(electronHome, "userdata", "desktop-window-state.json"),
    runtimeState: join(electronHome, "dev", "server-runtime.json"),
    lynxUserDataDir,
    lynxWindowState: join(lynxUserDataDir, "synara-lynx-slice", "window-state.json"),
    lynxKvState: join(lynxUserDataDir, "synara-lynx-slice", "kv.json"),
    electronEntry: join(root, "apps", "desktop", "dist-electron", "main.js"),
    lynxApp: join(root, "apps", "lynx", "dist", "desktop"),
    lynxtronCli: join(root, "apps", "lynx", "node_modules", ".bin", "lynxtron"),
  };
}

export function prepareDesktopComparisonHome(paths) {
  const sourceDev = join(paths.seedHome, "dev");
  const sourceDatabase = join(sourceDev, "state.sqlite");
  if (!existsSync(sourceDatabase)) {
    throw new Error(`Comparison seed database is missing at ${sourceDatabase}.`);
  }

  rmSync(paths.electronUserDataDir, { recursive: true, force: true });
  rmSync(paths.electronHome, { recursive: true, force: true });
  const targetDev = join(paths.electronHome, "dev");
  mkdirSync(targetDev, { recursive: true });
  const temporaryDatabase = join(targetDev, "state.sqlite.tmp");
  const backup = spawnSync("sqlite3", [sourceDatabase, `.backup '${temporaryDatabase}'`], {
    encoding: "utf8",
  });
  if (backup.status !== 0) {
    throw new Error(`Failed to clone comparison database: ${backup.stderr.trim()}`);
  }
  renameSync(temporaryDatabase, join(targetDev, "state.sqlite"));

  for (const fileName of ["settings.json", "keybindings.json"]) {
    const source = join(sourceDev, fileName);
    if (existsSync(source)) copyFileSync(source, join(targetDev, fileName));
  }
  for (const directoryName of ["provider-status", "secrets"]) {
    const source = join(sourceDev, directoryName);
    if (existsSync(source)) {
      cpSync(source, join(targetDev, directoryName), { recursive: true });
    }
  }
}

export function comparisonRoute(threadId) {
  return `/thread/${encodeURIComponent(threadId)}`;
}

export function comparisonWebUrl(options) {
  return `http://127.0.0.1:${options.webPort}/#/${encodeURIComponent(options.threadId)}`;
}

export function comparisonLynxDeepLink(options) {
  return `synara://thread/${encodeURIComponent(options.threadId)}`;
}

export function desktopComparisonCommands(options, paths, authToken, electronExecutable) {
  const webUrl = comparisonWebUrl(options);
  return {
    build: [
      {
        command: "bun",
        args: ["run", "build"],
        cwd: join(paths.root, "apps", "server"),
      },
      {
        command: "bun",
        args: ["run", "build:desktop"],
        cwd: paths.root,
      },
      {
        command: "bun",
        args: ["run", "build"],
        cwd: join(paths.root, "apps", "lynx"),
      },
    ],
    web: {
      command: "bun",
      args: [
        "run",
        "--cwd",
        join(paths.root, "apps", "web"),
        "dev",
        "--",
        "--host",
        "127.0.0.1",
        "--port",
        String(options.webPort),
        "--strictPort",
      ],
      cwd: paths.root,
      env: {},
    },
    electron: {
      command: electronExecutable,
      args: [
        `--remote-debugging-port=${options.electronCdpPort}`,
        `--user-data-dir=${paths.electronUserDataDir}`,
        `--synara-dev-root=${join(paths.root, "apps", "desktop")}`,
        paths.electronEntry,
      ],
      cwd: join(paths.root, "apps", "desktop"),
      env: {
        SYNARA_HOME: paths.electronHome,
        SYNARA_DESKTOP_AUTH_TOKEN: authToken,
        SYNARA_DESKTOP_USER_DATA_DIR: paths.electronUserDataDir,
        VITE_DEV_SERVER_URL: webUrl,
      },
    },
    lynx: {
      command: paths.lynxtronCli,
      args: [paths.lynxApp, comparisonLynxDeepLink(options)],
      cwd: paths.root,
      env: {
        NODE_ENV: "production",
        SYNARA_ALLOW_PARALLEL_INSTANCE: "1",
        SYNARA_ENABLE_DEVTOOL: "1",
        SYNARA_LYNX_USER_DATA_DIR: paths.lynxUserDataDir,
        SYNARA_LYNX_DEVTOOL_PORT: String(options.lynxDevtoolPort),
      },
    },
  };
}

export function writeComparisonWindowStates(paths, options) {
  mkdirSync(dirname(paths.electronWindowState), { recursive: true });
  writeFileSync(
    paths.electronWindowState,
    `${JSON.stringify(
      {
        version: 1,
        bounds: { x: 8, y: 72, width: options.width, height: options.height },
        isMaximized: false,
      },
      null,
      2,
    )}\n`,
  );
  mkdirSync(dirname(paths.lynxWindowState), { recursive: true });
  writeFileSync(
    paths.lynxWindowState,
    JSON.stringify({
      version: 1,
      bounds: { x: 1120, y: 72, width: options.width, height: options.height },
      maximized: false,
      fullscreen: false,
    }),
  );
  writeFileSync(
    paths.lynxKvState,
    JSON.stringify({
      "synara:theme": "dark",
    }),
  );
}

function isPortOpen(port) {
  return new Promise((resolvePort) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    socket.setTimeout(300);
    socket.once("connect", () => {
      socket.destroy();
      resolvePort(true);
    });
    const unavailable = () => {
      socket.destroy();
      resolvePort(false);
    };
    socket.once("error", unavailable);
    socket.once("timeout", unavailable);
  });
}

async function waitForPort(port, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Timed out waiting for 127.0.0.1:${port}.`);
}

async function waitForRuntimeState(runtimePath, launchedAt, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const state = JSON.parse(readFileSync(runtimePath, "utf8"));
      const startedAt = Date.parse(state.startedAt);
      if (
        state.version === 1 &&
        Number.isInteger(state.pid) &&
        state.pid > 0 &&
        Number.isInteger(state.port) &&
        state.port > 0 &&
        Number.isFinite(startedAt) &&
        startedAt >= launchedAt - 1_000
      ) {
        return state;
      }
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Timed out waiting for a fresh Electron runtime at ${runtimePath}.`);
}

async function configureElectronRenderer(cdpPort, expectedUrl, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let target = null;
  while (Date.now() < deadline) {
    try {
      const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((response) =>
        response.json(),
      );
      target = targets.find(
        (candidate) =>
          candidate.type === "page" &&
          candidate.url === expectedUrl &&
          typeof candidate.webSocketDebuggerUrl === "string",
      );
      if (target) break;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  if (!target) {
    throw new Error(`Timed out waiting for the Electron page at ${expectedUrl}.`);
  }

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });
  await new Promise((resolveEvaluation, rejectEvaluation) => {
    const timeout = setTimeout(
      () => rejectEvaluation(new Error("Timed out configuring the Electron comparison state.")),
      5_000,
    );
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== 1) return;
      clearTimeout(timeout);
      if (message.error) rejectEvaluation(new Error(message.error.message));
      else resolveEvaluation();
    });
    socket.send(
      JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: {
          expression:
            "localStorage.clear(); localStorage.setItem('synara:theme', 'dark'); location.reload(); undefined",
          returnByValue: true,
        },
      }),
    );
  }).finally(() => socket.close());
}

function runCommand(command) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command.command, command.args, {
      cwd: command.cwd,
      env: { ...process.env, ...command.env },
      stdio: "inherit",
    });
    child.once("error", rejectRun);
    child.once("exit", (code, signal) => {
      if (signal) {
        rejectRun(new Error(`${command.command} exited with ${signal}.`));
      } else if (code !== 0) {
        rejectRun(new Error(`${command.command} exited with code ${code}.`));
      } else {
        resolveRun();
      }
    });
  });
}

function startOwned(command) {
  return spawn(command.command, command.args, {
    cwd: command.cwd,
    env: { ...process.env, ...command.env },
    detached: process.platform !== "win32",
    stdio: "inherit",
  });
}

function stopOwned(child, signal) {
  if (!child?.pid) return;
  try {
    if (process.platform === "win32") child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch {}
}

async function resolveElectronExecutable(webUrl) {
  process.env.VITE_DEV_SERVER_URL = webUrl;
  const launcher = await import(
    new URL("../apps/desktop/scripts/electron-launcher.mjs", import.meta.url)
  );
  return launcher.resolveElectronPath();
}

async function main() {
  const options = parseDesktopComparisonArgs(process.argv.slice(2));
  const paths = resolveDesktopComparisonPaths();
  const authToken =
    process.env.SYNARA_COMPARE_AUTH_TOKEN?.trim() || "synara-local-desktop-comparison";
  const electronExecutable = await resolveElectronExecutable(comparisonWebUrl(options));
  const commands = desktopComparisonCommands(options, paths, authToken, electronExecutable);
  const ownedChildren = [];
  let shuttingDown = false;

  const shutdown = (exitCode) => {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const child of ownedChildren.toReversed()) stopOwned(child, "SIGTERM");
    setTimeout(() => {
      for (const child of ownedChildren.toReversed()) stopOwned(child, "SIGKILL");
      process.exit(exitCode);
    }, 1_500);
  };
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.once(signal, () => shutdown(0));
  }
  process.stdin.once("close", () => shutdown(0));
  process.once("disconnect", () => shutdown(0));
  const parentPid = process.ppid;
  const parentWatchdog = setInterval(() => {
    if (process.ppid === 1) {
      shutdown(0);
      return;
    }
    try {
      process.kill(parentPid, 0);
    } catch {
      shutdown(0);
    }
  }, 500);
  parentWatchdog.unref();

  if (!options.skipBuild) {
    for (const command of commands.build) await runCommand(command);
  }
  if (!existsSync(paths.electronEntry) || !existsSync(paths.lynxApp)) {
    throw new Error("Desktop comparison artifacts are missing. Run without --skip-build.");
  }
  for (const [label, port] of [
    ["Electron CDP", options.electronCdpPort],
    ["Lynx DevTool", options.lynxDevtoolPort],
  ]) {
    if (await isPortOpen(port)) {
      throw new Error(`${label} port ${port} is already in use.`);
    }
  }

  prepareDesktopComparisonHome(paths);
  writeComparisonWindowStates(paths, options);

  if (!(await isPortOpen(options.webPort))) {
    const web = startOwned(commands.web);
    ownedChildren.push(web);
    await waitForPort(options.webPort);
  }

  const launchedAt = Date.now();
  const electron = startOwned(commands.electron);
  ownedChildren.push(electron);
  const runtime = await waitForRuntimeState(paths.runtimeState, launchedAt);
  await waitForPort(runtime.port);
  await configureElectronRenderer(options.electronCdpPort, comparisonWebUrl(options));

  const socketUrl = new URL(`ws://127.0.0.1:${runtime.port}`);
  socketUrl.searchParams.set("token", authToken);
  commands.lynx.env.SYNARA_WS_URL = socketUrl.toString();
  const lynx = startOwned(commands.lynx);
  ownedChildren.push(lynx);

  console.log(
    `[compare:desktop] Electron and Lynxtron are opening thread ${options.threadId} at ${options.width}x${options.height}.`,
  );
  console.log(
    `[compare:desktop] Web ${options.webPort}, Electron CDP ${options.electronCdpPort}, Lynx DevTool ${options.lynxDevtoolPort}. Press Ctrl-C to stop owned processes.`,
  );

  for (const [name, child] of [
    ["Electron", electron],
    ["Lynxtron", lynx],
  ]) {
    child.once("error", (error) => {
      console.error(`[compare:desktop] ${name} failed to start:`, error);
      shutdown(1);
    });
    child.once("exit", (code, signal) => {
      if (!shuttingDown) {
        console.error(
          `[compare:desktop] ${name} exited unexpectedly (${signal ?? `code ${code ?? 0}`}).`,
        );
        shutdown(code ?? 1);
      }
    });
  }
}

const isEntrypoint =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  main().catch((error) => {
    console.error(`[compare:desktop] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
