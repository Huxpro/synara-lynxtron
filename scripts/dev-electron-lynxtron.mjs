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
const defaultLynxDevtoolConnector =
  "/Users/bytedance/.agents/skills/lynx-devtool/scripts/connector.mjs";

export const COMPARISON_RENDERER_STORAGE_KEYS = Object.freeze([
  "synara:theme",
  "synara:app-settings:v1",
  "synara:appsnap-welcome:v1",
  "synara:terminal-state:v1",
  "synara:right-dock-state:v1",
]);

export const DEFAULT_DESKTOP_COMPARISON_OPTIONS = Object.freeze({
  threadId: "lynx-landing-thread-1787298664226-1b47e02983941",
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
    const value = argv[index + 1];
    if (value === undefined) {
      throw new Error(`Missing value for ${argument}.`);
    }
    if (argument === "--thread") {
      options.threadId = value.trim();
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
        throw new Error("--system-appearance-sequence requires at least two comma-separated light/dark steps.");
      }
      options.systemAppearanceSequence = steps.join(",");
    } else if (argument === "--system-appearance-interval-ms") {
      options.systemAppearanceIntervalMs = parsePositiveInteger(value, argument);
    } else if (argument === "--terminal") {
      if (value !== "open" && value !== "closed") {
        throw new Error("--terminal requires open or closed.");
      }
      options.terminal = value;
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
  if (!options.threadId) {
    throw new Error("--thread requires a non-empty thread id.");
  }
  if (
    options.route !== null &&
    (!options.route.startsWith("/") || options.route.startsWith("//"))
  ) {
    throw new Error("--route requires an absolute app route beginning with one slash.");
  }
  return options;
}

export function resolveDesktopComparisonPaths(
  root = repositoryRoot,
  sourceLynxtronAppOverride = process.env.SYNARA_COMPARE_LYNXTRON_APP?.trim(),
  exists = existsSync,
) {
  const stateRoot = join(root, ".synara-desktop-comparison");
  const seedHome = join(root, ".synara-pr84");
  const electronHome = join(stateRoot, "electron");
  const electronUserDataDir = join(stateRoot, "electron-profile");
  const lynxUserDataDir = join(stateRoot, "lynx");
  const packageDist = join(
    root,
    "apps",
    "lynx",
    "node_modules",
    "@lynx-js",
    "lynxtron",
    "dist",
  );
  const lynxtronPackageJson = join(dirname(packageDist), "package.json");
  const variantLynxtronApp = join(packageDist, "devtool", "Lynxtron.app");
  const legacyLynxtronApp = join(packageDist, "lynxtron.app");
  const sourceLynxtronApp = sourceLynxtronAppOverride
    ? resolve(sourceLynxtronAppOverride)
    : exists(variantLynxtronApp)
      ? variantLynxtronApp
      : legacyLynxtronApp;
  const ownedLynxtronApp = join(
    stateRoot,
    "runtime",
    "Synara Comparison Lynxtron.app",
  );
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
  ]) {
    const rewrite = spawnSync(
      "plutil",
      ["-replace", key, "-string", value, infoPlist],
      { encoding: "utf8" },
    );
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
      const signFramework = spawnSync(
        "codesign",
        ["--force", "--sign", "-", embeddedFramework],
        { encoding: "utf8" },
      );
      if (signFramework.status !== 0) {
        throw new Error(
          `Failed to sign owned Lynxtron framework: ${signFramework.stderr.trim()}`,
        );
      }
    }
    const sign = spawnSync(
      "codesign",
      ["--force", "--sign", "-", paths.ownedLynxtronApp],
      { encoding: "utf8" },
    );
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
    try { process.kill(pid, "SIGTERM"); }
    catch (error) { if (error?.code !== "ESRCH") throw error; }
  }
  const deadline = Date.now() + 3_000;
  for (const pid of pids) {
    let running = true;
    while (Date.now() < deadline) {
      try {
        process.kill(pid, 0);
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
      } catch (error) {
        if (error?.code === "ESRCH") { running = false; break; }
        throw error;
      }
    }
    if (running) {
      try { process.kill(pid, "SIGKILL"); }
      catch (error) { if (error?.code !== "ESRCH") throw error; }
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
  for (const pid of pids) {
    try {
      process.kill(pid, 0);
      throw new Error(`Owned Lynxtron process ${pid} did not exit.`);
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
  }
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
    if (/^\/settings\/[^/]+$/.test(route.pathname)) {
      const section = decodeURIComponent(route.pathname.slice("/settings/".length));
      route.pathname = "/settings";
      url.searchParams.set("section", section);
    } else if (/^\/thread\/[^/]+$/.test(route.pathname)) {
      route.pathname = `/${route.pathname.slice("/thread/".length)}`;
    }
    url.hash = route.pathname + route.search;
  } else {
    url.hash = `/${encodeURIComponent(options.threadId)}`;
  }
  return url.toString();
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

export function electronComparisonUrlMatches(candidateUrl, expectedUrl) {
  try {
    const candidate = new URL(candidateUrl);
    const expected = new URL(expectedUrl);
    if (candidate.origin !== expected.origin || candidate.search !== expected.search) {
      return false;
    }
    const candidateHash = new URL(candidate.hash.slice(1) || '/', 'http://synara.local');
    const expectedHash = new URL(expected.hash.slice(1) || '/', 'http://synara.local');
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
) {
  return `(() => { const state = Object.fromEntries(${JSON.stringify(
    COMPARISON_RENDERER_STORAGE_KEYS,
  )}.flatMap((key) => { const value = localStorage.getItem(key); return value === null ? [] : [[key, value]]; })); const appSettings = JSON.parse(state['synara:app-settings:v1'] ?? '{}'); if (${JSON.stringify(chatFontSize)} !== null) appSettings.chatFontSizePx = ${JSON.stringify(chatFontSize)}; state['synara:app-settings:v1'] = JSON.stringify(appSettings); localStorage.clear(); for (const [key, value] of Object.entries(state)) localStorage.setItem(key, value); localStorage.setItem('synara:theme', ${JSON.stringify(theme)}); if (${JSON.stringify(appSnap)} === 'welcome') localStorage.removeItem('synara:appsnap-welcome:v1'); else localStorage.setItem('synara:appsnap-welcome:v1', '{"acknowledged":true}'); location.reload(); })(); undefined`;
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
  const webUrl = comparisonWebUrl(options);
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
    ],
    nativeBuild: {
      command: "bun",
      args: ["run", "build"],
      cwd: join(paths.root, "apps", "lynx"),
      env: {},
    },
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
        SYNARA_ALLOW_PARALLEL_INSTANCE: "1",
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
        SYNARA_ENABLE_DEVTOOL: "1",
        SYNARA_LYNX_USER_DATA_DIR: paths.lynxUserDataDir,
        SYNARA_MANAGED_RELAUNCH: "1",
        ...(options.systemAppearanceSequence
          ? { SYNARA_SYSTEM_APPEARANCE_PROBE_SEQUENCE: options.systemAppearanceSequence }
          : {}),
        ...(options.systemAppearanceIntervalMs
          ? { SYNARA_SYSTEM_APPEARANCE_PROBE_INTERVAL_MS: String(options.systemAppearanceIntervalMs) }
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

export function writeComparisonRendererState(
  paths,
  rendererState,
  comparisonTheme = "dark",
) {
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
  return output
    .split("\n")
    .some((line) => {
      const columns = line.trim().split(/\s+/);
      return (
        columns[1] === expectedPid &&
        (line.includes(expectedEndpoint) || line.includes(expectedLoopbackEndpoint))
      );
    });
}

function isPidListeningOnPort(pid, port) {
  const listeners = spawnSync(
    "lsof",
    ["-nP", "-a", "-p", String(pid), `-iTCP:${port}`, "-sTCP:LISTEN"],
    { encoding: "utf8" },
  );
  if (listeners.error) throw listeners.error;
  return lsofShowsPidListeningOnPort(listeners.stdout, pid, port);
}

async function waitForOwnedDevtoolListener(child, port, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `Lynxtron exited before its DevTool listener became ready on expected port ${port}.`,
      );
    }
    if (child.pid && isPidListeningOnPort(child.pid, port)) return child.pid;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(
    `Owned Lynxtron PID ${child.pid ?? "<unavailable>"} did not open the expected DevTool listener on 127.0.0.1:${port}. ` +
      "Desktop DebugRouter chooses the first free port in 8901-8920; --lynx-devtool-port is an assertion, not a runtime override. " +
      "The installed @lynx-js/lynxtron runtime may also lack an inspector-capable devtool variant; SYNARA_ENABLE_DEVTOOL cannot add inspector support to a release-only binary.",
  );
}

async function verifyOwnedNativeThreadIdentity(
  port,
  threadId,
  transcriptExpectation,
  timeoutMs = 20_000,
) {
  const connectorPath =
    process.env.LYNX_DEVTOOL_CONNECTOR?.trim() || defaultLynxDevtoolConnector;
  if (!existsSync(connectorPath)) {
    throw new Error(`Lynx DevTool connector is missing at ${connectorPath}.`);
  }
  const { createDefaultConnector } = await import(connectorPath);
  const connector = createDefaultConnector();
  const clientId = `localhost:${port}`;
  const deadline = Date.now() + timeoutMs;
  let lastIdentity = null;
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
    if (
      lastIdentity.count >= 1 &&
      lastIdentity.activeCount === 1 &&
      ((transcriptExpectation.messageCount === 0 && lastIdentity.emptyStateRendered) ||
        (lastIdentity.transcriptListCount === 1 && lastIdentity.lastMessageRendered))
    ) {
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

async function configureElectronRenderer(
  cdpPort,
  options,
  transcriptExpectation = null,
  timeoutMs = 30_000,
) {
  const expectedUrl = comparisonWebUrl(options);
  const theme = options.theme;
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
          electronComparisonUrlMatches(candidate.url, expectedUrl) &&
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
      () => rejectEvaluation(new Error("Timed out refreshing comparison providers.")),
      30_000,
    );
    const onMessage = (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== 1) return;
      socket.removeEventListener("message", onMessage);
      clearTimeout(timeout);
      const error = electronEvaluationError(message, "refreshing comparison providers");
      if (error) rejectEvaluation(error);
      else resolveEvaluation();
    };
    socket.addEventListener("message", onMessage);
    socket.send(
      JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: {
          expression:
            "import('/src/nativeApi.ts').then(({ ensureNativeApi }) => ensureNativeApi().server.refreshProviders()).then(() => undefined)",
          awaitPromise: true,
          returnByValue: true,
        },
      }),
    );
  });
  await new Promise((resolveEvaluation, rejectEvaluation) => {
    const timeout = setTimeout(
      () => rejectEvaluation(new Error("Timed out configuring the Electron comparison state.")),
      5_000,
    );
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== 2) return;
      clearTimeout(timeout);
      const error = electronEvaluationError(
        message,
        "configuring the Electron comparison state",
      );
      if (error) rejectEvaluation(error);
      else resolveEvaluation();
    });
    socket.send(
      JSON.stringify({
        id: 2,
        method: "Runtime.evaluate",
        params: {
          expression:
            comparisonRendererResetExpression(
              theme,
              options.appSnap,
              options.chatFontSize,
            ),
          returnByValue: true,
        },
      }),
    );
  });
  let requestId = 2;
  try {
    while (Date.now() < deadline) {
      requestId += 1;
      const rendererState = await new Promise((resolveEvaluation, rejectEvaluation) => {
        const timeout = setTimeout(
          () => rejectEvaluation(new Error("Timed out reading Electron comparison state.")),
          5_000,
        );
        const onMessage = (event) => {
          const message = JSON.parse(String(event.data));
          if (message.id !== requestId) return;
          socket.removeEventListener("message", onMessage);
          clearTimeout(timeout);
          const error = electronEvaluationError(
            message,
            "reading Electron comparison state",
          );
          if (error) {
            rejectEvaluation(error);
            return;
          }
          resolveEvaluation(message.result?.result?.value ?? {});
        };
        socket.addEventListener("message", onMessage);
        socket.send(
          JSON.stringify({
            id: requestId,
            method: "Runtime.evaluate",
            params: {
              expression: `Object.fromEntries(${JSON.stringify(
                COMPARISON_RENDERER_STORAGE_KEYS,
              )}.flatMap((key) => { const value = localStorage.getItem(key); return value === null ? [] : [[key, value]]; }))`,
              returnByValue: true,
            },
          }),
        );
      });
      if (typeof rendererState["synara:app-settings:v1"] === "string") {
        requestId += 1;
        await new Promise((resolveEvaluation, rejectEvaluation) => {
          const timeout = setTimeout(
            () => rejectEvaluation(new Error("Timed out restoring the Electron comparison route.")),
            5_000,
          );
          const onMessage = (event) => {
            const message = JSON.parse(String(event.data));
            if (message.id !== requestId) return;
            socket.removeEventListener("message", onMessage);
            clearTimeout(timeout);
            const error = electronEvaluationError(
              message,
              "restoring the Electron comparison route",
            );
            if (error) rejectEvaluation(error);
            else resolveEvaluation();
          };
          socket.addEventListener("message", onMessage);
          socket.send(
            JSON.stringify({
              id: requestId,
              method: "Runtime.evaluate",
              params: {
                expression: comparisonRouteRestoreExpression(expectedUrl),
                returnByValue: true,
              },
            }),
          );
        });
        const routeDeadline = Date.now() + 30_000;
        let stableRouteSince = 0;
        let lastObservedRoute = null;
        while (
          Date.now() < routeDeadline &&
          (stableRouteSince === 0 || Date.now() - stableRouteSince < 5_000)
        ) {
          requestId += 1;
          const currentUrl = await new Promise((resolveEvaluation, rejectEvaluation) => {
            const timeout = setTimeout(
              () => rejectEvaluation(new Error("Timed out reading the Electron comparison route.")),
              5_000,
            );
            const onMessage = (event) => {
              const message = JSON.parse(String(event.data));
              if (message.id !== requestId) return;
              socket.removeEventListener("message", onMessage);
              clearTimeout(timeout);
              const error = electronEvaluationError(
                message,
                "reading the Electron comparison route",
              );
              if (error) rejectEvaluation(error);
              else resolveEvaluation(message.result?.result?.value);
            };
            socket.addEventListener("message", onMessage);
            socket.send(
              JSON.stringify({
                id: requestId,
                method: "Runtime.evaluate",
                params: { expression: "location.href", returnByValue: true },
              }),
            );
          });
          lastObservedRoute = typeof currentUrl === "string" ? currentUrl : null;
          const routeMatches =
            typeof currentUrl === "string" &&
            electronComparisonUrlMatches(currentUrl, expectedUrl);
          if (routeMatches) {
            if (stableRouteSince === 0) stableRouteSince = Date.now();
          } else {
            stableRouteSince = 0;
            requestId += 1;
            await new Promise((resolveEvaluation, rejectEvaluation) => {
              const timeout = setTimeout(
                () => rejectEvaluation(new Error("Timed out reasserting the Electron comparison route.")),
                5_000,
              );
              const onMessage = (event) => {
                const message = JSON.parse(String(event.data));
                if (message.id !== requestId) return;
                socket.removeEventListener("message", onMessage);
                clearTimeout(timeout);
                const error = electronEvaluationError(
                  message,
                  "reasserting the Electron comparison route",
                );
                if (error) rejectEvaluation(error);
                else resolveEvaluation();
              };
              socket.addEventListener("message", onMessage);
              socket.send(
                JSON.stringify({
                  id: requestId,
                  method: "Runtime.evaluate",
                  params: {
                    expression: comparisonRouteRestoreExpression(expectedUrl),
                    returnByValue: true,
                  },
                }),
              );
            });
          }
          await new Promise((resolveWait) => setTimeout(resolveWait, 100));
        }
        if (stableRouteSince === 0 || Date.now() - stableRouteSince < 5_000) {
          throw new Error(
            `Timed out restoring the Electron comparison route ${expectedUrl}; last observed ${lastObservedRoute ?? "<unavailable>"}.`,
          );
        }
        const identityThreadId = comparisonThreadId(options);
        if (identityThreadId) {
          const identityDeadline = Date.now() + 15_000;
          let identity = null;
          while (Date.now() < identityDeadline) {
            requestId += 1;
            identity = await evaluateElectronExpression(
              socket,
              requestId,
              comparisonThreadIdentityReadyExpression(identityThreadId),
              `confirming Electron sidebar identity ${identityThreadId}`,
            );
            if (identity?.count >= 1 && identity?.visibleActiveCount === 1) break;
            await new Promise((resolveWait) => setTimeout(resolveWait, 100));
          }
          if (identity?.count < 1 || identity?.visibleActiveCount !== 1) {
            throw new Error(
              `Timed out confirming Electron sidebar identity ${identityThreadId}: ${JSON.stringify(identity)}.`,
            );
          }
          const transcriptDeadline = Date.now() + 15_000;
          let transcriptReadiness = null;
          while (Date.now() < transcriptDeadline) {
            requestId += 1;
            transcriptReadiness = await evaluateElectronExpression(
              socket,
              requestId,
              comparisonTranscriptReadyExpression(transcriptExpectation),
              `confirming Electron transcript anchor ${transcriptExpectation.lastMessageId ?? '<empty>'}`,
            );
            if (
              ((transcriptExpectation.messageCount === 0 &&
                transcriptReadiness?.emptyStateRendered === true) ||
                (transcriptReadiness?.lastMessageRendered === true &&
                  transcriptReadiness?.lastMessageVisible === true &&
                  transcriptReadiness?.clientHeight > 0 &&
                  transcriptReadiness?.scrollHeight >= transcriptReadiness?.clientHeight))
            ) break;
            await new Promise((resolveWait) => setTimeout(resolveWait, 100));
          }
          if (
            !((transcriptExpectation.messageCount === 0 &&
              transcriptReadiness?.emptyStateRendered === true) ||
              (transcriptReadiness?.lastMessageRendered === true &&
                transcriptReadiness?.lastMessageVisible === true &&
                transcriptReadiness?.clientHeight > 0 &&
                transcriptReadiness?.scrollHeight >= transcriptReadiness?.clientHeight))
          ) {
            throw new Error(
              `Timed out confirming Electron transcript anchor: ${JSON.stringify(transcriptReadiness)}.`,
            );
          }
          console.log(
            `[compare:desktop] Electron transcript anchor verified: ${JSON.stringify(transcriptReadiness)}.`,
          );
        }
        const explorerExpression = comparisonExplorerOpenExpression(options);
        if (explorerExpression) {
          requestId += 1;
          await evaluateElectronExpression(
            socket,
            requestId,
            explorerExpression,
            "opening the canonical Electron Explorer fixture",
          );
          const explorerPath = comparisonExplorerPath(options);
          if (explorerPath) {
            const segments = explorerPath.split("/").filter(Boolean);
            const targets = segments.map((_, index) =>
              segments.slice(0, index + 1).join("/"),
            );
            for (const targetPath of targets) {
              const targetDeadline = Date.now() + 15_000;
              let clicked = false;
              while (Date.now() < targetDeadline) {
                requestId += 1;
                clicked = await evaluateElectronExpression(
                  socket,
                  requestId,
                  comparisonExplorerRowClickExpression(targetPath),
                  `opening Electron Explorer row ${targetPath}`,
                );
                if (clicked) break;
                await new Promise((resolveWait) => setTimeout(resolveWait, 100));
              }
              if (!clicked) {
                throw new Error(`Timed out opening Electron Explorer row ${targetPath}.`);
              }
            }
            const previewDeadline = Date.now() + 15_000;
            let explorerReadiness = null;
            while (Date.now() < previewDeadline) {
              requestId += 1;
              explorerReadiness = await evaluateElectronExpression(
                socket,
                requestId,
                comparisonExplorerReadyExpression(explorerPath),
                `confirming Electron Explorer preview ${explorerPath}`,
              );
              if (explorerReadiness?.selected && explorerReadiness?.previewLoaded) break;
              await new Promise((resolveWait) => setTimeout(resolveWait, 100));
            }
            if (!explorerReadiness?.selected || !explorerReadiness?.previewLoaded) {
              throw new Error(
                `Timed out confirming Electron Explorer preview ${explorerPath}: ${JSON.stringify(explorerReadiness)}.`,
              );
            }
          }
        }
        const diffExpression = comparisonDiffOpenExpression(options);
        if (diffExpression) {
          requestId += 1;
          await evaluateElectronExpression(
            socket,
            requestId,
            diffExpression,
            "opening the canonical Electron Diff fixture",
          );
          const diffDeadline = Date.now() + 30_000;
          let diffReadiness = null;
          while (Date.now() < diffDeadline) {
            requestId += 1;
            diffReadiness = await evaluateElectronExpression(
              socket,
              requestId,
              comparisonDiffReadyExpression(options),
              "confirming the canonical Electron Diff fixture",
            );
            if (diffReadiness?.paneOpen && diffReadiness?.turnMatched && diffReadiness?.rendered) break;
            await new Promise((resolveWait) => setTimeout(resolveWait, 100));
          }
          if (!diffReadiness?.paneOpen || !diffReadiness?.turnMatched || !diffReadiness?.rendered) {
            throw new Error(
              `Timed out opening the canonical Electron Diff fixture: ${JSON.stringify(diffReadiness)}.`,
            );
          }
        }
        if (options.terminal === "open") {
          const terminalThreadId = comparisonThreadId(options) ?? options.threadId;
          requestId += 1;
          await evaluateElectronExpression(
            socket,
            requestId,
            comparisonTerminalOpenExpression(terminalThreadId),
            "opening the canonical Electron Terminal pane",
          );

          const terminalDeadline = Date.now() + 30_000;
          let lastTerminalReadiness = null;
          while (Date.now() < terminalDeadline) {
            requestId += 1;
            lastTerminalReadiness = await evaluateElectronExpression(
              socket,
              requestId,
              comparisonTerminalReadyExpression(terminalThreadId),
              "confirming the canonical Electron Terminal pane",
            );
            if (
              lastTerminalReadiness?.paneOpen === true &&
              lastTerminalReadiness?.terminalOpen === true &&
              lastTerminalReadiness?.rendered === true &&
              lastTerminalReadiness?.persistedDock === true &&
              lastTerminalReadiness?.persistedTerminal === true
            ) {
              break;
            }
            await new Promise((resolveWait) => setTimeout(resolveWait, 100));
          }
          if (
            lastTerminalReadiness?.paneOpen !== true ||
            lastTerminalReadiness?.terminalOpen !== true ||
            lastTerminalReadiness?.rendered !== true ||
            lastTerminalReadiness?.persistedDock !== true ||
            lastTerminalReadiness?.persistedTerminal !== true
          ) {
            throw new Error(
              `Timed out opening the canonical Electron Terminal pane: ${JSON.stringify(lastTerminalReadiness)}.`,
            );
          }

          requestId += 1;
          return await evaluateElectronExpression(
            socket,
            requestId,
            comparisonRendererStateExpression(),
            "reading synchronized Electron comparison state",
          );
        }
        return rendererState;
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    throw new Error("Timed out waiting for canonical Electron app settings.");
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

function evaluateElectronExpression(socket, requestId, expression, activity) {
  return new Promise((resolveEvaluation, rejectEvaluation) => {
    const timeout = setTimeout(
      () => rejectEvaluation(new Error(`Timed out ${activity}.`)),
      5_000,
    );
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
        params: { expression, awaitPromise: true, returnByValue: true },
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
  const stopAllOwned = (signal) => {
    for (const child of ownedChildren.toReversed()) stopOwned(child, signal);
  };

  const shutdown = (exitCode) => {
    if (shuttingDown) return;
    shuttingDown = true;
    stopAllOwned("SIGTERM");
    setTimeout(() => {
      stopAllOwned("SIGKILL");
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
    }
    if (!existsSync(paths.electronEntry)) {
      throw new Error("Electron comparison artifacts are missing. Run without --skip-build.");
    }
    stopExistingOwnedElectronRuntime(paths, electronExecutable);
    prepareDesktopComparisonHome(paths);
    prepareOwnedLynxtronRuntime(paths);
    const routedThreadId = comparisonThreadId(options);
    if (routedThreadId) assertComparisonThreadAvailable(paths, routedThreadId);
    const transcriptExpectation = routedThreadId
      ? readComparisonTranscriptExpectation(paths, routedThreadId)
      : null;
    writeComparisonWindowStates(paths, options);

    const web = startOwned(commands.web);
    ownedChildren.push(web);
    await waitForPort(options.webPort);

    const launchedAt = Date.now();
    const electron = startOwned(commands.electron);
    ownedChildren.push(electron);
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
    commands.nativeBuild.env.SYNARA_WS_URL = socketUrl.toString();
    await runCommand(commands.nativeBuild);
    if (!existsSync(paths.lynxApp)) {
      throw new Error("Native comparison artifacts are missing after the runtime-pinned build.");
    }
    const rendererState = await configureElectronRenderer(
      options.electronCdpPort,
      options,
      transcriptExpectation,
    );
    writeComparisonRendererState(paths, rendererState, options.theme);

    commands.lynx.env.SYNARA_WS_URL = socketUrl.toString();
    const lynx = startOwned(commands.lynx);
    ownedChildren.push(lynx);
    const lynxDevtoolPid = options.skipLynxDevtool
      ? null
      : await waitForOwnedDevtoolListener(lynx, options.lynxDevtoolPort);
    if (lynxDevtoolPid !== null && routedThreadId) {
      await verifyOwnedNativeThreadIdentity(
        options.lynxDevtoolPort,
        routedThreadId,
        transcriptExpectation,
      );
    }

    console.log(
      `[compare:desktop] Electron and Lynxtron are opening ${
        routedThreadId ? `thread ${routedThreadId}` : `route ${options.route}`
      } at ${options.width}x${options.height}.`,
    );
    console.log(
      lynxDevtoolPid === null
        ? `[compare:desktop] Web ${options.webPort}, Electron CDP ${options.electronCdpPort}; Lynx DevTool certification explicitly skipped. Press Ctrl-C to stop owned processes.`
        : `[compare:desktop] Web ${options.webPort}, Electron CDP ${options.electronCdpPort}, Lynx DevTool ${options.lynxDevtoolPort} (owned PID ${lynxDevtoolPid}, verified LISTEN). Press Ctrl-C to stop owned processes.`,
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
        if (name === "Lynxtron" && code === 0 && !signal) {
          console.log(
            "[compare:desktop] Lynxtron handed off to a managed replacement process.",
          );
          return;
        }
        if (!shuttingDown) {
          console.error(
            `[compare:desktop] ${name} exited unexpectedly (${signal ?? `code ${code ?? 0}`}).`,
          );
          shutdown(code ?? 1);
        }
      });
    }
  } catch (error) {
    for (const child of ownedChildren.toReversed()) stopOwned(child, "SIGTERM");
    await new Promise((resolveWait) => setTimeout(resolveWait, 1_500));
    for (const child of ownedChildren.toReversed()) stopOwned(child, "SIGKILL");
    throw error;
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
