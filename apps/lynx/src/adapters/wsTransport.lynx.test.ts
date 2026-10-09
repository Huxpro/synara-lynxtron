import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import {
  ORCHESTRATION_WS_CHANNELS,
  ORCHESTRATION_WS_METHODS,
  WS_CHANNELS,
  WS_METHODS,
} from "@synara/contracts";

import { NATIVE_EVENT_STREAM_CHANNELS } from "../main/nativeEventStreams.logic";
import {
  WsTransport,
  WsTransportRequestInterruptedError,
  mapHostTransportState,
} from "./wsTransport.lynx";
import {
  HOLD_REPLY,
  flushHost,
  installFakeNativeHost,
  type FakeNativeHost,
} from "./fakeNativeHost.testUtils";

describe("Lynx WsTransport compat", () => {
  let host: FakeNativeHost;
  let transport: WsTransport;

  beforeEach(() => {
    host = installFakeNativeHost({
      rpc: (tag, payload) => ({ tag, payload }),
    });
    transport = new WsTransport();
  });

  afterEach(async () => {
    await transport.dispose();
    rs.unstubAllGlobals();
    rs.useRealTimers();
  });

  it("sends plain requests through the host relay and reports the socket open", async () => {
    const states: string[] = [];
    transport.onStateChange((state) => states.push(state), { replayCurrent: true });

    const result = await transport.request(WS_METHODS.serverGetConfig);

    expect(result).toEqual({ tag: "server.getConfig", payload: {} });
    expect(host.callsNamed("synaraRpc")).toEqual([
      { name: "synaraRpc", params: { tag: "server.getConfig", payload: {} } },
    ]);
    expect(states).toEqual(["connecting", "open"]);
  });

  it("unwraps the dispatchCommand transport envelope and forwards null timeouts", async () => {
    const command = { type: "thread.rename", threadId: "thread-1", title: "Renamed" };
    await transport.request(ORCHESTRATION_WS_METHODS.dispatchCommand, { command });
    await transport.request(
      WS_METHODS.serverUpdateProvider,
      { provider: "codex" },
      {
        timeoutMs: null,
      },
    );

    expect(host.callsNamed("synaraRpc").map((call) => call.params)).toEqual([
      { tag: "orchestration.dispatchCommand", payload: command },
      { tag: "server.updateProvider", payload: { provider: "codex" }, timeoutMs: null },
    ]);
  });

  it("opens one scoped stream per push channel and routes items to its listeners", async () => {
    const received: unknown[] = [];
    const unsubscribe = transport.subscribe(WS_CHANNELS.serverSettingsUpdated, (message) =>
      received.push(message),
    );
    await flushHost();

    const [stream] = [...host.streams.values()];
    expect(stream?.tag).toBe(WS_METHODS.subscribeServerSettings);
    expect(stream?.payload).toEqual({});

    host.pushStreamItem(stream!.streamId, { settings: { theme: "dark" } });
    expect(received).toEqual([
      {
        type: "push",
        sequence: 1,
        channel: WS_CHANNELS.serverSettingsUpdated,
        data: { settings: { theme: "dark" } },
      },
    ]);
    expect(transport.getLatestPush(WS_CHANNELS.serverSettingsUpdated)?.data).toEqual({
      settings: { theme: "dark" },
    });

    unsubscribe();
    await flushHost();
    expect(host.cancelledStreamIds).toEqual([stream!.streamId]);
    expect(host.streams.size).toBe(0);
  });

  it("shares the lifecycle stream between welcome and maintenance channels", async () => {
    const welcomes: unknown[] = [];
    const maintenance: unknown[] = [];
    const unsubscribeWelcome = transport.subscribe(WS_CHANNELS.serverWelcome, (message) =>
      welcomes.push(message.data),
    );
    const unsubscribeMaintenance = transport.subscribe(
      WS_CHANNELS.serverMaintenanceUpdated,
      (message) => maintenance.push(message.data),
    );
    await flushHost();

    expect([...host.streams.values()].map((stream) => stream.tag)).toEqual([
      WS_METHODS.subscribeServerLifecycle,
    ]);
    const [stream] = [...host.streams.values()];
    host.pushStreamItem(stream!.streamId, {
      type: "welcome",
      payload: { cwd: "/tmp/project", projectName: "project" },
    });
    host.pushStreamItem(stream!.streamId, { type: "maintenance", mode: "none" });
    expect(welcomes).toEqual([{ cwd: "/tmp/project", projectName: "project" }]);
    expect(maintenance).toEqual([{ type: "maintenance", mode: "none" }]);

    unsubscribeWelcome();
    await flushHost();
    expect(host.cancelledStreamIds).toEqual([]);
    unsubscribeMaintenance();
    await flushHost();
    expect(host.cancelledStreamIds).toEqual([stream!.streamId]);
  });

  it("runs shell and thread subscriptions as cancellable streams", async () => {
    const shellItems: unknown[] = [];
    const threadItems: unknown[] = [];
    transport.subscribe(ORCHESTRATION_WS_CHANNELS.shellEvent, (message) =>
      shellItems.push(message.data),
    );
    transport.subscribe(ORCHESTRATION_WS_CHANNELS.threadEvent, (message) =>
      threadItems.push(message.data),
    );

    await transport.request(ORCHESTRATION_WS_METHODS.subscribeShell, {});
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeThread, { threadId: "thread-1" });
    await flushHost();

    const streams = [...host.streams.values()];
    expect(streams.map((stream) => [stream.tag, stream.payload])).toEqual([
      [ORCHESTRATION_WS_METHODS.subscribeShell, {}],
      [ORCHESTRATION_WS_METHODS.subscribeThread, { threadId: "thread-1" }],
    ]);
    host.pushStreamItem(streams[0]!.streamId, { kind: "snapshot", snapshot: { threads: [] } });
    host.pushStreamItem(streams[1]!.streamId, { kind: "snapshot", snapshot: { thread: {} } });
    expect(shellItems).toHaveLength(1);
    expect(threadItems).toHaveLength(1);

    await transport.request(ORCHESTRATION_WS_METHODS.unsubscribeThread, { threadId: "thread-1" });
    expect(host.cancelledStreamIds).toEqual([streams[1]!.streamId]);
    await transport.request(ORCHESTRATION_WS_METHODS.unsubscribeShell, {});
    expect(host.cancelledStreamIds).toEqual([streams[1]!.streamId, streams[0]!.streamId]);
    expect(host.streams.size).toBe(0);
  });

  it("emits git progress pushes and resolves the stacked action result", async () => {
    const progress: unknown[] = [];
    transport.subscribe(WS_CHANNELS.gitActionProgress, (message) => progress.push(message.data));

    const pending = transport.request(WS_METHODS.gitRunStackedAction, { action: "commit" });
    await flushHost();
    const [stream] = [...host.streams.values()];
    expect(stream?.tag).toBe(WS_METHODS.gitRunStackedAction);

    host.pushStreamItem(stream!.streamId, { kind: "action_started", actionId: "a1" });
    host.pushStreamItem(stream!.streamId, {
      kind: "action_finished",
      actionId: "a1",
      result: { ok: true },
    });
    stream!.settle();

    await expect(pending).resolves.toEqual({ ok: true });
    expect(progress).toHaveLength(2);
  });

  it("mirrors the host relay socket state onto the Web transport state contract", async () => {
    const states: string[] = [];
    transport.onStateChange((state) => states.push(state));
    await transport.request(WS_METHODS.serverGetConfig);

    host.setTransportState("reconnecting");
    host.setTransportState("connected");
    host.setTransportState("offline");

    expect(states).toEqual(["open", "connecting", "open", "closed"]);
    expect(mapHostTransportState("idle", false)).toBe("connecting");
    expect(mapHostTransportState("idle", true)).toBe("closed");
  });

  it("restarts a failed channel stream with backoff while it is still subscribed", async () => {
    rs.useFakeTimers();
    transport.subscribe(WS_CHANNELS.automationEvent, () => undefined);
    await flushHostWithFakeTimers();

    const [first] = [...host.streams.values()];
    first!.fail("socket closed");
    await flushHostWithFakeTimers();
    expect(host.streams.size).toBe(0);
    expect(transport.getState()).toBe("closed");

    await rs.advanceTimersByTimeAsync(500);
    await flushHostWithFakeTimers();
    const [second] = [...host.streams.values()];
    expect(second?.tag).toBe(WS_METHODS.subscribeAutomationEvents);
    expect(second?.streamId).not.toBe(first!.streamId);
  });

  it("mirrors the host's legacy terminal broadcast instead of opening a second terminal stream", async () => {
    const received: unknown[] = [];
    const unsubscribe = transport.subscribe(WS_CHANNELS.terminalEvent, (message) =>
      received.push(message.data),
    );
    await flushHost();
    expect(host.streams.size).toBe(0);

    host.emitGlobal(NATIVE_EVENT_STREAM_CHANNELS["terminal.subscribeEvents"], {
      type: "output",
      threadId: "thread-1",
      terminalId: "terminal-1",
    });
    expect(received).toEqual([{ type: "output", threadId: "thread-1", terminalId: "terminal-1" }]);

    unsubscribe();
    await flushHost();
    expect(host.listenerCount(NATIVE_EVENT_STREAM_CHANNELS["terminal.subscribeEvents"])).toBe(0);
  });

  it("mints generation-prefixed ids and drops the previous renderer's streams on reload", async () => {
    const received: unknown[] = [];
    transport.subscribe(WS_CHANNELS.serverSettingsUpdated, (message) => received.push(message));
    await flushHost();
    const [first] = [...host.streams.values()];
    expect(first?.streamId).toMatch(/^g1:server\.settings#\d+$/);
    expect(host.generation).toBe(1);

    // A LynxView reload: the old renderer is gone without disposing anything,
    // a fresh transport instance performs the handshake.
    const reloaded = new WsTransport();
    const reloadedReceived: unknown[] = [];
    reloaded.subscribe(WS_CHANNELS.serverSettingsUpdated, (message) =>
      reloadedReceived.push(message),
    );
    await flushHost();
    expect(host.generation).toBe(2);
    expect([...host.streams.keys()]).toEqual([expect.stringMatching(/^g2:server\.settings#/)]);
    expect(host.registrySize).toBe(1);

    // A stale item for the old id reaches neither renderer.
    host.pushStreamItem(first!.streamId, { settings: {} });
    const [fresh] = [...host.streams.values()];
    host.pushStreamItem(fresh!.streamId, { settings: { theme: "light" } });
    expect(received).toEqual([]);
    expect(reloadedReceived).toHaveLength(1);
    await reloaded.dispose();
  });

  it("cancels an in-flight git stacked action on dispose and rejects it as disposed", async () => {
    const pending = transport.request(WS_METHODS.gitRunStackedAction, { action: "commit" });
    await flushHost();
    const [stream] = [...host.streams.values()];
    expect(stream?.tag).toBe(WS_METHODS.gitRunStackedAction);

    await transport.dispose();
    await expect(pending).rejects.toThrow("Transport disposed");
    expect(host.cancelledStreamIds).toEqual([stream!.streamId]);
    expect(host.streams.size).toBe(0);
    expect(host.registrySize).toBe(0);
  });

  it("never opens a stream whose stop arrived while the host was still connecting", async () => {
    const release = host.holdStreamOpens();
    const unsubscribe = transport.subscribe(WS_CHANNELS.automationEvent, () => undefined);
    await flushHost();
    expect(host.registrySize).toBe(1);
    expect(host.streams.size).toBe(0);

    unsubscribe();
    release();
    await flushHost();
    expect(host.streams.size).toBe(0);
    expect(host.registrySize).toBe(0);
    expect(host.cancelledStreamIds).toHaveLength(1);
  });

  it("rejects with the upstream interruption error on abort and numeric timeout", async () => {
    rs.useFakeTimers();
    await transport.request(WS_METHODS.serverGetConfig);
    host.calls.length = 0;
    const held = installFakeNativeHost({ rpc: () => HOLD_REPLY });
    void held;
    const heldTransport = new WsTransport();

    const timedOut = heldTransport.request(WS_METHODS.serverGetConfig, {}, { timeoutMs: 25 });
    const timedOutSettled = timedOut.then(
      () => null,
      (error: unknown) => error,
    );
    await flushHostWithFakeTimers();
    await rs.advanceTimersByTimeAsync(25);
    const timeoutError = (await timedOutSettled) as WsTransportRequestInterruptedError;
    expect(timeoutError).toBeInstanceOf(WsTransportRequestInterruptedError);
    expect(timeoutError.code).toBe("WS_REQUEST_TIMEOUT");
    expect(timeoutError.method).toBe(WS_METHODS.serverGetConfig);
    expect(timeoutError.timeoutMs).toBe(25);
    expect(timeoutError.message).toBe("WebSocket RPC server.getConfig timed out after 25ms.");

    const controller = new AbortController();
    const aborted = heldTransport.request(
      WS_METHODS.serverGetSettings,
      {},
      {
        signal: controller.signal,
      },
    );
    const abortedSettled = aborted.then(
      () => null,
      (error: unknown) => error,
    );
    await flushHostWithFakeTimers();
    controller.abort(new Error("navigated away"));
    const abortError = (await abortedSettled) as WsTransportRequestInterruptedError;
    expect(abortError.code).toBe("WS_REQUEST_ABORTED");
    expect(abortError.message).toBe("WebSocket RPC server.getSettings was cancelled.");
    expect((abortError.cause as Error).message).toBe("navigated away");

    await expect(
      heldTransport.request(WS_METHODS.serverGetConfig, {}, { timeoutMs: -1 }),
    ).rejects.toThrow(RangeError);
    await heldTransport.dispose();
  });

  it("forwards numeric request deadlines to the host", async () => {
    await transport.request(WS_METHODS.serverGetConfig, {}, { timeoutMs: 5_000 });
    expect(host.callsNamed("synaraRpc").at(-1)?.params).toEqual({
      tag: "server.getConfig",
      payload: {},
      timeoutMs: 5_000,
    });
  });

  it("grows the thread stream backoff across automatic restarts and resets on resubscribe", async () => {
    rs.useFakeTimers();
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeThread, { threadId: "thread-1" });
    await flushHostWithFakeTimers();
    const opensAfter = async (ms: number) => {
      await rs.advanceTimersByTimeAsync(ms);
      await flushHostWithFakeTimers();
      return host.callsNamed("synaraRpcStream").length;
    };
    const failCurrent = async () => {
      const [stream] = [...host.streams.values()];
      stream!.fail("socket closed");
      await flushHostWithFakeTimers();
    };

    expect(host.callsNamed("synaraRpcStream")).toHaveLength(1);
    await failCurrent();
    expect(await opensAfter(499)).toBe(1);
    expect(await opensAfter(1)).toBe(2); // 500 ms
    await failCurrent();
    expect(await opensAfter(999)).toBe(2);
    expect(await opensAfter(1)).toBe(3); // 1 000 ms
    await failCurrent();
    expect(await opensAfter(1_999)).toBe(3);
    expect(await opensAfter(1)).toBe(4); // 2 000 ms

    // An explicit resubscription starts over at the base delay.
    await failCurrent();
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeThread, { threadId: "thread-1" });
    await flushHostWithFakeTimers();
    expect(host.callsNamed("synaraRpcStream")).toHaveLength(5);
    await failCurrent();
    expect(await opensAfter(500)).toBe(6);
  });

  it("stops every stream and reports disposed on dispose", async () => {
    transport.subscribe(WS_CHANNELS.automationEvent, () => undefined);
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeShell, {});
    await flushHost();
    expect(host.streams.size).toBe(2);

    await transport.dispose();
    expect(host.streams.size).toBe(0);
    expect(transport.getState()).toBe("disposed");
    await expect(transport.request(WS_METHODS.serverGetConfig)).rejects.toThrow(
      "Transport disposed",
    );
  });
});

async function flushHostWithFakeTimers(rounds = 8): Promise<void> {
  for (let index = 0; index < rounds; index += 1) {
    await rs.advanceTimersByTimeAsync(0);
  }
}
