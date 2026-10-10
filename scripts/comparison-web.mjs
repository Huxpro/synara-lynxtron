// usage: node scripts/comparison-web.mjs [--theme dark|light] [--width 1280 --height 820]
//          [--matrix] [--surfaces a,b] [--increments a,b] [--skip-build] [--out file]
//          [--port-offset n] [--fixture-root dir] [--markdown file]
//
// The browser pair of the comparison harness: the Web original and Lynx for Web, two
// pages on one isolated server, measured with the same cells as Electron ↔ Lynxtron
// (comparison-cells.mjs). Needs no desktop app and no Mac.
//
// One launch is one configuration (theme × window size): it clones the canonical fixture
// into a new home, starts the dev server and the Web dev server on ports of their own,
// opens each page in a headless Chrome it owns, gives both the renderer state the desktop
// launcher gives Electron and Lynxtron, certifies that both show the fixture thread on
// the fixture's data, measures, and stops everything it started. `--matrix` runs the four
// configurations of the desktop matrix one after another.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, openSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createConnection, createServer } from "node:net";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CONTROL_TOLERANCE_PX,
  INCREMENTS,
  SURFACES,
  installElectronErrorHook,
  measureCells,
} from "./comparison-cells.mjs";
import {
  comparisonFixtureEntitiesFromSnapshot,
  comparisonFixtureMismatches,
  openSynaraRpcSession,
  readComparisonFixtureEntities,
  readComparisonFixtureManifest,
  resolveComparisonFixturePaths,
} from "./comparison-fixture.mjs";
import {
  comparisonThemeIsApplied,
  comparisonThemeStorageValue,
  DEFAULT_COMPARISON_THEME_PACK,
  parseComparisonThemePack,
} from "./comparison-theme.mjs";
import { isTransientCdpContextError } from "./comparison-run.mjs";
import {
  LYNX_WEB_PAGE_PATH,
  openCdpPageSession,
  takeLynxWebPageErrors,
} from "./comparison-web-connector.mjs";
import { openElectronDriver, openNativeDriver, waitFor } from "./comparison-workflow.mjs";
import {
  COMPARISON_RENDERER_STORAGE_KEYS,
  comparisonRendererResetExpression,
  comparisonRoute,
  prepareDesktopComparisonHome,
} from "./dev-electron-lynxtron.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
// The first import of an app module makes the Web dev server transform its whole graph,
// and a provider refresh probes every provider CLI.
const PROVIDER_SETTLE_TIMEOUT_MS = 90_000;

/** The desktop matrix: two themes at two window sizes. */
export const WEB_COMPARISON_MATRIX = Object.freeze([
  { theme: "dark", width: 1280, height: 820 },
  { theme: "dark", width: 1440, height: 900 },
  { theme: "light", width: 1280, height: 820 },
  { theme: "light", width: 1440, height: 900 },
]);

/** Lynx for Web keeps renderer state in localStorage under this prefix (web-host.ts). */
export const LYNX_WEB_STORAGE_PREFIX = "synara.lynx.";

export const DEFAULT_WEB_COMPARISON_OPTIONS = Object.freeze({
  theme: "dark",
  // See comparison-theme.mjs: "codex" is the bare mode string, "default" the Synara pack.
  themePack: DEFAULT_COMPARISON_THEME_PACK,
  width: 1280,
  height: 820,
  matrix: false,
  skipBuild: false,
  portOffset: 731,
  surfaces: Object.keys(SURFACES),
  increments: Object.keys(INCREMENTS),
  fixtureRoot: null,
  out: null,
  markdown: null,
});

export function parseWebComparisonArgs(argv, environment = process.env) {
  const options = {
    ...DEFAULT_WEB_COMPARISON_OPTIONS,
    fixtureRoot: environment.SYNARA_COMPARE_FIXTURE_ROOT?.trim() || null,
  };
  const value = (index, name) => {
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) throw new Error(`${name} requires a value.`);
    return next;
  };
  const positiveInteger = (text, name) => {
    const number = Number(text);
    if (!Number.isInteger(number) || number <= 0) {
      throw new Error(`${name} requires a positive integer.`);
    }
    return number;
  };
  const names = (text, known, name) => {
    const list = text.split(",").filter(Boolean);
    const unknown = list.filter((entry) => !known.includes(entry));
    if (unknown.length > 0) throw new Error(`${name}: unknown ${unknown.join(", ")}.`);
    return list;
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--matrix") options.matrix = true;
    else if (argument === "--skip-build") options.skipBuild = true;
    else if (argument === "--theme") {
      const theme = value(index, argument);
      if (theme !== "dark" && theme !== "light") throw new Error("--theme requires dark or light.");
      options.theme = theme;
      index += 1;
    } else if (argument === "--theme-pack") {
      options.themePack = parseComparisonThemePack(value(index, argument));
      index += 1;
    } else if (argument === "--width" || argument === "--height" || argument === "--port-offset") {
      const key = argument === "--port-offset" ? "portOffset" : argument.slice(2);
      options[key] = positiveInteger(value(index, argument), argument);
      index += 1;
    } else if (argument === "--surfaces") {
      options.surfaces = names(value(index, argument), Object.keys(SURFACES), argument);
      index += 1;
    } else if (argument === "--increments") {
      // `--increments ""` is how the cells script is asked for surfaces only.
      const text = argv[index + 1] ?? "";
      options.increments = names(text, Object.keys(INCREMENTS), argument);
      index += 1;
    } else if (argument === "--fixture-root" || argument === "--out" || argument === "--markdown") {
      const key = argument === "--fixture-root" ? "fixtureRoot" : argument.slice(2);
      options[key] = resolve(value(index, argument));
      index += 1;
    } else throw new Error(`Unknown argument ${argument}.`);
  }
  return options;
}

export function webComparisonConfigurations(options) {
  return options.matrix
    ? WEB_COMPARISON_MATRIX
    : [{ theme: options.theme, width: options.width, height: options.height }];
}

export function configurationTitle(configuration) {
  return `${configuration.theme} ${configuration.width}×${configuration.height}`;
}

/** `[dev-runner] mode=… serverPort=4504 webPort=6464 …`, as printed by `--dry-run`. */
export function parseDevRunnerPorts(output) {
  const match = /serverPort=(\d+)\s+webPort=(\d+)/.exec(output);
  if (!match) throw new Error(`dev-runner --dry-run printed no ports: ${output.trim()}`);
  return { serverPort: Number(match[1]), webPort: Number(match[2]) };
}

/**
 * Environment of the isolated dev server and Web dev server. The home is the cloned
 * fixture; no browser is opened and no project is created from the working directory;
 * an inherited auth token belongs to another instance and is dropped.
 */
export function isolatedServerEnvironment(environment, { home, portOffset }) {
  const {
    SYNARA_AUTH_TOKEN: _token,
    SYNARA_WS_URL: _wsUrl,
    SYNARA_DEV_INSTANCE: _instance,
    ...inherited
  } = environment;
  return {
    ...inherited,
    SYNARA_HOME: home,
    SYNARA_PORT_OFFSET: String(portOffset),
    SYNARA_NO_BROWSER: "1",
    SYNARA_AUTO_BOOTSTRAP_PROJECT_FROM_CWD: "0",
  };
}

export function chromeArguments({ executable, cdpPort, profile }) {
  return [
    // The headless shell is headless by nature; a full Chrome needs to be told.
    ...(/headless[-_]shell/i.test(executable) ? [] : ["--headless=new"]),
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    // A page nobody looks at must keep its timers and animation frames: the thread
    // composer waits for a frame before it mounts.
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "about:blank",
  ];
}

function newestEntries(directory, prefix) {
  try {
    return readdirSync(directory)
      .filter((name) => name.startsWith(prefix))
      .toSorted((left, right) => right.localeCompare(left, undefined, { numeric: true }))
      .map((name) => join(directory, name));
  } catch {
    return [];
  }
}

/** Where a Chromium may be, most specific first. Paths are not checked here. */
export function chromeExecutableCandidates({
  environment = process.env,
  home = homedir(),
  platform = process.platform,
  playwrightExecutable = null,
  list = newestEntries,
} = {}) {
  const candidates = [];
  if (environment.SYNARA_COMPARE_CHROME?.trim()) {
    candidates.push(environment.SYNARA_COMPARE_CHROME.trim());
  }
  if (playwrightExecutable) candidates.push(playwrightExecutable);
  const cache =
    environment.PLAYWRIGHT_BROWSERS_PATH?.trim() ||
    (platform === "darwin"
      ? join(home, "Library", "Caches", "ms-playwright")
      : join(home, ".cache", "ms-playwright"));
  for (const revision of list(cache, "chromium_headless_shell-")) {
    for (const inner of list(revision, "chrome-")) {
      candidates.push(join(inner, "chrome-headless-shell"), join(inner, "headless_shell"));
    }
  }
  if (platform === "darwin") {
    candidates.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  } else {
    candidates.push("/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser");
  }
  return candidates;
}

export function resolveChromeExecutable(candidates, exists = existsSync) {
  const found = candidates.find((candidate) => exists(candidate));
  if (!found) {
    throw new Error(
      `No Chromium found. Install one with \`bun run --cwd apps/web test:browser:install\`, or set SYNARA_COMPARE_CHROME. Looked at:\n  ${candidates.join("\n  ")}`,
    );
  }
  return found;
}

function playwrightChromium() {
  try {
    const require = createRequire(join(repositoryRoot, "apps", "web", "package.json"));
    return require("playwright").chromium.executablePath();
  } catch {
    return null;
  }
}

/** Reads the allowlisted renderer state of the Web original (its localStorage). */
export function rendererStateExpression() {
  return `Object.fromEntries(${JSON.stringify(
    COMPARISON_RENDERER_STORAGE_KEYS,
  )}.flatMap((key) => { const value = localStorage.getItem(key); return value === null ? [] : [[key, value]]; }))`;
}

/**
 * Hands Lynx for Web the Web original's allowlisted renderer state and the theme, as the
 * desktop launcher hands Lynxtron Electron's (`writeComparisonRendererState`). It is
 * installed to run before the page's first script, so the app starts from this state and
 * is never reloaded: a reload issued while the bundle was still loading left the page
 * blank. The marker keeps a later reload (a workflow's) from resetting what the app saved.
 */
export function lynxWebStateSeedExpression(rendererState, theme) {
  const entries = Object.fromEntries(
    COMPARISON_RENDERER_STORAGE_KEYS.flatMap((key) => {
      const value = rendererState?.[key];
      return typeof value === "string" ? [[key, value]] : [];
    }),
  );
  entries["synara:theme"] = theme;
  return `(() => { const prefix = ${JSON.stringify(LYNX_WEB_STORAGE_PREFIX)}; const marker = "synara.comparison.seeded"; if (localStorage.getItem(marker) !== null) return; for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key); for (const [key, value] of Object.entries(${JSON.stringify(entries)})) localStorage.setItem(prefix + key, value); localStorage.setItem(marker, "1"); })();`;
}

/** One cell as the browser pair reports it. `outside` is capped at 25 by the cells script. */
export function summarizeWebCell(name, cell) {
  const comparison = cell.comparison;
  if (!comparison) {
    return { name, pass: false, error: cell.error ?? "not measured" };
  }
  const explained = comparison.electronOnly.filter((label) => !comparison.missing.includes(label));
  return {
    name,
    pass: cell.pass === true,
    compared: comparison.compared,
    matched: comparison.matched,
    exempt: comparison.exempt.length,
    outside: comparison.compared - comparison.matched - comparison.exempt.length,
    outsideControls: comparison.outside.map((entry) => ({
      label: entry.label,
      delta: entry.delta,
    })),
    missingOnLynx: comparison.missing,
    explainedMissing: explained,
    lynxOnly: comparison.nativeOnly,
    repeated: comparison.repeated,
    probes: (cell.probes ?? []).map((probe) => ({
      name: probe.name,
      match: probe.match,
      delta: probe.delta ?? null,
      missing: probe.missing ?? null,
    })),
    webErrors: cell.electronErrors ?? [],
  };
}

export function summarizeWebReport(report) {
  return [
    ...Object.entries(report.cells).map(([name, cell]) => summarizeWebCell(name, cell)),
    ...Object.entries(report.increments).map(([name, cell]) => summarizeWebCell(`+${name}`, cell)),
  ];
}

/** Totals over the cells that were measured; `failedCells` counts the ones that were not. */
export function webReportTotals(summaries) {
  const measured = summaries.filter((summary) => summary.error === undefined);
  const sum = (key) => measured.reduce((total, summary) => total + summary[key], 0);
  return {
    cells: summaries.length,
    passed: summaries.filter((summary) => summary.pass).length,
    unmeasured: summaries.length - measured.length,
    compared: sum("compared"),
    matched: sum("matched"),
    exempt: sum("exempt"),
    outside: sum("outside"),
    missingOnLynx: measured.reduce((total, summary) => total + summary.missingOnLynx.length, 0),
    lynxOnly: measured.reduce((total, summary) => total + summary.lynxOnly.length, 0),
  };
}

export function webComparisonMarkdown(reports) {
  const lines = [
    "| Configuration | Cell | Compared | ≤2px | Named | Outside | Missing on Lynx | Lynx-only | Result |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ];
  for (const report of reports) {
    const title = configurationTitle(report);
    const summaries = summarizeWebReport(report);
    for (const summary of summaries) {
      lines.push(
        summary.error !== undefined
          ? `| ${title} | ${summary.name} | – | – | – | – | – | – | not measured: ${summary.error.replaceAll("|", "\\|")} |`
          : `| ${title} | ${summary.name} | ${summary.compared} | ${summary.matched} | ${summary.exempt} | ${summary.outside} | ${summary.missingOnLynx.length} | ${summary.lynxOnly.length} | ${summary.pass ? "PASS" : "FAIL"} |`,
      );
    }
    const totals = webReportTotals(summaries);
    lines.push(
      `| ${title} | **total** | ${totals.compared} | ${totals.matched} | ${totals.exempt} | ${totals.outside} | ${totals.missingOnLynx} | ${totals.lynxOnly} | ${totals.passed}/${totals.cells} cells |`,
    );
  }
  return `${lines.join("\n")}\n`;
}

/** What a Lynx-for-Web page that did not reach the expected screen is showing and waiting on. */
const LYNX_WEB_DIAGNOSTICS_EXPRESSION = `(() => {
  const relay = globalThis.__SYNARA_LYNX_RELAY_DIAGNOSTICS__?.();
  const root = document.querySelector("#root-view")?.shadowRoot;
  return {
    href: location.href,
    relay: relay ? { socketState: relay.socketState, connectionAttempts: relay.connectionAttempts, pendingUnaryTags: relay.pendingUnaryTags, activeStreamTags: relay.activeStreamTags, recentRpcTags: relay.recentRpcTags.slice(-8), lastTransportError: relay.lastTransportError, lastRpcError: relay.lastRpcError, rendererReadyRoute: relay.rendererReadyRoute } : null,
    elements: root ? root.querySelectorAll("*").length : -1,
    threadRows: root ? root.querySelectorAll("[data-thread-id]").length : 0,
    labels: root ? Array.from(root.querySelectorAll("[accessibility-label]")).slice(0, 12).map((node) => node.getAttribute("accessibility-label")) : [],
  };
})()`;

function freePort() {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.once("error", rejectPort);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

function portOpenOn(host, port) {
  return new Promise((resolveOpen) => {
    const socket = createConnection({ host, port });
    socket.setTimeout(400);
    const done = (open) => {
      socket.destroy();
      resolveOpen(open);
    };
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
  });
}

/** A dev server may listen on IPv4 or IPv6 loopback only; check both. */
async function portOpen(port) {
  return (await portOpenOn("127.0.0.1", port)) || (await portOpenOn("::1", port));
}

function stopGroup(child, signal) {
  try {
    // Negative pid: the whole process group, so turbo's and bun's children go too, even
    // when the dev-runner at its head has already exited.
    process.kill(-child.pid, signal);
  } catch {
    // The group is already gone.
  }
}

function listenersOn(port) {
  const result = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
    encoding: "utf8",
  });
  return (result.stdout ?? "").split("\n").filter(Boolean).map(Number);
}

async function evaluateThroughReload(session, expression) {
  try {
    return await session.evaluate(expression);
  } catch (error) {
    if (isTransientCdpContextError(error?.message)) return undefined;
    throw error;
  }
}

async function pollPage(session, expression, accept, label, timeoutMs = 60_000) {
  return waitFor(
    async () => {
      const value = await evaluateThroughReload(session, expression).catch(() => undefined);
      return accept(value) ? { value } : null;
    },
    { label, timeoutMs, intervalMs: 250 },
  ).then((result) => result.value);
}

async function openControlSession(cdpPort, configuration) {
  const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((r) => r.json());
  const target = targets.find((candidate) => candidate.type === "page");
  if (!target) throw new Error(`Chrome on port ${cdpPort} has no page.`);
  const session = await openCdpPageSession(target.webSocketDebuggerUrl);
  await session.send("Page.enable");
  // Emulation lasts as long as this session, so the session is kept for the whole run.
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: configuration.width,
    height: configuration.height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await session.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: configuration.theme }],
  });
  return session;
}

/**
 * Starts one certified browser pair. Resolves to the two drivers plus `stop()`; rejects
 * (after stopping what it started) when the pair cannot be certified.
 */
export async function startWebComparison(options, configuration, log = console.log) {
  const fixturePaths = resolveComparisonFixturePaths(options.fixtureRoot ?? repositoryRoot);
  const manifest = readComparisonFixtureManifest(fixturePaths);
  if (!manifest) {
    throw new Error(
      `The comparison fixture is missing under ${fixturePaths.fixtureRoot}. Build it with \`node scripts/comparison-fixture.mjs\` (needs a provider login), or point --fixture-root at a checkout that has it.`,
    );
  }
  const runId = `web-${new Date().toISOString().replaceAll(/[:.]/g, "-")}-${configuration.theme}-${configuration.width}x${configuration.height}`;
  const runDirectory = join(repositoryRoot, ".synara-desktop-comparison", "web", runId);
  const home = join(runDirectory, "home");
  mkdirSync(runDirectory, { recursive: true });
  prepareDesktopComparisonHome({
    seedHome: fixturePaths.seedHome,
    electronHome: home,
    electronUserDataDir: join(runDirectory, "unused-electron-profile"),
  });
  const cloneMismatches = comparisonFixtureMismatches(
    manifest,
    readComparisonFixtureEntities(join(home, "dev", "state.sqlite")),
  );
  if (cloneMismatches.length > 0) {
    throw new Error(`Cloned fixture does not match fixture.json: ${cloneMismatches.join("; ")}.`);
  }

  const environment = isolatedServerEnvironment(process.env, {
    home,
    portOffset: options.portOffset,
  });
  const dryRun = spawnSync(process.execPath, ["scripts/dev-runner.ts", "dev:server", "--dry-run"], {
    cwd: repositoryRoot,
    env: environment,
    encoding: "utf8",
  });
  const { serverPort, webPort } = parseDevRunnerPorts(`${dryRun.stdout}${dryRun.stderr}`);
  for (const port of [serverPort, webPort]) {
    if (await portOpen(port)) {
      throw new Error(
        `Port ${port} is in use by another instance; pick another --port-offset (now ${options.portOffset}).`,
      );
    }
  }

  const started = { groups: [], chromes: [], sessions: [], drivers: [] };
  let stopped = false;
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    for (const driver of started.drivers) driver.close();
    for (const session of started.sessions) session.close();
    for (const chrome of started.chromes) chrome.kill("SIGTERM");
    for (const group of started.groups) stopGroup(group, "SIGTERM");
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline && ((await portOpen(serverPort)) || (await portOpen(webPort)))) {
      await sleep(250);
    }
    for (const group of started.groups) stopGroup(group, "SIGKILL");
    // The ports were free before this run started, so whatever still listens on them was
    // started by it (a server that left its process group).
    for (const port of [serverPort, webPort]) {
      for (const pid of listenersOn(port)) {
        try {
          process.kill(pid, "SIGKILL");
        } catch {
          // Already gone.
        }
      }
    }
    await sleep(300);
    const left = [];
    for (const port of [serverPort, webPort]) if (await portOpen(port)) left.push(port);
    for (const chrome of started.chromes) {
      if (chrome.exitCode === null && chrome.signalCode === null) chrome.kill("SIGKILL");
    }
    if (left.length > 0) throw new Error(`Cleanup failed: ports ${left.join(", ")} still open.`);
    log(`[web] Cleanup verified (${runId})`);
  };

  try {
    for (const mode of ["dev:server", "dev:web"]) {
      const logFile = openSync(join(runDirectory, `${mode.replace(":", "-")}.log`), "a");
      started.groups.push(
        spawn(process.execPath, ["scripts/dev-runner.ts", mode], {
          cwd: repositoryRoot,
          env: environment,
          detached: true,
          stdio: ["ignore", logFile, logFile],
        }),
      );
    }
    await waitFor(async () => (await portOpen(serverPort)) && (await portOpen(webPort)), {
      label: `the isolated server (${serverPort}) and Web dev server (${webPort})`,
      timeoutMs: 180_000,
      intervalMs: 500,
    });

    const backend = await openSynaraRpcSession(`ws://127.0.0.1:${serverPort}/`, "comparison-web");
    const entities = async () =>
      comparisonFixtureEntitiesFromSnapshot(await backend.request("orchestration.getSnapshot", {}));
    const liveMismatches = comparisonFixtureMismatches(manifest, await entities());
    if (liveMismatches.length > 0) {
      throw new Error(`The server does not serve the fixture: ${liveMismatches.join("; ")}.`);
    }

    const executable = resolveChromeExecutable(
      chromeExecutableCandidates({ playwrightExecutable: playwrightChromium() }),
    );
    const cdpPorts = { web: await freePort(), lynx: await freePort() };
    for (const [name, cdpPort] of Object.entries(cdpPorts)) {
      const profile = join(runDirectory, `chrome-${name}`);
      mkdirSync(profile, { recursive: true });
      started.chromes.push(
        spawn(executable, chromeArguments({ executable, cdpPort, profile }), { stdio: "ignore" }),
      );
    }
    for (const cdpPort of Object.values(cdpPorts)) {
      await waitFor(
        () =>
          fetch(`http://127.0.0.1:${cdpPort}/json/version`)
            .then((response) => response.ok)
            .catch(() => false),
        { label: `Chrome on port ${cdpPort}`, timeoutMs: 30_000 },
      );
    }

    const origin = `http://localhost:${webPort}`;
    const threadId = manifest.transcriptThreadId;
    const route = comparisonRoute(threadId);

    // The Web original first: it is the reference, and its settled state seeds Lynx.
    const web = await openControlSession(cdpPorts.web, configuration);
    started.sessions.push(web);
    await web.send("Page.navigate", { url: `${origin}${route}` });
    await pollPage(
      web,
      "({ origin: location.origin, readyState: document.readyState })",
      (value) => value?.origin === origin && value?.readyState === "complete",
      "the Web original document",
      120_000,
    );
    // Same preparation as the desktop launcher gives Electron: settle provider status,
    // then reset the renderer state to the canonical one for this theme and reload.
    await web.evaluate(
      "import('/src/nativeApi.ts').then(({ ensureNativeApi }) => ensureNativeApi().server.refreshProviders()).then(() => undefined)",
      PROVIDER_SETTLE_TIMEOUT_MS,
    );
    const installationKey = await web.evaluate(
      "import('/src/nativeApi.ts').then(({ ensureNativeApi }) => ensureNativeApi().server.getConfig()).then((config) => config.worktreesDir ?? null)",
      PROVIDER_SETTLE_TIMEOUT_MS,
    );
    await evaluateThroughReload(
      web,
      comparisonRendererResetExpression(
        comparisonThemeStorageValue(configuration.theme, options.themePack),
        "acknowledged",
        null,
        threadId,
        typeof installationKey === "string" ? installationKey : null,
      ),
    );
    const rendererState = await pollPage(
      web,
      rendererStateExpression(),
      (state) => typeof state?.["synara:app-settings:v1"] === "string",
      "the Web original's canonical app settings",
    );

    const lynx = await openControlSession(cdpPorts.lynx, configuration);
    started.sessions.push(lynx);
    const lynxUrl = `${origin}${LYNX_WEB_PAGE_PATH}?route=${encodeURIComponent(route)}`;
    await lynx.send("Page.addScriptToEvaluateOnNewDocument", {
      source: lynxWebStateSeedExpression(
        rendererState,
        comparisonThemeStorageValue(configuration.theme, options.themePack),
      ),
    });
    await lynx.send("Page.navigate", { url: lynxUrl });
    await pollPage(
      lynx,
      "({ href: location.href, readyState: document.readyState })",
      (value) => value?.href === lynxUrl && value?.readyState === "complete",
      "the Lynx-for-Web document",
      120_000,
    );

    const electron = await openElectronDriver(cdpPorts.web, origin);
    started.drivers.push(electron);
    process.env.LYNX_DEVTOOL_CONNECTOR = join(scriptDirectory, "comparison-web-connector.mjs");
    const native = await openNativeDriver(cdpPorts.lynx);
    started.drivers.push(native);

    // Certification: both pages show the fixture thread, at the requested size and theme,
    // and the server still serves exactly the fixture.
    const threadRow = { attribute: ["data-thread-id", threadId] };
    for (const driver of [electron, native]) {
      try {
        await waitFor(() => driver.find(threadRow), {
          label: `the fixture thread on ${driver.kind}`,
          timeoutMs: 120_000,
          intervalMs: 300,
        });
      } catch (error) {
        if (driver !== native) throw error;
        // Say what the Lynx page was doing instead: connecting, waiting on a request, or
        // showing something else.
        const state = await lynx.evaluate(LYNX_WEB_DIAGNOSTICS_EXPRESSION).catch(() => null);
        const errors = takeLynxWebPageErrors(cdpPorts.lynx).slice(0, 8);
        throw new Error(
          `${error.message} Lynx page: ${JSON.stringify(state)}; errors: ${JSON.stringify(errors)}`,
          { cause: error },
        );
      }
    }
    const pageFacts = `({ width: innerWidth, height: innerHeight, dark: matchMedia("(prefers-color-scheme: dark)").matches, dpr: devicePixelRatio })`;
    const facts = { web: await web.evaluate(pageFacts), lynx: await lynx.evaluate(pageFacts) };
    for (const [name, fact] of Object.entries(facts)) {
      if (fact.width !== configuration.width || fact.height !== configuration.height) {
        throw new Error(
          `${name} page is ${fact.width}×${fact.height}, not ${configuration.width}×${configuration.height}.`,
        );
      }
    }
    const themes = {
      web: await web.evaluate(`localStorage.getItem("synara:theme")`),
      lynx: await lynx.evaluate(
        `localStorage.getItem(${JSON.stringify(`${LYNX_WEB_STORAGE_PREFIX}synara:theme`)})`,
      ),
    };
    if (
      !comparisonThemeIsApplied(themes.web, configuration.theme, options.themePack) ||
      !comparisonThemeIsApplied(themes.lynx, configuration.theme, options.themePack)
    ) {
      throw new Error(`Theme not applied: ${JSON.stringify(themes)}.`);
    }
    const settled = comparisonFixtureMismatches(manifest, await entities());
    if (settled.length > 0) {
      throw new Error(`Data changed during certification: ${settled.join("; ")}.`);
    }
    log(
      `[web] certified ${configurationTitle(configuration)}: thread ${threadId}, sequence ${manifest.sequence}, server ${serverPort}, web ${webPort}, run ${runId}`,
    );
    return {
      runId,
      runDirectory,
      manifest,
      ports: { serverPort, webPort, cdp: cdpPorts },
      urls: { web: `${origin}${route}`, lynx: lynxUrl },
      chrome: executable,
      facts,
      electron,
      native,
      sessions: { web, lynx },
      entities,
      stop: async () => {
        backend.close?.();
        await stop();
      },
    };
  } catch (error) {
    await stop().catch((cleanupError) => log(`[web] ${cleanupError.message}`));
    throw error;
  }
}

export async function measureWebConfiguration(options, configuration, log = console.log) {
  const pair = await startWebComparison(options, configuration, log);
  try {
    await installElectronErrorHook(pair.electron);
    // Startup noise is not part of any cell.
    takeLynxWebPageErrors(pair.ports.cdp.lynx);
    const measured = await measureCells({
      electron: pair.electron,
      native: pair.native,
      surfaces: options.surfaces,
      increments: options.increments,
      title: `web ${configurationTitle(configuration)}`,
      // The Web dev server transforms a route's modules on first visit, which on a busy
      // machine has taken longer than the desktop limit.
      surfaceReadyTimeoutMs: 60_000,
    });
    const after = await pair.entities();
    return {
      runId: pair.runId,
      pair: "web-original ↔ lynx-for-web",
      theme: configuration.theme,
      width: configuration.width,
      height: configuration.height,
      tolerancePx: CONTROL_TOLERANCE_PX,
      chrome: pair.chrome,
      pages: pair.facts,
      fixtureSequence: pair.manifest.sequence,
      // Cells create nothing through the server; a moved sequence means one of them did.
      sequenceAfterCells: after.sequence,
      cells: measured.cells,
      increments: measured.increments,
      lynxWebErrors: takeLynxWebPageErrors(pair.ports.cdp.lynx),
    };
  } finally {
    await pair.stop();
  }
}

async function main() {
  const options = parseWebComparisonArgs(process.argv.slice(2));
  if (!options.skipBuild) {
    console.log("[web] building Lynx for Web (bun run --cwd apps/lynx build:web)");
    const build = spawnSync(
      "bun",
      ["run", "--cwd", join(repositoryRoot, "apps", "lynx"), "build:web"],
      {
        cwd: repositoryRoot,
        stdio: ["ignore", "ignore", "inherit"],
      },
    );
    if (build.status !== 0) throw new Error("The Lynx-for-Web build failed.");
  }
  const reports = [];
  let harnessFailures = 0;
  for (const configuration of webComparisonConfigurations(options)) {
    try {
      reports.push(await measureWebConfiguration(options, configuration));
    } catch (error) {
      harnessFailures += 1;
      console.error(
        `[web] ${configurationTitle(configuration)}: harness failure, not a product result: ${error?.message ?? error}`,
      );
    }
  }
  for (const report of reports) {
    const totals = webReportTotals(summarizeWebReport(report));
    console.log(
      `[web] ${configurationTitle(report)}: ${totals.passed}/${totals.cells} cells, ${totals.matched}/${totals.compared} controls ≤${CONTROL_TOLERANCE_PX}px, ${totals.exempt} named, ${totals.outside} outside, ${totals.missingOnLynx} missing on Lynx, ${totals.lynxOnly} Lynx-only, ${totals.unmeasured} not measured, ${report.lynxWebErrors.length} Lynx page errors`,
    );
  }
  const markdown = webComparisonMarkdown(reports);
  console.log(markdown);
  if (options.out) {
    mkdirSync(dirname(options.out), { recursive: true });
    writeFileSync(options.out, `${JSON.stringify(reports, null, 2)}\n`);
  }
  if (options.markdown) {
    mkdirSync(dirname(options.markdown), { recursive: true });
    writeFileSync(options.markdown, markdown);
  }
  // Differences are the measurement; only a run that could not be certified fails.
  process.exit(harnessFailures > 0 ? 1 : 0);
}

const isEntrypoint =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) await main();
