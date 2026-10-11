import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import type { ThreadTranscriptRow } from "./queries";
import {
  createTranscriptFollowController,
  TRANSCRIPT_FOLLOW_SETTLE_DELAY_MS,
  transcriptFollowVersion,
} from "./transcriptFollow.logic";
import {
  resolveTranscriptPinnedFromScroll,
  type MessageTranscriptRow,
  type WorkLogEntry,
} from "./transcriptRows.logic";

function entry(id: string, toolStatus: WorkLogEntry["toolStatus"] = "completed"): WorkLogEntry {
  return {
    id,
    label: id,
    tone: "tool",
    createdAt: "2026-07-29T00:00:00.000Z",
    toolStatus,
  };
}

function messageRow(
  id: string,
  role: "user" | "assistant",
  text: string,
  overrides: Partial<MessageTranscriptRow> = {},
): ThreadTranscriptRow {
  return {
    kind: "message",
    id,
    createdAt: "2026-07-29T00:00:00.000Z",
    message: {
      id,
      role,
      text,
      createdAt: "2026-07-29T00:00:00.000Z",
      turnId: null,
      streaming: role === "assistant",
    },
    ...overrides,
  } as ThreadTranscriptRow;
}

function workRow(id: string, entries: readonly WorkLogEntry[]): ThreadTranscriptRow {
  return {
    kind: "work",
    id,
    createdAt: "2026-07-29T00:00:00.000Z",
    groupedEntries: entries,
  } as ThreadTranscriptRow;
}

/** The chrome rows a running turn has around its reply; only their identity matters here. */
function chromeRow(id: string): ThreadTranscriptRow {
  return { kind: "working", id, createdAt: "2026-07-29T00:00:00.000Z" } as never;
}

/** A running turn as the transcript lays it out: the reply is not the last row. */
function streamingTurn(replyText: string): ThreadTranscriptRow[] {
  return [
    messageRow("older-user", "user", "earlier prompt"),
    messageRow("older-reply", "assistant", "earlier reply"),
    messageRow("user", "user", "prompt"),
    chromeRow("working-header"),
    messageRow("reply", "assistant", replyText),
    chromeRow("working-indicator"),
  ];
}

describe("transcriptFollowVersion", () => {
  it("changes when text grows inside a row that is not the last one", () => {
    expect(transcriptFollowVersion(streamingTurn("1. Nile"))).not.toBe(
      transcriptFollowVersion(streamingTurn("1. Nile\n2. Amazon")),
    );
  });

  it("is the same for a render that changes nothing the latest turn draws", () => {
    expect(transcriptFollowVersion(streamingTurn("1. Nile"))).toBe(
      transcriptFollowVersion(streamingTurn("1. Nile")),
    );
    const editedHistory = streamingTurn("1. Nile");
    editedHistory[1] = messageRow("older-reply", "assistant", "earlier reply, re-rendered");
    expect(transcriptFollowVersion(editedHistory)).toBe(
      transcriptFollowVersion(streamingTurn("1. Nile")),
    );
  });

  it("changes when a work row arrives, and when a work entry changes state", () => {
    const base = streamingTurn("");
    const withWork = [...base.slice(0, 4), workRow("work", [entry("tool", "running")]), base[5]!];
    const workDone = [...base.slice(0, 4), workRow("work", [entry("tool", "completed")]), base[5]!];
    expect(transcriptFollowVersion(withWork)).not.toBe(transcriptFollowVersion(base));
    expect(transcriptFollowVersion(workDone)).not.toBe(transcriptFollowVersion(withWork));

    const inline = (toolStatus: WorkLogEntry["toolStatus"]) => {
      const rows = streamingTurn("text");
      rows[4] = messageRow("reply", "assistant", "text", {
        inlineWorkEntries: [entry("tool", toolStatus)],
      });
      return rows;
    };
    expect(transcriptFollowVersion(inline("running"))).not.toBe(
      transcriptFollowVersion(inline("completed")),
    );
  });

  it("changes when the turn settles: the chrome rows go and the reply stops streaming", () => {
    const running = streamingTurn("done");
    const settledReply = messageRow("reply", "assistant", "done");
    (settledReply as MessageTranscriptRow).message.streaming = false;
    const settled = [...running.slice(0, 3), settledReply];
    expect(transcriptFollowVersion(settled)).not.toBe(transcriptFollowVersion(running));
  });

  it("changes when another thread's rows replace these, and handles an empty transcript", () => {
    expect(transcriptFollowVersion([])).toBe(transcriptFollowVersion([]));
    expect(transcriptFollowVersion([messageRow("a", "user", "hi")])).not.toBe(
      transcriptFollowVersion([messageRow("b", "user", "hi")]),
    );
    expect(transcriptFollowVersion([messageRow("a", "user", "hi")])).not.toBe(
      transcriptFollowVersion([]),
    );
  });
});

function harness(initiallyFollowing = true) {
  let now = 0;
  let nextHandle = 1;
  const timers = new Map<number, { readonly at: number; readonly callback: () => void }>();
  const scrolls: string[] = [];
  const state = { following: initiallyFollowing };
  const controller = createTranscriptFollowController<number>({
    isFollowing: () => state.following,
    scrollToEnd: ({ smooth }) => scrolls.push(smooth ? "settle" : "follow"),
    setTimer: (callback, delayMs) => {
      const handle = nextHandle;
      nextHandle += 1;
      timers.set(handle, { at: now + delayMs, callback });
      return handle;
    },
    clearTimer: (handle) => {
      timers.delete(handle);
    },
  });
  const advance = (ms: number) => {
    now += ms;
    for (const [handle, timer] of [...timers]) {
      if (timer.at > now) continue;
      timers.delete(handle);
      timer.callback();
    }
  };
  /** The reader scrolls: the same decision the transcript's scroll handler makes. */
  const userScroll = (scrollTop: number, scrollHeight: number, listHeight = 600) => {
    state.following = resolveTranscriptPinnedFromScroll({
      currentPinned: state.following,
      detail: { eventSource: 2, scrollTop, scrollHeight, listHeight },
      isWebRelayMode: false,
      nativeUserEventSource: 2,
      bottomEpsilon: 30,
    });
  };
  return { controller, scrolls, state, advance, userScroll, pending: () => timers.size };
}

describe("transcript follow controller", () => {
  it("scrolls to the end on every change while the reader is there, then settles once", () => {
    const { controller, scrolls, advance, pending } = harness();
    for (let flush = 0; flush < 5; flush += 1) {
      controller.contentChanged();
      advance(60);
    }
    expect(scrolls).toEqual(["follow", "follow", "follow", "follow", "follow"]);
    expect(pending()).toBe(1);
    advance(TRANSCRIPT_FOLLOW_SETTLE_DELAY_MS);
    expect(scrolls).toEqual(["follow", "follow", "follow", "follow", "follow", "settle"]);
    expect(pending()).toBe(0);
    // Nothing repeats without new content: the follow cannot feed itself.
    advance(10_000);
    expect(scrolls).toHaveLength(6);
  });

  it("never moves a reader who is away from the end, whatever arrives", () => {
    const { controller, scrolls, advance, pending } = harness(false);
    for (let flush = 0; flush < 20; flush += 1) {
      controller.contentChanged();
      advance(100);
    }
    advance(10_000);
    expect(scrolls).toEqual([]);
    expect(pending()).toBe(0);
  });

  it("is released by the reader scrolling up, including before a pending settle pass", () => {
    const { controller, scrolls, advance, userScroll, state } = harness();
    controller.contentChanged();
    expect(scrolls).toEqual(["follow"]);
    // 400px above the end of a 2000px transcript.
    userScroll(1000, 2000);
    expect(state.following).toBe(false);
    advance(TRANSCRIPT_FOLLOW_SETTLE_DELAY_MS * 2);
    expect(scrolls).toEqual(["follow"]);
    // Growth, work rows and the settled layout do not re-arm it.
    controller.contentChanged();
    controller.contentChanged();
    advance(10_000);
    expect(scrolls).toEqual(["follow"]);
    expect(state.following).toBe(false);
  });

  it("is not released or re-armed by scroll events the follow itself causes", () => {
    const { state } = harness();
    const programmatic = (currentPinned: boolean, scrollTop: number) =>
      resolveTranscriptPinnedFromScroll({
        currentPinned,
        detail: { eventSource: 0, scrollTop, scrollHeight: 2000, listHeight: 600 },
        isWebRelayMode: false,
        nativeUserEventSource: 2,
        bottomEpsilon: 30,
      });
    // A follow scroll reported part-way keeps a following reader following…
    expect(programmatic(state.following, 900)).toBe(true);
    // …and one that lands at the end does not re-attach a reader who left.
    expect(programmatic(false, 1400)).toBe(false);
  });

  it("follows again once the reader scrolls back to the end", () => {
    const { controller, scrolls, advance, userScroll, state } = harness();
    userScroll(1000, 2000);
    controller.contentChanged();
    expect(scrolls).toEqual([]);
    userScroll(1385, 2000);
    expect(state.following).toBe(true);
    controller.contentChanged();
    advance(TRANSCRIPT_FOLLOW_SETTLE_DELAY_MS);
    expect(scrolls).toEqual(["follow", "settle"]);
  });

  it("drops a pending settle pass when cancelled", () => {
    const { controller, scrolls, advance, pending } = harness();
    controller.contentChanged();
    controller.cancel();
    expect(pending()).toBe(0);
    advance(10_000);
    expect(scrolls).toEqual(["follow"]);
  });
});

describe("Transcript follow wiring", () => {
  const source = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");

  it("follows the latest turn's content, not the last row", () => {
    expect(source).toMatch(
      /follow\.contentChanged\(\);\s*\}, \[follow, transcriptFollowVersion\(rows\)\]\);/,
    );
    expect(source).not.toContain("transcriptRowVersion(rows[rows.length - 1])");
  });

  it("asks the reader's pin when a scroll runs and cancels the settle pass on unmount", () => {
    expect(source).toContain("isFollowing: () => pinnedRef.current,");
    expect(source).toContain("return () => follow.cancel();");
  });

  it("does not drive the follow from scroll or layout events", () => {
    expect(source).not.toContain("bindlayoutcomplete");
    const scrollHandlers = source.slice(
      source.indexOf("function handleScrollDetail"),
      source.indexOf("function jumpToLatest"),
    );
    expect(scrollHandlers.match(/scrollToBottom\(\)/g)).toHaveLength(1);
    expect(scrollHandlers).toMatch(/\[threadId\]/);
  });
});
