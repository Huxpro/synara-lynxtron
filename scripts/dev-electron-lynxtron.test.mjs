import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";

import {
  DEFAULT_DESKTOP_COMPARISON_OPTIONS,
  COMPARISON_RENDERER_STORAGE_KEYS,
  comparisonDockOpenExpression,
  comparisonDockReadyExpression,
  LEGACY_COMPARISON_THREAD_ID,
  createElectronCdpClient,
  ownedComparisonPidsFromPs,
  resolveComparisonSeedOptions,
  assertComparisonThreadAvailable,
  readComparisonTranscriptExpectation,
  comparisonLynxDeepLink,
  comparisonElectronAnchorThreadId,
  comparisonElectronStartupUrl,
  comparisonExplorerOpenExpression,
  comparisonDiffOpenExpression,
  comparisonDiffReadyExpression,
  comparisonExplorerPath,
  comparisonExplorerReadyExpression,
  comparisonExplorerRowClickExpression,
  comparisonRendererResetExpression,
  comparisonTerminalOpenExpression,
  comparisonTerminalReadyExpression,
  comparisonRouteRestoreExpression,
  comparisonNewThreadLandingReadyExpression,
  comparisonNewThreadOpenExpression,
  comparisonNewThreadProjectId,
  comparisonThreadId,
  comparisonThreadIdentityReadyExpression,
  comparisonTranscriptReadyExpression,
  comparisonTransientUiReadyExpression,
  nativeThreadIdentityFromDom,
  nativeThreadIdentityIsReady,
  nativeTransientUiStateFromDom,
  comparisonWebUrl,
  desktopComparisonCommands,
  electronEvaluationError,
  electronComparisonUrlMatches,
  lsofShowsPidListeningOnPort,
  pidOwnedDevtoolPortsFromLsof,
  resolveLynxDevtoolReadyTimeoutMs,
  parseDesktopComparisonArgs,
  ownedElectronPidsFromPs,
  ownedWebPidsFromPs,
  ownedLynxtronPidsFromPs,
  prepareDesktopComparisonHome,
  prepareOwnedLynxtronRuntime,
  resolveDesktopComparisonPaths,
  writeComparisonRendererState,
} from "./dev-electron-lynxtron.mjs";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { platform, tmpdir } from "node:os";
import { dirname, join } from "node:path";

describe("Electron and Lynxtron comparison launcher", () => {
  it("uses the canonical fixture seed and matched dimensions by default", () => {
    expect(parseDesktopComparisonArgs([])).toEqual(DEFAULT_DESKTOP_COMPARISON_OPTIONS);
    expect(DEFAULT_DESKTOP_COMPARISON_OPTIONS).toMatchObject({
      threadId: null,
      seed: "fixture",
      exitAfterCertify: false,
    });
  });

  it("resolves the default thread from the seed and refuses a missing fixture", () => {
    const defaults = parseDesktopComparisonArgs([]);
    expect(
      resolveComparisonSeedOptions(defaults, { transcriptThreadId: "fixture-thread" }).threadId,
    ).toBe("fixture-thread");
    expect(() => resolveComparisonSeedOptions(defaults, null)).toThrow(
      "The comparison fixture is missing.",
    );
    expect(
      resolveComparisonSeedOptions(parseDesktopComparisonArgs(["--seed", "legacy"]), null).threadId,
    ).toBe(LEGACY_COMPARISON_THREAD_ID);
    expect(
      resolveComparisonSeedOptions(parseDesktopComparisonArgs(["--thread", "explicit"]), {
        transcriptThreadId: "fixture-thread",
      }).threadId,
    ).toBe("explicit");
    expect(() => parseDesktopComparisonArgs(["--seed", "other"])).toThrow(
      "--seed requires fixture or legacy.",
    );
    expect(() => parseDesktopComparisonArgs(["--thread", " "])).toThrow(
      "--thread requires a non-empty thread id.",
    );
  });

  it("clones the fixture seed by default and the pre-fixture seed only on request", () => {
    expect(resolveDesktopComparisonPaths("/repo").seedHome).toBe(
      "/repo/.synara-desktop-comparison/fixture/seed",
    );
    expect(resolveDesktopComparisonPaths("/repo", undefined, existsSync, "legacy").seedHome).toBe(
      "/repo/.synara-pr84",
    );
  });

  it("supports an explicit comparison-only Lynxtron runtime without changing dependencies", () => {
    expect(resolveDesktopComparisonPaths("/repo", "/tmp/lynxtron.app")).toMatchObject({
      sourceLynxtronApp: "/tmp/lynxtron.app",
      ownedLynxtronApp: "/repo/.synara-desktop-comparison/runtime/Synara Comparison Lynxtron.app",
    });
  });

  it("prefers the installed devtool runtime variant used by current Lynxtron releases", () => {
    expect(
      resolveDesktopComparisonPaths("/repo", undefined, (filePath) =>
        filePath.endsWith("/dist/devtool/Lynxtron.app"),
      ),
    ).toMatchObject({
      sourceLynxtronApp: "/repo/apps/lynx/node_modules/@lynx-js/lynxtron/dist/devtool/Lynxtron.app",
    });
  });

  it("parses explicit ports, dimensions, thread, and build mode", () => {
    expect(
      parseDesktopComparisonArgs([
        "--thread",
        "thread-two",
        "--route",
        "/settings/advanced",
        "--width",
        "1280",
        "--height",
        "820",
        "--web-port",
        "9001",
        "--electron-cdp-port",
        "9002",
        "--lynx-devtool-port",
        "9003",
        "--theme",
        "system",
        "--system-appearance-sequence",
        "light,dark,light",
        "--system-appearance-interval-ms",
        "250",
        "--terminal",
        "open",
        "--appsnap",
        "welcome",
        "--chat-font-size",
        "18",
        "--skip-build",
        "--skip-lynx-devtool",
        "--seed",
        "legacy",
        "--exit-after-certify",
        "--dock",
        "git",
      ]),
    ).toEqual({
      threadId: "thread-two",
      seed: "legacy",
      exitAfterCertify: true,
      dock: "git",
      route: "/settings/advanced",
      width: 1280,
      height: 820,
      webPort: 9001,
      electronCdpPort: 9002,
      lynxDevtoolPort: 9003,
      theme: "system",
      systemAppearanceSequence: "light,dark,light",
      systemAppearanceIntervalMs: 250,
      terminal: "open",
      appSnap: "welcome",
      chatFontSize: 18,
      skipLynxDevtool: true,
      skipBuild: true,
    });
  });

  it("rejects invalid arguments instead of launching an ambiguous fixture", () => {
    expect(() => parseDesktopComparisonArgs(["--width", "wide"])).toThrow(
      "--width requires a positive integer.",
    );
    expect(() => parseDesktopComparisonArgs(["--unknown", "value"])).toThrow(
      "Unknown option: --unknown",
    );
    expect(() => parseDesktopComparisonArgs(["--theme", "sepia"])).toThrow(
      "--theme requires light, dark, or system.",
    );
    expect(() => parseDesktopComparisonArgs(["--terminal", "maybe"])).toThrow(
      "--terminal requires open or closed.",
    );
    expect(() => parseDesktopComparisonArgs(["--appsnap", "maybe"])).toThrow(
      "--appsnap requires acknowledged or welcome.",
    );
    expect(() => parseDesktopComparisonArgs(["--chat-font-size", "10"])).toThrow(
      "--chat-font-size requires an integer from 11 to 18.",
    );
    expect(() => parseDesktopComparisonArgs(["--chat-font-size", "19"])).toThrow(
      "--chat-font-size requires an integer from 11 to 18.",
    );
    expect(() => parseDesktopComparisonArgs(["--route", "settings/advanced"])).toThrow(
      "--route requires an absolute app route beginning with one slash.",
    );
    expect(() => parseDesktopComparisonArgs(["--route", "//other-host/path"])).toThrow(
      "--route requires an absolute app route beginning with one slash.",
    );
  });

  it("passes deterministic system appearance probes only to the owned Native host", () => {
    const options = parseDesktopComparisonArgs([
      "--theme",
      "system",
      "--system-appearance-sequence",
      "light,dark,light",
      "--system-appearance-interval-ms",
      "250",
    ]);
    const commands = desktopComparisonCommands(
      options,
      resolveDesktopComparisonPaths("/repo"),
      "comparison-token",
      "/runtime/electron",
    );
    expect(commands.lynx.env).toMatchObject({
      SYNARA_SYSTEM_APPEARANCE_PROBE_SEQUENCE: "light,dark,light",
      SYNARA_SYSTEM_APPEARANCE_PROBE_INTERVAL_MS: "250",
    });
    expect(commands.electron.env).not.toHaveProperty("SYNARA_SYSTEM_APPEARANCE_PROBE_SEQUENCE");
  });

  it("maps an explicit Native thread route onto the canonical Web hash route", () => {
    const options = parseDesktopComparisonArgs([
      "--route",
      "/thread/thread-two?explorer=open&explorerPath=package.json",
    ]);

    expect(comparisonWebUrl(options)).toBe(
      "http://127.0.0.1:8891/?explorer=open&explorerPath=package.json#/thread-two?explorer=open&explorerPath=package.json",
    );
    expect(comparisonLynxDeepLink(options)).toBe(
      "synara://thread/thread-two?explorer=open&explorerPath=package.json",
    );
    expect(comparisonThreadId(options)).toBe("thread-two");
  });

  it("maps Native Editor deep-link state onto the Web route contract", () => {
    const fileOptions = parseDesktopComparisonArgs([
      "--route",
      "/thread/thread-two?editor=open&editorMode=file&explorerPath=src/example.ts",
    ]);
    expect(comparisonWebUrl(fileOptions)).toContain(
      "#/thread-two?editor=open&editorMode=file&explorerPath=src%2Fexample.ts&view=editor&editorFilePath=src%2Fexample.ts",
    );
    expect(comparisonLynxDeepLink(fileOptions)).toBe(
      "synara://thread/thread-two?editor=open&editorMode=file&explorerPath=src%2Fexample.ts",
    );

    const diffOptions = parseDesktopComparisonArgs([
      "--route",
      "/thread/thread-two?editor=open&editorMode=diff",
    ]);
    expect(comparisonWebUrl(diffOptions)).toContain(
      "#/thread-two?editor=open&editorMode=diff&view=editor",
    );
  });

  it("opens the same Explorer path through the canonical Electron dock and rendered rows", () => {
    const options = parseDesktopComparisonArgs([
      "--route",
      "/thread/thread-two?explorer=open&explorerPath=src/nested/example.ts",
    ]);
    const expression = comparisonExplorerOpenExpression(options);

    expect(comparisonThreadId(options)).toBe("thread-two");
    expect(expression).toContain("clearThreadDockState");
    expect(expression).toContain("useRightDockStore.getState().openPane");
    expect(expression).toContain("paneId: 'explorer', kind: 'explorer'");
    expect(comparisonExplorerPath(options)).toBe("src/nested/example.ts");
    expect(comparisonExplorerRowClickExpression("src/nested")).toContain(
      "candidate.getAttribute('title') === \"src/nested\"",
    );
    expect(comparisonExplorerRowClickExpression("src/nested")).toContain("row.click()");
    expect(expression).toContain("useRightDockStore.getState().openPane");
    expect(comparisonExplorerReadyExpression("src/nested/example.ts")).toContain(
      "document.querySelector('.editor-file-viewer__highlight, .editor-file-viewer__plain')",
    );
  });

  it("does not synthesize an Electron Explorer state for unrelated routes", () => {
    expect(
      comparisonExplorerOpenExpression(
        parseDesktopComparisonArgs(["--route", "/settings/general"]),
      ),
    ).toBeNull();
    expect(
      comparisonExplorerPath(parseDesktopComparisonArgs(["--route", "/settings/general"])),
    ).toBeNull();
    expect(comparisonThreadId(parseDesktopComparisonArgs(["--thread", "thread-default"]))).toBe(
      "thread-default",
    );
  });

  it("opens and verifies a turn-scoped Electron Diff through the canonical dock store", () => {
    const options = parseDesktopComparisonArgs([
      "--route",
      "/thread/thread-two?diff=1&diffTurnId=turn-7&diffFilePath=src/example.ts",
    ]);
    const openExpression = comparisonDiffOpenExpression(options);
    const readyExpression = comparisonDiffReadyExpression(options);

    expect(openExpression).toContain("useRightDockStore.setState");
    expect(openExpression).toContain("await useRightDockStore.persist.rehydrate()");
    expect(openExpression).toContain("activePaneId: 'diff'");
    expect(openExpression).toContain("id: 'diff', kind: 'diff'");
    expect(openExpression).toContain('diffTurnId: "turn-7"');
    expect(openExpression).toContain('diffFilePath: "src/example.ts"');
    expect(readyExpression).toContain("dockState.activePaneId === pane.id");
    expect(readyExpression).toContain('=== "turn-7"');
  });

  it("accepts product-added canonical hash defaults without accepting a different route", () => {
    expect(
      electronComparisonUrlMatches(
        "http://127.0.0.1:8891/#/pull-requests?involvement=all&state=open",
        "http://127.0.0.1:8891/#/pull-requests",
      ),
    ).toBe(true);
    expect(
      electronComparisonUrlMatches(
        "http://127.0.0.1:8891/?explorer=open#/thread-one",
        "http://127.0.0.1:8891/?explorer=open#/thread-one",
      ),
    ).toBe(true);
    expect(
      electronComparisonUrlMatches(
        "http://127.0.0.1:8891/#/settings",
        "http://127.0.0.1:8891/#/pull-requests",
      ),
    ).toBe(false);
  });

  it("opens the same encoded thread in Web and native Lynx", () => {
    const options = { ...DEFAULT_DESKTOP_COMPARISON_OPTIONS, threadId: "thread / one" };
    expect(comparisonWebUrl(options)).toBe("http://127.0.0.1:8891/#/thread%20%2F%20one");
    expect(comparisonWebUrl({ ...options, terminal: "open" })).toBe(
      "http://127.0.0.1:8891/?terminal=open#/thread%20%2F%20one",
    );
    expect(comparisonLynxDeepLink(options)).toBe("synara://thread/thread%20%2F%20one");
    expect(comparisonLynxDeepLink({ ...options, terminal: "open" })).toBe(
      "synara://thread/thread%20%2F%20one?terminal=open",
    );
    expect(comparisonRouteRestoreExpression(comparisonWebUrl(options))).toBe(
      'location.hash = "#/thread%20%2F%20one"; undefined',
    );
  });

  it("opens an explicit app route in Web and native Lynx", () => {
    const options = {
      ...DEFAULT_DESKTOP_COMPARISON_OPTIONS,
      route: "/settings/advanced?target=environment-panel",
    };
    expect(comparisonWebUrl(options)).toBe(
      "http://127.0.0.1:8891/?target=environment-panel&section=advanced#/settings?target=environment-panel",
    );
    expect(comparisonLynxDeepLink(options)).toBe(
      "synara://settings/advanced?target=environment-panel",
    );
    expect(comparisonLynxDeepLink({ ...options, terminal: "open" })).toBe(
      "synara://settings/advanced?target=environment-panel&terminal=open",
    );
  });

  it("opens a project-scoped Electron draft through the rendered project action", () => {
    const options = {
      ...DEFAULT_DESKTOP_COMPARISON_OPTIONS,
      route: "/new-thread/project%20one",
    };
    expect(comparisonNewThreadProjectId(options)).toBe("project one");
    expect(comparisonElectronAnchorThreadId(options)).toBe(options.threadId);
    expect(comparisonElectronStartupUrl(options)).toBe(
      `http://127.0.0.1:8891/#/${options.threadId}`,
    );
    expect(comparisonWebUrl(options)).toBe(`http://127.0.0.1:8891/#/${options.threadId}`);
    expect(comparisonLynxDeepLink(options)).toBe("synara://new-thread/project%20one");

    const openExpression = comparisonNewThreadOpenExpression(options);
    expect(openExpression).toContain("new-thread-button");
    expect(openExpression).toContain("data-project-id");
    expect(openExpression).toContain("trigger.click()");
    expect(openExpression).toContain(JSON.stringify("project one"));

    const readyExpression = comparisonNewThreadLandingReadyExpression(options);
    expect(readyExpression).toContain("data-empty-landing-composer-block");
    expect(readyExpression).toContain("project-picker-trigger");
    expect(readyExpression).toContain("Temporary chat");
    expect(readyExpression).toContain("Local");
    expect(readyExpression).toContain("Not Found");
  });

  it("opens the same Components Lab story, state, and variant in both renderers", () => {
    const options = {
      ...DEFAULT_DESKTOP_COMPARISON_OPTIONS,
      route: "/components-lab?story=typography%2Fdiff-code&state=default&variant=split",
    };
    expect(comparisonWebUrl(options)).toBe(
      "http://127.0.0.1:8891/#/components-lab?story=typography%2Fdiff-code&state=default&variant=split",
    );
    expect(comparisonLynxDeepLink(options)).toBe(
      "synara://components-lab?story=typography%2Fdiff-code&state=default&variant=split",
    );
  });

  it("requires the exact routed thread row to be uniquely active and visible", () => {
    const expression = comparisonThreadIdentityReadyExpression("thread-a/b");
    expect(expression).toContain(JSON.stringify('[data-thread-id="thread-a/b"]'));
    expect(expression).toContain("getAttribute('data-active') === 'true'");
    expect(expression).toContain("visibleActiveCount");
  });

  it("requires the exact Native routed thread identity after PID-owned DevTool resolution", () => {
    const identity = nativeThreadIdentityFromDom(
      {
        nodeId: 1,
        children: [
          { nodeId: 2, attributes: ["data-thread-id", "thread-a", "data-active", "false"] },
          { nodeId: 3, attributes: ["data-thread-id", "thread-a", "data-active", "true"] },
          { nodeId: 4, attributes: [{ name: "data-thread-id", value: "thread-b" }] },
        ],
      },
      "thread-a",
    );
    expect(identity).toEqual({
      threadId: "thread-a",
      count: 2,
      activeCount: 1,
      transcriptListCount: 0,
      lastMessageId: null,
      lastMessageRendered: true,
      emptyStateRendered: false,
      matches: [
        { nodeId: 2, active: false },
        { nodeId: 3, active: true },
      ],
    });
  });

  it("allows the intentionally hidden sidebar only for Editor-mode identity checks", () => {
    const identity = {
      threadId: "thread-editor",
      count: 0,
      activeCount: 0,
      transcriptListCount: 1,
      lastMessageId: "tail",
      lastMessageRendered: true,
      emptyStateRendered: false,
      matches: [],
      transientUi: {
        dialogCount: 0,
        menuLayerCount: 0,
        notificationCount: 0,
        resizeOverlayCount: 0,
        selectionToolbarCount: 0,
      },
    };
    const expectation = { messageCount: 2, lastMessageId: "tail" };

    expect(nativeThreadIdentityIsReady(identity, expectation, true)).toBe(false);
    expect(nativeThreadIdentityIsReady(identity, expectation, false)).toBe(true);
  });

  it("derives transcript readiness from the seed and requires the exact tail message", () => {
    const root = mkdtempSync(join(tmpdir(), "synara-comparison-transcript-"));
    const paths = resolveDesktopComparisonPaths(root);
    mkdirSync(join(paths.electronHome, "dev"), { recursive: true });
    const sqlite = spawnSync(
      "sqlite3",
      [
        join(paths.electronHome, "dev", "state.sqlite"),
        "create table projection_thread_messages(message_id text, thread_id text, sequence integer); insert into projection_thread_messages values('first', 'thread-live', 1), ('tail-message', 'thread-live', 2);",
      ],
      { encoding: "utf8" },
    );
    expect(sqlite.status).toBe(0);

    const expectation = readComparisonTranscriptExpectation(paths, "thread-live");
    expect(expectation).toEqual({ messageCount: 2, lastMessageId: "tail-message" });
    const expression = comparisonTranscriptReadyExpression(expectation);
    expect(expression).toContain('[data-chat-scroll-container="true"]');
    expect(expression).toContain('CSS.escape("tail-message")');
    expect(expression).toContain("distanceFromBottom");

    expect(
      nativeThreadIdentityFromDom(
        {
          attributes: ["class", "TranscriptList"],
          children: [{ attributes: ["item-key", "tail-message"] }],
        },
        "thread-live",
        "tail-message",
      ),
    ).toMatchObject({
      transcriptListCount: 1,
      lastMessageRendered: true,
    });
  });

  it("rejects transient overlays before retaining comparison evidence", () => {
    const expression = comparisonTransientUiReadyExpression();
    expect(expression).toContain('aria-label="Recent views"');
    expect(expression).toContain('data-transcript-selection-action="true"');
    expect(expression).toContain('data-panel-resize-overlay="true"');
    expect(expression).toContain('data-slot="dialog-popup"');
    expect(expression).toContain('data-slot="menu-popup"');
    expect(expression).toContain('data-toast-root="true"');
    expect(expression).toContain("notificationDetails");
    expect(expression).toContain("node.getAttribute('data-state')");

    expect(
      nativeTransientUiStateFromDom({
        attributes: ["class", "SliceRoot"],
        children: [
          { attributes: ["class", "LxDialogOverlay"] },
          { attributes: ["class", "TranscriptSelectionToolbar"] },
          { attributes: ["class", "RightPanelResizeOverlay"] },
          { attributes: ["class", "LxMenuLayer"] },
          { attributes: ["class", "ProviderUpdatePrompt"] },
          { attributes: ["class", "TaskCompletionToast"] },
        ],
      }),
    ).toEqual({
      dialogCount: 1,
      menuLayerCount: 1,
      notificationCount: 2,
      resizeOverlayCount: 1,
      selectionToolbarCount: 1,
    });
  });

  it("waits for Electron transient UI to remain clean before retaining evidence", () => {
    const source = readFileSync(new URL("./dev-electron-lynxtron.mjs", import.meta.url), "utf8");
    expect(source).toContain("const transientDeadline = Date.now() + 10_000");
    expect(source).toContain("cleanTransientSince === 0 && Date.now() < transientDeadline");
    expect(source).toContain("Date.now() - cleanTransientSince < 250");
    expect(source).toContain("cleanTransientSince = clean");
    expect(source).toContain('typeof value !== "number" || value === 0');
  });

  it("preserves the renderer comparison allowlist while resetting transient state", () => {
    const values = new Map([
      ["synara:theme", "light"],
      ["synara:app-settings:v1", '{"density":"compact"}'],
      ["synara:appsnap-welcome:v1", '{"acknowledged":true}'],
      ["synara:terminal-state:v1", '{"state":{"terminal":true}}'],
      ["synara:right-dock-state:v1", '{"state":{"browser":true}}'],
      ["synara:composer-drafts:v1", "discard me"],
    ]);
    const localStorage = {
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    };
    let reloadCount = 0;
    const location = {
      reload: () => {
        reloadCount += 1;
      },
    };

    Function(
      "localStorage",
      "location",
      comparisonRendererResetExpression("dark"),
    )(localStorage, location);

    expect(Object.fromEntries(values)).toEqual({
      "synara:theme": "dark",
      "synara:app-settings:v1":
        '{"density":"compact","enableProviderUpdateChecks":false,"enableTaskCompletionToasts":false,"comparisonForwardCompatSentinel":"kept"}',
      "synara:appsnap-welcome:v1": '{"acknowledged":true}',
      "synara:terminal-state:v1": '{"state":{"terminal":true}}',
      "synara:right-dock-state:v1": '{"state":{"browser":true}}',
    });
    expect(reloadCount).toBe(1);
  });

  it("can explicitly retain the AppSnap welcome state for dialog comparison", () => {
    const values = new Map([["synara:appsnap-welcome:v1", '{"acknowledged":true}']]);
    const localStorage = {
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, value),
    };
    const location = { reload() {} };

    Function(
      "localStorage",
      "location",
      comparisonRendererResetExpression("light", "welcome"),
    )(localStorage, location);

    expect(values.has("synara:appsnap-welcome:v1")).toBe(false);
  });

  it("seeds a canonical non-empty recent-view history for thread comparisons", () => {
    const values = new Map();
    const localStorage = {
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, value),
    };
    const location = { reload() {} };

    Function(
      "localStorage",
      "location",
      comparisonRendererResetExpression("dark", "acknowledged", null, "thread-canonical"),
    )(localStorage, location);

    expect(JSON.parse(values.get("synara:recent-views:v1"))).toEqual({
      state: {
        recentViews: [
          { kind: "thread", threadId: "thread-canonical" },
          { kind: "settings", section: "general" },
        ],
      },
      version: 0,
    });
  });

  it("pins an explicit chat font size into the copied renderer settings", () => {
    const values = new Map([
      ["synara:app-settings:v1", '{"uiDensity":"compact","chatFontSizePx":12}'],
    ]);
    const localStorage = {
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, value),
    };
    const location = { reload() {} };

    Function(
      "localStorage",
      "location",
      comparisonRendererResetExpression("light", "acknowledged", 18),
    )(localStorage, location);

    expect(JSON.parse(values.get("synara:app-settings:v1"))).toEqual({
      uiDensity: "compact",
      chatFontSizePx: 18,
      enableProviderUpdateChecks: false,
      enableTaskCompletionToasts: false,
      comparisonForwardCompatSentinel: "kept",
    });
  });

  it("opens and verifies the ordinary Electron Terminal through canonical stores", () => {
    const threadId = `thread-'quoted`;
    const openExpression = comparisonTerminalOpenExpression(threadId);
    const readyExpression = comparisonTerminalReadyExpression(threadId);

    expect(openExpression).toContain("import('/src/rightDockStore.ts')");
    expect(openExpression).toContain("clearThreadDockState");
    expect(openExpression).toContain("useRightDockStore.getState().openPane");
    expect(openExpression).toContain(JSON.stringify(threadId));
    expect(openExpression).toContain("{ paneId: 'terminal', kind: 'terminal' }");
    expect(readyExpression).toContain("import('/src/terminalStateStore.ts')");
    expect(readyExpression).toContain(JSON.stringify(`dock-terminal:${threadId}`));
    expect(readyExpression).toContain("dockState?.open === true");
    expect(readyExpression).toContain("dockState.activePaneId === terminalPane.id");
    expect(readyExpression).toContain("terminalState?.terminalOpen === true");
    expect(readyExpression).toContain("document.querySelectorAll('.xterm').length");
    expect(readyExpression).toContain(
      "document.body.innerText.includes('Terminal is sleeping. Restoring shortly.')",
    );
    expect(readyExpression).toContain("const rendered = xtermCount > 0 && !sleepingPreview");
    expect(readyExpression).toContain("flushTerminalStatePersistence()");
  });

  it("surfaces renderer exceptions from CDP evaluations", () => {
    expect(
      electronEvaluationError(
        {
          result: {
            exceptionDetails: { exception: { description: "ReferenceError: bad import" } },
          },
        },
        "opening Terminal",
      )?.message,
    ).toBe("Failed opening Terminal: ReferenceError: bad import");
    expect(electronEvaluationError({ result: { result: { value: true } } }, "reading")).toBeNull();
  });

  it("generates commands with one home, endpoint credential, and matched route", () => {
    const paths = resolveDesktopComparisonPaths("/repo");
    const commands = desktopComparisonCommands(
      { ...DEFAULT_DESKTOP_COMPARISON_OPTIONS, threadId: LEGACY_COMPARISON_THREAD_ID },
      paths,
      "comparison-token",
      "/runtime/electron",
    );

    expect(commands.electron).toMatchObject({
      command: "/runtime/electron",
      cwd: "/repo/apps/desktop",
      env: {
        SYNARA_HOME: "/repo/.synara-desktop-comparison/electron",
        SYNARA_ALLOW_PARALLEL_INSTANCE: "1",
        SYNARA_DESKTOP_AUTH_TOKEN: "comparison-token",
        SYNARA_DESKTOP_USER_DATA_DIR: "/repo/.synara-desktop-comparison/electron-profile",
        SYNARA_DISABLE_THREAD_RETENTION: "1",
        SYNARA_SKIP_SHELL_ENVIRONMENT_SYNC: "1",
        SYNARA_SKIP_MEDIA_PERMISSION_SETUP: "1",
        VITE_DEV_SERVER_URL:
          "http://127.0.0.1:8891/#/lynx-landing-thread-1787298664226-1b47e02983941",
      },
    });
    expect(commands.electron.args).toContain("--remote-debugging-port=9223");
    // Occluded windows would stop requestAnimationFrame and stall the composer.
    expect(commands.electron.args).toContain("--disable-backgrounding-occluded-windows");
    expect(commands.electron.env.SYNARA_BACKGROUND_LAUNCH).toBe("1");
    expect(commands.lynx.env.SYNARA_BACKGROUND_LAUNCH).toBe("1");
    expect(commands.electron.args).toContain(
      "--user-data-dir=/repo/.synara-desktop-comparison/electron-profile",
    );
    expect(commands.lynx).toMatchObject({
      command:
        "/repo/.synara-desktop-comparison/runtime/Synara Comparison Lynxtron.app/Contents/MacOS/lynxtron",
      args: [
        "/repo/apps/lynx/dist/desktop",
        "synara://thread/lynx-landing-thread-1787298664226-1b47e02983941",
      ],
      env: {
        NODE_ENV: "production",
        SYNARA_ALLOW_PARALLEL_INSTANCE: "1",
        SYNARA_ENABLE_DEVTOOL: "1",
        SYNARA_LYNX_USER_DATA_DIR: "/repo/.synara-desktop-comparison/lynx",
        SYNARA_MANAGED_RELAUNCH: "1",
      },
    });
    expect(commands.preRuntimeBuild).toHaveLength(4);
    expect(commands.preRuntimeBuild.at(-2)).toMatchObject({
      command: "bun",
      args: ["run", "build:web"],
      cwd: "/repo/apps/lynx",
    });
    // One endpoint-independent Native build per source state; the live backend
    // reaches the renderer through the host at load time.
    expect(commands.preRuntimeBuild.at(-1)).toMatchObject({
      command: "bun",
      args: ["run", "build"],
      cwd: "/repo/apps/lynx",
      env: { SYNARA_WS_URL: "" },
    });
    expect(commands).not.toHaveProperty("nativeBuild");
  });

  it("makes an inspector-disabled visual run explicit in both build and readiness gates", () => {
    const options = parseDesktopComparisonArgs(["--skip-lynx-devtool"]);
    const commands = desktopComparisonCommands(
      options,
      resolveDesktopComparisonPaths("/repo"),
      "comparison-token",
      "/runtime/electron",
    );

    expect(commands.preRuntimeBuild.at(-1)?.env).toEqual({ SYNARA_WS_URL: "" });
    expect(options.skipLynxDevtool).toBe(true);
  });

  it("copies Lynxtron to an exact-owned app path for desktop automation", () => {
    const root = mkdtempSync(join(tmpdir(), "synara-owned-lynxtron-"));
    const paths = resolveDesktopComparisonPaths(root);
    mkdirSync(join(paths.sourceLynxtronApp, "Contents", "MacOS"), { recursive: true });
    mkdirSync(dirname(paths.lynxtronPackageJson), { recursive: true });
    writeFileSync(paths.lynxtronPackageJson, JSON.stringify({ version: "0.0.21" }));
    writeFileSync(
      join(paths.sourceLynxtronApp, "Contents", "Info.plist"),
      `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>com.lynxjs.Lynxtron</string>
<key>CFBundleDisplayName</key><string>lynxtron</string>
<key>CFBundleName</key><string>lynxtron</string>
</dict></plist>`,
    );
    writeFileSync(join(paths.sourceLynxtronApp, "Contents", "MacOS", "lynxtron"), "binary");

    prepareOwnedLynxtronRuntime(paths, { sign: false });

    expect(readFileSync(paths.ownedLynxtronExecutable, "utf8")).toBe("binary");
    expect(paths.ownedLynxtronApp).not.toBe(paths.sourceLynxtronApp);
    expect(
      spawnSync(
        "plutil",
        [
          "-extract",
          "CFBundleIdentifier",
          "raw",
          join(paths.ownedLynxtronApp, "Contents", "Info.plist"),
        ],
        { encoding: "utf8" },
      ).stdout.trim(),
    ).toBe("com.lynxjs.SynaraComparisonLynxtron");
    expect(
      spawnSync(
        "plutil",
        [
          "-extract",
          "CFBundleShortVersionString",
          "raw",
          join(paths.ownedLynxtronApp, "Contents", "Info.plist"),
        ],
        { encoding: "utf8" },
      ).stdout.trim(),
    ).toBe("0.0.21");
    expect(
      spawnSync(
        "plutil",
        [
          "-extract",
          "SynaraLynxtronSourceVersion",
          "raw",
          join(paths.ownedLynxtronApp, "Contents", "Info.plist"),
        ],
        { encoding: "utf8" },
      ).stdout.trim(),
    ).toBe("0.0.21");
    expect(
      spawnSync(
        "plutil",
        ["-extract", "LSUIElement", "raw", join(paths.ownedLynxtronApp, "Contents", "Info.plist")],
        { encoding: "utf8" },
      ).stdout.trim(),
    ).toBe("true");
    if (platform() === "darwin") {
      const source = readFileSync(new URL("./dev-electron-lynxtron.mjs", import.meta.url), "utf8");
      expect(source).toContain(
        'spawnSync("ditto", [paths.sourceLynxtronApp, paths.ownedLynxtronApp]',
      );
    }
  });

  it("matches only exact comparison-owned Lynxtron executables during cleanup", () => {
    const executable =
      "/repo/.synara-desktop-comparison/runtime/Synara Comparison Lynxtron.app/Contents/MacOS/lynxtron";
    expect(
      ownedLynxtronPidsFromPs(
        [
          `101 ${executable} /repo/apps/lynx/dist/desktop`,
          "102 /repo/node_modules/@lynx-js/lynxtron/dist/lynxtron.app/Contents/MacOS/lynxtron /repo/apps/lynx/dist/desktop",
          `103 ${executable}-helper`,
        ].join("\n"),
        executable,
      ),
    ).toEqual([101]);
  });

  it("matches only Electron processes using the exact comparison profile", () => {
    const executable =
      "/repo/apps/desktop/.electron-runtime/Synara (Dev).app/Contents/MacOS/Electron";
    const profile = "/repo/.synara-desktop-comparison/electron-profile";
    const commands = [
      `${executable} --remote-debugging-port=9223 --user-data-dir=${profile} /repo/apps/desktop/dist-electron/main.js`,
      `${executable} --remote-debugging-port=9224 --user-data-dir=/repo/.synara/default-profile /repo/apps/desktop/dist-electron/main.js`,
      `/Applications/Other.app/Contents/MacOS/Electron --user-data-dir=${profile}`,
      `${executable} --user-data-dir=${profile}-other /repo/apps/desktop/dist-electron/main.js`,
    ];
    const output = commands.map((command, index) => `${index + 101} ${command}`).join("\n");

    expect(ownedElectronPidsFromPs(output, executable, profile)).toEqual([101]);
  });

  it("matches only the repo-local Vite process on the comparison port", () => {
    const root = "/repo/apps/web";
    const output = [
      "101 node /repo/apps/web/node_modules/.bin/vite --host 127.0.0.1 --port 8891 --strictPort",
      "102 node /repo/apps/web/node_modules/.bin/vite --host 127.0.0.1 --port 8892 --strictPort",
      "103 node /other/apps/web/node_modules/.bin/vite --host 127.0.0.1 --port 8891 --strictPort",
    ].join("\n");

    expect(ownedWebPidsFromPs(output, root, 8891)).toEqual([101]);
  });

  it("accepts a DevTool listener only when the requested PID owns the requested port", () => {
    const lsof = [
      "COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME",
      "lynxtron  101 user   20u  IPv4  0x01      0t0  TCP *:8902 (LISTEN)",
      "lynxtron  202 user   21u  IPv4  0x02      0t0  TCP 127.0.0.1:8903 (LISTEN)",
    ].join("\n");

    expect(lsofShowsPidListeningOnPort(lsof, 101, 8902)).toBe(true);
    expect(lsofShowsPidListeningOnPort(lsof, 202, 8902)).toBe(false);
    expect(lsofShowsPidListeningOnPort(lsof, 101, 8903)).toBe(false);
  });

  it("discovers the unique DevTool port owned by the launched PID", () => {
    const lsof = [
      "COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME",
      "lynxtron  101 user   20u  IPv4  0x01      0t0  TCP *:8904 (LISTEN)",
      "lynxtron  202 user   21u  IPv4  0x02      0t0  TCP *:8903 (LISTEN)",
      "lynxtron  101 user   22u  IPv4  0x03      0t0  TCP *:9222 (LISTEN)",
    ].join("\n");

    expect(pidOwnedDevtoolPortsFromLsof(lsof, 101)).toEqual([8904]);
    expect(pidOwnedDevtoolPortsFromLsof(lsof, 202)).toEqual([8903]);
  });

  it("allows slow DevTool registration without weakening PID ownership", () => {
    expect(resolveLynxDevtoolReadyTimeoutMs()).toBe(30_000);
    expect(resolveLynxDevtoolReadyTimeoutMs("45000")).toBe(45_000);
    expect(resolveLynxDevtoolReadyTimeoutMs("invalid")).toBe(30_000);
    expect(resolveLynxDevtoolReadyTimeoutMs("0")).toBe(30_000);
  });

  it("does not claim Lynx DevTool readiness before PID-owned LISTEN verification", () => {
    const source = readFileSync(new URL("./dev-electron-lynxtron.mjs", import.meta.url), "utf8");

    expect(source).toContain("await waitForOwnedDevtoolListener(");
    expect(source).toContain("verified LISTEN");
    expect(source).toContain("reserves a preferred free slot but is not a runtime override");
    expect(source).toContain("lynxDevtool.port");
    expect(source).toContain("may also lack an inspector-capable devtool variant");
    expect(source).not.toContain("SYNARA_LYNX_DEVTOOL_PORT:");
  });

  it("signs the copied Lynxtron framework before the outer app", () => {
    const source = readFileSync(new URL("./dev-electron-lynxtron.mjs", import.meta.url), "utf8");
    const frameworkSign = source.indexOf('["--force", "--sign", "-", embeddedFramework]');
    const appSign = source.indexOf('["--force", "--sign", "-", paths.ownedLynxtronApp]');
    expect(frameworkSign).toBeGreaterThan(-1);
    expect(appSign).toBeGreaterThan(frameworkSign);
    expect(source).not.toContain('["--force", "--deep", "--sign", "-", paths.ownedLynxtronApp]');
  });

  it("keeps owned children in the foreground process group for terminal cleanup", () => {
    const source = readFileSync(new URL("./dev-electron-lynxtron.mjs", import.meta.url), "utf8");
    expect(source).toContain("detached: false");
    expect(source).toContain("child.kill(signal)");
    expect(source).toContain("stopExistingOwnedLynxtronRuntime(paths)");
    expect(source).toContain("stopExistingOwnedElectronRuntime(paths, electronExecutable)");
    expect(source).toContain("stopExistingOwnedWebRuntime(paths, options.webPort)");
    expect(source).toContain('stopAllOwned("SIGKILL")');
    expect(source).not.toContain("process.kill(-child.pid, signal)");
  });

  it("checks comparison ports before starting heavyweight builds", () => {
    const source = readFileSync(new URL("./dev-electron-lynxtron.mjs", import.meta.url), "utf8");
    expect(source.indexOf("if (await isPortOpen(port))")).toBeLessThan(
      source.indexOf("for (const command of commands.preRuntimeBuild)"),
    );
  });

  it("clones the real seed snapshot without carrying live runtime ownership files", () => {
    const root = mkdtempSync(join(tmpdir(), "synara-desktop-comparison-"));
    const paths = resolveDesktopComparisonPaths(root);
    mkdirSync(join(paths.seedHome, "dev", "provider-status"), { recursive: true });
    const sqlite = spawnSync(
      "sqlite3",
      [
        join(paths.seedHome, "dev", "state.sqlite"),
        "create table fixture(value text); insert into fixture values('example.js');",
      ],
      { encoding: "utf8" },
    );
    expect(sqlite.status).toBe(0);
    writeFileSync(
      join(paths.seedHome, "dev", "settings.json"),
      '{"keepFixtureSetting":true,"enableProviderUpdateChecks":true}',
    );
    writeFileSync(join(paths.seedHome, "dev", "server-runtime.json"), '{"pid":1}');

    prepareDesktopComparisonHome(paths);

    expect(
      JSON.parse(readFileSync(join(paths.electronHome, "dev", "settings.json"), "utf8")),
    ).toEqual({
      keepFixtureSetting: true,
      enableProviderUpdateChecks: false,
      enableTaskCompletionToasts: false,
    });
    expect(
      spawnSync(
        "sqlite3",
        [join(paths.electronHome, "dev", "state.sqlite"), "select value from fixture;"],
        { encoding: "utf8" },
      ).stdout,
    ).toBe("example.js\n");
    expect(existsSync(join(paths.electronHome, "dev", "server-runtime.json"))).toBe(false);
  });

  it("fails before launch when the requested thread is absent from the seed snapshot", () => {
    const root = mkdtempSync(join(tmpdir(), "synara-desktop-comparison-thread-"));
    const paths = resolveDesktopComparisonPaths(root);
    mkdirSync(join(paths.electronHome, "dev"), { recursive: true });
    const sqlite = spawnSync(
      "sqlite3",
      [
        join(paths.electronHome, "dev", "state.sqlite"),
        "create table projection_projects(project_id text primary key, kind text, deleted_at text); create table projection_threads(thread_id text primary key, project_id text, deleted_at text); insert into projection_projects values('project-live', 'project', null), ('project-chat', 'chat', null); insert into projection_threads values('thread-live', 'project-live', null), ('thread-chat', 'project-chat', null);",
      ],
      { encoding: "utf8" },
    );
    expect(sqlite.status).toBe(0);

    expect(() => assertComparisonThreadAvailable(paths, "thread-live")).not.toThrow();
    expect(() => assertComparisonThreadAvailable(paths, "thread-chat")).toThrow(
      "does not belong to a visible ordinary project",
    );
    expect(() => assertComparisonThreadAvailable(paths, "thread-missing")).toThrow(
      "Comparison thread thread-missing is missing from the seed snapshot or does not belong to a visible ordinary project.",
    );
  });

  it("copies only canonical visual/settings state into the owned Lynx KV", () => {
    const root = mkdtempSync(join(tmpdir(), "synara-renderer-state-"));
    const paths = resolveDesktopComparisonPaths(root);

    expect(COMPARISON_RENDERER_STORAGE_KEYS).toEqual([
      "synara:theme",
      "synara:app-settings:v1",
      "synara:appsnap-welcome:v1",
      "synara:terminal-state:v1",
      "synara:right-dock-state:v1",
      "synara:recent-views:v1",
    ]);
    writeComparisonRendererState(paths, {
      "synara:theme": "dark",
      "synara:app-settings:v1": '{"hiddenProviders":["kilo"]}',
      "synara:appsnap-welcome:v1": '{"acknowledged":true}',
      "synara:terminal-state:v1": '{"state":{"terminalStateByThreadId":{}}}',
      "synara:right-dock-state:v1": '{"state":{"dockStateByThreadId":{}}}',
      "synara:recent-views:v1": undefined,
      "synara:composer-drafts:v1": "must-not-copy",
      "synara:renderer-state:v8": "must-not-copy",
    });

    expect(JSON.parse(readFileSync(paths.lynxKvState, "utf8"))).toEqual({
      "synara:theme": "dark",
      "synara:app-settings:v1": '{"hiddenProviders":["kilo"]}',
      "synara:appsnap-welcome:v1": '{"acknowledged":true}',
      "synara:terminal-state:v1": '{"state":{"terminalStateByThreadId":{}}}',
      "synara:right-dock-state:v1": '{"state":{"dockStateByThreadId":{}}}',
    });
  });

  it("keeps the requested comparison theme explicit after Electron migration", () => {
    const root = mkdtempSync(join(tmpdir(), "synara-renderer-theme-"));
    const paths = resolveDesktopComparisonPaths(root);

    writeComparisonRendererState(paths, { "synara:app-settings:v1": "{}" }, "dark");

    expect(JSON.parse(readFileSync(paths.lynxKvState, "utf8"))).toEqual({
      "synara:app-settings:v1": "{}",
      "synara:theme": "dark",
    });
  });

  it("settles provider status through Electron before retaining either renderer", () => {
    const source = readFileSync(new URL("./dev-electron-lynxtron.mjs", import.meta.url), "utf8");
    const configureSource = source.slice(
      source.indexOf("async function configureElectronRenderer"),
      source.indexOf("function comparisonRendererStateExpression"),
    );
    const mainSource = source.slice(source.indexOf("async function main()"));
    // Module imports resolve only after the dev-server document commits.
    expect(configureSource.indexOf('value?.readyState === "complete"')).toBeLessThan(
      configureSource.indexOf("ensureNativeApi().server.refreshProviders()"),
    );
    expect(configureSource.indexOf("ensureNativeApi().server.refreshProviders()")).toBeLessThan(
      configureSource.indexOf("comparisonRendererResetExpression("),
    );
    expect(configureSource.indexOf("settleElectronRoute(cdp, expectedUrl)")).toBeLessThan(
      configureSource.indexOf("certifyElectronAnchor("),
    );
    // Build identity and seed identity are verified before any process starts,
    // and the backend is identified before either renderer is certified.
    expect(mainSource.indexOf("nativeBuildStampProblems(")).toBeLessThan(
      mainSource.indexOf("startOwned(commands.web)"),
    );
    expect(mainSource.indexOf("comparisonFixtureMismatches(")).toBeLessThan(
      mainSource.indexOf("startOwned(commands.web)"),
    );
    expect(mainSource.indexOf("readBackendIdentity(socketUrl.toString())")).toBeLessThan(
      mainSource.indexOf("configureElectronRenderer("),
    );
    expect(
      mainSource.indexOf("commands.lynx.env.SYNARA_WS_URL = socketUrl.toString()"),
    ).toBeLessThan(mainSource.indexOf("startOwned(commands.lynx)"));
    expect(mainSource.indexOf("verifyNativeBackendConnections(")).toBeLessThan(
      mainSource.indexOf('run.status = "certified"'),
    );
    expect(source).toContain('process.env.SYNARA_COMPARE_ELECTRON_READY_TIMEOUT_MS ?? "90000"');
    expect(source).toContain('["Web", options.webPort]');
  });

  it("opens git and browser panes through the canonical dock store", () => {
    expect(() => parseDesktopComparisonArgs(["--dock", "terminal"])).toThrow(
      "--dock requires git or browser.",
    );
    const open = comparisonDockOpenExpression("thread-1", "git");
    expect(open).toContain('clearThreadDockState("thread-1")');
    expect(open).toContain('openPane("thread-1", { paneId: "git", kind: "git" })');
    // Readiness requires the persisted state Native restores from.
    expect(comparisonDockReadyExpression("thread-1", "git")).toContain(
      "localStorage.getItem('synara:right-dock-state:v1')",
    );
  });

  it("retries idempotent Electron reads through a reload and records the activity trail", async () => {
    const sent = [];
    const enabled = [];
    const listeners = new Set();
    let collectNext = true;
    const socket = {
      addEventListener: (_type, listener) => listeners.add(listener),
      removeEventListener: (_type, listener) => listeners.delete(listener),
      send: (raw) => {
        const message = JSON.parse(raw);
        if (!message.params) {
          enabled.push(message.method);
          return;
        }
        sent.push({ id: message.id, expression: message.params.expression });
        const reply = collectNext
          ? { id: message.id, error: { message: "Promise was collected" } }
          : { id: message.id, result: { result: { value: "ok" } } };
        collectNext = false;
        queueMicrotask(() => {
          for (const listener of [...listeners]) listener({ data: JSON.stringify(reply) });
        });
      },
    };
    const trail = [];
    const cdp = createElectronCdpClient(socket, trail);

    await expect(
      cdp.evaluate("location.href", "reading route", { retryTransient: true }),
    ).resolves.toBe("ok");
    // Lifecycle events are subscribed so context loss shows up in the trail.
    expect(enabled).toEqual(["Runtime.enable", "Page.enable"]);
    expect(sent.map((entry) => entry.id)).toEqual([1, 2]);
    expect(trail).toMatchObject([
      {
        requestId: 1,
        activity: "reading route",
        attempt: 1,
        ok: false,
        error: "Promise was collected",
      },
      { requestId: 2, activity: "reading route", attempt: 2, ok: true },
    ]);

    collectNext = true;
    await expect(cdp.evaluate("mutate()", "mutating state")).rejects.toThrow(
      "Promise was collected",
    );
    expect(trail.at(-1)).toMatchObject({ activity: "mutating state", ok: false });
  });

  it("identifies every owned comparison process for cleanup verification", () => {
    const paths = resolveDesktopComparisonPaths("/repo");
    const output = [
      `101 ${paths.ownedLynxtronExecutable} /repo/apps/lynx/dist/desktop synara://thread/a`,
      `102 /runtime/electron --remote-debugging-port=9223 --user-data-dir=${paths.electronUserDataDir} main.js`,
      "103 /repo/apps/web/node_modules/.bin/vite --host 127.0.0.1 --port 8891 --strictPort",
      "104 /runtime/electron --user-data-dir=/somewhere/else main.js",
      "105 /Applications/Other.app/Contents/MacOS/other",
    ].join("\n");
    expect(ownedComparisonPidsFromPs(output, paths, "/runtime/electron", 8891)).toEqual({
      lynxtron: [101],
      electron: [102],
      web: [103],
    });
  });
});
