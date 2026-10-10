import { describe, expect, it } from "vitest";

import {
  MESSAGE_FORMATS_THREAD_IDS,
  buildMessageFormatsFixture,
  messageFormatsFixturePng,
  messageFormatsFixtureSql,
  messageFormatsLiveCommands,
  messageFormatsLiveTurnCommands,
} from "./message-formats-fixture.mjs";

const input = { workspaceRoot: "/workspace/app", imagePath: "/home/assets/diagram.png" };

describe("message formats fixture", () => {
  it("is deterministic", () => {
    expect(buildMessageFormatsFixture(input)).toEqual(buildMessageFormatsFixture(input));
  });

  it("appends each thread as one gapless stream that starts with its creation", () => {
    const { events } = buildMessageFormatsFixture(input);
    const byStream = new Map();
    for (const event of events) {
      const stream = byStream.get(event.streamId) ?? [];
      stream.push(event);
      byStream.set(event.streamId, stream);
    }
    const journalThreads = Object.values(MESSAGE_FORMATS_THREAD_IDS).filter(
      (threadId) => threadId !== MESSAGE_FORMATS_THREAD_IDS.liveTurn,
    );
    expect([...byStream.keys()].toSorted()).toEqual([...journalThreads].toSorted());
    for (const stream of byStream.values()) {
      expect(stream[0].eventType).toBe("thread.created");
      expect(stream.map((event) => event.streamVersion)).toEqual(stream.map((_, index) => index));
    }
    expect(new Set(events.map((event) => event.eventId)).size).toBe(events.length);
  });

  it("carries every settled row type the checklist names", () => {
    const { events, files } = buildMessageFormatsFixture(input);
    const main = events.filter((event) => event.streamId === MESSAGE_FORMATS_THREAD_IDS.main);
    const activityKinds = new Set(
      main.flatMap((event) =>
        event.eventType === "thread.activity-appended" ? [event.payload.activity.kind] : [],
      ),
    );
    for (const kind of [
      "task.progress",
      "tool.started",
      "tool.completed",
      "approval.requested",
      "approval.resolved",
      "user-input.requested",
      "user-input.resolved",
      "turn.completed",
    ]) {
      expect(activityKinds, kind).toContain(kind);
    }
    const itemTypes = new Set(
      main.flatMap((event) =>
        event.eventType === "thread.activity-appended" && event.payload.activity.payload.itemType
          ? [event.payload.activity.payload.itemType]
          : [],
      ),
    );
    expect([...itemTypes].toSorted()).toEqual([
      "command_execution",
      "file_change",
      "mcp_tool_call",
      "web_search",
    ]);
    expect(main.some((event) => event.eventType === "thread.proposed-plan-upserted")).toBe(true);
    expect(
      main.some(
        (event) => event.eventType === "thread.turn-diff-completed" && event.payload.files.length,
      ),
    ).toBe(true);
    const userMessages = main.filter(
      (event) => event.eventType === "thread.message-sent" && event.payload.role === "user",
    );
    expect(userMessages.some((event) => event.payload.mentions?.length === 2)).toBe(true);
    expect(
      userMessages
        .flatMap((event) => event.payload.attachments.map((item) => item.type))
        .toSorted(),
    ).toEqual(["file", "image"]);
    expect(files.map((file) => file.relativePath.split(".").pop()).toSorted()).toEqual([
      "png",
      "txt",
    ]);
  });

  it("ends the failed, interrupted and streaming states the way the server records them", () => {
    const { events } = buildMessageFormatsFixture(input);
    const last = (threadId, eventType) =>
      events.findLast((event) => event.streamId === threadId && event.eventType === eventType);
    expect(
      last(MESSAGE_FORMATS_THREAD_IDS.failed, "thread.session-set").payload.session,
    ).toMatchObject({ status: "error", activeTurnId: null });
    expect(last(MESSAGE_FORMATS_THREAD_IDS.main, "thread.session-set").payload.session.status).toBe(
      "interrupted",
    );
    // Left open mid code fence: no completion follows the streamed text.
    const streamed = last(MESSAGE_FORMATS_THREAD_IDS.streaming, "thread.message-sent").payload;
    expect(streamed.streaming).toBe(true);
    expect(streamed.text.match(/```/g)).toHaveLength(1);
  });

  it("marks the journal consumed so the fixture never starts a provider turn", () => {
    const sql = messageFormatsFixtureSql(buildMessageFormatsFixture(input).events);
    expect(sql).toContain("UPDATE orchestration_consumer_state SET last_acked_sequence");
    expect(sql.startsWith("BEGIN;")).toBe(true);
    expect(sql.endsWith("COMMIT;")).toBe(true);
  });

  it("builds a PNG", () => {
    expect([...messageFormatsFixturePng(4, 4).subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it("adds the pending requests and the running turn through client commands only", () => {
    expect(messageFormatsLiveCommands("2026-10-09T12:00:00.000Z").map((c) => c.type)).toEqual([
      "thread.activity.append",
      "thread.activity.append",
    ]);
    const [create, start] = messageFormatsLiveTurnCommands("2026-10-09T12:00:00.000Z");
    expect(create).toMatchObject({ type: "thread.create", runtimeMode: "approval-required" });
    expect(start).toMatchObject({ type: "thread.turn.start", runtimeMode: "approval-required" });
  });
});
