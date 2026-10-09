import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";
import { MessageId } from "@synara/contracts";

import {
  buildNativeThreadHandoffCreateCommand,
  resolveNativeThreadHandoffTargets,
} from "./threadHandoff.lynx";
import type { ThreadHeaderSummary } from "./queries";

const eligibleThread: ThreadHeaderSummary = {
  id: "thread-1",
  title: "Source thread",
  projectId: "project-1",
  project: "Project",
  branch: null,
  envMode: "local",
  handoff: null,
  messages: [
    {
      id: MessageId.makeUnsafe("message-1"),
      role: "user",
      text: "hello",
      source: "native",
      turnId: null,
      streaming: false,
      createdAt: "2026-08-30T00:00:00.000Z",
      updatedAt: "2026-08-30T00:00:00.000Z",
    },
  ],
  activities: [],
  worktreePath: null,
  associatedWorktreePath: null,
  associatedWorktreeBranch: null,
  associatedWorktreeRef: null,
  createBranchFlowCompleted: false,
  modelSelection: { provider: "codex", model: "gpt-5.6-sol" },
  runtimeMode: "full-access",
  interactionMode: "default",
  sessionStatus: "idle",
  error: null,
  errorRevision: null,
  activeTurnId: null,
  sidechatSourceThreadId: null,
  latestTurnState: "completed",
  workspaceRoot: null,
  notes: "",
  pinnedMessages: [],
  pinnedMessageTextById: {},
  pinnedRevision: "",
  threadMarkers: [],
  markerRevision: "",
  lastKnownPr: null,
  pendingApprovals: [],
  pendingUserInputs: [],
  checkpoints: [],
};

describe("Native thread handoff service", () => {
  it("uses the same eligibility and target-provider policy as the header and sidebar", () => {
    expect(resolveNativeThreadHandoffTargets(eligibleThread)).toEqual([
      "claudeAgent",
      "cursor",
      "antigravity",
      "grok",
      "droid",
      "kilo",
      "opencode",
      "pi",
    ]);
    expect(
      resolveNativeThreadHandoffTargets({
        ...eligibleThread,
        sessionStatus: "running",
      }),
    ).toEqual([]);
  });

  it("owns the complete canonical handoff command and imported activity flow", () => {
    const source = readFileSync(new URL("./threadHandoff.lynx.ts", import.meta.url), "utf8");
    expect(source).toContain("fetchFreshServerConfig()");
    expect(source).toContain("resolveProviderSendAvailability({");
    expect(source).toContain("resolveThreadHandoffModelSelection({");
    expect(source).toContain("buildThreadHandoffImportedMessages(");
    expect(source).toContain("buildThreadHandoffImportedActivities(");
    expect(source).toContain('type: "thread.handoff.create"');
    expect(source).toContain('type: "thread.activity.append"');
  });

  it("inherits the source project id even when thread titles are ambiguous", () => {
    const command = buildNativeThreadHandoffCreateCommand({
      createdAt: "2026-09-11T00:00:00.000Z",
      nextThreadId: "thread-handoff",
      project: {
        id: "project-other",
        defaultModelSelection: {
          provider: "claudeAgent",
          model: "claude-sonnet-5",
        },
      },
      targetProvider: "claudeAgent",
      thread: {
        ...eligibleThread,
        id: "thread-source",
        title: "New chat",
        projectId: "project-source",
      },
    });

    expect(command).toMatchObject({
      type: "thread.handoff.create",
      threadId: "thread-handoff",
      sourceThreadId: "thread-source",
      projectId: "project-source",
    });
  });
});
