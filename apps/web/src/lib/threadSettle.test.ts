import { describe, expect, it } from "vitest";

import {
  createOptimisticSettledMutation,
  recordOptimisticSettledMutationSequence,
  reconcileOptimisticSettledMutation,
  reconcileOptimisticSettledMutations,
} from "./threadSettle";
import type { ThreadId } from "@synara/contracts";

describe("optimistic thread settlement", () => {
  it("acknowledges a projection that reaches a newly requested state", () => {
    const mutation = createOptimisticSettledMutation({
      desiredSettled: true,
      serverSettledAtDispatch: false,
    });

    expect(reconcileOptimisticSettledMutation(mutation, true).acknowledged).toBe(true);
  });

  it("does not mistake the pre-Done snapshot for acknowledgement of a fast Undo", () => {
    const undo = createOptimisticSettledMutation({
      desiredSettled: false,
      serverSettledAtDispatch: false,
    });

    const beforeDoneProjects = reconcileOptimisticSettledMutation(undo, false);
    expect(beforeDoneProjects.acknowledged).toBe(false);
    expect(beforeDoneProjects.mutation.observedDifferentState).toBe(false);

    const doneProjects = reconcileOptimisticSettledMutation(beforeDoneProjects.mutation, true);
    expect(doneProjects.acknowledged).toBe(false);
    expect(doneProjects.mutation.observedDifferentState).toBe(true);

    expect(reconcileOptimisticSettledMutation(doneProjects.mutation, false).acknowledged).toBe(
      true,
    );
  });

  it("acknowledges a batched replay once it reaches the durable command sequence", () => {
    const undo = recordOptimisticSettledMutationSequence(
      createOptimisticSettledMutation({
        desiredSettled: false,
        serverSettledAtDispatch: false,
      }),
      42,
    );

    expect(reconcileOptimisticSettledMutation(undo, false, 41).acknowledged).toBe(false);
    expect(reconcileOptimisticSettledMutation(undo, false, 42).acknowledged).toBe(true);
  });

  it("reconciles every pending override and releases acknowledged or vanished threads", () => {
    const done = createOptimisticSettledMutation({
      desiredSettled: true,
      serverSettledAtDispatch: false,
    });
    const current = new Map([
      ["acked" as ThreadId, done],
      ["pending" as ThreadId, done],
      ["gone" as ThreadId, done],
    ]);
    const server = new Map<ThreadId, boolean>([
      ["acked" as ThreadId, true],
      ["pending" as ThreadId, false],
    ]);

    const { next, releasedThreadIds } = reconcileOptimisticSettledMutations(
      current,
      (threadId) => server.get(threadId),
      0,
    );

    expect([...next.keys()]).toEqual(["pending"]);
    expect(releasedThreadIds).toEqual(["acked", "gone"]);
  });

  it("returns the same map when nothing changed", () => {
    const done = {
      ...createOptimisticSettledMutation({ desiredSettled: true, serverSettledAtDispatch: false }),
    };
    const current = new Map([["pending" as ThreadId, done]]);
    expect(reconcileOptimisticSettledMutations(current, () => false, 0).next).toBe(current);
  });
});
