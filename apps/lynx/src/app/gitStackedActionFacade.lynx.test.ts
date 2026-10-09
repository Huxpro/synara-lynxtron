// A git stacked action from the environment panel's variables, over the real
// facade and transport compat: the request the host receives (compared with
// the legacy client's) and the per-phase progress the panel shows. Kept in its
// own file: upstream's git module reaches the facade through an import path
// `setNativeApiForTest` cannot reset, so each file uses a single facade.

import { afterEach, describe, expect, it } from "@rstest/core";
import { QueryClient } from "@tanstack/react-query";
import type { GitActionProgressEvent } from "@synara/contracts";
import { gitRunStackedActionMutationOptions } from "@synara-web/lib/gitReactQuery";
import { resetWsNativeApiForTest } from "@synara-web/wsNativeApi";

import { installFakeNativeHost } from "../adapters/fakeNativeHost.testUtils";
import { ensureNativeApi, setNativeApiForTest } from "../adapters/nativeApi.lynx";

const CWD = "/repo";

describe("Git stacked action over the upstream facade", () => {
  afterEach(async () => {
    // Dispose upstream's facade first, then drop the Lynx wrapper, so nothing
    // that runs during disposal can re-cache the disposed instance.
    await resetWsNativeApiForTest();
    setNativeApiForTest(undefined);
  });

  it("runs a stacked action with the panel's variables and reports each phase", async () => {
    const seen: GitActionProgressEvent[] = [];
    const stop = ensureNativeApi().git.onActionProgress((event) => {
      if (event.actionId === "action-1") seen.push(event);
    });
    // The variables EnvironmentGitActions passes for "commit and push" with a
    // message and a file selection: no model, no force, nothing implicit.
    const host = installFakeNativeHost({ rpc: (tag) => ({ tag }) });
    const queryClient = new QueryClient();
    const pending = gitRunStackedActionMutationOptions({ cwd: CWD, queryClient }).mutationFn!(
      {
        actionId: "action-1",
        action: "commit_push",
        commitMessage: "fix: thing",
        filePaths: ["a.ts"],
      },
      undefined as never,
    );
    const findStream = () =>
      [...host.streams.values()].find((entry) => entry.tag === "git.runStackedAction");
    for (let round = 0; round < 200 && !findStream(); round += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    const stream = findStream();
    expect(stream).toBeDefined();
    expect(stream?.payload).toEqual({
      actionId: "action-1",
      cwd: CWD,
      action: "commit_push",
      commitMessage: "fix: thing",
      filePaths: ["a.ts"],
    });

    host.pushStreamItem(stream!.streamId, {
      kind: "phase_started",
      actionId: "action-1",
      label: "Committing…",
    });
    host.pushStreamItem(stream!.streamId, {
      kind: "phase_started",
      actionId: "other-action",
      label: "Not ours",
    });
    host.pushStreamItem(stream!.streamId, {
      kind: "action_finished",
      actionId: "action-1",
      result: { branch: { status: "skipped_not_requested" } },
    });
    stream!.settle();

    await expect(pending).resolves.toEqual({ branch: { status: "skipped_not_requested" } });
    expect(seen.map((event) => event.kind)).toEqual(["phase_started", "action_finished"]);
    stop();
    // Nothing went out as a plain request, and nothing carried the legacy envelope.
    expect(host.callsNamed("synaraRpc")).toEqual([]);
    for (const call of host.callsNamed("synaraRpcStream")) {
      expect(call.params).not.toHaveProperty("baseUrl");
    }
  });
});
