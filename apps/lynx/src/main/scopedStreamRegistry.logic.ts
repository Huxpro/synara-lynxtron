// Host-side ownership of the request-scoped streams the shared `WsTransport`
// compat opens (`adapters/wsTransport.lynx.ts`). Shared by the Lynxtron host
// (`desktop/nativeRpcHost.ts`) and the Lynx-for-Web host (`web/web-host.ts`):
//
// - an entry is registered the moment the open arrives, before any socket
//   connection, so a cancel can never race an in-flight open (the opener checks
//   `isCancelled()` once its connection resolves and skips the request);
// - stream ids carry the renderer generation (`scopedStreamId`); a reset bumps
//   it, cancels every earlier-generation stream, and later opens/cancels from a
//   stale renderer are refused/ignored.

import { scopedStreamGeneration } from "./nativeEventStreams.logic";

export interface ScopedStreamHandle {
  /** Resolves when the stream ends or was cancelled; rejects on a transport/RPC failure. */
  readonly settled: Promise<void>;
  readonly cancel: () => void;
}

export type ScopedStreamOpener = (isCancelled: () => boolean) => ScopedStreamHandle;

interface RegistryEntry {
  readonly generation: number;
  cancelled: boolean;
  cancel: (() => void) | null;
}

export class StaleRendererGenerationError extends Error {
  readonly name = "StaleRendererGenerationError";
}

export function createScopedStreamRegistry() {
  let generation = 0;
  const entries = new Map<string, RegistryEntry>();

  const cancelEntry = (streamId: string, entry: RegistryEntry) => {
    if (entries.get(streamId) === entry) entries.delete(streamId);
    entry.cancelled = true;
    entry.cancel?.();
  };

  return {
    get generation(): number {
      return generation;
    },
    get size(): number {
      return entries.size;
    },
    /** New renderer generation: every stream of an earlier generation is cancelled. */
    reset(): number {
      generation += 1;
      for (const [streamId, entry] of [...entries]) {
        if (entry.generation < generation) cancelEntry(streamId, entry);
      }
      return generation;
    },
    accepts(streamId: string): boolean {
      return scopedStreamGeneration(streamId) === generation;
    },
    async run(streamId: string, open: ScopedStreamOpener): Promise<void> {
      if (!streamId) throw new Error("Synara RPC stream id is required");
      if (!this.accepts(streamId)) {
        throw new StaleRendererGenerationError(
          `Synara RPC stream ${streamId} belongs to a stale renderer generation (current g${generation}).`,
        );
      }
      const previous = entries.get(streamId);
      if (previous) cancelEntry(streamId, previous);
      const entry: RegistryEntry = { generation, cancelled: false, cancel: null };
      entries.set(streamId, entry);
      const handle = open(() => entry.cancelled);
      entry.cancel = handle.cancel;
      if (entry.cancelled) handle.cancel();
      try {
        await handle.settled;
      } finally {
        if (entries.get(streamId) === entry) entries.delete(streamId);
      }
    },
    cancel(streamId: string): boolean {
      if (!this.accepts(streamId)) return false;
      const entry = entries.get(streamId);
      if (!entry) return false;
      cancelEntry(streamId, entry);
      return true;
    },
    cancelAll(): void {
      for (const [streamId, entry] of [...entries]) cancelEntry(streamId, entry);
    },
  };
}

export type ScopedStreamRegistry = ReturnType<typeof createScopedStreamRegistry>;
