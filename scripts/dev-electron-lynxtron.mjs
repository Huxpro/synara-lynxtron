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

import {
  comparisonFixtureMismatches,
  openSynaraRpcSession,
  readComparisonFixtureEntities,
  readComparisonFixtureManifest,
  resolveComparisonFixturePaths,
} from "./comparison-fixture.mjs";
import {
  createRunManifest,
  inspectNativeBackendConnections,
  isTransientCdpContextError,
  nativeBuildStampProblems,
  nativeBundleHashes,
  readJsonIfPresent,
  recordPhase,
  sha256File,
  sourceIdentity,
  writeNativeBuildStamp,
  writeRunManifest,
} from "./comparison-run.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const defaultLynxDevtoolConnector =
  "/Users/bytedance/.agents/skills/lynx-devtool/scripts/connector.mjs";

export const COMPARISON_RENDERER_STORAGE_KEYS = Object.freeze([
  "synara:theme",
  "synara:app-settings:v1",
  "synara:appsnap-welcome:v1",
  "synara:terminal-state:v1",
  "synara:right-dock-state:v1",
  "synara:recent-views:v1",
]);

// A key no app version knows, seeded into app settings so a workflow can prove
// that saving settings keeps fields it does not understand (forward compat).
export const COMPARISON_UNKNOWN_SETTING = Object.freeze({
  key: "comparisonForwardCompatSentinel",
  value: "kept",
});

// The pre-fixture seed's only visible ordinary-project thread. Kept for
// `--seed legacy` reproductions of historical evidence.
export const LEGACY_COMPARISON_THREAD_ID = "lynx-landing-thread-1787298664226-1b47e02983941";

export const DEFAULT_DESKTOP_COMPARISON_OPTIONS = Object.freeze({
  // null resolves to the seed's canonical thread (the fixture transcript).
  threadId: null,
  seed: "fixture",
  exitAfterCertify: false,
  route: null,
  width: 1079,
  height: 803,
  webPort: 8891,
  electronCdpPort: 9223,
  lynxDevtoolPort: 8902,
  theme: "dark",
  systemAppearanceSequence: null,
  systemAppearanceIntervalMs: null,
  terminal: "closed",
  dock: null,
  appSnap: "acknowledged",
  chatFontSize: null,
  skipLynxDevtool: false,
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
    if (argument === "--skip-lynx-devtool") {
      options.skipLynxDevtool = true;
      continue;
    }
    if (argument === "--exit-after-certify") {
      options.exitAfterCertify = true;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined) {
      throw new Error(`Missing value for ${argument}.`);
    }
    if (argument === "--thread") {
      options.threadId = value.trim();
      if (!options.threadId) throw new Error("--thread requires a non-empty thread id.");
    } else if (argument === "--seed") {
      if (value !== "fixture" && value !== "legacy") {
        throw new Error("--seed requires fixture or legacy.");
      }
      options.seed = value;
    } else if (argument === "--route") {
      options.route = value.trim();
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
    } else if (argument === "--theme") {
      if (value !== "light" && value !== "dark" && value !== "system") {
        throw new Error("--theme requires light, dark, or system.");
      }
      options.theme = value;
    } else if (argument === "--system-appearance-sequence") {
      const steps = value.split(",").map((entry) => entry.trim().toLowerCase());
      if (steps.length < 2 || steps.some((entry) => entry !== "light" && entry !== "dark")) {
        throw new Error(
          "--system-appearance-sequence requires at least two comma-separated light/dark steps.",
        );
      }
      options.systemAppearanceSequence = steps.join(",");
    } else if (argument === "--system-appearance-interval-ms") {
      options.systemAppearanceIntervalMs = parsePositiveInteger(value, argument);
    } else if (argument === "--terminal") {
      if (value !== "open" && value !== "closed") {
        throw new Error("--terminal requires open or closed.");
      }
      options.terminal = value;
    } else if (argument === "--dock") {
      if (value !== "git" && value !== "browser") {
        throw new Error("--dock requires git or browser.");
      }
      options.dock = value;
    } else if (argument === "--appsnap") {
      if (value !== "acknowledged" && value !== "welcome") {
        throw new Error("--appsnap requires acknowledged or welcome.");
      }
      options.appSnap = value;
    } else if (argument === "--chat-font-size") {
      options.chatFontSize = parsePositiveInteger(value, argument);
      if (options.chatFontSize < 11 || options.chatFontSize > 18) {
        throw new Error("--chat-font-size requires an integer from 11 to 18.");
      }
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
    index += 1;
  }
  if (
    options.route !== null &&
    (!options.route.startsWith("/") || options.route.startsWith("//"))
  ) {
    throw new Error("--route requires an absolute app route beginning with one slash.");
  }
  return options;
}

/**
 * Fills seed-dependent defaults. The fixture seed must exist with its manifest:
 * certifying against a missing fixture would silently fall back to whatever
 * state happens to be on disk.
 */
export function resolveComparisonSeedOptions(options, fixtureManifest) {
  if (options.seed === "legacy") {
    return { ...options, threadId: options.threadId ?? LEGACY_COMPARISON_THREAD_ID };
  }
  if (!fixtureManifest) {
    throw new Error(
      "The comparison fixture is missing. Build it with `node scripts/comparison-fixture.mjs`.",
    );
  }
  return { ...options, threadId: options.threadId ?? fixtureManifest.transcriptThreadId };
}

export function resolveDesktopComparisonPaths(
  root = repositoryRoot,
  sourceLynxtronAppOverride = process.env.SYNARA_COMPARE_LYNXTRON_APP?.trim(),
  exists = existsSync,
  seed = "fixture",
) {
  const stateRoot = join(root, ".synara-desktop-comparison");
  const seedHome =
    seed === "legacy" ? join(root, ".synara-pr84") : resolveComparisonFixturePaths(root).seedHome;
  const electronHome = join(stateRoot, "electron");
  const electronUserDataDir = join(stateRoot, "electron-profile");
  const lynxUserDataDir = join(stateRoot, "lynx");
  const packageDist = join(root, "apps", "lynx", "node_modules", "@lynx-js", "lynxtron", "dist");
  const lynxtronPackageJson = join(dirname(packageDist), "package.json");
  const variantLynxtronApp = join(packageDist, "devtool", "Lynxtron.app");
  const legacyLynxtronApp = join(packageDist, "lynxtron.app");
  const sourceLynxtronApp = sourceLynxtronAppOverride
    ? resolve(sourceLynxtronAppOverride)
    : exists(variantLynxtronApp)
      ? variantLynxtronApp
      : legacyLynxtronApp;
  const ownedLynxtronApp = join(stateRoot, "runtime", "Synara Comparison Lynxtron.app");
  return {
    root,
    stateRoot,
    seed,
    seedHome,
    runsDir: join(stateRoot, "runs"),
    nativeBuildStamp: join(stateRoot, "native-build.json"),
    electronHome,
    electronUserDataDir,
    electronWindowState: join(electronHome, "userdata", "desktop-window-state.json"),
    runtimeState: join(electronHome, "dev", "server-runtime.json"),
    lynxUserDataDir,
    lynxWindowState: join(lynxUserDataDir, "synara-lynx-slice", "window-state.json"),
    lynxKvState: join(lynxUserDataDir, "synara-lynx-slice", "kv.json"),
    electronEntry: join(root, "apps", "desktop", "dist-electron", "main.js"),
    lynxApp: join(root, "apps", "lynx", "dist", "desktop"),
    lynxtronPackageJson,
    sourceLynxtronApp,
    ownedLynxtronApp,
    ownedLynxtronExecutable: join(ownedLynxtronApp, "Contents", "MacOS", "lynxtron"),
  };
}

export function prepareOwnedLynxtronRuntime(paths, options = {}) {
  stopExistingOwnedLynxtronRuntime(paths);
  if (!existsSync(paths.sourceLynxtronApp)) {
    throw new Error(`Lynxtron runtime is missing at ${paths.sourceLynxtronApp}.`);
  }
  rmSync(paths.ownedLynxtronApp, { recursive: true, force: true });
  mkdirSync(dirname(paths.ownedLynxtronApp), { recursive: true });
  if (process.platform === "darwin") {
    const copy = spawnSync("ditto", [paths.sourceLynxtronApp, paths.ownedLynxtronApp], {
      encoding: "utf8",
    });
    if (copy.status !== 0) {
      throw new Error(`Failed to copy owned Lynxtron runtime: ${copy.stderr.trim()}`);
    }
  } else {
    cpSync(paths.sourceLynxtronApp, paths.ownedLynxtronApp, { recursive: true });
  }
  const infoPlist = join(paths.ownedLynxtronApp, "Contents", "Info.plist");
  const bundleId = "com.lynxjs.SynaraComparisonLynxtron";
  const sourceVersion = JSON.parse(readFileSync(paths.lynxtronPackageJson, "utf8")).version;
  if (typeof sourceVersion !== "string" || sourceVersion.trim().length === 0) {
    throw new Error(`Invalid Lynxtron package version in ${paths.lynxtronPackageJson}.`);
  }
  for (const [key, value] of [
    ["CFBundleIdentifier", bundleId],
    ["CFBundleDisplayName", "Synara Comparison Lynxtron"],
    ["CFBundleName", "Synara Comparison Lynxtron"],
    ["CFBundleShortVersionString", sourceVersion],
    ["CFBundleVersion", sourceVersion],
    ["SynaraLynxtronSourceVersion", sourceVersion],
    // An agent (UI element) app never activates, so comparisons cannot pull
    // focus from the user's foreground app.
    ["LSUIElement", true],
  ]) {
    const type = typeof value === "boolean" ? "-bool" : "-string";
    const rewrite = spawnSync("plutil", ["-replace", key, type, String(value), infoPlist], {
      encoding: "utf8",
    });
    if (rewrite.status !== 0) {
      throw new Error(`Failed to rewrite owned Lynxtron ${key}: ${rewrite.stderr.trim()}`);
    }
  }
  if (options.sign !== false) {
    const embeddedFramework = join(
      paths.ownedLynxtronApp,
      "Contents",
      "Frameworks",
      "Lynxtron Framework.framework",
    );
    if (existsSync(embeddedFramework)) {
      const signFramework = spawnSync("codesign", ["--force", "--sign", "-", embeddedFramework], {
        encoding: "utf8",
      });
      if (signFramework.status !== 0) {
        throw new Error(`Failed to sign owned Lynxtron framework: ${signFramework.stderr.trim()}`);
      }
    }
    const sign = spawnSync("codesign", ["--force", "--sign", "-", paths.ownedLynxtronApp], {
      encoding: "utf8",
    });
    if (sign.status !== 0) {
      throw new Error(`Failed to sign owned Lynxtron runtime: ${sign.stderr.trim()}`);
    }
  }
}

export function ownedLynxtronPidsFromPs(output, executable) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (!match || !match[2].startsWith(`${executable} `)) return [];
      return [Number(match[1])];
    })
    .filter((pid) => Number.isSafeInteger(pid) && pid > 1 && pid !== process.pid);
}

export function ownedElectronPidsFromPs(output, executable, electronUserDataDir) {
  const profileArgument = `--user-data-dir=${electronUserDataDir}`;
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (!match) return [];
      const command = match[2];
      if (!command.startsWith(`${executable} `)) return [];
      if (!command.split(" ").includes(profileArgument)) return [];
      return [Number(match[1])];
    })
    .filter((pid) => Number.isSafeInteger(pid) && pid > 1 && pid !== process.pid);
}

export function ownedWebPidsFromPs(output, webRoot, webPort) {
  const exactRoot = resolve(webRoot);
  const port = String(webPort);
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (!match) return [];
      const command = match[2];
      if (!command.includes(exactRoot + "/node_modules/.bin/vite")) return [];
      const args = command.split(" ");
      const portIndex = args.indexOf("--port");
      if (portIndex < 0 || args[portIndex + 1] !== port) return [];
      return [Number(match[1])];
    })
    .filter((pid) => Number.isSafeInteger(pid) && pid > 1 && pid !== process.pid);
}

function stopExistingOwnedWebRuntime(paths, webPort) {
  const processes = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
  if (processes.status !== 0) {
    throw new Error("Failed to inspect owned Web processes: " + processes.stderr.trim());
  }
  for (const pid of ownedWebPidsFromPs(
    processes.stdout,
    join(paths.root, "apps", "web"),
    webPort,
  )) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
  }
}

export function stopExistingOwnedElectronRuntime(paths, electronExecutable) {
  const processes = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
  if (processes.status !== 0) {
    throw new Error(`Failed to inspect owned Electron processes: ${processes.stderr.trim()}`);
  }
  const pids = ownedElectronPidsFromPs(
    processes.stdout,
    electronExecutable,
    paths.electronUserDataDir,
  );
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
  }
  const deadline = Date.now() + 3_000;
  for (const pid of pids) {
    let running = true;
    while (Date.now() < deadline) {
      try {
        process.kill(pid, 0);
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
      } catch (error) {
        if (error?.code === "ESRCH") {
          running = false;
          break;
        }
        throw error;
      }
    }
    if (running) {
      try {
        process.kill(pid, "SIGKILL");
      } catch (error) {
        if (error?.code !== "ESRCH") throw error;
      }
    }
  }
}

export function stopExistingOwnedLynxtronRuntime(paths) {
  const processes = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
  if (processes.status !== 0) {
    throw new Error(`Failed to inspect owned Lynxtron processes: ${processes.stderr.trim()}`);
  }
  const pids = ownedLynxtronPidsFromPs(processes.stdout, paths.ownedLynxtronExecutable);
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
  }
  const deadline = Date.now() + 3_000;
  for (const pid of pids) {
    let running = true;
    while (Date.now() < deadline) {
      try {
        process.kill(pid, 0);
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
      } catch (error) {
        if (error?.code === "ESRCH") {
          running = false;
          break;
        }
        throw error;
      }
    }
    if (running) {
      try {
        process.kill(pid, "SIGKILL");
      } catch (error) {
        if (error?.code !== "ESRCH") throw error;
      }
    }
  }
  // A killed child can remain briefly as a zombie until its launcher reaps it.
  // kill(pid, 0) reports zombies as alive even though they own no window or
  // listener, so the next run's exact process/port preflight is authoritative.
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
  const comparisonSettingsPath = join(targetDev, "settings.json");
  const comparisonSettings = existsSync(comparisonSettingsPath)
    ? JSON.parse(readFileSync(comparisonSettingsPath, "utf8"))
    : {};
  writeFileSync(
    comparisonSettingsPath,
    `${JSON.stringify(
      {
        ...comparisonSettings,
        enableProviderUpdateChecks: false,
        enableTaskCompletionToasts: false,
      },
      null,
      2,
    )}\n`,
  );
  for (const directoryName of ["provider-status", "secrets"]) {
    const source = join(sourceDev, directoryName);
    if (existsSync(source)) {
      cpSync(source, join(targetDev, directoryName), { recursive: true });
    }
  }
}

export function assertComparisonThreadAvailable(paths, threadId) {
  const databasePath = join(paths.electronHome, "dev", "state.sqlite");
  const escapedThreadId = threadId.replaceAll("'", "''");
  const query = spawnSync(
    "sqlite3",
    [
      databasePath,
      `select 1 from projection_threads t join projection_projects p on p.project_id = t.project_id where t.thread_id = '${escapedThreadId}' and t.deleted_at is null and p.deleted_at is null and p.kind = 'project' limit 1;`,
    ],
    { encoding: "utf8" },
  );
  if (query.status !== 0) {
    throw new Error(`Failed to verify comparison thread ${threadId}: ${query.stderr.trim()}`);
  }
  if (query.stdout.trim() !== "1") {
    throw new Error(
      `Comparison thread ${threadId} is missing from the seed snapshot or does not belong to a visible ordinary project.`,
    );
  }
}

export function readComparisonTranscriptExpectation(paths, threadId) {
  const databasePath = join(paths.electronHome, "dev", "state.sqlite");
  const escapedThreadId = threadId.replaceAll("'", "''");
  const query = spawnSync(
    "sqlite3",
    [
      "-json",
      databasePath,
      `select count(*) as messageCount, (select message_id from projection_thread_messages where thread_id = '${escapedThreadId}' order by sequence desc, rowid desc limit 1) as lastMessageId from projection_thread_messages where thread_id = '${escapedThreadId}';`,
    ],
    { encoding: "utf8" },
  );
  if (query.status !== 0) {
    throw new Error(`Failed to inspect comparison transcript ${threadId}: ${query.stderr.trim()}`);
  }
  const [row] = JSON.parse(query.stdout || "[]");
  return {
    messageCount: Number(row?.messageCount ?? 0),
    lastMessageId: typeof row?.lastMessageId === "string" ? row.lastMessageId : null,
  };
}

export function comparisonRoute(threadId) {
  return `/thread/${encodeURIComponent(threadId)}`;
}

export function comparisonNewThreadProjectId(options) {
  if (options.route === null) return null;
  const pathname = new URL(options.route, "http://synara.local").pathname;
  const match = /^\/new-thread\/([^/]+)$/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
}

export function comparisonElectronAnchorThreadId(options) {
  return comparisonNewThreadProjectId(options) === null
    ? comparisonThreadId(options)
    : options.threadId;
}

export function comparisonWebUrl(options) {
  const url = new URL(`http://127.0.0.1:${options.webPort}/`);
  if (options.terminal === "open") url.searchParams.set("terminal", "open");
  if (options.route !== null) {
    const route = new URL(options.route, "http://synara.local");
    if (route.pathname !== "/components-lab") {
      for (const [key, value] of route.searchParams) {
        url.searchParams.append(key, value);
      }
    }
    if (route.searchParams.get("editor") === "open") {
      route.searchParams.set("view", "editor");
      if (
        route.searchParams.get("editorMode") === "file" &&
        route.searchParams.get("explorerPath")
      ) {
        route.searchParams.set("editorFilePath", route.searchParams.get("explorerPath"));
      } else {
        route.searchParams.delete("editorFilePath");
      }
    }
    if (/^\/settings\/[^/]+$/.test(route.pathname)) {
      const section = decodeURIComponent(route.pathname.slice("/settings/".length));
      route.pathname = "/settings";
      url.searchParams.set("section", section);
    } else if (/^\/thread\/[^/]+$/.test(route.pathname)) {
      route.pathname = `/${route.pathname.slice("/thread/".length)}`;
    } else if (comparisonNewThreadProjectId(options) !== null) {
      route.pathname = `/${encodeURIComponent(options.threadId)}`;
    }
    url.hash = route.pathname + route.search;
  } else {
    url.hash = `/${encodeURIComponent(options.threadId)}`;
  }
  return url.toString();
}

export function comparisonElectronStartupUrl(options) {
  return comparisonWebUrl(options);
}

export function comparisonLynxDeepLink(options) {
  if (options.route !== null) {
    const route = new URL(options.route, "http://synara.local");
    const deepLink = new URL(`synara://${route.pathname.slice(1)}`);
    for (const [key, value] of route.searchParams) deepLink.searchParams.append(key, value);
    if (options.terminal === "open") deepLink.searchParams.set("terminal", "open");
    return deepLink.toString();
  }
  const url = new URL(`synara://thread/${encodeURIComponent(options.threadId)}`);
  if (options.terminal === "open") url.searchParams.set("terminal", "open");
  return url.toString();
}

export function comparisonRouteRestoreExpression(expectedUrl) {
  const expectedHash = new URL(expectedUrl).hash;
  return `location.hash = ${JSON.stringify(expectedHash)}; undefined`;
}

export function comparisonNewThreadOpenExpression(options) {
  const projectId = comparisonNewThreadProjectId(options);
  if (projectId === null) return null;
  return `(() => { const projectId = ${JSON.stringify(projectId)}; const trigger = Array.from(document.querySelectorAll('[data-testid=\"new-thread-button\"][data-project-id]')).find((node) => node.getAttribute('data-project-id') === projectId); if (!(trigger instanceof HTMLButtonElement)) return { clicked: false, projectId }; trigger.click(); return { clicked: true, projectId }; })()`;
}

export function comparisonNewThreadLandingReadyExpression(options) {
  const projectId = comparisonNewThreadProjectId(options);
  if (projectId === null) return null;
  return `import('/src/composerDraftStore.ts').then(({ useComposerDraftStore }) => { const pathname = location.hash.slice(1).split('?')[0]; const threadId = decodeURIComponent(pathname.slice(1)); const draft = useComposerDraftStore.getState().draftThreadsByThreadId[threadId] ?? null; const composer = document.querySelector('[data-empty-landing-composer-block=\"true\"]'); const localControl = Array.from(document.querySelectorAll('button')).find((node) => node.textContent?.trim() === 'Local'); const temporaryControl = document.querySelector('button[aria-label=\"Temporary chat\"]'); const projectTrigger = document.querySelector('[data-testid=\"project-picker-trigger\"]'); return { projectId: draft?.projectId ?? null, threadId, pathname, composerRendered: composer !== null && composer.getBoundingClientRect().width > 0, localControlRendered: localControl !== undefined && localControl.getBoundingClientRect().width > 0, temporaryControlRendered: temporaryControl !== null && temporaryControl.getBoundingClientRect().width > 0, projectTriggerRendered: projectTrigger !== null && projectTrigger.getBoundingClientRect().width > 0, notFound: document.body.innerText.includes('Not Found') }; })`;
}

export function electronComparisonUrlMatches(candidateUrl, expectedUrl) {
  try {
    const candidate = new URL(candidateUrl);
    const expected = new URL(expectedUrl);
    if (candidate.origin !== expected.origin || candidate.search !== expected.search) {
      return false;
    }
    const candidateHash = new URL(candidate.hash.slice(1) || "/", "http://synara.local");
    const expectedHash = new URL(expected.hash.slice(1) || "/", "http://synara.local");
    if (candidateHash.pathname !== expectedHash.pathname) return false;
    const transientRouteKeys = new Set(["panel", "diff", "diffTurnId", "diffFilePath"]);
    for (const [key, value] of expectedHash.searchParams) {
      if (transientRouteKeys.has(key) && !candidateHash.searchParams.has(key)) continue;
      if (!candidateHash.searchParams.getAll(key).includes(value)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function comparisonRendererResetExpression(
  theme,
  appSnap = "acknowledged",
  chatFontSize = null,
  threadId = null,
) {
  return `(() => { const state = Object.fromEntries(${JSON.stringify(
    COMPARISON_RENDERER_STORAGE_KEYS,
  )}.flatMap((key) => { const value = localStorage.getItem(key); return value === null ? [] : [[key, value]]; })); const appSettings = JSON.parse(state['synara:app-settings:v1'] ?? '{}'); appSettings.enableProviderUpdateChecks = false; appSettings.enableTaskCompletionToasts = false; appSettings[${JSON.stringify(COMPARISON_UNKNOWN_SETTING.key)}] = ${JSON.stringify(COMPARISON_UNKNOWN_SETTING.value)}; if (${JSON.stringify(chatFontSize)} !== null) appSettings.chatFontSizePx = ${JSON.stringify(chatFontSize)}; state['synara:app-settings:v1'] = JSON.stringify(appSettings); if (${JSON.stringify(threadId)} !== null) state['synara:recent-views:v1'] = JSON.stringify({ state: { recentViews: [{ kind: 'thread', threadId: ${JSON.stringify(threadId)} }, { kind: 'settings', section: 'general' }] }, version: 0 }); localStorage.clear(); for (const [key, value] of Object.entries(state)) localStorage.setItem(key, value); localStorage.setItem('synara:theme', ${JSON.stringify(theme)}); if (${JSON.stringify(appSnap)} === 'welcome') localStorage.removeItem('synara:appsnap-welcome:v1'); else localStorage.setItem('synara:appsnap-welcome:v1', '{"acknowledged":true}'); location.reload(); })(); undefined`;
}

/** Opens one singleton right-dock pane through the canonical Electron store. */
export function comparisonDockOpenExpression(threadId, kind) {
  return `import('/src/rightDockStore.ts').then(({ useRightDockStore }) => { useRightDockStore.getState().clearThreadDockState(${JSON.stringify(
    threadId,
  )}); useRightDockStore.getState().openPane(${JSON.stringify(threadId)}, { paneId: ${JSON.stringify(
    kind,
  )}, kind: ${JSON.stringify(kind)} }); })`;
}

export function comparisonDockReadyExpression(threadId, kind) {
  return `import('/src/rightDockStore.ts').then(({ useRightDockStore }) => { const dockState = useRightDockStore.getState().dockStateByThreadId[${JSON.stringify(
    threadId,
  )}]; const pane = dockState?.panes.find((candidate) => candidate.kind === ${JSON.stringify(
    kind,
  )}); return { paneOpen: dockState?.open === true && pane !== undefined && dockState.activePaneId === pane.id, persisted: (localStorage.getItem('synara:right-dock-state:v1') ?? '').includes(${JSON.stringify(
    `"kind":"${kind}"`,
  )}) }; })`;
}

export function comparisonTerminalOpenExpression(threadId) {
  return `import('/src/rightDockStore.ts').then(({ useRightDockStore }) => { const store = useRightDockStore.getState(); store.clearThreadDockState(${JSON.stringify(
    threadId,
  )}); useRightDockStore.getState().openPane(${JSON.stringify(threadId)}, { paneId: 'terminal', kind: 'terminal' }); })`;
}

export function comparisonThreadId(options) {
  if (options.route === null) return options.threadId;
  const pathname = new URL(options.route, "http://synara.local").pathname;
  const match = /^\/thread\/([^/]+)$/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
}

export function comparisonThreadIdentityReadyExpression(threadId) {
  const selector = `[data-thread-id=${JSON.stringify(threadId)}]`;
  return `(() => { const rows = Array.from(document.querySelectorAll(${JSON.stringify(
    selector,
  )})); const activeRows = rows.filter((row) => row.getAttribute('data-active') === 'true'); return { threadId: ${JSON.stringify(
    threadId,
  )}, count: rows.length, activeCount: activeRows.length, visibleActiveCount: activeRows.filter((row) => { const rect = row.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; }).length }; })()`;
}

export function comparisonTranscriptReadyExpression(expectation) {
  return `(() => { const scroll = document.querySelector('[data-chat-scroll-container="true"]'); const messages = Array.from(document.querySelectorAll('[data-timeline-row-kind="message"][data-message-id]')); const last = ${JSON.stringify(expectation.lastMessageId)} === null ? null : document.querySelector('[data-message-id=' + CSS.escape(${JSON.stringify(expectation.lastMessageId)}) + ']'); const scrollRect = scroll?.getBoundingClientRect(); const lastRect = last?.getBoundingClientRect(); const emptyStateRendered = ${expectation.messageCount} === 0 && document.body.innerText.includes('Send a message to start the conversation.'); const distanceFromBottom = scroll ? Math.max(0, scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop) : null; return { expectedMessageCount: ${expectation.messageCount}, renderedMessageCount: messages.length, lastMessageId: ${JSON.stringify(expectation.lastMessageId)}, lastMessageRendered: ${JSON.stringify(expectation.lastMessageId)} === null || last !== null, lastMessageVisible: ${JSON.stringify(expectation.lastMessageId)} === null || Boolean(lastRect && scrollRect && lastRect.bottom > scrollRect.top && lastRect.top < scrollRect.bottom), emptyStateRendered, scrollTop: scroll?.scrollTop ?? null, clientHeight: scroll?.clientHeight ?? null, scrollHeight: scroll?.scrollHeight ?? null, distanceFromBottom }; })()`;
}

export function comparisonTransientUiReadyExpression() {
  return `(() => { const notifications = Array.from(document.querySelectorAll('[data-toast-root="true"]')); return { recentViewSwitcherCount: document.querySelectorAll('[role="listbox"][aria-label="Recent views"]').length, selectionToolbarCount: document.querySelectorAll('[data-transcript-selection-action="true"]').length, dialogCount: document.querySelectorAll('[data-slot="dialog-popup"], [data-slot="alert-dialog-popup"], [data-slot="command-dialog-popup"]').length, menuCount: document.querySelectorAll('[data-slot="menu-popup"]').length, notificationCount: notifications.length, notificationDetails: notifications.map((node) => ({ text: node.textContent?.trim() ?? '', type: node.getAttribute('data-type'), state: node.getAttribute('data-state') })), resizeOverlayCount: document.querySelectorAll('[data-panel-resize-overlay="true"]').length }; })()`;
}

function nodeAttributeMap(node) {
  const attributes = node?.attributes ?? [];
  if (attributes.length > 0 && typeof attributes[0] === "object") {
    return Object.fromEntries(
      attributes.map((attribute) => [attribute.name, attribute.value ?? ""]),
    );
  }
  return Object.fromEntries(
    Array.from({ length: Math.floor(attributes.length / 2) }, (_, index) => [
      attributes[index * 2],
      attributes[index * 2 + 1] ?? "",
    ]),
  );
}

export function nativeThreadIdentityFromDom(root, threadId, lastMessageId = null) {
  const queue = [root];
  const matches = [];
  let transcriptListCount = 0;
  let lastMessageRendered = lastMessageId === null;
  let emptyStateRendered = false;
  while (queue.length > 0) {
    const node = queue.shift();
    const attributes = nodeAttributeMap(node);
    if (attributes["data-thread-id"] === threadId) {
      matches.push({
        nodeId: node.nodeId,
        active: attributes["data-active"] === "true",
      });
    }
    if (attributes.class?.split(/\s+/).includes("TranscriptList")) transcriptListCount += 1;
    if (lastMessageId !== null && attributes["item-key"] === lastMessageId) {
      lastMessageRendered = true;
    }
    if (attributes.text === "Send a message to start the conversation.") {
      emptyStateRendered = true;
    }
    queue.push(...(node?.children ?? []));
    queue.push(...(node?.shadowRoots ?? []));
    if (node?.contentDocument) queue.push(node.contentDocument);
  }
  return {
    threadId,
    count: matches.length,
    activeCount: matches.filter((match) => match.active).length,
    transcriptListCount,
    lastMessageId,
    lastMessageRendered,
    emptyStateRendered,
    matches,
  };
}

export function nativeTransientUiStateFromDom(root) {
  const queue = [root];
  const counts = {
    dialogCount: 0,
    menuLayerCount: 0,
    notificationCount: 0,
    resizeOverlayCount: 0,
    selectionToolbarCount: 0,
  };
  while (queue.length > 0) {
    const node = queue.shift();
    const classes = nodeAttributeMap(node).class?.split(/\s+/) ?? [];
    if (classes.includes("LxDialogOverlay")) counts.dialogCount += 1;
    if (classes.includes("LxMenuLayer")) counts.menuLayerCount += 1;
    if (classes.includes("ProviderUpdatePrompt") || classes.includes("TaskCompletionToast")) {
      counts.notificationCount += 1;
    }
    if (classes.some((name) => name.endsWith("ResizeOverlay"))) counts.resizeOverlayCount += 1;
    if (classes.includes("TranscriptSelectionToolbar")) counts.selectionToolbarCount += 1;
    queue.push(...(node?.children ?? []));
    queue.push(...(node?.shadowRoots ?? []));
    if (node?.contentDocument) queue.push(node.contentDocument);
  }
  return counts;
}

export function nativeThreadIdentityIsReady(
  identity,
  transcriptExpectation,
  requireSidebarIdentity = true,
) {
  const sidebarIdentityReady = requireSidebarIdentity
    ? identity.count >= 1 && identity.activeCount === 1
    : identity.count === 0 && identity.activeCount === 0;
  return (
    sidebarIdentityReady &&
    ((transcriptExpectation.messageCount === 0 && identity.emptyStateRendered) ||
      (identity.transcriptListCount === 1 && identity.lastMessageRendered)) &&
    Object.values(identity.transientUi).every((count) => count === 0)
  );
}

export function comparisonExplorerOpenExpression(options) {
  if (options.route === null) return null;
  const route = new URL(options.route, "http://synara.local");
  if (route.searchParams.get("explorer") !== "open") return null;
  const threadId = comparisonThreadId(options);
  if (!threadId) return null;
  return `import('/src/rightDockStore.ts').then(({ useRightDockStore }) => {
    useRightDockStore.getState().clearThreadDockState(${JSON.stringify(threadId)});
    useRightDockStore.getState().openPane(${JSON.stringify(threadId)}, { paneId: 'explorer', kind: 'explorer' });
  })`;
}

export function comparisonDiffOpenExpression(options) {
  if (options.route === null) return null;
  const route = new URL(options.route, "http://synara.local");
  if (!["1", "open"].includes(route.searchParams.get("diff") ?? "")) return null;
  const threadId = comparisonThreadId(options);
  if (!threadId) return null;
  const diffTurnId = route.searchParams.get("diffTurnId")?.trim() || null;
  const diffFilePath = route.searchParams.get("diffFilePath")?.trim() || null;
  return `import('/src/rightDockStore.ts').then(async ({ useRightDockStore }) => {
    await useRightDockStore.persist.rehydrate();
    useRightDockStore.setState((current) => ({ dockStateByThreadId: { ...current.dockStateByThreadId, [${JSON.stringify(threadId)}]: { open: true, activePaneId: 'diff', panes: [{ id: 'diff', kind: 'diff', threadId: null, diffTurnId: ${JSON.stringify(diffTurnId)}, diffFilePath: ${JSON.stringify(diffFilePath)}, filePath: null, pullRequestProjectId: null, pullRequestRepository: null, pullRequestNumber: null, pullRequestInitialTab: null }] } } }));
  })`;
}

export function comparisonDiffReadyExpression(options) {
  const threadId = comparisonThreadId(options);
  if (!threadId || options.route === null) return null;
  const route = new URL(options.route, "http://synara.local");
  if (!["1", "open"].includes(route.searchParams.get("diff") ?? "")) return null;
  const diffTurnId = route.searchParams.get("diffTurnId")?.trim() || null;
  return `import('/src/rightDockStore.ts').then(({ useRightDockStore }) => { const dockState = useRightDockStore.getState().dockStateByThreadId[${JSON.stringify(threadId)}]; const pane = dockState?.panes.find((candidate) => candidate.kind === 'diff'); return { paneOpen: dockState?.open === true && pane !== undefined && dockState.activePaneId === pane.id, turnMatched: (pane?.diffTurnId ?? null) === ${JSON.stringify(diffTurnId)}, actualTurnId: pane?.diffTurnId ?? null, activePaneId: dockState?.activePaneId ?? null, panes: dockState?.panes ?? [], rendered: document.body.innerText.includes('Changes') }; })`;
}

export function comparisonExplorerPath(options) {
  if (options.route === null) return null;
  const route = new URL(options.route, "http://synara.local");
  if (route.searchParams.get("explorer") !== "open") return null;
  return route.searchParams.get("explorerPath")?.trim() || null;
}

export function comparisonExplorerRowClickExpression(path) {
  return `(() => { const row = Array.from(document.querySelectorAll('button[title]')).find((candidate) => candidate.getAttribute('title') === ${JSON.stringify(path)}); if (!row) return false; row.click(); return true; })()`;
}

export function comparisonExplorerReadyExpression(path) {
  return `(() => { const row = Array.from(document.querySelectorAll('button[title]')).find((candidate) => candidate.getAttribute('title') === ${JSON.stringify(path)}); return { selected: row?.className.includes('bg-[var(--color-background-button-secondary)]') === true, previewLoaded: document.querySelector('.editor-file-viewer__highlight, .editor-file-viewer__plain') !== null }; })()`;
}

export function comparisonTerminalReadyExpression(threadId) {
  const scopeId = `dock-terminal:${threadId}`;
  return `Promise.all([import('/src/rightDockStore.ts'), import('/src/terminalStateStore.ts')]).then(([{ useRightDockStore }, { useTerminalStateStore, flushTerminalStatePersistence }]) => { const dockState = useRightDockStore.getState().dockStateByThreadId[${JSON.stringify(
    threadId,
  )}]; const terminalState = useTerminalStateStore.getState().terminalStateByThreadId[${JSON.stringify(
    scopeId,
  )}]; const terminalPane = dockState?.panes.find((pane) => pane.kind === 'terminal'); const paneOpen = dockState?.open === true && terminalPane !== undefined && dockState.activePaneId === terminalPane.id; const terminalOpen = terminalState?.terminalOpen === true; const xtermCount = document.querySelectorAll('.xterm').length; const sleepingPreview = document.body.innerText.includes('Terminal is sleeping. Restoring shortly.'); const rendered = xtermCount > 0 && !sleepingPreview; if (paneOpen && terminalOpen && rendered) flushTerminalStatePersistence(); return { paneOpen, terminalOpen, rendered, xtermCount, sleepingPreview, persistedDock: localStorage.getItem('synara:right-dock-state:v1') !== null, persistedTerminal: localStorage.getItem('synara:terminal-state:v1') !== null }; })`;
}

export function desktopComparisonCommands(options, paths, authToken, electronExecutable) {
  const webUrl = comparisonElectronStartupUrl(options);
  return {
    preRuntimeBuild: [
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
        args: ["run", "build:web"],
        cwd: join(paths.root, "apps", "lynx"),
        env: {},
      },
      // The Native bundle is endpoint-independent: the Lynxtron host hands the
      // live backend URL to the renderer at load time, so one build serves every
      // run and a stale port can never be compiled in.
      {
        command: "bun",
        args: ["run", "build"],
        cwd: join(paths.root, "apps", "lynx"),
        env: { SYNARA_WS_URL: "" },
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
        // A comparison must not depend on whether the window is covered: occluded
        // Chromium windows stop requestAnimationFrame, and the thread composer
        // waits for one before it mounts.
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        `--user-data-dir=${paths.electronUserDataDir}`,
        `--synara-dev-root=${join(paths.root, "apps", "desktop")}`,
        paths.electronEntry,
      ],
      cwd: join(paths.root, "apps", "desktop"),
      env: {
        SYNARA_HOME: paths.electronHome,
        SYNARA_ALLOW_PARALLEL_INSTANCE: "1",
        // Both renderers open inactive so a comparison never steals focus.
        SYNARA_BACKGROUND_LAUNCH: "1",
        SYNARA_DESKTOP_AUTH_TOKEN: authToken,
        SYNARA_DESKTOP_USER_DATA_DIR: paths.electronUserDataDir,
        SYNARA_DISABLE_THREAD_RETENTION: "1",
        SYNARA_SKIP_SHELL_ENVIRONMENT_SYNC: "1",
        SYNARA_SKIP_MEDIA_PERMISSION_SETUP: "1",
        VITE_DEV_SERVER_URL: webUrl,
      },
    },
    lynx: {
      command: paths.ownedLynxtronExecutable,
      args: [paths.lynxApp, comparisonLynxDeepLink(options)],
      cwd: paths.root,
      env: {
        NODE_ENV: "production",
        SYNARA_ALLOW_PARALLEL_INSTANCE: "1",
        SYNARA_BACKGROUND_LAUNCH: "1",
        SYNARA_ENABLE_DEVTOOL: "1",
        SYNARA_LYNX_USER_DATA_DIR: paths.lynxUserDataDir,
        SYNARA_MANAGED_RELAUNCH: "1",
        ...(options.systemAppearanceSequence
          ? { SYNARA_SYSTEM_APPEARANCE_PROBE_SEQUENCE: options.systemAppearanceSequence }
          : {}),
        ...(options.systemAppearanceIntervalMs
          ? {
              SYNARA_SYSTEM_APPEARANCE_PROBE_INTERVAL_MS: String(
                options.systemAppearanceIntervalMs,
              ),
            }
          : {}),
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

export function writeComparisonRendererState(paths, rendererState, comparisonTheme = "dark") {
  const allowlisted = Object.fromEntries(
    COMPARISON_RENDERER_STORAGE_KEYS.flatMap((key) => {
      const value = rendererState?.[key];
      return typeof value === "string" ? [[key, value]] : [];
    }),
  );
  allowlisted["synara:theme"] = comparisonTheme;
  mkdirSync(dirname(paths.lynxKvState), { recursive: true });
  writeFileSync(paths.lynxKvState, JSON.stringify(allowlisted));
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

export function lsofShowsPidListeningOnPort(output, pid, port) {
  const expectedPid = String(pid);
  const expectedEndpoint = `TCP *:${port} (LISTEN)`;
  const expectedLoopbackEndpoint = `TCP 127.0.0.1:${port} (LISTEN)`;
  return output.split("\n").some((line) => {
    const columns = line.trim().split(/\s+/);
    return (
      columns[1] === expectedPid &&
      (line.includes(expectedEndpoint) || line.includes(expectedLoopbackEndpoint))
    );
  });
}

export function pidOwnedDevtoolPortsFromLsof(output, pid) {
  const expectedPid = String(pid);
  return Array.from(
    new Set(
      output
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .flatMap((line) => {
          const columns = line.split(/\s+/);
          if (columns[1] !== expectedPid) return [];
          const match = line.match(/TCP (?:\*|127\.0\.0\.1):(89(?:0[1-9]|1[0-9]|20)) \(LISTEN\)/);
          return match ? [Number(match[1])] : [];
        }),
    ),
  ).sort((left, right) => left - right);
}

function pidOwnedDevtoolPorts(pid) {
  const listeners = spawnSync("lsof", ["-nP", "-a", "-p", String(pid), "-iTCP", "-sTCP:LISTEN"], {
    encoding: "utf8",
  });
  if (listeners.error) throw listeners.error;
  return pidOwnedDevtoolPortsFromLsof(listeners.stdout, pid);
}

export function resolveLynxDevtoolReadyTimeoutMs(
  raw = process.env.SYNARA_COMPARE_LYNX_DEVTOOL_READY_TIMEOUT_MS,
) {
  const timeoutMs = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 30_000;
}

async function waitForOwnedDevtoolListener(
  child,
  preferredPort,
  timeoutMs = resolveLynxDevtoolReadyTimeoutMs(),
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `Lynxtron exited before its DevTool listener became ready near preferred port ${preferredPort}.`,
      );
    }
    if (child.pid) {
      const ports = pidOwnedDevtoolPorts(child.pid);
      if (ports.length === 1) return { pid: child.pid, port: ports[0] };
      if (ports.length > 1) {
        throw new Error(
          `Owned Lynxtron PID ${child.pid} opened multiple DevTool listeners: ${ports.join(", ")}.`,
        );
      }
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(
    `Owned Lynxtron PID ${child.pid ?? "<unavailable>"} did not open a DevTool listener in 8901-8920 near preferred port ${preferredPort}. ` +
      "Desktop DebugRouter chooses the first free port in 8901-8920; --lynx-devtool-port reserves a preferred free slot but is not a runtime override. " +
      "The installed @lynx-js/lynxtron runtime may also lack an inspector-capable devtool variant; SYNARA_ENABLE_DEVTOOL cannot add inspector support to a release-only binary.",
  );
}

async function verifyOwnedNativeThreadIdentity(
  port,
  threadId,
  transcriptExpectation,
  requireSidebarIdentity = true,
  timeoutMs = 20_000,
) {
  const connectorPath = process.env.LYNX_DEVTOOL_CONNECTOR?.trim() || defaultLynxDevtoolConnector;
  if (!existsSync(connectorPath)) {
    throw new Error(`Lynx DevTool connector is missing at ${connectorPath}.`);
  }
  const { createDefaultConnector } = await import(connectorPath);
  const connector = createDefaultConnector();
  const clientId = `localhost:${port}`;
  const deadline = Date.now() + timeoutMs;
  let lastIdentity = null;
  let cleanSince = null;
  const stableCleanWindowMs = 1_500;
  while (Date.now() < deadline) {
    const clients = await connector.listClients();
    if (!clients.some((client) => client.id === clientId)) {
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
      continue;
    }
    const sessions = await connector.sendListSessionMessage(clientId);
    const session = sessions.at(-1);
    if (!session) {
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
      continue;
    }
    const document = await connector.sendCDPMessage(
      clientId,
      session.session_id,
      "DOM.getDocument",
      { depth: -1 },
    );
    lastIdentity = nativeThreadIdentityFromDom(
      document?.result?.root ?? document?.root ?? document?.result ?? document,
      threadId,
      transcriptExpectation.lastMessageId,
    );
    const transientUi = nativeTransientUiStateFromDom(
      document?.result?.root ?? document?.root ?? document?.result ?? document,
    );
    lastIdentity = { ...lastIdentity, transientUi };
    const ready = nativeThreadIdentityIsReady(
      lastIdentity,
      transcriptExpectation,
      requireSidebarIdentity,
    );
    if (!ready) {
      cleanSince = null;
    } else if (cleanSince === null) {
      cleanSince = Date.now();
    } else if (Date.now() - cleanSince >= stableCleanWindowMs) {
      console.log(
        `[compare:desktop] Native thread/transcript anchor verified: ${JSON.stringify(lastIdentity)}.`,
      );
      return lastIdentity;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(
    `Timed out confirming Native thread/transcript identity ${threadId}: ${JSON.stringify(lastIdentity)}.`,
  );
}

async function waitForRuntimeState(runtimePath, launchedAt, timeoutMs = 90_000) {
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

const sleep = (ms) => new Promise((resolveWait) => setTimeout(resolveWait, ms));

const ELECTRON_ACTIVITY_TRAIL_LIMIT = 400;

/**
 * Every Electron CDP evaluation goes through this client so a failure always
 * carries the exact activity, request id, attempt, and timing that preceded it.
 * Reloads legitimately destroy the execution context ("Promise was collected");
 * idempotent reads retry through that, anything else fails loudly.
 */
export function createElectronCdpClient(socket, trail = []) {
  let requestId = 0;
  const evaluate = async (
    expression,
    activity,
    { retryTransient = false, awaitPromise = true, timeoutMs = 5_000 } = {},
  ) => {
    for (let attempt = 1; ; attempt += 1) {
      requestId += 1;
      const startedAt = Date.now();
      const entry = { at: new Date(startedAt).toISOString(), requestId, activity, attempt };
      trail.push(entry);
      if (trail.length > ELECTRON_ACTIVITY_TRAIL_LIMIT) {
        trail.splice(0, trail.length - ELECTRON_ACTIVITY_TRAIL_LIMIT);
      }
      try {
        const value = await evaluateElectronExpression(socket, requestId, expression, activity, {
          awaitPromise,
          timeoutMs,
        });
        entry.ms = Date.now() - startedAt;
        entry.ok = true;
        return value;
      } catch (error) {
        entry.ms = Date.now() - startedAt;
        entry.ok = false;
        entry.error = error instanceof Error ? error.message : String(error);
        if (retryTransient && attempt < 3 && isTransientCdpContextError(entry.error)) {
          await sleep(250);
          continue;
        }
        throw error;
      }
    }
  };
  // Page lifecycle events explain context loss ("Promise was collected"):
  // record them in the same trail as the requests they interrupt.
  const lifecycleEvents = new Set([
    "Runtime.executionContextDestroyed",
    "Runtime.executionContextCreated",
    "Page.frameNavigated",
    "Page.loadEventFired",
  ]);
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!lifecycleEvents.has(message.method)) return;
    trail.push({
      at: new Date().toISOString(),
      event: message.method,
      url: message.params?.frame?.url ?? message.params?.context?.origin ?? undefined,
    });
  });
  for (const [offset, method] of ["Runtime.enable", "Page.enable"].entries()) {
    socket.send(JSON.stringify({ id: 1_000_000 + offset, method }));
  }
  return { evaluate, trail };
}

async function pollElectron(cdp, expression, activity, isReady, timeoutMs, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs;
  let value = null;
  while (Date.now() < deadline) {
    value = await cdp.evaluate(expression, activity, { retryTransient: true });
    if (isReady(value)) return { ready: true, value };
    await sleep(intervalMs);
  }
  return { ready: false, value };
}

function transcriptAnchorReady(transcriptExpectation, readiness) {
  return (
    (transcriptExpectation.messageCount === 0 && readiness?.emptyStateRendered === true) ||
    (readiness?.lastMessageRendered === true &&
      readiness?.lastMessageVisible === true &&
      readiness?.clientHeight > 0 &&
      readiness?.scrollHeight >= readiness?.clientHeight)
  );
}

async function findElectronPageTarget(cdpPort, startupUrl, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((response) =>
        response.json(),
      );
      const target = targets.find(
        (candidate) =>
          candidate.type === "page" &&
          new URL(candidate.url).origin === new URL(startupUrl).origin &&
          typeof candidate.webSocketDebuggerUrl === "string",
      );
      if (target) return target;
    } catch {}
    await sleep(100);
  }
  return null;
}

async function settleElectronRoute(cdp, expectedUrl) {
  await cdp.evaluate(
    comparisonRouteRestoreExpression(expectedUrl),
    "restoring the Electron comparison route",
    { retryTransient: true },
  );
  const routeDeadline = Date.now() + 30_000;
  let stableRouteSince = 0;
  let lastObservedRoute = null;
  while (
    Date.now() < routeDeadline &&
    (stableRouteSince === 0 || Date.now() - stableRouteSince < 5_000)
  ) {
    const currentUrl = await cdp.evaluate(
      "location.href",
      "reading the Electron comparison route",
      {
        retryTransient: true,
      },
    );
    lastObservedRoute = typeof currentUrl === "string" ? currentUrl : null;
    if (typeof currentUrl === "string" && electronComparisonUrlMatches(currentUrl, expectedUrl)) {
      if (stableRouteSince === 0) stableRouteSince = Date.now();
    } else {
      stableRouteSince = 0;
      await cdp.evaluate(
        comparisonRouteRestoreExpression(expectedUrl),
        "reasserting the Electron comparison route",
        { retryTransient: true },
      );
    }
    await sleep(100);
  }
  if (stableRouteSince === 0 || Date.now() - stableRouteSince < 5_000) {
    throw new Error(
      `Timed out restoring the Electron comparison route ${expectedUrl}; last observed ${lastObservedRoute ?? "<unavailable>"}.`,
    );
  }
}

async function certifyElectronAnchor(cdp, identityThreadId, transcriptExpectation) {
  const identity = await pollElectron(
    cdp,
    comparisonThreadIdentityReadyExpression(identityThreadId),
    `confirming Electron sidebar identity ${identityThreadId}`,
    (value) => value?.count >= 1 && value?.visibleActiveCount === 1,
    15_000,
  );
  if (!identity.ready) {
    throw new Error(
      `Timed out confirming Electron sidebar identity ${identityThreadId}: ${JSON.stringify(identity.value)}.`,
    );
  }
  const transcript = await pollElectron(
    cdp,
    comparisonTranscriptReadyExpression(transcriptExpectation),
    `confirming Electron transcript anchor ${transcriptExpectation.lastMessageId ?? "<empty>"}`,
    (value) => transcriptAnchorReady(transcriptExpectation, value),
    15_000,
  );
  if (!transcript.ready) {
    throw new Error(
      `Timed out confirming Electron transcript anchor: ${JSON.stringify(transcript.value)}.`,
    );
  }
  console.log(
    `[compare:desktop] Electron transcript anchor verified: ${JSON.stringify(transcript.value)}.`,
  );
  const transientDeadline = Date.now() + 10_000;
  let transientUi = null;
  let cleanTransientSince = 0;
  while (
    (cleanTransientSince === 0 && Date.now() < transientDeadline) ||
    (cleanTransientSince !== 0 && Date.now() - cleanTransientSince < 250)
  ) {
    transientUi = await cdp.evaluate(
      comparisonTransientUiReadyExpression(),
      "confirming clean Electron transient UI state",
      { retryTransient: true },
    );
    const clean = Object.values(transientUi ?? {}).every(
      (value) => typeof value !== "number" || value === 0,
    );
    cleanTransientSince = clean ? cleanTransientSince || Date.now() : 0;
    await sleep(50);
  }
  if (cleanTransientSince === 0 || Date.now() - cleanTransientSince < 250) {
    throw new Error(`Electron comparison retained transient UI: ${JSON.stringify(transientUi)}.`);
  }
  console.log(
    `[compare:desktop] Electron transient UI verified clean: ${JSON.stringify(transientUi)}.`,
  );
  return { identity: identity.value, transcript: transcript.value, transientUi };
}

async function openElectronNewThreadLanding(cdp, options) {
  const newThreadLandingExpression = comparisonNewThreadLandingReadyExpression(options);
  if (!newThreadLandingExpression) return;
  const openResult = await cdp.evaluate(
    comparisonNewThreadOpenExpression(options),
    "opening the Electron project landing through its rendered New thread action",
  );
  if (openResult?.clicked !== true) {
    throw new Error(
      `Unable to activate the Electron project New thread action: ${JSON.stringify(openResult)}.`,
    );
  }
  const projectId = comparisonNewThreadProjectId(options);
  const landing = await pollElectron(
    cdp,
    newThreadLandingExpression,
    "confirming the Electron project landing",
    (value) =>
      value?.projectId === projectId &&
      value?.composerRendered === true &&
      value?.localControlRendered === true &&
      value?.temporaryControlRendered === true &&
      value?.projectTriggerRendered === true &&
      value?.notFound === false,
    15_000,
  );
  if (!landing.ready) {
    throw new Error(
      `Timed out confirming Electron project landing: ${JSON.stringify(landing.value)}.`,
    );
  }
  console.log(
    `[compare:desktop] Electron project landing verified: ${JSON.stringify(landing.value)}.`,
  );
}

async function openElectronExplorer(cdp, options) {
  const explorerExpression = comparisonExplorerOpenExpression(options);
  if (!explorerExpression) return;
  await cdp.evaluate(explorerExpression, "opening the canonical Electron Explorer fixture", {
    retryTransient: true,
  });
  const explorerPath = comparisonExplorerPath(options);
  if (!explorerPath) return;
  const segments = explorerPath.split("/").filter(Boolean);
  for (const targetPath of segments.map((_, index) => segments.slice(0, index + 1).join("/"))) {
    const row = await pollElectron(
      cdp,
      comparisonExplorerRowClickExpression(targetPath),
      `opening Electron Explorer row ${targetPath}`,
      (clicked) => clicked === true,
      15_000,
    );
    if (!row.ready) throw new Error(`Timed out opening Electron Explorer row ${targetPath}.`);
  }
  const preview = await pollElectron(
    cdp,
    comparisonExplorerReadyExpression(explorerPath),
    `confirming Electron Explorer preview ${explorerPath}`,
    (value) => value?.selected && value?.previewLoaded,
    15_000,
  );
  if (!preview.ready) {
    throw new Error(
      `Timed out confirming Electron Explorer preview ${explorerPath}: ${JSON.stringify(preview.value)}.`,
    );
  }
}

async function openElectronDiff(cdp, options) {
  const diffExpression = comparisonDiffOpenExpression(options);
  if (!diffExpression) return;
  await cdp.evaluate(diffExpression, "opening the canonical Electron Diff fixture", {
    retryTransient: true,
  });
  const diff = await pollElectron(
    cdp,
    comparisonDiffReadyExpression(options),
    "confirming the canonical Electron Diff fixture",
    (value) => value?.paneOpen && value?.turnMatched && value?.rendered,
    30_000,
  );
  if (!diff.ready) {
    throw new Error(
      `Timed out opening the canonical Electron Diff fixture: ${JSON.stringify(diff.value)}.`,
    );
  }
}

async function openElectronDock(cdp, options) {
  const threadId = comparisonThreadId(options) ?? options.threadId;
  await cdp.evaluate(
    comparisonDockOpenExpression(threadId, options.dock),
    `opening the canonical Electron ${options.dock} pane`,
    { retryTransient: true },
  );
  const dock = await pollElectron(
    cdp,
    comparisonDockReadyExpression(threadId, options.dock),
    `confirming the canonical Electron ${options.dock} pane`,
    (value) => value?.paneOpen === true && value?.persisted === true,
    30_000,
  );
  if (!dock.ready) {
    throw new Error(
      `Timed out opening the canonical Electron ${options.dock} pane: ${JSON.stringify(dock.value)}.`,
    );
  }
}

async function openElectronTerminal(cdp, options) {
  const terminalThreadId = comparisonThreadId(options) ?? options.threadId;
  await cdp.evaluate(
    comparisonTerminalOpenExpression(terminalThreadId),
    "opening the canonical Electron Terminal pane",
    { retryTransient: true },
  );
  const terminal = await pollElectron(
    cdp,
    comparisonTerminalReadyExpression(terminalThreadId),
    "confirming the canonical Electron Terminal pane",
    (value) =>
      value?.paneOpen === true &&
      value?.terminalOpen === true &&
      value?.rendered === true &&
      value?.persistedDock === true &&
      value?.persistedTerminal === true,
    30_000,
  );
  if (!terminal.ready) {
    throw new Error(
      `Timed out opening the canonical Electron Terminal pane: ${JSON.stringify(terminal.value)}.`,
    );
  }
}

async function configureElectronRenderer(
  cdpPort,
  options,
  transcriptExpectation = null,
  trail = [],
  timeoutMs = 30_000,
) {
  const expectedUrl = comparisonWebUrl(options);
  const startupUrl = comparisonElectronStartupUrl(options);
  const target = await findElectronPageTarget(cdpPort, startupUrl, timeoutMs);
  if (!target) {
    throw new Error(`Timed out waiting for the Electron page at ${expectedUrl}.`);
  }

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });
  const cdp = createElectronCdpClient(socket, trail);
  try {
    // A page target exists before its document commits. Module imports only
    // resolve once the dev-server document has loaded, so gate on that
    // explicitly instead of relying on incidental startup delay.
    const expectedOrigin = new URL(startupUrl).origin;
    const document = await pollElectron(
      cdp,
      "({ origin: location.origin, readyState: document.readyState })",
      "waiting for the Electron document to load",
      (value) => value?.origin === expectedOrigin && value?.readyState === "complete",
      timeoutMs,
    );
    if (!document.ready) {
      throw new Error(
        `Timed out waiting for the Electron document at ${expectedOrigin}: ${JSON.stringify(document.value)}.`,
      );
    }
    // Settle provider status before either renderer is retained, so both read
    // the same provider snapshot.
    await cdp.evaluate(
      "import('/src/nativeApi.ts').then(({ ensureNativeApi }) => ensureNativeApi().server.refreshProviders()).then(() => undefined)",
      "refreshing comparison providers",
      { retryTransient: true, timeoutMs: 30_000 },
    );
    // The reset reloads the page synchronously at its end; it must not await.
    await cdp.evaluate(
      comparisonRendererResetExpression(
        options.theme,
        options.appSnap,
        options.chatFontSize,
        comparisonElectronAnchorThreadId(options),
      ),
      "configuring the Electron comparison state",
      { awaitPromise: false },
    );
    const settings = await pollElectron(
      cdp,
      comparisonRendererStateExpression(),
      "reading Electron comparison state",
      (state) => typeof state?.["synara:app-settings:v1"] === "string",
      timeoutMs,
    );
    if (!settings.ready) throw new Error("Timed out waiting for canonical Electron app settings.");
    const rendererState = settings.value;

    await settleElectronRoute(cdp, expectedUrl);
    const identityThreadId = comparisonElectronAnchorThreadId(options);
    const anchor = identityThreadId
      ? await certifyElectronAnchor(cdp, identityThreadId, transcriptExpectation)
      : null;
    await openElectronNewThreadLanding(cdp, options);
    await openElectronExplorer(cdp, options);
    await openElectronDiff(cdp, options);
    if (options.dock) await openElectronDock(cdp, options);
    if (options.terminal === "open") await openElectronTerminal(cdp, options);
    if (options.terminal === "open" || options.dock) {
      // The dock/terminal state just changed; hand Native the synchronized copy.
      return {
        rendererState: await cdp.evaluate(
          comparisonRendererStateExpression(),
          "reading synchronized Electron comparison state",
          { retryTransient: true },
        ),
        anchor,
      };
    }
    return { rendererState, anchor };
  } catch (error) {
    const recent = trail
      .slice(-10)
      .map((entry) =>
        entry.event
          ? `${entry.at} event ${entry.event}${entry.url ? ` ${entry.url}` : ""}`
          : `${entry.at} #${entry.requestId} ${entry.activity} attempt=${entry.attempt} ${entry.ok ? "ok" : `failed: ${entry.error}`} ${entry.ms ?? "?"}ms`,
      );
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}\nRecent Electron activity:\n  ${recent.join("\n  ")}`,
      { cause: error },
    );
  } finally {
    socket.close();
  }
}

function comparisonRendererStateExpression() {
  return `Object.fromEntries(${JSON.stringify(
    COMPARISON_RENDERER_STORAGE_KEYS,
  )}.flatMap((key) => { const value = localStorage.getItem(key); return value === null ? [] : [[key, value]]; }))`;
}

export function electronEvaluationError(message, activity) {
  if (message?.error) return new Error(message.error.message);
  const details = message?.result?.exceptionDetails;
  if (!details) return null;
  const description =
    details.exception?.description ??
    details.exception?.value ??
    details.text ??
    "Unknown renderer exception";
  return new Error(`Failed ${activity}: ${description}`);
}

function evaluateElectronExpression(
  socket,
  requestId,
  expression,
  activity,
  { awaitPromise = true, timeoutMs = 5_000 } = {},
) {
  return new Promise((resolveEvaluation, rejectEvaluation) => {
    const timeout = setTimeout(() => {
      socket.removeEventListener("message", onMessage);
      rejectEvaluation(new Error(`Timed out ${activity}.`));
    }, timeoutMs);
    const onMessage = (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== requestId) return;
      socket.removeEventListener("message", onMessage);
      clearTimeout(timeout);
      const error = electronEvaluationError(message, activity);
      if (error) {
        rejectEvaluation(error);
      } else {
        resolveEvaluation(message.result?.result?.value);
      }
    };
    socket.addEventListener("message", onMessage);
    socket.send(
      JSON.stringify({
        id: requestId,
        method: "Runtime.evaluate",
        params: { expression, awaitPromise, returnByValue: true },
      }),
    );
  });
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
    detached: false,
    stdio: "inherit",
  });
}

function stopOwned(child, signal) {
  if (!child?.pid) return;
  try {
    child.kill(signal);
  } catch {}
}

async function resolveElectronExecutable(webUrl) {
  process.env.VITE_DEV_SERVER_URL = webUrl;
  const launcher = await import(
    new URL("../apps/desktop/scripts/electron-launcher.mjs", import.meta.url)
  );
  return launcher.resolveElectronPath({ background: true });
}

export function ownedComparisonPidsFromPs(output, paths, electronExecutable, webPort) {
  return {
    lynxtron: ownedLynxtronPidsFromPs(output, paths.ownedLynxtronExecutable),
    electron: ownedElectronPidsFromPs(output, electronExecutable, paths.electronUserDataDir),
    web: ownedWebPidsFromPs(output, join(paths.root, "apps", "web"), webPort),
  };
}

function listOwnedComparisonProcesses(paths, electronExecutable, webPort) {
  const processes = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
  if (processes.status !== 0) {
    throw new Error(`Failed to inspect owned processes: ${processes.stderr.trim()}`);
  }
  return ownedComparisonPidsFromPs(processes.stdout, paths, electronExecutable, webPort);
}

/**
 * Every Native socket must reach the certified backend. The Lynxtron host owns
 * all renderer transports (RPC, streams, Terminal), so its established TCP
 * connections are the ground truth for "which server is this window using".
 */
async function verifyNativeBackendConnections(paths, lynx, runtimePort, devtoolPort, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    const processes = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
    const pids = [
      ...new Set([
        ...(lynx.pid ? [lynx.pid] : []),
        ...ownedLynxtronPidsFromPs(processes.stdout ?? "", paths.ownedLynxtronExecutable),
      ]),
    ];
    last = inspectNativeBackendConnections(pids, { runtimePort, devtoolPort });
    if (last.violations.length > 0) {
      throw new Error(
        `Native process is connected to a backend other than 127.0.0.1:${runtimePort}: ${JSON.stringify(last.violations)}.`,
      );
    }
    if (last.backend.length > 0) return last;
    await sleep(250);
  }
  throw new Error(
    `Native process never connected to the certified backend 127.0.0.1:${runtimePort}: ${JSON.stringify(last)}.`,
  );
}

async function readBackendIdentity(socketUrl) {
  const session = await openSynaraRpcSession(socketUrl, "comparison-harness");
  try {
    const snapshot = await session.request("orchestration.getSnapshot", {});
    return {
      serverInstanceId: session.serverInstanceId,
      snapshotSequence: snapshot?.snapshotSequence ?? null,
      visibleThreadIds: (snapshot?.threads ?? [])
        .filter((thread) => thread.deletedAt === null && thread.archivedAt === null)
        .map((thread) => thread.id)
        .sort(),
    };
  } finally {
    session.close();
  }
}

function eventTypesAfter(databasePath, sequence) {
  const result = spawnSync(
    "sqlite3",
    [
      "-json",
      databasePath,
      `select event_type as type, count(*) as count from orchestration_events where sequence > ${Number(sequence)} group by event_type order by event_type;`,
    ],
    { encoding: "utf8" },
  );
  return result.status === 0
    ? JSON.parse(result.stdout || "[]")
    : [{ error: result.stderr.trim() }];
}

async function main() {
  const parsedOptions = parseDesktopComparisonArgs(process.argv.slice(2));
  const fixtureManifest = parsedOptions.seed === "fixture" ? readComparisonFixtureManifest() : null;
  const options = resolveComparisonSeedOptions(parsedOptions, fixtureManifest);
  const paths = resolveDesktopComparisonPaths(repositoryRoot, undefined, existsSync, options.seed);
  const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;
  const run = createRunManifest({ runId, options, paths });
  const persistRun = () => writeRunManifest(paths.runsDir, run);
  persistRun();
  const authToken =
    process.env.SYNARA_COMPARE_AUTH_TOKEN?.trim() || "synara-local-desktop-comparison";
  const electronExecutable = await resolveElectronExecutable(comparisonElectronStartupUrl(options));
  const commands = desktopComparisonCommands(options, paths, authToken, electronExecutable);
  const ownedChildren = [];
  let shuttingDown = false;
  const stopAllOwned = (signal) => {
    for (const child of ownedChildren.toReversed()) stopOwned(child, signal);
    // Lynxtron may hand off to a replacement process and let the originally
    // spawned child exit successfully. That replacement is no longer present
    // in ownedChildren, but it is still uniquely identified by the copied
    // comparison executable. Reap it on every shutdown so later evidence runs
    // cannot attach to a stale window or DevTool listener.
    stopExistingOwnedLynxtronRuntime(paths);
    stopExistingOwnedElectronRuntime(paths, electronExecutable);
    stopExistingOwnedWebRuntime(paths, options.webPort);
  };
  const trackChild = (name, child) => {
    child.once("exit", (code, signal) => {
      run.children.push({
        name,
        pid: child.pid ?? null,
        code,
        signal,
        at: new Date().toISOString(),
        duringShutdown: shuttingDown,
      });
    });
  };

  // Stops every owned process, then proves none survived before exiting. The
  // cleanup result is part of the run evidence.
  const shutdown = (exitCode, reason) => {
    if (shuttingDown) return;
    shuttingDown = true;
    recordPhase(run, "shutdown", { reason, exitCode });
    stopAllOwned("SIGTERM");
    setTimeout(() => {
      stopAllOwned("SIGKILL");
      setTimeout(() => {
        const leftovers = listOwnedComparisonProcesses(paths, electronExecutable, options.webPort);
        const clean = Object.values(leftovers).every((pids) => pids.length === 0);
        run.cleanup = { at: new Date().toISOString(), clean, leftovers };
        run.endedAt = new Date().toISOString();
        persistRun();
        console.log(
          `[compare:desktop] Cleanup ${clean ? "verified" : "FAILED"}: ${JSON.stringify(leftovers)}.`,
        );
        process.exit(clean ? exitCode : 1);
      }, 500);
    }, 1_500);
  };
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.once(signal, () => shutdown(0, signal));
  }
  process.stdin.once("close", () => shutdown(0, "stdin-closed"));
  process.once("disconnect", () => shutdown(0, "disconnect"));
  const parentPid = process.ppid;
  const parentWatchdog = setInterval(() => {
    if (process.ppid === 1) {
      shutdown(0, "parent-exited");
      return;
    }
    try {
      process.kill(parentPid, 0);
    } catch {
      shutdown(0, "parent-exited");
    }
  }, 500);
  parentWatchdog.unref();

  try {
    for (const [label, port] of [
      ["Web", options.webPort],
      ["Electron CDP", options.electronCdpPort],
      ["Lynx DevTool", options.lynxDevtoolPort],
    ]) {
      if (await isPortOpen(port)) {
        throw new Error(`${label} port ${port} is already in use.`);
      }
    }
    if (!options.skipBuild) {
      for (const command of commands.preRuntimeBuild) await runCommand(command);
      writeNativeBuildStamp(paths.nativeBuildStamp, {
        builtAt: new Date().toISOString(),
        source: sourceIdentity(paths.root),
        bundles: nativeBundleHashes(paths.lynxApp),
      });
    }
    if (!existsSync(paths.electronEntry)) {
      throw new Error("Electron comparison artifacts are missing. Run without --skip-build.");
    }
    // A reused bundle must match the current Native sources exactly.
    const buildStamp = readJsonIfPresent(paths.nativeBuildStamp);
    const currentSource = sourceIdentity(paths.root);
    const currentBundles = nativeBundleHashes(paths.lynxApp);
    const stampProblems = nativeBuildStampProblems(buildStamp, currentSource, currentBundles);
    run.build = { skipped: options.skipBuild, stamp: buildStamp, source: currentSource };
    if (stampProblems.length > 0) {
      throw new Error(`Refusing to certify a stale Native bundle: ${stampProblems.join("; ")}.`);
    }
    recordPhase(run, "build-verified", { bundles: currentBundles });

    stopExistingOwnedElectronRuntime(paths, electronExecutable);
    prepareDesktopComparisonHome(paths);
    prepareOwnedLynxtronRuntime(paths);
    run.lynxtron = {
      packageVersion: JSON.parse(readFileSync(paths.lynxtronPackageJson, "utf8")).version,
      sourceApp: paths.sourceLynxtronApp,
      frameworkSha256: sha256File(
        join(
          paths.ownedLynxtronApp,
          "Contents",
          "Frameworks",
          "Lynxtron Framework.framework",
          "Versions",
          "1.0",
          "Lynxtron Framework",
        ),
      ),
    };
    const clonedDatabase = join(paths.electronHome, "dev", "state.sqlite");
    if (fixtureManifest) {
      const mismatches = comparisonFixtureMismatches(
        fixtureManifest,
        readComparisonFixtureEntities(clonedDatabase),
      );
      if (mismatches.length > 0) {
        throw new Error(`Cloned fixture does not match fixture.json: ${mismatches.join("; ")}.`);
      }
    }
    const routedThreadId = comparisonThreadId(options);
    const electronAnchorThreadId = comparisonElectronAnchorThreadId(options);
    if (routedThreadId) assertComparisonThreadAvailable(paths, routedThreadId);
    if (electronAnchorThreadId && electronAnchorThreadId !== routedThreadId) {
      assertComparisonThreadAvailable(paths, electronAnchorThreadId);
    }
    const transcriptExpectation = electronAnchorThreadId
      ? readComparisonTranscriptExpectation(paths, electronAnchorThreadId)
      : null;
    run.seed = {
      kind: options.seed,
      seedHome: paths.seedHome,
      fixture: fixtureManifest
        ? {
            createdAt: fixtureManifest.createdAt,
            projectId: fixtureManifest.projectId,
            workspaceRoot: fixtureManifest.workspaceRoot,
            sequence: fixtureManifest.sequence,
          }
        : null,
      threadId: electronAnchorThreadId,
      transcriptExpectation,
    };
    recordPhase(run, "seed-verified");
    writeComparisonWindowStates(paths, options);

    const web = startOwned(commands.web);
    ownedChildren.push(web);
    trackChild("web", web);
    await waitForPort(options.webPort);

    const launchedAt = Date.now();
    const electron = startOwned(commands.electron);
    ownedChildren.push(electron);
    trackChild("electron", electron);
    const electronReadyTimeoutMs = Number.parseInt(
      process.env.SYNARA_COMPARE_ELECTRON_READY_TIMEOUT_MS ?? "90000",
      10,
    );
    const runtime = await waitForRuntimeState(
      paths.runtimeState,
      launchedAt,
      Number.isFinite(electronReadyTimeoutMs) && electronReadyTimeoutMs > 0
        ? electronReadyTimeoutMs
        : 90_000,
    );
    await waitForPort(runtime.port);
    const socketUrl = new URL(`ws://127.0.0.1:${runtime.port}`);
    socketUrl.searchParams.set("token", authToken);
    run.backend = {
      port: runtime.port,
      pid: runtime.pid,
      stateDir: join(paths.electronHome, "dev"),
      ...(await readBackendIdentity(socketUrl.toString())),
    };
    if (electronAnchorThreadId && !run.backend.visibleThreadIds.includes(electronAnchorThreadId)) {
      throw new Error(
        `Backend ${run.backend.serverInstanceId} does not expose thread ${electronAnchorThreadId}.`,
      );
    }
    recordPhase(run, "backend-verified");
    persistRun();

    const electronResult = await configureElectronRenderer(
      options.electronCdpPort,
      options,
      transcriptExpectation,
      run.activity,
    );
    run.electron = { anchor: electronResult.anchor, cdpPort: options.electronCdpPort };
    writeComparisonRendererState(paths, electronResult.rendererState, options.theme);
    recordPhase(run, "electron-certified");

    commands.lynx.env.SYNARA_WS_URL = socketUrl.toString();
    const lynx = startOwned(commands.lynx);
    ownedChildren.push(lynx);
    trackChild("lynxtron", lynx);
    const lynxDevtool = options.skipLynxDevtool
      ? null
      : await waitForOwnedDevtoolListener(lynx, options.lynxDevtoolPort);
    let nativeIdentity = null;
    if (lynxDevtool !== null && routedThreadId) {
      const route = options.route === null ? null : new URL(options.route, "http://synara.local");
      nativeIdentity = await verifyOwnedNativeThreadIdentity(
        lynxDevtool.port,
        routedThreadId,
        transcriptExpectation,
        route?.searchParams.get("editor") !== "open",
      );
    }
    const connections = await verifyNativeBackendConnections(
      paths,
      lynx,
      runtime.port,
      lynxDevtool?.port ?? null,
      15_000,
    );
    run.native = {
      pid: lynx.pid ?? null,
      devtool: lynxDevtool,
      identity: nativeIdentity,
      connections,
    };
    recordPhase(run, "native-certified");

    // Data freeze: the certified entities must be unchanged after both
    // renderers attached. Any events appended meanwhile are recorded by type.
    const backendAfter = await readBackendIdentity(socketUrl.toString());
    run.backend.after = backendAfter;
    run.backend.eventsSinceSeed = fixtureManifest
      ? eventTypesAfter(clonedDatabase, fixtureManifest.sequence)
      : null;
    if (backendAfter.serverInstanceId !== run.backend.serverInstanceId) {
      throw new Error("The backend restarted during certification.");
    }
    if (fixtureManifest && run.backend.eventsSinceSeed.length > 0) {
      // The fixture already contains everything the app settles on first
      // launch; any event now means a renderer mutated the certified data.
      throw new Error(
        `Data changed during certification: ${JSON.stringify(run.backend.eventsSinceSeed)}.`,
      );
    }
    if (fixtureManifest) {
      const entities = readComparisonFixtureEntities(clonedDatabase);
      const mismatches = comparisonFixtureMismatches(
        { ...fixtureManifest, sequence: entities.sequence },
        entities,
      );
      if (mismatches.length > 0) {
        throw new Error(`Fixture entities changed during certification: ${mismatches.join("; ")}.`);
      }
    }
    run.status = "certified";
    recordPhase(run, "certified");
    persistRun();

    console.log(
      `[compare:desktop] Electron and Lynxtron are opening ${
        routedThreadId ? `thread ${routedThreadId}` : `route ${options.route}`
      } at ${options.width}x${options.height}.`,
    );
    console.log(
      lynxDevtool === null
        ? `[compare:desktop] Web ${options.webPort}, Electron CDP ${options.electronCdpPort}; Lynx DevTool certification explicitly skipped. Press Ctrl-C to stop owned processes.`
        : `[compare:desktop] Web ${options.webPort}, Electron CDP ${options.electronCdpPort}, Lynx DevTool ${lynxDevtool.port} (owned PID ${lynxDevtool.pid}, verified LISTEN; preferred ${options.lynxDevtoolPort}). Press Ctrl-C to stop owned processes.`,
    );
    console.log(`[compare:desktop] Run manifest: ${join(paths.runsDir, `${runId}.json`)}.`);

    for (const [name, child] of [
      ["Electron", electron],
      ["Lynxtron", lynx],
    ]) {
      child.once("error", (error) => {
        console.error(`[compare:desktop] ${name} failed to start:`, error);
        shutdown(1, `${name}-start-error`);
      });
      child.once("exit", (code, signal) => {
        if (name === "Lynxtron" && code === 0 && !signal) {
          console.log("[compare:desktop] Lynxtron handed off to a managed replacement process.");
          return;
        }
        if (!shuttingDown) {
          console.error(
            `[compare:desktop] ${name} exited unexpectedly (${signal ?? `code ${code ?? 0}`}).`,
          );
          shutdown(code ?? 1, `${name}-exited`);
        }
      });
    }
    if (options.exitAfterCertify) shutdown(0, "exit-after-certify");
  } catch (error) {
    run.status = "failed";
    run.error = error instanceof Error ? error.message : String(error);
    recordPhase(run, "failed");
    persistRun();
    console.error(`[compare:desktop] ${run.error}`);
    // Route failures through the same verified cleanup as a normal exit so a
    // failed run also proves it left nothing behind.
    shutdown(1, "failure");
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
