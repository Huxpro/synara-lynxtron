// The Automations surfaces run upstream's generated state layer; the list is
// kept current by the server's automation stream, with one shared subscription.

import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import { act, render } from "@lynx-js/react/testing-library";
import { QueryClient, QueryClientContext } from "@tanstack/react-query";
import type { AutomationStreamEvent, NativeApi } from "@synara/contracts";

import { installFakeNativeHost } from "../adapters/fakeNativeHost.testUtils";
import { setNativeApiForTest } from "../adapters/nativeApi.lynx";
import { automationQueryKey } from "../generated/automationsState.generated";
import { useLiveAutomations } from "./automationsLive.lynx";

rs.hoisted(() => {
  (globalThis as { NativeModules?: unknown }).NativeModules = {
    bridge: {
      call: (_name: string, _params: unknown, callback: (reply: string) => void) =>
        queueMicrotask(() => callback("{}")),
    },
  };
});

const definition = (id: string, name: string, updatedAt: string, enabled = true) =>
  ({ id, name, enabled, updatedAt, createdAt: "2026-02-27T00:00:00.000Z" }) as never;

describe("live automations", () => {
  let calls: string[];
  let listeners: Set<(event: AutomationStreamEvent) => void>;
  let list: () => Promise<unknown>;
  let update: (input: unknown) => Promise<unknown>;
  let client: QueryClient;
  let automations: ReturnType<typeof useLiveAutomations>;
  let unmount: (() => void) | null = null;

  function Probe() {
    automations = useLiveAutomations();
    return null;
  }
  function Second() {
    useLiveAutomations();
    return null;
  }

  async function settle() {
    // react-query batches its notifications onto a timer.
    await act(async () => {
      for (let turn = 0; turn < 3; turn += 1) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    });
  }

  async function mount(second = false) {
    const view = render(
      <QueryClientContext.Provider value={client}>
        <Probe />
        {second ? <Second /> : null}
      </QueryClientContext.Provider>,
    );
    unmount = view.unmount;
    await settle();
  }

  beforeEach(() => {
    installFakeNativeHost();
    calls = [];
    listeners = new Set();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    list = async () => ({
      definitions: [definition("a1", "Nightly", "2026-02-27T00:00:00.000Z")],
      runs: [],
      memories: [],
    });
    update = async (input) => input;
    setNativeApiForTest({
      automation: {
        list: () => {
          calls.push("list");
          return list();
        },
        update: (input: unknown) => {
          calls.push("update");
          return update(input);
        },
        onEvent: (listener: (event: AutomationStreamEvent) => void) => {
          calls.push("subscribe");
          listeners.add(listener);
          return () => {
            calls.push("unsubscribe");
            listeners.delete(listener);
          };
        },
      },
    } as unknown as NativeApi);
  });

  afterEach(() => {
    unmount?.();
    unmount = null;
    setNativeApiForTest(undefined);
  });

  it("loads the list once under upstream's key and follows the stream without polling", async () => {
    await mount(true);
    expect(automations.isLoading).toBe(false);
    expect(automations.data.definitions.map((entry) => entry.name)).toEqual(["Nightly"]);
    expect(client.getQueryData(automationQueryKey)).toBe(automations.data);
    // Two surfaces, one request and one subscription.
    expect(calls.toSorted()).toEqual(["list", "subscribe"]);

    act(() => {
      for (const listener of listeners) {
        listener({
          type: "definition-upserted",
          definition: definition("a2", "Weekly", "2026-02-28T00:00:00.000Z"),
        } as never);
      }
    });
    await settle();
    expect(automations.data.definitions.map((entry) => entry.name).toSorted()).toEqual([
      "Nightly",
      "Weekly",
    ]);
    expect(calls.filter((call) => call === "list")).toHaveLength(1);

    unmount?.();
    unmount = null;
    expect(calls.at(-1)).toBe("unsubscribe");
    expect(listeners.size).toBe(0);
  });

  it("shows an empty list, not a spinner, when the server cannot be reached", async () => {
    list = async () => {
      throw new Error("Synara is offline.");
    };
    await mount();
    expect(automations.isLoading).toBe(false);
    expect(automations.data.definitions).toEqual([]);
    expect(client.getQueryState(automationQueryKey)?.error?.message).toBe("Synara is offline.");
  });

  it("patches a definition optimistically and rolls the patch back when the update fails", async () => {
    await mount();
    let fail: (error: Error) => void = () => undefined;
    update = () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      });
    act(() => automations.updateMutation.mutate({ id: "a1", enabled: false } as never));
    await settle();
    expect(automations.data.definitions[0]?.enabled).toBe(false);
    fail(new Error("nope"));
    await settle();
    expect(automations.data.definitions[0]?.enabled).toBe(true);
    expect(automations.updateMutation.error?.message).toBe("nope");
  });
});
