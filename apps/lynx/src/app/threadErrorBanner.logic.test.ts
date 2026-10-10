import { describe, expect, it } from "@rstest/core";

import {
  threadErrorDismissKey,
  threadErrorShownInTranscript,
  visibleThreadError,
} from "./threadErrorBanner.logic";

describe("thread error banner dismissal identity", () => {
  it("keeps one runtime error dismissed for the same session revision", () => {
    const dismissedKey = threadErrorDismissKey({
      error: "Usage limit reached.",
      revision: "2026-08-18T08:00:00.000Z",
    });

    expect(
      visibleThreadError({
        dismissedKey,
        error: "Usage limit reached.",
        revision: "2026-08-18T08:00:00.000Z",
      }),
    ).toBeNull();
  });

  it("shows the same provider message again after a newer failure", () => {
    const dismissedKey = threadErrorDismissKey({
      error: "Usage limit reached.",
      revision: "2026-08-18T08:00:00.000Z",
    });

    expect(
      visibleThreadError({
        dismissedKey,
        error: "Usage limit reached.",
        revision: "2026-08-18T08:05:00.000Z",
      }),
    ).toBe("Usage limit reached.");
  });
});

describe("thread error shown by the transcript", () => {
  const failure = { turnFailure: { cause: "stream disconnected" } };

  it("is true when a work row carries the same failure", () => {
    expect(
      threadErrorShownInTranscript(
        [{ kind: "work", groupedEntries: [{}, failure] }],
        " stream disconnected ",
      ),
    ).toBe(true);
  });

  it("looks inside a message row's leading, inline and collapsed work", () => {
    expect(
      threadErrorShownInTranscript(
        [
          {
            kind: "message",
            collapsedTurnItems: [{ kind: "narration" }, { kind: "work", entry: failure }],
          },
        ],
        "stream disconnected",
      ),
    ).toBe(true);
  });

  it("keeps the banner for a different error or none", () => {
    const rows = [{ kind: "work" as const, groupedEntries: [failure] }];
    expect(threadErrorShownInTranscript(rows, "usage limit reached")).toBe(false);
    expect(threadErrorShownInTranscript(rows, null)).toBe(false);
    expect(threadErrorShownInTranscript([{ kind: "working" }], "stream disconnected")).toBe(false);
  });

  it("leaves the banner to the transcript card, read from the thread summary", () => {
    const thread = { error: "stream disconnected", errorRevision: "2026-10-09T12:00:00.000Z" };
    expect(
      visibleThreadError({
        dismissedKey: null,
        thread,
        transcriptRows: [{ kind: "work", groupedEntries: [failure] }],
      }),
    ).toBeNull();
    expect(visibleThreadError({ dismissedKey: null, thread, transcriptRows: [] })).toBe(
      "stream disconnected",
    );
    expect(visibleThreadError({ dismissedKey: null, thread: undefined })).toBeNull();
  });
});
