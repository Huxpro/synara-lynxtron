import { describe, expect, it } from "@rstest/core";

import {
  normalizeSystemStateAnnouncement,
  resolveNextSystemStateAnnouncement,
  type SystemStateAnnouncementInput,
} from "./system-state-announcement.logic";

describe("resolveNextSystemStateAnnouncement", () => {
  it("normalizes ReactLynx text fragments without calling string methods on arrays", () => {
    const fragments = [
      1,
      " project ",
      ["repository was", " unavailable. "],
      null,
      false,
      { ignored: true },
      "Healthy repositories are still shown.",
    ];

    expect(normalizeSystemStateAnnouncement(fragments)).toBe(
      "1 project repository was unavailable. Healthy repositories are still shown.",
    );
    // The typed announcement channel only admits text-like fragments; the
    // boolean/object fragments above are covered by the untyped normalizer.
    const typedFragments: SystemStateAnnouncementInput = [
      1,
      " project ",
      ["repository was", " unavailable. "],
      null,
      undefined,
      "Healthy repositories are still shown.",
    ];
    expect(
      resolveNextSystemStateAnnouncement({
        previousKey: null,
        intent: "status",
        announcement: typedFragments,
      }),
    ).toEqual({
      content: "1 project repository was unavailable. Healthy repositories are still shown.",
      nextKey: "status:1 project repository was unavailable. Healthy repositories are still shown.",
    });
  });

  it("keeps plain hints and empty labels out of the announcement channel", () => {
    expect(
      resolveNextSystemStateAnnouncement({
        previousKey: null,
        intent: "plain",
        announcement: "Select a file",
      }),
    ).toEqual({ content: null, nextKey: null });
    expect(
      resolveNextSystemStateAnnouncement({
        previousKey: null,
        intent: "status",
        announcement: "   ",
      }),
    ).toEqual({ content: null, nextKey: null });
  });

  it("announces a discrete state once and suppresses consecutive duplicates", () => {
    const first = resolveNextSystemStateAnnouncement({
      previousKey: null,
      intent: "status",
      announcement: " Loading conversation ",
    });
    expect(first).toEqual({
      content: "Loading conversation",
      nextKey: "status:Loading conversation",
    });
    expect(
      resolveNextSystemStateAnnouncement({
        previousKey: first.nextKey,
        intent: "status",
        announcement: "Loading conversation",
      }),
    ).toEqual({
      content: null,
      nextKey: "status:Loading conversation",
    });
  });

  it("announces changed result and error states and resets after plain content", () => {
    const empty = resolveNextSystemStateAnnouncement({
      previousKey: "status:Loading pull requests",
      intent: "empty",
      announcement: "No pull requests found",
    });
    expect(empty.content).toBe("No pull requests found");

    const alert = resolveNextSystemStateAnnouncement({
      previousKey: empty.nextKey,
      intent: "alert",
      announcement: "Pull requests unavailable",
    });
    expect(alert.content).toBe("Pull requests unavailable");

    expect(
      resolveNextSystemStateAnnouncement({
        previousKey: alert.nextKey,
        intent: "plain",
      }),
    ).toEqual({ content: null, nextKey: null });
  });
});
