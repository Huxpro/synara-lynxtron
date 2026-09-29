import { describe, expect, it, rs } from "@rstest/core";

import {
  ensureLandingThreadCreated,
  type LandingThreadCreationState,
} from "./landingThreadCreation.logic";

function freshState(): LandingThreadCreationState {
  return { created: false, inFlight: null };
}

describe("ensureLandingThreadCreated", () => {
  it("coalesces simultaneous sends into one canonical thread creation", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const create = rs.fn(() => pending);
    const recover = rs.fn(async () => false);
    const state = freshState();

    const first = ensureLandingThreadCreated({ create, recover, state });
    const duplicate = ensureLandingThreadCreated({ create, recover, state });
    expect(create).toHaveBeenCalledTimes(1);
    release();
    await Promise.all([first, duplicate]);

    await ensureLandingThreadCreated({ create, recover, state });
    expect(create).toHaveBeenCalledTimes(1);
    expect(recover).not.toHaveBeenCalled();
  });

  it("accepts an ambiguous response only when persistence confirms the thread", async () => {
    const state = freshState();
    await ensureLandingThreadCreated({
      create: async () => {
        throw new Error("connection closed after write");
      },
      recover: async () => true,
      state,
    });

    expect(state.created).toBe(true);
  });

  it("keeps creation retryable after a confirmed failure", async () => {
    const state = freshState();
    const create = rs
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce();

    await expect(
      ensureLandingThreadCreated({
        create,
        recover: async () => false,
        state,
      }),
    ).rejects.toThrow("offline");
    expect(state).toEqual({ created: false, inFlight: null });

    await ensureLandingThreadCreated({
      create,
      recover: async () => false,
      state,
    });
    expect(create).toHaveBeenCalledTimes(2);
    expect(state.created).toBe(true);
  });
});
