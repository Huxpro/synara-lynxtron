import { readFileSync } from "node:fs";

import { describe, expect, it } from "@rstest/core";

describe("Lynx Synara relay state", () => {
  it("keeps the Lynxtron 0.0.9 feature socket in the Node host", () => {
    const hostSource = readFileSync(
      new URL("../main/desktop/nativeRpcHost.ts", import.meta.url),
      "utf8",
    );
    const clientSource = readFileSync(new URL("./synaraClient.lynx.ts", import.meta.url), "utf8");

    expect(hostSource).toContain(
      "const featureManager = createManager(openFeatureSocket, {\n  closeWhenIdle: false,",
    );
    expect(hostSource).toContain(`{
    maxReconnectAttempts: 0,
  }`);
    expect(hostSource).toContain("manager.dispose()");
    expect(clientSource).not.toContain("LynxWebSocketModule");
    expect(clientSource).not.toContain("featureManager");

    const mainSource = readFileSync(new URL("../main/desktop/main.ts", import.meta.url), "utf8");
    expect(mainSource).toContain('_tag: "NativeRpcResult"');
    expect(clientSource).toContain('parsed._tag === "NativeRpcResult"');
    expect(clientSource).toContain('"orchestration.subscribeShell"');
    // Long-lived streams are relayed as global events through one shared table.
    expect(clientSource).toContain(
      'const ORCHESTRATION_SHELL_EVENT = NATIVE_EVENT_STREAM_CHANNELS["orchestration.subscribeShell"]',
    );
    expect(clientSource).toContain(
      'const SERVER_SETTINGS_EVENT = NATIVE_EVENT_STREAM_CHANNELS["server.subscribeSettings"]',
    );
    expect(mainSource).toContain("nativeEventStreamChannel(String(rpcData.tag");
    const nativeHostSource = readFileSync(
      new URL("../main/desktop/nativeRpcHost.ts", import.meta.url),
      "utf8",
    );
    expect(nativeHostSource).toContain(
      "if (nativeEventStreamChannel(tag) === null) events.push(event);",
    );
  });

  it("leaves connection lifecycle state to the Web relay socket owner", () => {
    const source = readFileSync(new URL("./synaraClient.lynx.ts", import.meta.url), "utf8");
    const relayRequest = source.slice(
      source.indexOf("async function relayRequest"),
      source.indexOf("function transportRequest"),
    );

    expect(source).toContain("onGlobalEvent(TRANSPORT_STATE_EVENT");
    expect(relayRequest).not.toContain(
      "setRelayState(relayEverConnected ? 'reconnecting' : 'connecting')",
    );
    expect(relayRequest).toContain('setRelayState("offline")');
    expect(relayRequest).toContain('setRelayState("connected")');
  });

  it("settles connection-level RPC defects without taking the socket offline", () => {
    const hostSource = readFileSync(new URL("../main/web/web-host.ts", import.meta.url), "utf8");
    const featureSocketSource = hostSource.slice(
      hostSource.indexOf("async function openFeatureSocket"),
    );
    const messageHandler = featureSocketSource.slice(
      featureSocketSource.indexOf("socket.onmessage = (event) => {"),
      featureSocketSource.indexOf("socket.onerror = () => {"),
    );
    const defectBranch = messageHandler.slice(
      messageHandler.indexOf("if (message._tag === 'Defect')"),
      messageHandler.indexOf("const pending = relayPending.get(message.requestId)"),
    );

    expect(messageHandler).toContain('message._tag === "Defect"');
    expect(messageHandler).toContain("rejectPendingRpcDefect(");
    expect(messageHandler.indexOf("message._tag === 'Defect'")).toBeLessThan(
      messageHandler.indexOf("relayPending.get(message.requestId)"),
    );
    expect(defectBranch).not.toContain("invalidateRelaySocket");
  });

  it("keeps streamed RPC backpressure and completion explicit on Web", () => {
    const hostSource = readFileSync(new URL("../main/web/web-host.ts", import.meta.url), "utf8");
    const clientSource = readFileSync(new URL("./synaraClient.lynx.ts", import.meta.url), "utf8");

    expect(hostSource).toContain('message._tag === "Chunk"');
    expect(hostSource).toContain('_tag: "Ack"');
    expect(hostSource).toContain("publishRelayGitActionProgress?.(value)");
    expect(hostSource).toContain("const timer = stream");
    expect(hostSource).toContain("? undefined");
    expect(clientSource).toContain('"synaraRpcStream"');
    expect(clientSource).toContain("gitActionProgressListeners.get(event.actionId)");
    expect(clientSource).toContain('event.kind === "action_finished"');
    expect(clientSource).toContain('"Git action stream completed without a final result"');
  });

  it("keeps Native terminal delivery on the component-owned main-thread listener", () => {
    const mainSource = readFileSync(new URL("../main/desktop/main.ts", import.meta.url), "utf8");
    const clientSource = readFileSync(new URL("./synaraClient.lynx.ts", import.meta.url), "utf8");
    const toastHostSource = readFileSync(
      new URL("../app/TaskCompletionToastHost.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(mainSource).toContain("nativeEventStreamChannel(String(rpcData.tag");
    expect(clientSource).not.toContain("export function publishTerminalEvent");
    expect(clientSource).not.toContain("onGlobalEvent(TERMINAL_EVENT");
    expect(toastHostSource).toContain("queryClient.setQueryData<TerminalEventSnapshot>(");
    expect(toastHostSource).toContain("const disposeGlobalEvent = onGlobalEvent(");
  });

  it("uses canonical automation mutation tags", () => {
    const source = readFileSync(new URL("./synaraClient.lynx.ts", import.meta.url), "utf8");
    expect(source).toContain('transportRequest<AutomationDefinition>("automation.update", input)');
    expect(source).toContain('transportRequest<AutomationDefinition>("automation.create", input)');
    expect(source).toContain('transportRequest("automation.delete", input)');
  });

  it("uses canonical project dev-server registry tags", () => {
    const source = readFileSync(new URL("./synaraClient.lynx.ts", import.meta.url), "utf8");
    expect(source).toContain(
      'transportRequest<ProjectListDevServersResult>("projects.listDevServers", {})',
    );
    expect(source).toContain(
      'transportRequest<ProjectStopDevServerResult>("projects.stopDevServer", input)',
    );
    expect(source).toContain(
      'transportRequest<ProjectDiscoverScriptsResult>("projects.discoverScripts", input)',
    );
    expect(source).toContain(
      'transportRequest<ProjectRunDevServerResult>("projects.runDevServer", input)',
    );
  });

  it("exposes the canonical keybinding mutation for Native action editors", () => {
    const source = readFileSync(new URL("./synaraClient.lynx.ts", import.meta.url), "utf8");
    expect(source).toContain('transportRequest("server.upsertKeybinding", rule)');
    expect(source).toContain('transportRequest("server.removeKeybinding", { command })');
  });
});
