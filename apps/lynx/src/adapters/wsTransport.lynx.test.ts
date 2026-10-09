import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import {
  COMPUTER_WS_CHANNELS,
  COMPUTER_WS_METHODS,
  DEVICE_WS_CHANNELS,
  DEVICE_WS_METHODS,
  ORCHESTRATION_STREAM_OVERFLOW_CODE,
  ORCHESTRATION_WS_CHANNELS,
  ORCHESTRATION_WS_METHODS,
  ThreadId,
  WS_CHANNELS,
  WS_METHODS,
  WS_GIT_ACTION_RECOVERY_CAPABILITY,
  WS_PROJECT_FILE_WATCH_CAPABILITY,
  WS_TURN_DISPATCH_SETTLEMENT_CAPABILITY,
} from "@synara/contracts";
import {
  getThreadDetailResumeCursor,
  resetThreadDetailResumeCursorsForTests,
  setThreadDetailResumeCursor,
} from "@synara-web/threadDetailResumeCursors";
import type { WsTransport as UpstreamWsTransport } from "../../../web/src/wsTransport";

import type { NativeRpcCompatibility } from "../main/nativeEventStreams.logic";
import {
  MAX_THREAD_SNAPSHOT_BOOTSTRAP_RETRY_ATTEMPTS,
  SNAPSHOT_FAULT_RETRY_MS,
  WsTransport,
  WsTransportRequestInterruptedError,
  MAX_STREAM_OVERFLOW_RETRIES,
  getProjectFileWatchRetryDelayMs,
  getStreamOverflowRetryDelayMs,
  mapHostTransportState,
  resolveStreamAdmissionRetry,
  type WsThreadStreamFailure,
} from "./wsTransport.lynx";
import {
  FakeRpcFailure,
  FakeTransportFailure,
  HOLD_REPLY,
  flushHost,
  installFakeNativeHost,
  type FakeNativeHost,
} from "./fakeNativeHost.testUtils";

// `wsNativeApi.ts` imports the transport relatively, so it type-checks against
// the upstream class while the bundle runs this one. Every public member the
// upstream class has must exist here with a compatible signature; a member
// upstream adds later fails this assignment at typecheck.
type UpstreamSurface = Pick<UpstreamWsTransport, keyof UpstreamWsTransport>;
const assertUpstreamSurface = (compat: WsTransport): UpstreamSurface => compat;
void assertUpstreamSurface;

const COMPATIBILITY: NativeRpcCompatibility = {
  protocolEpoch: 1,
  negotiatedRevision: 2,
  serverBuild: "test",
  serverInstanceId: "server-a",
  capabilities: ["rpc.typed-errors", WS_PROJECT_FILE_WATCH_CAPABILITY],
};

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
    resetThreadDetailResumeCursorsForTests();
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

  it("owns the terminal event stream and reopens it after the host loses its socket", async () => {
    rs.useFakeTimers();
    const received: unknown[] = [];
    const unsubscribe = transport.subscribe(WS_CHANNELS.terminalEvent, (message) =>
      received.push(message.data),
    );
    await rs.advanceTimersByTimeAsync(0);
    const [first] = [...host.streams.values()];
    expect(first?.tag).toBe(WS_METHODS.subscribeTerminalEvents);
    expect(first?.payload).toEqual({});

    const event = { type: "output", threadId: "thread-1", terminalId: "terminal-1" };
    host.pushStreamItem(first!.streamId, event);
    expect(received).toEqual([event]);

    // No legacy stream and no retry loop beside it: the transport resubscribes.
    first!.fail("socket closed");
    await rs.advanceTimersByTimeAsync(500);
    const [second] = [...host.streams.values()];
    expect(second?.tag).toBe(WS_METHODS.subscribeTerminalEvents);
    expect(second?.streamId).not.toBe(first!.streamId);
    host.pushStreamItem(second!.streamId, event);
    expect(received).toEqual([event, event]);

    unsubscribe();
    await rs.advanceTimersByTimeAsync(0);
    expect(host.cancelledStreamIds).toContain(second!.streamId);
    expect(host.streams.size).toBe(0);
  });

  it("sends payloads as JSON so explicit nulls survive the bridge", async () => {
    const command = {
      type: "thread.fork.create",
      threadId: "thread-1",
      worktreePath: null,
      branch: null,
    };
    await transport.request(ORCHESTRATION_WS_METHODS.dispatchCommand, { command });
    transport.subscribe(WS_CHANNELS.serverSettingsUpdated, () => undefined);
    await flushHost();

    // What crossed the bridge: no object the marshaller could drop keys from.
    const raw = host.rawCalls.find((call) => call.name === "synaraRpc");
    expect(raw?.params).toEqual({
      tag: "orchestration.dispatchCommand",
      payloadJson: JSON.stringify(command),
    });
    const rawStream = host.rawCalls.find((call) => call.name === "synaraRpcStream");
    expect(rawStream?.params.payloadJson).toBe("{}");
    expect(rawStream?.params).not.toHaveProperty("payload");
    // What the host handler decodes: the command, nulls included.
    expect(host.callsNamed("synaraRpc").at(-1)?.params.payload).toEqual(command);
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

  it("opens the device and computer event streams for their push channels", async () => {
    const device: unknown[] = [];
    const computer: unknown[] = [];
    transport.subscribe(DEVICE_WS_CHANNELS.event, (message) => device.push(message.data));
    transport.subscribe(COMPUTER_WS_CHANNELS.event, (message) => computer.push(message.data));
    await flushHost();

    const streams = [...host.streams.values()];
    expect(streams.map((stream) => stream.tag)).toEqual([
      DEVICE_WS_METHODS.subscribeEvents,
      COMPUTER_WS_METHODS.subscribeEvents,
    ]);
    host.pushStreamItem(streams[0]!.streamId, { type: "device.thread-state" });
    host.pushStreamItem(streams[1]!.streamId, { type: "computer.thread-state" });
    expect(device).toEqual([{ type: "device.thread-state" }]);
    expect(computer).toEqual([{ type: "computer.thread-state" }]);
  });

  it("streams worktree setup and GitHub provisioning, resolving their final results", async () => {
    const worktreeProgress: unknown[] = [];
    const provisionProgress: unknown[] = [];
    transport.subscribe(WS_CHANNELS.gitWorktreeSetupProgress, (message) =>
      worktreeProgress.push(message.data),
    );
    transport.subscribe(WS_CHANNELS.projectProvisionProgress, (message) =>
      provisionProgress.push(message.data),
    );

    const worktree = transport.request(
      WS_METHODS.gitCreateDetachedWorktree,
      { cwd: "/repo" },
      { timeoutMs: null },
    );
    await flushHost();
    const [worktreeStream] = [...host.streams.values()];
    expect(worktreeStream?.tag).toBe(WS_METHODS.gitCreateDetachedWorktree);
    expect(worktreeStream?.payload).toEqual({ cwd: "/repo" });
    host.pushStreamItem(worktreeStream!.streamId, { kind: "progress", step: "fetch" });
    host.pushStreamItem(worktreeStream!.streamId, {
      kind: "completed",
      result: { worktreePath: "/repo-wt" },
    });
    worktreeStream!.settle();
    await expect(worktree).resolves.toEqual({ worktreePath: "/repo-wt" });
    expect(worktreeProgress).toHaveLength(2);

    const provision = transport.request(
      WS_METHODS.projectsProvisionFromGitHub,
      { repository: "o/r" },
      { timeoutMs: null },
    );
    await flushHost();
    const [provisionStream] = [...host.streams.values()];
    expect(provisionStream?.tag).toBe(WS_METHODS.projectsProvisionFromGitHub);
    host.pushStreamItem(provisionStream!.streamId, { kind: "completed", result: { cwd: "/r" } });
    provisionStream!.settle();
    await expect(provision).resolves.toEqual({ cwd: "/r" });
    expect(provisionProgress).toHaveLength(1);

    const empty = transport.request(WS_METHODS.gitCreateDetachedWorktree, {}, { timeoutMs: null });
    await flushHost();
    [...host.streams.values()][0]!.settle();
    await expect(empty).rejects.toThrow("Worktree creation completed without a final result.");
  });

  it("drops null answers from a user-input response before it reaches the host", async () => {
    await transport.request(ORCHESTRATION_WS_METHODS.dispatchCommand, {
      command: { type: "thread.user-input.respond", answers: { a: "yes", b: null } },
    });
    expect(host.callsNamed("synaraRpc").at(-1)?.params.payload).toEqual({
      type: "thread.user-input.respond",
      answers: { a: "yes" },
    });
  });

  it("retries a unary request the server rejected for capacity", async () => {
    await transport.dispose();
    let calls = 0;
    host = installFakeNativeHost({
      rpc: () => {
        calls += 1;
        if (calls === 1) {
          throw new FakeRpcFailure({ code: "RPC_REQUEST_CAPACITY_EXCEEDED", retryAfterMs: 5 });
        }
        return { ok: true };
      },
    });
    transport = new WsTransport();
    await expect(transport.request(WS_METHODS.serverGetConfig)).resolves.toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it("absorbs a repeated subscribeShell until the snapshot arrived, then restarts for a new one", async () => {
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeShell, {});
    await flushHost();
    const [first] = [...host.streams.values()];

    // The pending snapshot of the running stream serves the second caller.
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeShell, {});
    await flushHost();
    expect(host.callsNamed("synaraRpcStream")).toHaveLength(1);

    host.pushStreamItem(first!.streamId, { kind: "snapshot", snapshot: { threads: [] } });
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeShell, {});
    await flushHost();
    expect(host.cancelledStreamIds).toEqual([first!.streamId]);
    const [second] = [...host.streams.values()];
    expect(second?.tag).toBe(ORCHESTRATION_WS_METHODS.subscribeShell);
    expect(second?.streamId).not.toBe(first!.streamId);
  });

  it("rebuilds a thread stream's input from the resume cursor on an automatic restart", async () => {
    rs.useFakeTimers();
    const threadId = ThreadId.makeUnsafe("thread-1");
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeThread, { threadId });
    await flushHostWithFakeTimers();
    const [first] = [...host.streams.values()];
    expect(first?.payload).toEqual({ threadId });

    // Events were applied on top of the snapshot: a restart must resume there.
    setThreadDetailResumeCursor(threadId, 42);
    first!.fail("socket closed");
    await flushHostWithFakeTimers();
    await rs.advanceTimersByTimeAsync(500);
    await flushHostWithFakeTimers();
    const [second] = [...host.streams.values()];
    expect(second?.payload).toMatchObject({ threadId });
    expect(JSON.stringify(second?.payload)).toContain("42");
  });

  it("drops the resume cursor and retries in place when the server demands a resnapshot", async () => {
    rs.useFakeTimers();
    const threadId = ThreadId.makeUnsafe("thread-1");
    setThreadDetailResumeCursor(threadId, 7);
    const failures: WsThreadStreamFailure[] = [];
    transport.onThreadStreamFailure((failure) => failures.push(failure));
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeThread, { threadId });
    await flushHostWithFakeTimers();

    [...host.streams.values()][0]!.failTyped({ code: "ORCHESTRATION_RESNAPSHOT_REQUIRED" });
    await flushHostWithFakeTimers();
    expect(getThreadDetailResumeCursor(threadId)).toBeUndefined();
    expect(transport.getState()).not.toBe("closed");
    await rs.advanceTimersByTimeAsync(250);
    await flushHostWithFakeTimers();
    const [retried] = [...host.streams.values()];
    expect(retried?.payload).toEqual({ threadId });
    expect(failures).toEqual([]);
  });

  it("reports a thread stream failure once the snapshot bootstrap retries are exhausted", async () => {
    rs.useFakeTimers();
    const failures: WsThreadStreamFailure[] = [];
    transport.onThreadStreamFailure((failure) => failures.push(failure));
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeThread, { threadId: "thread-1" });
    await flushHostWithFakeTimers();

    for (let attempt = 0; attempt < MAX_THREAD_SNAPSHOT_BOOTSTRAP_RETRY_ATTEMPTS; attempt += 1) {
      [...host.streams.values()][0]!.failTyped({ code: "THREAD_SNAPSHOT_NOT_FOUND" });
      await flushHostWithFakeTimers();
      expect(failures).toEqual([]);
      await rs.advanceTimersByTimeAsync(10_000);
      await flushHostWithFakeTimers();
    }
    expect(host.callsNamed("synaraRpcStream")).toHaveLength(
      MAX_THREAD_SNAPSHOT_BOOTSTRAP_RETRY_ATTEMPTS + 1,
    );
    [...host.streams.values()][0]!.failTyped({ code: "THREAD_SNAPSHOT_NOT_FOUND" });
    await flushHostWithFakeTimers();
    expect(failures.map((failure) => [failure.threadId, failure.code])).toEqual([
      ["thread-1", "THREAD_SNAPSHOT_NOT_FOUND"],
    ]);
    // Terminal: no further open until the caller resubscribes.
    await rs.advanceTimersByTimeAsync(60_000);
    await flushHostWithFakeTimers();
    expect(host.streams.size).toBe(0);
  });

  it("keeps a slow retry armed for a server-diagnosed snapshot fault", async () => {
    rs.useFakeTimers();
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeShell, {});
    await flushHostWithFakeTimers();
    [...host.streams.values()][0]!.failTyped({
      code: "ORCHESTRATION_SNAPSHOT_STALLED",
      retryable: false,
    });
    await flushHostWithFakeTimers();
    await rs.advanceTimersByTimeAsync(SNAPSHOT_FAULT_RETRY_MS - 1);
    await flushHostWithFakeTimers();
    expect(host.streams.size).toBe(0);
    await rs.advanceTimersByTimeAsync(1);
    await flushHostWithFakeTimers();
    expect([...host.streams.values()][0]?.tag).toBe(ORCHESTRATION_WS_METHODS.subscribeShell);
  });

  it("classifies stream admission failures like upstream", () => {
    const none = { capacity: 0, duplicate: 0, "thread-bootstrap": 0, resnapshot: 0 };
    const typed = (code: string, extra: object = {}) => ({
      code,
      retryAfterMs: null,
      retryable: null,
      ...extra,
    });
    expect(resolveStreamAdmissionRetry(typed("STREAM_CAPACITY_EXCEEDED"), none)).toEqual({
      kind: "capacity",
      attempt: 1,
      delayMs: 1_000,
    });
    expect(
      resolveStreamAdmissionRetry(typed("STREAM_CAPACITY_EXCEEDED", { retryable: false }), none),
    ).toBeNull();
    expect(
      resolveStreamAdmissionRetry(
        typed("THREAD_STREAM_DUPLICATE_SUBSCRIPTION", { retryable: false, retryAfterMs: 40 }),
        none,
      ),
    ).toEqual({ kind: "duplicate", attempt: 1, delayMs: 40 });
    expect(
      resolveStreamAdmissionRetry(typed("STREAM_DUPLICATE_SUBSCRIPTION"), {
        ...none,
        duplicate: 5,
      }),
    ).toBeNull();
    expect(
      resolveStreamAdmissionRetry(typed("ORCHESTRATION_RESNAPSHOT_REQUIRED"), {
        ...none,
        resnapshot: 2,
      }),
    ).toBeNull();
    expect(resolveStreamAdmissionRetry(typed("SOMETHING_ELSE"), none)).toBeNull();
    expect(resolveStreamAdmissionRetry(null, none)).toBeNull();
    expect(getProjectFileWatchRetryDelayMs(typed("PROJECT_FILE_WATCH_FAILED"), 2)).toBe(2_000);
    expect(getProjectFileWatchRetryDelayMs(typed("PROJECT_FILE_WATCH_FAILED"), 5)).toBeNull();
  });

  it("exposes the host's negotiation and watches files only when the server can", async () => {
    const seen: (readonly string[] | null)[] = [];
    transport.onCompatibilityChange((value) => seen.push(value?.capabilities ?? null), {
      replayCurrent: true,
    });
    const changes: unknown[] = [];
    const unsubscribe = transport.subscribeProjectFileChange(
      { cwd: "/repo", relativePath: "a.ts" },
      (event) => changes.push(event),
    );
    await flushHost();
    // No negotiation reported yet: the capability is unknown, nothing opens.
    expect(transport.getCompatibility()).toBeNull();
    expect(host.streams.size).toBe(0);

    host.setCompatibility(COMPATIBILITY);
    await flushHost();
    expect(transport.getCompatibility()).toEqual(COMPATIBILITY);
    expect(seen).toEqual([null, COMPATIBILITY.capabilities]);
    const [watch] = [...host.streams.values()];
    expect(watch?.tag).toBe(WS_METHODS.projectsSubscribeFileChange);
    expect(watch?.payload).toEqual({ cwd: "/repo", relativePath: "a.ts" });
    host.pushStreamItem(watch!.streamId, { kind: "changed" });
    expect(changes).toEqual([{ kind: "changed" }]);

    unsubscribe();
    await flushHost();
    expect(host.cancelledStreamIds).toEqual([watch!.streamId]);
  });

  it("seeds the negotiation from the reset handshake of an already connected host", async () => {
    host.compatibility = COMPATIBILITY;
    await transport.request(WS_METHODS.serverGetConfig);
    expect(transport.getCompatibility()).toEqual(COMPATIBILITY);
  });

  it("drops resume cursors and reopens thread streams when the server instance changes", async () => {
    const threadId = ThreadId.makeUnsafe("thread-1");
    host.compatibility = COMPATIBILITY;
    transport.subscribe(WS_CHANNELS.serverWelcome, () => undefined);
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeThread, { threadId });
    await flushHost();
    const lifecycle = [...host.streams.values()].find(
      (stream) => stream.tag === WS_METHODS.subscribeServerLifecycle,
    );
    host.pushStreamItem(lifecycle!.streamId, { type: "welcome", payload: { cwd: "/a" } });
    expect(transport.getLatestPush(WS_CHANNELS.serverWelcome)).not.toBeNull();
    setThreadDetailResumeCursor(threadId, 9);
    const threadStream = [...host.streams.values()].find(
      (stream) => stream.tag === ORCHESTRATION_WS_METHODS.subscribeThread,
    );

    // Same instance again (a plain reconnect): nothing is invalidated.
    host.setCompatibility({ ...COMPATIBILITY });
    await flushHost();
    expect(getThreadDetailResumeCursor(threadId)).toBe(9);
    expect(host.cancelledStreamIds).toEqual([]);

    host.setCompatibility({ ...COMPATIBILITY, serverInstanceId: "server-b" });
    await flushHost();
    expect(getThreadDetailResumeCursor(threadId)).toBeUndefined();
    expect(transport.getLatestPush(WS_CHANNELS.serverWelcome)).toBeNull();
    expect(host.cancelledStreamIds).toEqual([threadStream!.streamId]);
    const reopened = [...host.streams.values()].find(
      (stream) => stream.tag === ORCHESTRATION_WS_METHODS.subscribeThread,
    );
    expect(reopened?.payload).toEqual({ threadId });
    expect(reopened?.streamId).not.toBe(threadStream!.streamId);
  });

  it("asks the server for the verdict when a turn start loses the socket", async () => {
    await transport.dispose();
    const command = { type: "thread.turn.start", threadId: "thread-1", commandId: "c-1" };
    const tags: string[] = [];
    let settleCalls = 0;
    host = installFakeNativeHost({
      rpc: (tag, payload) => {
        tags.push(tag);
        if (tag === ORCHESTRATION_WS_METHODS.dispatchCommand) {
          throw new FakeTransportFailure("socket closed");
        }
        if (tag === ORCHESTRATION_WS_METHODS.settleTurnDispatch) {
          settleCalls += 1;
          expect(payload).toEqual({ command });
          return { status: "accepted", sequence: 7 };
        }
        return {};
      },
    });
    host.compatibility = {
      ...COMPATIBILITY,
      capabilities: [...COMPATIBILITY.capabilities, WS_TURN_DISPATCH_SETTLEMENT_CAPABILITY],
    };
    transport = new WsTransport();
    await transport.request(WS_METHODS.serverGetConfig);

    await expect(
      transport.request(ORCHESTRATION_WS_METHODS.dispatchCommand, { command }),
    ).resolves.toEqual({ sequence: 7 });
    expect(settleCalls).toBe(1);
    expect(tags.filter((tag) => tag === ORCHESTRATION_WS_METHODS.dispatchCommand)).toHaveLength(1);
  });

  it("reports a lost turn start as failed when the server cannot settle it", async () => {
    await transport.dispose();
    const tags: string[] = [];
    host = installFakeNativeHost({
      rpc: (tag) => {
        tags.push(tag);
        if (tag === ORCHESTRATION_WS_METHODS.dispatchCommand) {
          throw new FakeTransportFailure("socket closed");
        }
        return {};
      },
    });
    host.compatibility = COMPATIBILITY;
    transport = new WsTransport();
    await transport.request(WS_METHODS.serverGetConfig);

    await expect(
      transport.request(ORCHESTRATION_WS_METHODS.dispatchCommand, {
        command: { type: "thread.turn.start", threadId: "thread-1" },
      }),
    ).rejects.toThrow("socket closed");
    await expect(
      transport.request(ORCHESTRATION_WS_METHODS.settleTurnDispatch, { command: {} }),
    ).rejects.toMatchObject({ code: "WS_TURN_SETTLEMENT_UNAVAILABLE", retryable: false });
    expect(tags).not.toContain(ORCHESTRATION_WS_METHODS.settleTurnDispatch);
  });

  it("runs one cancellable project-agent stream per project", async () => {
    const events: unknown[] = [];
    transport.subscribe(WS_CHANNELS.projectAgentEvent, (message) => events.push(message.data));
    await transport.request(WS_METHODS.subscribeProjectAgentEvents, { projectId: "project-1" });
    await flushHost();

    const [stream] = [...host.streams.values()];
    expect(stream?.tag).toBe(WS_METHODS.subscribeProjectAgentEvents);
    expect(stream?.payload).toEqual({ projectId: "project-1" });
    host.pushStreamItem(stream!.streamId, { kind: "updated" });
    expect(events).toEqual([{ kind: "updated" }]);

    await transport.unsubscribeProjectAgentEvents("project-1");
    expect(host.cancelledStreamIds).toEqual([stream!.streamId]);
    expect(host.streams.size).toBe(0);
  });

  it("opens the keep-awake and task streams for their push channels", async () => {
    transport.subscribe(WS_CHANNELS.serverKeepAwakeUpdated, () => undefined);
    transport.subscribe(WS_CHANNELS.todoEvent, () => undefined);
    await flushHost();
    expect([...host.streams.values()].map((stream) => stream.tag).toSorted()).toEqual(
      [WS_METHODS.subscribeServerKeepAwake, WS_METHODS.subscribeTodoEvents].toSorted(),
    );
  });

  it("retries an overflowed shell stream on upstream's schedule, then reports it", async () => {
    rs.useFakeTimers();
    const failures: (string | null)[] = [];
    transport.onShellStreamFailure((failure) => failures.push(failure.code));
    await transport.request(ORCHESTRATION_WS_METHODS.subscribeShell, {});
    await flushHostWithFakeTimers();

    for (let attempt = 0; attempt < MAX_STREAM_OVERFLOW_RETRIES; attempt += 1) {
      const [stream] = [...host.streams.values()];
      expect(stream?.tag).toBe(ORCHESTRATION_WS_METHODS.subscribeShell);
      stream!.failTyped({ code: ORCHESTRATION_STREAM_OVERFLOW_CODE });
      await flushHostWithFakeTimers();
      expect(host.streams.size).toBe(0);
      expect(failures).toEqual([]);
      await rs.advanceTimersByTimeAsync(getStreamOverflowRetryDelayMs(attempt));
      await flushHostWithFakeTimers();
    }

    const [last] = [...host.streams.values()];
    last!.failTyped({ code: ORCHESTRATION_STREAM_OVERFLOW_CODE });
    await flushHostWithFakeTimers();
    expect(failures).toEqual([ORCHESTRATION_STREAM_OVERFLOW_CODE]);
  });

  it("reattaches a recoverable git action by id after the socket drops, without re-running it", async () => {
    rs.useFakeTimers();
    host.compatibility = {
      ...COMPATIBILITY,
      capabilities: [...COMPATIBILITY.capabilities, WS_GIT_ACTION_RECOVERY_CAPABILITY],
    };
    await transport.request(WS_METHODS.serverGetConfig);
    const input = { actionId: "action-1", cwd: "/repo", action: "commit_push" };

    const pending = transport.request(WS_METHODS.gitRunStackedAction, input);
    await flushHostWithFakeTimers();
    const [first] = [...host.streams.values()];
    expect(first?.payload).toEqual({ ...input, recoverable: true });
    host.pushStreamItem(first!.streamId, { kind: "action_started", actionId: "action-1" });
    first!.fail("socket closed");
    await flushHostWithFakeTimers();
    expect(host.streams.size).toBe(0);

    await rs.advanceTimersByTimeAsync(500);
    await flushHostWithFakeTimers();
    const [second] = [...host.streams.values()];
    expect(second?.tag).toBe(WS_METHODS.gitRunStackedAction);
    expect(second?.payload).toEqual({ ...input, recoverable: true, resume: true });
    host.pushStreamItem(second!.streamId, {
      kind: "action_finished",
      actionId: "action-1",
      result: { ok: true },
    });
    second!.settle();
    await flushHostWithFakeTimers();

    await expect(pending).resolves.toEqual({ ok: true });
  });

  it("does not mark a git action recoverable, or retry it, without the server capability", async () => {
    rs.useFakeTimers();
    host.compatibility = COMPATIBILITY;
    await transport.request(WS_METHODS.serverGetConfig);
    const input = { actionId: "action-2", cwd: "/repo", action: "commit" };

    const pending = transport.request(WS_METHODS.gitRunStackedAction, input);
    const outcome = pending.then(
      () => "resolved",
      (error: Error) => error.message,
    );
    await flushHostWithFakeTimers();
    const [stream] = [...host.streams.values()];
    expect(stream?.payload).toEqual(input);
    stream!.fail("socket closed");
    await flushHostWithFakeTimers();

    expect(await outcome).toContain("socket closed");
    await rs.advanceTimersByTimeAsync(10_000);
    await flushHostWithFakeTimers();
    expect(host.streams.size).toBe(0);
  });

  it("returns a git action's final result when the stream fails after it arrived", async () => {
    const pending = transport.request(WS_METHODS.gitRunStackedAction, {
      actionId: "action-3",
      cwd: "/repo",
      action: "commit",
    });
    await flushHost();
    const [stream] = [...host.streams.values()];
    host.pushStreamItem(stream!.streamId, {
      kind: "action_finished",
      actionId: "action-3",
      result: { ok: true, commit: "abc" },
    });
    stream!.fail("socket closed");

    await expect(pending).resolves.toEqual({ ok: true, commit: "abc" });
    expect(host.streams.size).toBe(0);
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
