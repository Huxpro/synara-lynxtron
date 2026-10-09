// Skill toggles against deferred server responses: the real settings write
// helper and query cache, with a facade double whose `updateSettings` settles
// when the test says so.

import { afterEach, beforeEach, describe, expect, it } from "@rstest/core";
import { QueryClient } from "@tanstack/react-query";
import type { NativeApi, ServerSettingsPatch, ServerSettingsView } from "@synara/contracts";
import { serverQueryKeys } from "@synara-web/lib/serverReactQuery";

import { setNativeApiForTest } from "../adapters/nativeApi.lynx";
import { writeServerSettings } from "./settingsServerData.lynx";
import {
  EMPTY_SKILL_TOGGLE_QUEUE_STATE,
  createSkillToggleQueue,
  projectDisabledSkillNames,
  type SkillToggleQueueState,
} from "./settingsSkillToggleQueue.logic";

interface PendingWrite {
  readonly disabled: readonly string[];
  readonly resolve: () => void;
  readonly reject: (error: Error) => void;
}

function view(disabled: readonly string[]): ServerSettingsView {
  return { skills: { disabled } } as unknown as ServerSettingsView;
}

async function flush(): Promise<void> {
  for (let round = 0; round < 10; round += 1) await Promise.resolve();
}

describe("Settings skill toggle queue", () => {
  let queryClient: QueryClient;
  let writes: PendingWrite[];
  let serverDisabled: readonly string[];
  let state: SkillToggleQueueState;
  const confirmed = () =>
    queryClient.getQueryData<ServerSettingsView>(serverQueryKeys.settings())?.skills.disabled ?? [];
  /** What the panel renders: the settings query with the pending intents on top. */
  const shown = () => projectDisabledSkillNames(confirmed(), state.intents);
  const makeQueue = () =>
    createSkillToggleQueue({
      readConfirmed: confirmed,
      write: (disabled) =>
        writeServerSettings(queryClient, { skills: { disabled: [...disabled] } }),
      onState: (next) => {
        state = next;
      },
    });

  beforeEach(() => {
    queryClient = new QueryClient();
    writes = [];
    serverDisabled = [];
    state = EMPTY_SKILL_TOGGLE_QUEUE_STATE;
    queryClient.setQueryData(serverQueryKeys.settings(), view([]));
    setNativeApiForTest({
      server: {
        updateSettings: (patch: ServerSettingsPatch) =>
          new Promise<ServerSettingsView>((resolve, reject) => {
            const disabled = patch.skills?.disabled ?? [];
            writes.push({
              disabled,
              resolve: () => {
                serverDisabled = disabled;
                resolve(view(disabled));
              },
              reject,
            });
          }),
      },
    } as unknown as NativeApi);
  });

  afterEach(() => {
    setNativeApiForTest(undefined);
    queryClient.clear();
  });

  it("keeps later toggles when an earlier one is confirmed first", async () => {
    const queue = makeQueue();
    const a = queue.toggle("A", false);
    const b = queue.toggle("B", false);
    await flush();
    expect(shown()).toEqual(["a", "b"]);
    expect(writes.map((write) => write.disabled)).toEqual([["a"]]);

    // A is confirmed, and the server's settings push for it lands (EventRouter
    // writes the same query) while B is still waiting.
    writes[0]!.resolve();
    await a;
    queryClient.setQueryData(serverQueryKeys.settings(), view(["a"]));
    await flush();
    expect(confirmed()).toEqual(["a"]);
    expect(shown()).toEqual(["a", "b"]);
    expect(state.savingSkillKey).toBe("b");

    const c = queue.toggle("C", false);
    await flush();
    expect(shown()).toEqual(["a", "b", "c"]);
    // B's write was derived from the confirmed list, not from a stale closure.
    expect(writes[1]!.disabled).toEqual(["a", "b"]);

    writes[1]!.resolve();
    await b;
    await flush();
    expect(shown()).toEqual(["a", "b", "c"]);
    expect(writes[2]!.disabled).toEqual(["a", "b", "c"]);

    writes[2]!.resolve();
    await c;
    expect(serverDisabled).toEqual(["a", "b", "c"]);
    expect(confirmed()).toEqual(["a", "b", "c"]);
    expect(shown()).toEqual(["a", "b", "c"]);
    expect(state).toEqual({ intents: [], savingSkillKey: null, error: null });
  });

  it("rolls a failed toggle back to confirmed state and keeps the later one", async () => {
    const queue = makeQueue();
    const a = queue.toggle("A", false);
    await flush();
    writes[0]!.resolve();
    await a;

    const b = queue.toggle("B", false);
    const c = queue.toggle("C", false);
    await flush();
    expect(shown()).toEqual(["a", "b", "c"]);

    writes[1]!.reject(new Error("disk full"));
    await b;
    await flush();
    // B is gone, A (confirmed) and C (still pending) stay.
    expect(shown()).toEqual(["a", "c"]);
    expect(state.error).toBe("disk full");
    expect(state.savingSkillKey).toBe("c");
    // C is sent on top of what the server holds, without the failed B.
    expect(writes[2]!.disabled).toEqual(["a", "c"]);

    writes[2]!.resolve();
    await c;
    expect(serverDisabled).toEqual(["a", "c"]);
    expect(shown()).toEqual(["a", "c"]);
    expect(state.intents).toEqual([]);

    // A new toggle clears the error and builds on confirmed state.
    const d = queue.toggle("A", true);
    await flush();
    expect(state.error).toBeNull();
    expect(writes[3]!.disabled).toEqual(["c"]);
    writes[3]!.resolve();
    await d;
    expect(shown()).toEqual(["c"]);
  });

  it("derives each write from the list confirmed when it runs, including other clients' changes", async () => {
    const queue = makeQueue();
    const a = queue.toggle("A", false);
    const b = queue.toggle("B", false);
    await flush();
    writes[0]!.resolve();
    await a;
    // Another client disabled Z; its push replaces the confirmed list.
    queryClient.setQueryData(serverQueryKeys.settings(), view(["a", "z"]));
    await flush();
    // B started the moment A settled, before that push: the list is a full
    // replacement, so only writes that start after a push can include it.
    expect(writes[1]!.disabled).toEqual(["a", "b"]);
    writes[1]!.resolve();
    await b;
    queryClient.setQueryData(serverQueryKeys.settings(), view(["a", "b", "z"]));
    const c = queue.toggle("C", false);
    await flush();
    expect(writes[2]!.disabled).toEqual(["a", "b", "c", "z"]);
    writes[2]!.resolve();
    await c;
  });
});
