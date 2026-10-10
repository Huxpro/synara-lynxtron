import { describe, expect, it } from "@rstest/core";
import { MessageId, ThreadId, TurnId } from "@synara/contracts";
import { applyOrchestrationEvents } from "@synara-web/storeEventReducer";
import { makeDomainEvent, makeState, makeThread, threadsOf } from "@synara-web/storeTestFixtures";
import type { Thread } from "@synara-web/types";

import { isRpcTransportError } from "../data/rpcTransport.logic";
import {
  createThreadMarkdownCache,
  projectThreadHeaderSummary,
  projectThreadTranscriptRows,
  resolveThreadPageRead,
  resolveTranscriptTurnActivity,
  type ThreadPageData,
} from "./threadPageProjection.logic";

const chatMessage = (id: string, role: "user" | "assistant", text: string) => ({
  id: MessageId.makeUnsafe(id),
  role,
  text,
  turnId: null,
  streaming: false,
  createdAt: `2026-02-27T00:0${id.length}:00.000Z`,
});

function threadWith(overrides: Partial<Thread>): Thread {
  return makeThread(overrides);
}

describe("projectThreadTranscriptRows", () => {
  it("reuses the history-wide derivations while only message text changes", () => {
    const cache = createThreadMarkdownCache();
    const base = threadWith({
      messages: [chatMessage("a", "user", "Question"), chatMessage("bb", "assistant", "Hi")],
    });
    projectThreadTranscriptRows(base, cache);
    const workLog = cache.slices?.workLog?.value;
    const turnDiffs = cache.slices?.turnDiffs?.value;
    expect(workLog).toBeDefined();
    expect(turnDiffs).toBeDefined();

    // A streamed delta: new messages array, same activities and summaries.
    projectThreadTranscriptRows(
      { ...base, messages: [base.messages[0]!, { ...base.messages[1]!, text: "Hi there" }] },
      cache,
    );
    expect(cache.slices?.workLog?.value).toBe(workLog);
    expect(cache.slices?.turnDiffs?.value).toBe(turnDiffs);

    // New activities rebuild the work log only; a new message rebuilds the maps.
    projectThreadTranscriptRows({ ...base, activities: [...base.activities] }, cache);
    expect(cache.slices?.workLog?.value).not.toBe(workLog);
    expect(cache.slices?.turnDiffs?.value).toBe(turnDiffs);
    projectThreadTranscriptRows(
      { ...base, messages: [...base.messages, chatMessage("ccc", "user", "More")] },
      cache,
    );
    expect(cache.slices?.turnDiffs?.value).not.toBe(turnDiffs);
  });

  it("parses a message once and reuses its tree while the text is unchanged", () => {
    const cache = createThreadMarkdownCache();
    const first = threadWith({
      messages: [chatMessage("a", "user", "Question"), chatMessage("bb", "assistant", "**Hi**")],
    });
    const rows = projectThreadTranscriptRows(first, cache);
    const trees = rows.flatMap((row) => (row.kind === "message" ? [row.markdownTree] : []));
    expect(trees).toHaveLength(2);
    expect(trees.every(Boolean)).toBe(true);
    expect([...cache.trees.keys()].toSorted()).toEqual(["message:a", "message:bb"]);

    // One message streams on; the other keeps its tree object.
    const second = threadWith({
      messages: [
        chatMessage("a", "user", "Question"),
        chatMessage("bb", "assistant", "**Hi** there"),
      ],
    });
    const nextTrees = projectThreadTranscriptRows(second, cache).flatMap((row) =>
      row.kind === "message" ? [row.markdownTree] : [],
    );
    expect(nextTrees[0]).toBe(trees[0]);
    expect(nextTrees[1]).not.toBe(trees[1]);

    // Trees of rows that are gone are dropped with them.
    projectThreadTranscriptRows(
      threadWith({ messages: [chatMessage("a", "user", "Question")] }),
      cache,
    );
    expect([...cache.trees.keys()]).toEqual(["message:a"]);
  });

  it("hides fork-imported history in a Side thread, like the Web transcript", () => {
    const messages = [
      { ...chatMessage("a", "user", "Imported"), source: "fork-import" as const },
      chatMessage("bb", "user", "Asked in the Side"),
    ];
    const texts = (thread: Thread) =>
      projectThreadTranscriptRows(thread).flatMap((row) =>
        row.kind === "message" ? [row.message.text] : [],
      );
    expect(texts(threadWith({ messages }))).toEqual(["Imported", "Asked in the Side"]);
    expect(
      texts(threadWith({ messages, sidechatSourceThreadId: "thread-source" as never })),
    ).toEqual(["Asked in the Side"]);
  });
});

describe("the running turn's rows", () => {
  const TURN = TurnId.makeUnsafe("turn-1");
  const STARTED_AT = "2026-02-27T00:01:00.000Z";
  const COMPLETED_AT = "2026-02-27T00:01:30.000Z";
  type Session = NonNullable<Thread["session"]>;
  type LatestTurn = NonNullable<Thread["latestTurn"]>;

  const session = (
    status: Session["status"],
    orchestrationStatus: Session["orchestrationStatus"],
    activeTurnId?: typeof TURN,
  ): Session => ({
    provider: "codex",
    status,
    orchestrationStatus,
    ...(activeTurnId ? { activeTurnId } : {}),
    createdAt: "2026-02-27T00:00:00.000Z",
    updatedAt: COMPLETED_AT,
  });
  const latestTurn = (state: LatestTurn["state"], completedAt: string | null): LatestTurn => ({
    turnId: TURN,
    state,
    requestedAt: STARTED_AT,
    startedAt: STARTED_AT,
    completedAt,
    assistantMessageId: MessageId.makeUnsafe("reply"),
  });
  const turnMessages = (streaming: boolean): Thread["messages"] => [
    chatMessage("a", "user", "Question"),
    { ...chatMessage("reply", "assistant", "Answer"), turnId: TURN, streaming },
  ];
  const workingRowKinds = (thread: Thread) =>
    projectThreadTranscriptRows(thread)
      .map((row) => row.kind)
      .filter((kind) => kind === "working" || kind === "working-header");

  it("shows the header and the Thinking row while the session runs the turn", () => {
    const thread = threadWith({
      messages: turnMessages(true),
      session: session("running", "running", TURN),
      latestTurn: latestTurn("running", null),
    });
    expect(resolveTranscriptTurnActivity(thread)).toEqual({
      isWorking: true,
      activeTurnInProgress: true,
      activeTurnId: TURN,
      activeTurnStartedAt: STARTED_AT,
    });
    expect(workingRowKinds(thread)).toEqual(["working-header", "working"]);
    const header = projectThreadTranscriptRows(thread).find((row) => row.kind === "working-header");
    expect(header?.createdAt).toBe(STARTED_AT);
  });

  it("shows Thinking without a timer while the provider session connects", () => {
    const thread = threadWith({
      messages: [chatMessage("a", "user", "Question")],
      session: session("connecting", "starting"),
    });
    expect(resolveTranscriptTurnActivity(thread)).toMatchObject({
      isWorking: true,
      activeTurnStartedAt: null,
    });
    expect(workingRowKinds(thread)).toEqual(["working"]);
  });

  it.each([
    ["completed", session("ready", "ready"), latestTurn("completed", COMPLETED_AT)],
    ["interrupted", session("ready", "interrupted"), latestTurn("interrupted", COMPLETED_AT)],
    ["failed", session("error", "error"), latestTurn("error", COMPLETED_AT)],
    [
      "opened after completion, session stopped",
      session("closed", "stopped"),
      latestTurn("completed", COMPLETED_AT),
    ],
    ["opened after completion, no session", null, latestTurn("completed", COMPLETED_AT)],
  ] as const)("has no working rows once the turn is %s", (_name, threadSession, turn) => {
    const thread = threadWith({
      messages: turnMessages(false),
      session: threadSession,
      latestTurn: turn,
    });
    expect(resolveTranscriptTurnActivity(thread)).toEqual({
      isWorking: false,
      activeTurnInProgress: false,
      activeTurnId: null,
      activeTurnStartedAt: null,
    });
    expect(workingRowKinds(thread)).toEqual([]);
  });

  it("has no working rows when the turn reads running but the session has settled", () => {
    // What upstream's reducer leaves when a streaming assistant message of the
    // turn is applied after the session event that settled it.
    const settled = makeThread({
      id: ThreadId.makeUnsafe("thread-1"),
      messages: turnMessages(true),
      session: session("ready", "ready"),
      latestTurn: latestTurn("completed", COMPLETED_AT),
    });
    const [thread] = threadsOf(
      applyOrchestrationEvents(makeState(settled), [
        makeDomainEvent("thread.message-sent", {
          threadId: settled.id,
          messageId: MessageId.makeUnsafe("reply"),
          role: "assistant",
          text: " late delta",
          turnId: TURN,
          streaming: true,
          createdAt: STARTED_AT,
          updatedAt: "2026-02-27T00:01:31.000Z",
          attachments: [],
          source: "native",
        }),
      ]),
    );
    expect(thread?.latestTurn).toMatchObject({ state: "running", completedAt: COMPLETED_AT });
    expect(thread?.session?.status).toBe("ready");
    expect(resolveTranscriptTurnActivity(thread!)).toMatchObject({
      isWorking: false,
      activeTurnInProgress: false,
      activeTurnId: null,
    });
    expect(workingRowKinds(thread!)).toEqual([]);
  });

  it("keeps the newest turn inline, without working rows, while only its text still streams", () => {
    // Claude clears the session's turn before the last text has arrived.
    const thread = threadWith({
      messages: turnMessages(true),
      session: session("ready", "ready"),
      latestTurn: latestTurn("running", null),
    });
    expect(resolveTranscriptTurnActivity(thread)).toEqual({
      isWorking: false,
      activeTurnInProgress: true,
      activeTurnId: TURN,
      activeTurnStartedAt: STARTED_AT,
    });
    expect(workingRowKinds(thread)).toEqual([]);
  });
});

describe("projectThreadHeaderSummary", () => {
  it("reads session, provider and workspace from the store's normalized thread", () => {
    const thread = threadWith({
      title: "Fix the build",
      messages: [chatMessage("a", "user", "Question"), chatMessage("bb", "assistant", "  ")],
      session: {
        provider: "claudeAgent",
        status: "running",
        orchestrationStatus: "running",
        activeTurnId: TurnId.makeUnsafe("turn-1"),
        createdAt: "2026-02-27T00:00:00.000Z",
        updatedAt: "2026-02-27T00:03:00.000Z",
        lastError: "Rate limited",
      },
      notes: "remember",
    });
    const summary = projectThreadHeaderSummary(thread, { name: "My project", cwd: "/work/repo" });
    expect(summary).toMatchObject({
      id: thread.id,
      title: "Fix the build",
      project: "My project",
      workspaceRoot: "/work/repo",
      provider: "claudeAgent",
      // A thread with a session keeps its provider.
      boundProvider: "claudeAgent",
      // The server's status, not the legacy session phase.
      sessionStatus: "running",
      error: "Rate limited",
      errorRevision: "2026-02-27T00:03:00.000Z",
      activeTurnId: "turn-1",
      notes: "remember",
      pinnedMessages: [],
      pinnedRevision: "[]",
      // Blank messages cannot be pinned.
      pinnedMessageTextById: { a: "Question" },
    });
    // The store's own messages, as upstream's hand-off and fork builders expect them.
    expect(summary.messages).toBe(thread.messages);
    expect(summary.activities).toBe(thread.activities);
  });

  it("falls back like the sidebar when the thread has no session or project yet", () => {
    const summary = projectThreadHeaderSummary(threadWith({}), undefined);
    expect(summary.project).toBe("Synara");
    expect(summary.workspaceRoot).toBeNull();
    expect(summary.provider).toBe(summary.modelSelection.provider);
    expect(summary.boundProvider).toBeNull();
    expect(summary.sessionStatus).toBeNull();
    expect(summary.envMode).toBe("local");
  });

  it("gives the diff surfaces the checkpoints the store keeps as turn diff summaries", () => {
    const summary = projectThreadHeaderSummary(
      threadWith({
        turnDiffSummaries: [
          {
            turnId: TurnId.makeUnsafe("turn-1"),
            completedAt: "2026-02-27T00:05:00.000Z",
            status: "ready",
            checkpointTurnCount: 1,
            checkpointRef: "refs/checkpoint/1" as never,
            assistantMessageId: MessageId.makeUnsafe("bb"),
            files: [{ path: "a.ts", kind: "modified", additions: 2, deletions: 1 }],
          },
          // Provisional: no checkpoint to diff against yet.
          {
            turnId: TurnId.makeUnsafe("turn-2"),
            completedAt: "2026-02-27T00:06:00.000Z",
            files: [],
          },
        ],
      }),
      undefined,
    );
    expect(summary.checkpoints).toEqual([
      {
        turnId: "turn-1",
        checkpointTurnCount: 1,
        checkpointRef: "refs/checkpoint/1",
        status: "ready",
        files: [{ path: "a.ts", kind: "modified", additions: 2, deletions: 1 }],
        assistantMessageId: "bb",
        completedAt: "2026-02-27T00:05:00.000Z",
      },
    ]);
  });
});

describe("resolveThreadPageRead", () => {
  const projected: ThreadPageData = {
    data: [{ kind: "message" } as never],
    summary: undefined,
  };
  const base = {
    threadsHydrated: true,
    thread: threadWith({ messages: [chatMessage("a", "user", "Question")] }),
    detailSyncState: "synced" as const,
    transport: "connected" as const,
    project: () => projected,
  };

  it("waits for the shell, and says offline once the transport is closed", () => {
    const waiting = { ...base, threadsHydrated: false, thread: undefined, detailSyncState: null };
    expect(resolveThreadPageRead({ ...waiting, transport: "idle" })).toEqual({
      data: undefined,
      error: null,
      isPending: true,
    });
    expect(resolveThreadPageRead({ ...waiting, transport: "reconnecting" }).isPending).toBe(true);
    const offline = resolveThreadPageRead({ ...waiting, transport: "offline" });
    expect(offline.isPending).toBe(false);
    expect(isRpcTransportError(offline.error)).toBe(true);
  });

  it("does not project a thread whose detail has not been applied", () => {
    const shellOnly = threadWith({});
    let projections = 0;
    const read = resolveThreadPageRead({
      ...base,
      thread: shellOnly,
      detailSyncState: null,
      project: () => {
        projections += 1;
        return projected;
      },
    });
    expect(read).toEqual({ data: undefined, error: null, isPending: true });
    expect(projections).toBe(0);
  });

  it("reports a failed detail sync as an error, not as loading or empty", () => {
    const read = resolveThreadPageRead({
      ...base,
      thread: threadWith({}),
      detailSyncState: "failed",
    });
    expect(read.isPending).toBe(false);
    expect(read.data).toBeUndefined();
    expect(read.error).toBeInstanceOf(Error);
    expect(isRpcTransportError(read.error)).toBe(false);
  });

  it("is ready with a synced empty thread, with cached rows, and while offline", () => {
    const empty: ThreadPageData = { data: [], summary: undefined };
    expect(
      resolveThreadPageRead({ ...base, thread: threadWith({}), project: () => empty }),
    ).toEqual({ data: empty, error: null, isPending: false });
    // Detail kept from an earlier visit, stream not resumed yet.
    expect(resolveThreadPageRead({ ...base, detailSyncState: null }).data).toBe(projected);
    // A dropped connection does not take loaded content away.
    expect(resolveThreadPageRead({ ...base, transport: "offline" })).toEqual({
      data: projected,
      error: null,
      isPending: false,
    });
  });

  it("shows the empty page for a thread the hydrated shell does not have", () => {
    expect(resolveThreadPageRead({ ...base, thread: undefined, detailSyncState: null })).toEqual({
      data: { data: [], summary: undefined },
      error: null,
      isPending: false,
    });
  });
});
