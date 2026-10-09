import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import type { NativeApi, ThreadId } from "@synara/contracts";
import { resetWsNativeApiForTest } from "@synara-web/wsNativeApi";

import { ensureNativeApi, readNativeApi, setNativeApiForTest } from "./nativeApi.lynx";
import { flushHost, installFakeNativeHost, type FakeNativeHost } from "./fakeNativeHost.testUtils";

const GUARDED_GLOBALS = ["window", "document", "navigator", "location", "fetch"] as const;
const PENDING = Symbol("pending");

function throwingGlobal(name: string): unknown {
  return new Proxy(() => undefined, {
    apply: () => {
      throw new Error(`${name} accessed`);
    },
    get: (_target, property) => {
      throw new Error(`${name}.${String(property)} accessed`);
    },
  });
}

const BASE_INPUT = {
  threadId: "thread-1",
  cwd: "/tmp/project",
  projectId: "project-1",
  url: "https://example.com",
  partialPath: "/tmp",
  defaultFilename: "notes.md",
  contents: "# notes",
  provider: "codex",
  terminalId: "terminal-1",
  path: "/tmp/project/file.txt",
  tabId: "tab-1",
  actionId: "action-1",
  automationId: "automation-1",
  runId: "run-1",
  command: "thread.archive",
} as const;

function argumentsFor(namespace: string, method: string): unknown[] {
  if (method.startsWith("on")) return [() => undefined];
  if (namespace === "shell" && method === "openInEditor") return [BASE_INPUT.cwd, "vscode"];
  if (namespace === "shell") return [BASE_INPUT.url];
  if (namespace === "dialogs" && method === "confirm") return ["Proceed?"];
  if (namespace === "dialogs" && method === "pickFolder") return [];
  if (namespace === "contextMenu") return [[{ id: "a", label: "A" }], { x: 4, y: 8 }];
  if (namespace === "orchestration" && method === "replayEvents") return [0];
  if (namespace === "orchestration" && method === "dispatchCommand") {
    return [{ type: "thread.rename", threadId: BASE_INPUT.threadId, title: "Renamed" }];
  }
  return [{ ...BASE_INPUT }];
}

describe("Lynx NativeApi facade", () => {
  let host: FakeNativeHost;

  beforeEach(() => {
    host = installFakeNativeHost({
      rpc: (tag) => ({ tag }),
      bridge: {
        dialogsConfirm: () => ({ confirmed: true }),
        dialogsPickFolder: () => ({ path: "/tmp/picked" }),
        dialogsSaveFile: () => ({ path: "/tmp/saved.md" }),
        shellOpenExternal: () => ({ opened: true }),
        shellShowInFolder: () => ({ opened: true }),
        contextMenuShow: () => ({ id: "a" }),
      },
    });
    for (const name of GUARDED_GLOBALS) rs.stubGlobal(name, throwingGlobal(name));
  });

  afterEach(async () => {
    setNativeApiForTest(undefined);
    await resetWsNativeApiForTest();
    rs.unstubAllGlobals();
  });

  it("returns the upstream facade on Lynx instead of a null read", () => {
    const api = readNativeApi();
    expect(api).not.toBeNull();
    expect(ensureNativeApi()).toBe(api);
  });

  it("touches every namespace once without reaching for browser globals", async () => {
    const api = ensureNativeApi() as unknown as Record<string, Record<string, unknown>>;
    const namespaces = Object.keys(api).toSorted();
    expect(namespaces).toEqual(
      [
        "automation",
        "browser",
        "contextMenu",
        "dialogs",
        "filesystem",
        "git",
        "orchestration",
        "projects",
        "provider",
        "pullRequests",
        "server",
        "shell",
        "stats",
        "studio",
        "terminal",
      ].toSorted(),
    );

    const browserGlobalAccesses: string[] = [];
    let exercised = 0;
    for (const namespace of namespaces) {
      for (const [method, member] of Object.entries(api[namespace] ?? {})) {
        if (typeof member !== "function") continue;
        exercised += 1;
        const label = `${namespace}.${method}`;
        let outcome: unknown;
        try {
          // Long-lived calls (git stacked actions stream until the host ends
          // them) stay pending by design; a bounded wait keeps the sweep moving.
          outcome = await Promise.race([
            (member as (...args: unknown[]) => unknown)(...argumentsFor(namespace, method)),
            new Promise<symbol>((resolve) => setTimeout(() => resolve(PENDING), 200)),
          ]);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.endsWith(" accessed") || error instanceof ReferenceError) {
            browserGlobalAccesses.push(`${label}: ${message}`);
          }
          continue;
        }
        if (typeof outcome === "function") outcome();
      }
    }
    await flushHost();

    expect(browserGlobalAccesses).toEqual([]);
    expect(exercised).toBeGreaterThan(100);
  });

  it("routes the DOM-bound namespaces to the Lynx host ports", async () => {
    const api = ensureNativeApi();

    await expect(api.dialogs.confirm("Proceed?")).resolves.toBe(true);
    await expect(api.dialogs.pickFolder()).resolves.toBe("/tmp/picked");
    await expect(
      api.dialogs.saveFile?.({ defaultFilename: "notes.md", contents: "# notes" }),
    ).resolves.toBe("/tmp/saved.md");
    await expect(api.shell.openExternal("https://example.com")).resolves.toBeUndefined();
    await expect(api.shell.showInFolder("/tmp/project")).resolves.toBeUndefined();
    await expect(api.contextMenu.show([{ id: "a", label: "A" }], { x: 4, y: 8 })).resolves.toBe(
      "a",
    );

    // Channel streams start in the background as soon as the facade exists.
    const hostPortCalls = host.calls
      .map((call) => call.name)
      .filter((name) => name !== "synaraRpcStream");
    expect(hostPortCalls).toEqual([
      "dialogsConfirm",
      "dialogsPickFolder",
      "dialogsSaveFile",
      "shellOpenExternal",
      "shellShowInFolder",
      "contextMenuShow",
    ]);
    expect(host.callsNamed("contextMenuShow")[0]?.params).toEqual({
      items: [{ id: "a", label: "A" }],
      position: { x: 4, y: 8 },
    });
  });

  it("serves server config, settings and voice transcription through the host relay", async () => {
    const api = ensureNativeApi();

    await expect(api.server.getConfig()).resolves.toEqual({ tag: "server.getConfig" });
    await expect(api.server.getSettings()).resolves.toEqual({ tag: "server.getSettings" });
    await expect(
      api.server.transcribeVoice({
        provider: "codex",
        cwd: "/tmp/project",
        mimeType: "audio/webm",
        sampleRateHz: 16_000,
        durationMs: 1_000,
        audioBase64: "",
      }),
    ).resolves.toEqual({ tag: "server.transcribeVoice" });

    expect(host.callsNamed("synaraRpc").map((call) => call.params.tag)).toEqual([
      "server.getConfig",
      "server.getSettings",
      "server.transcribeVoice",
    ]);
    await expect(api.server.getAuthSession()).rejects.toThrow(/Lynxtron host/);
    await expect(api.browser.getState({ threadId: "thread-1" as ThreadId })).resolves.toMatchObject(
      { open: false, tabs: [] },
    );
  });

  it("honors a test override", () => {
    const override = { dialogs: {} } as unknown as NativeApi;
    setNativeApiForTest(override);
    expect(readNativeApi()).toBe(override);
    expect(ensureNativeApi()).toBe(override);
  });
});
