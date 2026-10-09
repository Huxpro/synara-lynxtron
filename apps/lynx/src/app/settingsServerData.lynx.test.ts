// The Settings data paths run on upstream's facade and query keys: requests
// leave through the transport compat (no legacy relay envelope), the confirmed
// settings view lands in upstream's settings query, and no Settings source
// reaches for the legacy client or a Lynx-only cache key.

import { readdirSync, readFileSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, it } from "@rstest/core";
import { QueryClient } from "@tanstack/react-query";
import type { ServerSettingsView } from "@synara/contracts";
import { gitRemoveWorktreeMutationOptions } from "@synara-web/lib/gitReactQuery";
import {
  serverQueryKeys,
  serverSettingsQueryOptions,
  serverWorktreesQueryOptions,
} from "@synara-web/lib/serverReactQuery";
import { resetWsNativeApiForTest } from "@synara-web/wsNativeApi";

import {
  FakeRpcFailure,
  installFakeNativeHost,
  type FakeNativeHost,
} from "../adapters/fakeNativeHost.testUtils";
import { ensureNativeApi, setNativeApiForTest } from "../adapters/nativeApi.lynx";
import {
  EXTERNAL_MCP_INTEGRATIONS_QUERY_KEY,
  externalMcpIntegrationsQueryOptions,
  readServerSettings,
  writeServerSettings,
} from "./settingsServerData.lynx";

function settingsView(patch: Record<string, unknown>): ServerSettingsView {
  return { enableAssistantStreaming: true, ...patch } as unknown as ServerSettingsView;
}

function rpcCalls(host: FakeNativeHost) {
  return host.callsNamed("synaraRpc").map((call) => call.params);
}

/** The request payload as the host receives it (JSON on the bridge, or the object). */
function hostPayload(call: Record<string, unknown>): unknown {
  return typeof call.payloadJson === "string" ? JSON.parse(call.payloadJson) : call.payload;
}

describe("Settings server data over the upstream facade", () => {
  let host: FakeNativeHost;
  let queryClient: QueryClient;
  let failNextUpdate = false;

  beforeEach(() => {
    failNextUpdate = false;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    host = installFakeNativeHost({
      rpc: (tag, payload) => {
        if (tag === "server.getSettings") return settingsView({ source: "server" });
        if (tag === "server.updateSettings") {
          if (failNextUpdate) throw new FakeRpcFailure({ code: "SETTINGS_WRITE_FAILED" });
          return settingsView({ source: "updated", patch: payload });
        }
        if (tag === "server.listWorktrees") return { worktrees: [] };
        if (tag === "server.listExternalMcpIntegrations") return [];
        return null;
      },
    });
  });

  afterEach(async () => {
    queryClient.clear();
    setNativeApiForTest(undefined);
    await resetWsNativeApiForTest();
  });

  it("writes through the facade and publishes the confirmed view under upstream's key", async () => {
    const result = await writeServerSettings(queryClient, { enableAssistantStreaming: false });

    expect(result).toMatchObject({ source: "updated" });
    expect(queryClient.getQueryData(serverQueryKeys.settings())).toBe(result);
    const calls = rpcCalls(host);
    expect(calls.map((call) => call.tag)).toEqual(["server.updateSettings"]);
    // The legacy relay stamped every request with the socket URL; the facade does not.
    expect(calls[0]).not.toHaveProperty("baseUrl");
  });

  it("returns the surface to server state when a write fails", async () => {
    const before = await readServerSettings(queryClient);
    failNextUpdate = true;

    await expect(
      writeServerSettings(queryClient, { enableAssistantStreaming: false }),
    ).rejects.toThrow();

    expect(queryClient.getQueryData(serverQueryKeys.settings())).toBe(before);
    expect(queryClient.getQueryState(serverQueryKeys.settings())?.isInvalidated).toBe(true);
  });

  it("reads the view session sync keeps current instead of asking again", async () => {
    const pushed = settingsView({ source: "push" });
    // What EventRouter does for every `serverSettingsUpdated` push.
    queryClient.setQueryData(serverQueryKeys.settings(), pushed);

    await expect(readServerSettings(queryClient)).resolves.toBe(pushed);
    expect(rpcCalls(host)).toEqual([]);

    queryClient.removeQueries({ queryKey: serverQueryKeys.settings() });
    await expect(readServerSettings(queryClient)).resolves.toMatchObject({ source: "server" });
    expect(rpcCalls(host).map((call) => call.tag)).toEqual(["server.getSettings"]);
    expect(rpcCalls(host)[0]).not.toHaveProperty("baseUrl");
    expect(serverSettingsQueryOptions().queryKey).toEqual(serverQueryKeys.settings());
  });

  it("removes a worktree with upstream's mutation and keeps its temporary branch", async () => {
    await queryClient.fetchQuery(serverWorktreesQueryOptions());
    const options = gitRemoveWorktreeMutationOptions({ queryClient });
    // The exact variables SettingsWorktreesPanel passes.
    await options.mutationFn?.(
      { cwd: "/repo", path: "/repo/.worktrees/a", force: true, reclaimTemporaryBranch: false },
      undefined as never,
    );

    const calls = rpcCalls(host);
    expect(calls.map((call) => call.tag)).toEqual(["server.listWorktrees", "git.removeWorktree"]);
    for (const call of calls) expect(call).not.toHaveProperty("baseUrl");
    const sent = hostPayload(calls[1]!);
    expect(sent).toMatchObject({
      cwd: "/repo",
      path: "/repo/.worktrees/a",
      force: true,
      reclaimTemporaryBranch: false,
    });
  });

  it("sends orchestration commands in the facade's shape", async () => {
    await ensureNativeApi().orchestration.dispatchCommand({
      type: "thread.unarchive",
      threadId: "thread-1",
      commandId: "command-1",
    } as never);

    const call = rpcCalls(host).find((entry) => entry.tag === "orchestration.dispatchCommand");
    expect(call).toBeDefined();
    expect(call).not.toHaveProperty("baseUrl");
    // The compat unwraps upstream's `{ command }` envelope: the host gets the bare command.
    const sent = JSON.stringify(call);
    expect(sent).toContain("thread.unarchive");
    expect(sent).not.toContain('\\"command\\":{');
    expect(sent).not.toContain('"command":{');
  });

  it("lists integrations under the key upstream's panel uses", async () => {
    const upstreamPanel = readFileSync(
      new URL("../../../web/src/components/settings/ExternalMcpSettingsPanel.tsx", import.meta.url),
      "utf8",
    );
    expect(upstreamPanel).toContain(
      `const INTEGRATIONS_QUERY_KEY = ${JSON.stringify(EXTERNAL_MCP_INTEGRATIONS_QUERY_KEY).replace(",", ", ")} as const;`,
    );

    await queryClient.fetchQuery(externalMcpIntegrationsQueryOptions());
    expect(rpcCalls(host).map((call) => call.tag)).toEqual(["server.listExternalMcpIntegrations"]);
    // Upstream polls while a pairing is pending; Lynx never did.
    expect(externalMcpIntegrationsQueryOptions()).not.toHaveProperty("refetchInterval");
  });
});

describe("Settings sources and the legacy client", () => {
  const appDir = new URL("./", import.meta.url);
  const settingsSources = readdirSync(appDir)
    .filter(
      (name) =>
        /^(Settings|settings)[^/]*\.tsx?$/.test(name) || name === "custom-model-settings.ts",
    )
    .filter((name) => !/\.test\.tsx?$/.test(name));

  it("covers every Settings surface", () => {
    for (const expected of [
      "SettingsPage.tsx",
      "SettingsAdvancedPanel.lynx.tsx",
      "SettingsArchivedPanel.lynx.tsx",
      "SettingsCustomModelsPanel.lynx.tsx",
      "SettingsIntegrationsPanel.lynx.tsx",
      "SettingsProfilePanel.lynx.tsx",
      "SettingsProviderToolsPanel.lynx.tsx",
      "SettingsSkillsPanel.lynx.tsx",
      "SettingsUsagePanel.tsx",
      "SettingsWorktreesPanel.lynx.tsx",
      "settingsServerData.lynx.ts",
    ]) {
      expect(settingsSources).toContain(expected);
    }
  });

  it("no Settings file imports synaraClient", () => {
    for (const name of settingsSources) {
      const source = readFileSync(new URL(name, appDir), "utf8");
      expect(source, name).not.toMatch(/data\/synaraClient/);
    }
  });

  it("no Settings file keeps a Lynx-only cache key for data upstream keys", () => {
    for (const name of settingsSources) {
      const source = readFileSync(new URL(name, appDir), "utf8");
      for (const legacyKey of [
        '"server-config"',
        '"server-settings"',
        '"managed-worktrees"',
        '"external-mcp-integrations"',
        '"profile-stats"',
        '"profile-token-stats"',
        '"skills-catalog"',
        '"settings-provider-usage"',
        '"sidebar-snapshot"',
      ]) {
        expect(source, `${name} ${legacyKey}`).not.toContain(legacyKey);
      }
      expect(source, name).not.toContain("refetchInterval");
    }
  });

  it("no Lynx source keeps a second cache for server config, settings or provider usage", () => {
    const srcDir = new URL("../", import.meta.url);
    const sources = (readdirSync(srcDir, { recursive: true }) as string[]).filter(
      (name) =>
        /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) && !name.startsWith("generated"),
    );
    expect(sources.length).toBeGreaterThan(300);
    for (const name of sources) {
      const source = readFileSync(new URL(name, srcDir), "utf8");
      for (const legacyKey of [
        '"server-config"',
        '"sidebar-server-config"',
        '"server-settings"',
        '"environment-provider-usage"',
        '"settings-provider-usage"',
      ]) {
        expect(source, `${name} ${legacyKey}`).not.toContain(legacyKey);
      }
    }
  });

  it("the legacy client no longer carries the Settings-only requests", () => {
    const client = readFileSync(new URL("../data/synaraClient.lynx.ts", import.meta.url), "utf8");
    for (const removed of [
      "subscribeServerSettings",
      "updateServerSettings",
      "repairSynaraState",
      "fetchManagedWorktrees",
      "removeManagedWorktree",
      "fetchSkillsCatalog",
      "fetchExternalMcpIntegrations",
      "createExternalMcpIntegration",
      "revokeExternalMcpIntegration",
      "refreshExternalMcpPairing",
      "fetchProfileStats",
      "fetchProfileTokenStats",
    ]) {
      expect(client, removed).not.toContain(removed);
    }
  });
});
