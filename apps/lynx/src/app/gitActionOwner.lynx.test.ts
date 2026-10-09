// A git action belongs to its workspace, not to the panel that started it:
// the panel can unmount and remount (and the connection can drop and return)
// while one server execution runs, and the progress listener never leaks.

import { afterEach, beforeEach, describe, expect, it } from "@rstest/core";
import type { GitActionProgressEvent, NativeApi } from "@synara/contracts";

import { setNativeApiForTest } from "../adapters/nativeApi.lynx";
import {
  GitActionAlreadyRunningError,
  readOutstandingGitAction,
  runOwnedGitAction,
  useGitActionOwnerStore,
} from "./gitActionOwner.lynx";

const CWD = "/repo";

describe("workspace git action owner", () => {
  let progressListeners: Set<(event: GitActionProgressEvent) => void>;
  let executions: string[];
  let settle: { resolve: (value: unknown) => void; reject: (error: Error) => void } | null;
  const emit = (event: Partial<GitActionProgressEvent> & { actionId: string; kind: string }) => {
    for (const listener of Array.from(progressListeners)) {
      listener(event as GitActionProgressEvent);
    }
  };
  /** What the facade does for one stacked action: one request, pending until it ends. */
  const execute = (actionId: string) =>
    new Promise<unknown>((resolve, reject) => {
      executions.push(actionId);
      settle = { resolve, reject };
    });
  const start = (actionId: string) =>
    runOwnedGitAction({
      workspaceRoot: CWD,
      actionId,
      kind: "stacked",
      initialProgressLabel: "Running git action…",
      run: () => execute(actionId),
    });

  beforeEach(() => {
    progressListeners = new Set();
    executions = [];
    settle = null;
    useGitActionOwnerStore.setState({ byWorkspace: {} });
    setNativeApiForTest({
      git: {
        onActionProgress: (listener: (event: GitActionProgressEvent) => void) => {
          progressListeners.add(listener);
          return () => progressListeners.delete(listener);
        },
      },
    } as unknown as NativeApi);
  });

  afterEach(() => {
    setNativeApiForTest(undefined);
  });

  it("keeps one execution across disconnect, unmount, reconnect and remount", async () => {
    // Panel #1 mounts, observes the owner store, and starts commit + push.
    const panelOneSeen: (string | null)[] = [];
    const unmountPanelOne = useGitActionOwnerStore.subscribe((state) =>
      panelOneSeen.push(state.byWorkspace[CWD]?.progressLabel ?? null),
    );
    const pending = start("action-1");
    expect(readOutstandingGitAction(CWD)).toMatchObject({ actionId: "action-1", kind: "stacked" });
    expect(progressListeners.size).toBe(1);
    emit({ kind: "phase_started", actionId: "action-1", label: "Committing…" });
    expect(panelOneSeen.at(-1)).toBe("Committing…");

    // The connection drops (the transport keeps the request and resumes the
    // same action id later) and the user navigates away: the panel unmounts.
    unmountPanelOne();
    expect(readOutstandingGitAction(CWD)?.actionId).toBe("action-1");
    // The owner, not the panel, holds the one listener.
    expect(progressListeners.size).toBe(1);

    // Reconnected; progress resumes while no panel is mounted.
    emit({ kind: "phase_started", actionId: "action-1", label: "Pushing…" });
    emit({ kind: "phase_started", actionId: "someone-else", label: "Not ours" });

    // Panel #2 mounts: it attaches to the same action, shows its progress, and
    // cannot start another one.
    const remounted = readOutstandingGitAction(CWD);
    expect(remounted).toEqual({ actionId: "action-1", kind: "stacked", progressLabel: "Pushing…" });
    await expect(start("action-2")).rejects.toBeInstanceOf(GitActionAlreadyRunningError);
    await expect(
      runOwnedGitAction({
        workspaceRoot: CWD,
        actionId: "pull-1",
        kind: "pull",
        initialProgressLabel: null,
        run: () => execute("pull-1"),
      }),
    ).rejects.toBeInstanceOf(GitActionAlreadyRunningError);
    expect(executions).toEqual(["action-1"]);
    expect(progressListeners.size).toBe(1);

    settle!.resolve({ branch: { status: "skipped_not_requested" } });
    await expect(pending).resolves.toEqual({ branch: { status: "skipped_not_requested" } });
    expect(readOutstandingGitAction(CWD)).toBeNull();
    expect(progressListeners.size).toBe(0);
    expect(executions).toEqual(["action-1"]);
  });

  it("releases the workspace and the listener when the action fails", async () => {
    const pending = start("action-1");
    emit({ kind: "action_failed", actionId: "action-1", message: "hook rejected the commit" });
    expect(readOutstandingGitAction(CWD)?.progressLabel).toBe("hook rejected the commit");
    settle!.reject(new Error("hook rejected the commit"));
    await expect(pending).rejects.toThrow("hook rejected the commit");
    expect(readOutstandingGitAction(CWD)).toBeNull();
    expect(progressListeners.size).toBe(0);

    // The workspace is free again, and another workspace was never blocked.
    const next = start("action-2");
    expect(executions).toEqual(["action-1", "action-2"]);
    settle!.resolve("ok");
    await next;
  });

  it("claims the workspace synchronously, closing the double-submit window", async () => {
    // Two confirmation dialogs accepted in the same tick: only one may start.
    const first = start("action-1");
    const second = start("action-2");
    await expect(second).rejects.toBeInstanceOf(GitActionAlreadyRunningError);
    expect(executions).toEqual(["action-1"]);
    settle!.resolve("ok");
    await first;
  });
});
