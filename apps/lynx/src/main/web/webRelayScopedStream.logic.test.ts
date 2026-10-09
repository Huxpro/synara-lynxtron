import { describe, expect, it } from "@rstest/core";

import { scopedStreamId } from "../nativeEventStreams.logic";
import { createScopedStreamRegistry } from "../scopedStreamRegistry.logic";
import {
  openWebRelayScopedStream,
  type RelayPendingStreamRequest,
} from "./webRelayScopedStream.logic";

class FakeRelaySocket {
  readonly sent: string[] = [];
  open = true;
  send(data: string): void {
    this.sent.push(data);
  }
}

function harness() {
  const socket = new FakeRelaySocket();
  let release: (socket: FakeRelaySocket) => void = () => undefined;
  const connection = new Promise<FakeRelaySocket>((resolve) => {
    release = resolve;
  });
  const pending = new Map<string, RelayPendingStreamRequest>();
  const items: unknown[] = [];
  const failures: Error[] = [];
  let sequence = 0;
  const registry = createScopedStreamRegistry();
  const generation = registry.reset();
  const run = (streamId: string) =>
    registry.run(streamId, (isCancelled) =>
      openWebRelayScopedStream(
        "orchestration.subscribeShell",
        {},
        {
          ensureSocket: () => connection,
          isSocketOpen: (candidate) => candidate.open,
          nextRequestId: () => String(++sequence),
          pending,
          onItem: (item) => items.push(item),
          onSendFailure: (_socket, error) => failures.push(error),
          describeError: (error) => String(error),
        },
        isCancelled,
      ),
    );
  return { socket, release: () => release(socket), pending, items, registry, generation, run };
}

describe("Lynx-for-Web scoped relay stream", () => {
  it("never sends a stream whose cancel arrived while the relay connection was pending", async () => {
    const h = harness();
    const streamId = scopedStreamId(h.generation, "orchestration.shell", 1);
    const run = h.run(streamId);
    expect(h.registry.size).toBe(1);

    expect(h.registry.cancel(streamId)).toBe(true);
    h.release();

    await expect(run).resolves.toBeUndefined();
    expect(h.socket.sent).toEqual([]);
    expect(h.pending.size).toBe(0);
    expect(h.registry.size).toBe(0);
  });

  it("interrupts a sent stream on cancel and ignores the server's later exit", async () => {
    const h = harness();
    const streamId = scopedStreamId(h.generation, "orchestration.shell", 2);
    const run = h.run(streamId);
    h.release();
    await Promise.resolve();
    await Promise.resolve();
    expect(h.socket.sent).toHaveLength(1);
    const request = JSON.parse(h.socket.sent[0]!) as { id: string; tag: string };
    expect(request.tag).toBe("orchestration.subscribeShell");
    h.pending.get(request.id)?.onItem?.({ kind: "snapshot" });
    expect(h.items).toEqual([{ kind: "snapshot" }]);

    expect(h.registry.cancel(streamId)).toBe(true);
    await expect(run).resolves.toBeUndefined();
    expect(JSON.parse(h.socket.sent[1]!)).toEqual({ _tag: "Interrupt", requestId: request.id });
    expect(h.pending.has(request.id)).toBe(false);
    expect(h.registry.size).toBe(0);
  });

  it("cancels the previous renderer generation's relay streams on reset", async () => {
    const h = harness();
    const streamId = scopedStreamId(h.generation, "server.settings", 3);
    const run = h.run(streamId);
    h.release();
    await Promise.resolve();
    await Promise.resolve();
    expect(h.pending.size).toBe(1);

    const next = h.registry.reset();
    expect(next).toBe(h.generation + 1);
    await expect(run).resolves.toBeUndefined();
    expect(h.pending.size).toBe(0);
    expect(h.socket.sent.at(-1)).toContain('"Interrupt"');
    expect(h.registry.size).toBe(0);
  });
});
