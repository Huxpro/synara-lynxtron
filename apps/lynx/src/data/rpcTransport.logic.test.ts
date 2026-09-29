import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import {
  createRpcSocketManager,
  openRpcSocketWithTimeout,
  type RpcTransportSocket,
  type StartRpcTimeout,
} from "./rpcTransport.logic";

describe("RPC pending cleanup contract", () => {
  it("contains derived finally rejections for connection and recovery promises", () => {
    const source = readFileSync(new URL("./rpcTransport.logic.ts", import.meta.url), "utf8");
    expect(source.match(/\.finally\(\(\) => \{/g)).toHaveLength(2);
    expect(source).toContain(
      "if (recoveryPromise === pending) recoveryPromise = null;\n      })\n      .catch",
    );
    expect(source).toContain(
      "if (connectionPromise === pending && activeSocket === null) {\n        connectionPromise = null;\n      }\n    }).catch",
    );
  });
});

class FakeSocket implements RpcTransportSocket {
  readonly listeners = new Map<string, Array<(event: any) => void>>();
  readonly sent: string[] = [];
  closed = false;

  addEventListener(type: string, listener: (event: any) => void): void {
    const entries = this.listeners.get(type) ?? [];
    entries.push(listener);
    this.listeners.set(type, entries);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.closed = true;
  }

  emit(type: string, event: any = {}): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }

  succeedLast(value: unknown): void {
    const request = this.lastRequest();
    this.emit("message", {
      data: JSON.stringify({
        _tag: "Exit",
        requestId: request.id,
        exit: { _tag: "Success", value },
      }),
    });
  }

  chunkLast(...values: unknown[]): void {
    const request = this.lastRequest();
    this.emit("message", {
      data: JSON.stringify({
        _tag: "Chunk",
        requestId: request.id,
        values,
      }),
    });
  }

  private lastRequest(): { id?: string } {
    for (const frame of this.sent.toReversed()) {
      const parsed = JSON.parse(frame) as { _tag?: string; id?: string };
      if (parsed._tag === "Request") return parsed;
    }
    return {};
  }
}

function controlledTimeouts() {
  const callbacks: Array<() => void> = [];
  const startTimeout: StartRpcTimeout = (_milliseconds, callback) => {
    callbacks.push(callback);
    let cancelled = false;
    return () => {
      cancelled = true;
      const index = callbacks.indexOf(callback);
      if (index >= 0) callbacks[index] = () => undefined;
    };
  };
  return {
    startTimeout,
    get size() {
      return callbacks.length;
    },
    fireNext() {
      callbacks.shift()?.();
    },
  };
}

function managerFor(input: {
  readonly connect: () => Promise<FakeSocket>;
  readonly sleep?: (milliseconds: number) => Promise<void>;
  readonly maxReconnectAttempts?: number;
  readonly offlineRetryDelayMs?: number;
  readonly now?: () => number;
  readonly closeWhenIdle?: boolean;
  readonly autoReconnectOnFailure?: boolean;
}) {
  let sequence = 0;
  const timeouts = controlledTimeouts();
  return {
    timeouts,
    manager: createRpcSocketManager({
      connect: input.connect,
      sleep: input.sleep ?? (() => Promise.resolve()),
      startTimeout: timeouts.startTimeout,
      nextRequestId: () => String(++sequence),
      requestTimeoutMs: 8_000,
      maxReconnectAttempts: input.maxReconnectAttempts ?? 3,
      initialReconnectDelayMs: 100,
      maxReconnectDelayMs: 400,
      offlineRetryDelayMs: input.offlineRetryDelayMs,
      now: input.now,
      closeWhenIdle: input.closeWhenIdle,
      autoReconnectOnFailure: input.autoReconnectOnFailure,
    }),
  };
}

async function flushUntil(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) return;
    await Promise.resolve();
  }
  throw new Error("condition did not become true");
}

describe("rpc transport manager", () => {
  it("closes and rejects a socket that never opens", async () => {
    const socket = new FakeSocket();
    const timeouts = controlledTimeouts();
    const pending = openRpcSocketWithTimeout({
      createSocket: () => socket,
      timeoutMs: 8_000,
      startTimeout: timeouts.startTimeout,
    });
    timeouts.fireNext();
    await expect(pending).rejects.toThrow("open timed out after 8000ms");
    expect(socket.closed).toBe(true);
  });

  it("atomically rejects a mid-RPC close and invalidates the active socket", async () => {
    const socket = new FakeSocket();
    const { manager } = managerFor({ connect: async () => socket });
    const pending = manager.request("orchestration.getSnapshot", {});
    await flushUntil(() => socket.sent.length === 1);
    socket.emit("close");
    await expect(pending).rejects.toThrow("socket closed");
    expect(socket.closed).toBe(true);
    expect(manager.getState()).toBe("idle");
  });

  it("invalidates a hanging request even when close is missing", async () => {
    const socket = new FakeSocket();
    const { manager, timeouts } = managerFor({ connect: async () => socket });
    const pending = manager.request("orchestration.getSnapshot", {});
    await flushUntil(() => socket.sent.length === 1);
    timeouts.fireNext();
    await expect(pending).rejects.toThrow("timed out after 8000ms");
    expect(socket.closed).toBe(true);
    expect(manager.getState()).toBe("idle");
  });

  it("uses bounded exponential backoff while the server restarts", async () => {
    const delays: number[] = [];
    const socket = new FakeSocket();
    let attempts = 0;
    const { manager } = managerFor({
      connect: async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("server unavailable");
        return socket;
      },
      sleep: async (milliseconds) => {
        delays.push(milliseconds);
      },
    });
    const pending = manager.request<{ ok: true }>("orchestration.getSnapshot", {});
    await flushUntil(() => socket.sent.length === 1);
    socket.succeedLast({ ok: true });
    await expect(pending).resolves.toEqual({ ok: true });
    expect(attempts).toBe(3);
    expect(delays).toEqual([100, 200]);
    expect(manager.getState()).toBe("connected");
  });

  it("renegotiates on the next snapshot after a failed socket", async () => {
    const first = new FakeSocket();
    const second = new FakeSocket();
    const sockets = [first, second];
    const { manager } = managerFor({
      connect: async () => sockets.shift() ?? second,
    });

    const failed = manager.request("orchestration.getSnapshot", {});
    await flushUntil(() => first.sent.length === 1);
    first.emit("close");
    await expect(failed).rejects.toThrow("socket closed");

    const recovered = manager.request<{ snapshotSequence: number }>(
      "orchestration.getSnapshot",
      {},
    );
    await flushUntil(() => second.sent.length === 1);
    second.succeedLast({ snapshotSequence: 42 });
    await expect(recovered).resolves.toEqual({ snapshotSequence: 42 });
    expect(manager.getState()).toBe("connected");
  });

  it("recovers a failed active socket without waiting for another request", async () => {
    const first = new FakeSocket();
    const second = new FakeSocket();
    const sockets = [first, second];
    let attempts = 0;
    const { manager } = managerFor({
      connect: async () => {
        attempts += 1;
        return sockets.shift() ?? second;
      },
      autoReconnectOnFailure: true,
    });

    const initial = manager.request<{ snapshotSequence: number }>("orchestration.getSnapshot", {});
    await flushUntil(() => first.sent.length === 1);
    first.succeedLast({ snapshotSequence: 41 });
    await expect(initial).resolves.toEqual({ snapshotSequence: 41 });

    first.emit("close");
    expect(manager.getState()).toBe("reconnecting");
    await flushUntil(() => attempts === 2);
    expect(manager.getState()).toBe("connected");

    const recovered = manager.request<{ snapshotSequence: number }>(
      "orchestration.getSnapshot",
      {},
    );
    await flushUntil(() => second.sent.length === 1);
    second.succeedLast({ snapshotSequence: 42 });
    await expect(recovered).resolves.toEqual({ snapshotSequence: 42 });
  });

  it("holds offline between bounded retry windows, then recovers", async () => {
    const recoveredSocket = new FakeSocket();
    let now = 1_000;
    let attempts = 0;
    let serverOnline = false;
    const { manager } = managerFor({
      connect: async () => {
        attempts += 1;
        if (!serverOnline) throw new Error("server unavailable");
        return recoveredSocket;
      },
      maxReconnectAttempts: 1,
      offlineRetryDelayMs: 5_000,
      now: () => now,
    });

    await expect(manager.request("orchestration.getSnapshot", {})).rejects.toThrow(
      "server unavailable",
    );
    expect(manager.getState()).toBe("offline");
    expect(attempts).toBe(2);

    serverOnline = true;
    await expect(manager.request("orchestration.getSnapshot", {})).rejects.toThrow(
      "reconnect cooling down",
    );
    expect(attempts).toBe(2);
    expect(manager.getState()).toBe("offline");

    now += 5_000;
    const recovered = manager.request<{ snapshotSequence: number }>(
      "orchestration.getSnapshot",
      {},
    );
    await flushUntil(() => recoveredSocket.sent.length === 1);
    recoveredSocket.succeedLast({ snapshotSequence: 43 });
    await expect(recovered).resolves.toEqual({ snapshotSequence: 43 });
    expect(attempts).toBe(3);
  });

  it("retires an idle socket after its final response when requested", async () => {
    const first = new FakeSocket();
    const second = new FakeSocket();
    const sockets = [first, second];
    const states: string[] = [];
    const { manager } = managerFor({
      connect: async () => sockets.shift() ?? second,
      closeWhenIdle: true,
      autoReconnectOnFailure: true,
    });
    manager.subscribe((state) => states.push(state));
    const pending = manager.request<{ ok: true }>("orchestration.getSnapshot", {});
    await flushUntil(() => first.sent.length === 1);
    first.succeedLast({ ok: true });
    await expect(pending).resolves.toEqual({ ok: true });
    expect(first.closed).toBe(true);
    expect(manager.getState()).toBe("idle");

    const next = manager.request<{ ok: true }>("orchestration.getSnapshot", {});
    await flushUntil(() => second.sent.length === 1);
    second.succeedLast({ ok: true });
    await expect(next).resolves.toEqual({ ok: true });
    expect(states).not.toContain("reconnecting");
  });

  it("delivers stream chunks in order and settles on the final exit", async () => {
    const socket = new FakeSocket();
    const { manager, timeouts } = managerFor({
      connect: async () => socket,
      closeWhenIdle: true,
    });
    const chunks: unknown[] = [];
    const pending = manager.requestStream("git.runStackedAction", { action: "commit" }, (value) =>
      chunks.push(value),
    );
    await flushUntil(() => socket.sent.length === 1);
    expect(timeouts.size).toBe(0);
    socket.chunkLast({ kind: "action_started" }, { kind: "phase_started" });
    expect(JSON.parse(socket.sent.at(-1) ?? "{}")).toEqual({
      _tag: "Ack",
      requestId: "1",
    });
    socket.chunkLast({ kind: "action_finished", result: { action: "commit" } });
    expect(chunks).toEqual([
      { kind: "action_started" },
      { kind: "phase_started" },
      { kind: "action_finished", result: { action: "commit" } },
    ]);
    socket.succeedLast(undefined);
    await expect(pending).resolves.toBeUndefined();
    expect(socket.closed).toBe(true);
  });
});
