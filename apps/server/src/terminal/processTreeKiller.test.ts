// FILE: processTreeKiller.test.ts
// Purpose: Verifies PTY process-tree capture and safe descendant signaling.
// Layer: Terminal infrastructure tests
// Depends on: Vitest and injectable processTreeKiller dependencies.
import { describe, expect, it } from "vitest";

import {
  collectDescendantProcesses,
  createProcessTreeKiller,
  parseProcessCommandMap,
  parseProcessParentMap,
  type CapturedProcessTree,
  type TerminalKillSignal,
} from "./processTreeKiller";

describe("processTreeKiller", () => {
  it("collects nested process-tree descendants in parent-first order", () => {
    const childrenByParentPid = new Map([
      [100, [101, 102]],
      [102, [103]],
    ]);

    expect(collectDescendantProcesses(100, childrenByParentPid)).toEqual([101, 102, 103]);
  });

  it("parses a lightweight process parent snapshot without command payloads", () => {
    expect(
      parseProcessParentMap(`
        101 100
        102 100
        103 102
        invalid row
      `),
    ).toEqual(
      new Map([
        [100, [101, 102]],
        [102, [103]],
      ]),
    );
  });

  it("parses current command snapshots with command arguments intact", () => {
    expect(
      parseProcessCommandMap(`
        102 bun run dev -- --watch
        103 /bin/zsh -l
      `),
    ).toEqual(
      new Map([
        [102, "bun run dev -- --watch"],
        [103, "/bin/zsh -l"],
      ]),
    );
  });

  it("reads commands only for descendants discovered by the lightweight snapshot", () => {
    const commandReadCalls: number[][] = [];
    const killer = createProcessTreeKiller({
      captureChildrenMap: () =>
        new Map([
          [100, [101, 102]],
          [102, [103]],
        ]),
      readCurrentCommands: (pids) => {
        commandReadCalls.push([...pids]);
        return new Map([
          [101, "zsh"],
          [102, "bun run dev"],
          [103, "tsdown --watch"],
        ]);
      },
    });

    expect(killer.capture(100)).toEqual({
      descendants: [
        { pid: 101, command: "zsh" },
        { pid: 102, command: "bun run dev" },
        { pid: 103, command: "tsdown --watch" },
      ],
      captureComplete: true,
    });
    expect(commandReadCalls).toEqual([[101, 102, 103]]);
  });

  it("marks capture incomplete when descendant identities cannot be read", () => {
    const killer = createProcessTreeKiller({
      captureChildrenMap: () => new Map([[100, [101]]]),
      readCurrentCommands: () => null,
    });

    expect(killer.capture(100)).toEqual({
      descendants: [],
      captureComplete: false,
    });
  });

  it("marks capture incomplete when a discovered descendant loses its identity", () => {
    const killer = createProcessTreeKiller({
      captureChildrenMap: () =>
        new Map([
          [100, [101]],
          [101, [102]],
        ]),
      readCurrentCommands: () => new Map([[101, "zsh"]]),
    });

    expect(killer.capture(100)).toEqual({
      descendants: [],
      captureComplete: false,
    });
  });

  it("validates captured child commands before delayed SIGKILL", () => {
    const signaledPids: Array<{ pid: number; signal: TerminalKillSignal }> = [];
    const treeSignals: Array<{ rootPid: number; signal: TerminalKillSignal }> = [];
    const commandReadCalls: number[][] = [];
    const tree: CapturedProcessTree = {
      descendants: [
        { pid: 102, command: "bun run dev" },
        { pid: 103, command: "tsdown --watch" },
      ],
    };
    const killer = createProcessTreeKiller({
      readCurrentCommands: (pids) => {
        commandReadCalls.push([...pids]);
        return new Map([
          [102, "bun run dev"],
          [103, "node unrelated-process.js"],
        ]);
      },
      signalPid: (pid, signal) => {
        signaledPids.push({ pid, signal });
        return null;
      },
      signalTree: (rootPid, signal, callback) => {
        treeSignals.push({ rootPid, signal });
        callback(null);
      },
    });

    killer.signal({
      rootPid: 100,
      signal: "SIGKILL",
      tree,
      onError: () => undefined,
    });

    expect(signaledPids).toEqual([{ pid: 102, signal: "SIGKILL" }]);
    expect(commandReadCalls).toEqual([[102, 103]]);
    expect(treeSignals).toEqual([{ rootPid: 100, signal: "SIGKILL" }]);
  });

  it("does not validate captured child commands before initial SIGTERM", () => {
    const signaledPids: number[] = [];
    const killer = createProcessTreeKiller({
      readCurrentCommands: () => {
        throw new Error("SIGTERM should not read current commands");
      },
      signalPid: (pid) => {
        signaledPids.push(pid);
        return null;
      },
      signalTree: (_rootPid, _signal, callback) => callback(null),
    });

    killer.signal({
      rootPid: 100,
      signal: "SIGTERM",
      tree: {
        descendants: [
          { pid: 102, command: "bun run dev" },
          { pid: 103, command: "tsdown --watch" },
        ],
      },
      onError: () => undefined,
    });

    expect(signaledPids).toEqual([103, 102]);
  });

  it("can skip root tree signaling while still signaling captured children", () => {
    const signaledPids: number[] = [];
    const treeSignals: number[] = [];
    const killer = createProcessTreeKiller({
      readCurrentCommands: () => new Map([[103, "tsdown --watch"]]),
      signalPid: (pid) => {
        signaledPids.push(pid);
        return null;
      },
      signalTree: (rootPid, _signal, callback) => {
        treeSignals.push(rootPid);
        callback(null);
      },
    });

    killer.signal({
      rootPid: 100,
      signal: "SIGKILL",
      includeRootTree: false,
      tree: {
        descendants: [{ pid: 103, command: "tsdown --watch" }],
      },
      onError: () => undefined,
    });

    expect(signaledPids).toEqual([103]);
    expect(treeSignals).toEqual([]);
  });
});
