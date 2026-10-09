import { describe, expect, it } from "@rstest/core";

import { scopedStreamId } from "./nativeEventStreams.logic";
import { createScopedStreamRegistry, type ScopedStreamHandle } from "./scopedStreamRegistry.logic";

function fakeOpener() {
  const state = {
    opened: false,
    cancelled: false,
    resolve: () => undefined as void,
    reject: (_error: Error) => undefined as void,
  };
  const opener = (isCancelled: () => boolean): ScopedStreamHandle => {
    const settled = new Promise<void>((resolve, reject) => {
      state.resolve = resolve;
      state.reject = reject;
    });
    state.opened = !isCancelled();
    return {
      settled,
      cancel: () => {
        state.cancelled = true;
        state.resolve();
      },
    };
  };
  return { state, opener };
}

describe("scoped stream registry", () => {
  it("cancels every earlier-generation stream on reset and refuses stale opens and cancels", async () => {
    const registry = createScopedStreamRegistry();
    const first = registry.reset();
    const oldId = scopedStreamId(first, "server.settings", 1);
    const old = fakeOpener();
    const oldRun = registry.run(oldId, old.opener);
    expect(registry.size).toBe(1);

    const second = registry.reset();
    expect(second).toBe(first + 1);
    await expect(oldRun).resolves.toBeUndefined();
    expect(old.state.cancelled).toBe(true);
    expect(registry.size).toBe(0);

    await expect(registry.run(oldId, fakeOpener().opener)).rejects.toThrow(
      /stale renderer generation/,
    );
    expect(registry.cancel(oldId)).toBe(false);

    const fresh = fakeOpener();
    const freshId = scopedStreamId(second, "server.settings", 2);
    const freshRun = registry.run(freshId, fresh.opener);
    expect(registry.accepts(freshId)).toBe(true);
    expect(registry.cancel(freshId)).toBe(true);
    await expect(freshRun).resolves.toBeUndefined();
    expect(registry.size).toBe(0);
  });

  it("marks an entry cancelled before its opener connects so nothing is opened", async () => {
    const registry = createScopedStreamRegistry();
    const generation = registry.reset();
    const streamId = scopedStreamId(generation, "orchestration.shell", 1);
    let release: () => void = () => undefined;
    const connection = new Promise<void>((resolve) => {
      release = resolve;
    });
    let sent = false;
    const run = registry.run(streamId, (isCancelled) => ({
      settled: connection.then(() => {
        if (isCancelled()) return;
        sent = true;
      }),
      cancel: () => undefined,
    }));
    expect(registry.cancel(streamId)).toBe(true);
    release();
    await expect(run).resolves.toBeUndefined();
    expect(sent).toBe(false);
    expect(registry.size).toBe(0);
  });

  it("replaces a re-opened stream id and cancels everything on cancelAll", async () => {
    const registry = createScopedStreamRegistry();
    const generation = registry.reset();
    const streamId = scopedStreamId(generation, "automation.events", 1);
    const first = fakeOpener();
    const firstRun = registry.run(streamId, first.opener);
    const second = fakeOpener();
    const secondRun = registry.run(streamId, second.opener);
    await expect(firstRun).resolves.toBeUndefined();
    expect(first.state.cancelled).toBe(true);
    expect(registry.size).toBe(1);
    registry.cancelAll();
    await expect(secondRun).resolves.toBeUndefined();
    expect(second.state.cancelled).toBe(true);
    expect(registry.size).toBe(0);
  });
});
