import type { TerminalEvent, TerminalSessionSnapshot } from "@synara/contracts";

export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        index += 1;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

export function applyTerminalEventToSnapshot(input: {
  readonly event: TerminalEvent;
  readonly snapshot: TerminalSessionSnapshot | null;
  readonly terminalId: string;
  readonly threadId: string;
}): TerminalSessionSnapshot | null {
  const { event } = input;
  if (event.threadId !== input.threadId || event.terminalId !== input.terminalId) {
    return input.snapshot;
  }
  if (event.type === "started" || event.type === "restarted") {
    return event.snapshot;
  }
  if (!input.snapshot) return null;
  if (event.type === "output") {
    return {
      ...input.snapshot,
      history: input.snapshot.history + event.data,
      updatedAt: event.createdAt,
    };
  }
  if (event.type === "cleared") {
    return { ...input.snapshot, history: "", replayPreamble: "", updatedAt: event.createdAt };
  }
  if (event.type === "exited") {
    return {
      ...input.snapshot,
      status: "exited",
      pid: null,
      exitCode: event.exitCode,
      exitSignal: event.exitSignal,
      updatedAt: event.createdAt,
    };
  }
  if (event.type === "error") {
    return { ...input.snapshot, status: "error", updatedAt: event.createdAt };
  }
  return input.snapshot;
}
