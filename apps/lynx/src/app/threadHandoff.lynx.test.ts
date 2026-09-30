import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";
import { DEFAULT_PROVIDER_ORDER } from "@synara-web/providerOrdering";

import {
  buildNativeThreadHandoffCreateCommand,
  resolveNativeThreadHandoffTargets,
} from "./threadHandoff.lynx";

const eligibleThread = {
  id: "thread-1",
  title: "Source thread",
  projectId: "project-1",
  modelSelection: { provider: "codex", model: "gpt-5.6-sol" },
  sessionStatus: "idle",
  latestTurnState: "completed",
  pendingApprovals: [],
  pendingUserInputs: [],
  handoff: null,
  messages: [
    {
      id: "message-1",
      role: "user",
      text: "hello",
      source: "native",
      streaming: false,
      createdAt: "2026-08-30T00:00:00.000Z",
    },
  ],
  activities: [],
} as never;

describe("Native thread handoff service", () => {
  it("uses the same eligibility and target-provider policy as the header and sidebar", () => {
    const disabledProviders = new Set(["grok"]);
    const providers = {
      providerSettings: Object.fromEntries(
        DEFAULT_PROVIDER_ORDER.map((provider) => [
          provider,
          { enabled: !disabledProviders.has(provider) },
        ]),
      ) as never,
      providerStatuses: [
        { provider: "codex", available: true, authStatus: "authenticated" },
        { provider: "claudeAgent", available: true, authStatus: "authenticated" },
        { provider: "cursor", available: false, authStatus: "authenticated" },
        { provider: "grok", available: true, authStatus: "authenticated" },
        { provider: "opencode", available: true, authStatus: "unknown" },
      ] as never,
    };
    expect(resolveNativeThreadHandoffTargets(eligibleThread, providers)).toEqual([
      "claudeAgent",
      "opencode",
    ]);
    expect(
      resolveNativeThreadHandoffTargets(
        {
          ...eligibleThread,
          sessionStatus: "running",
        },
        providers,
      ),
    ).toEqual([]);
  });

  it("owns the complete canonical handoff command and imported activity flow", () => {
    const source = readFileSync(new URL("./threadHandoff.lynx.ts", import.meta.url), "utf8");
    expect(source).toContain("fetchFreshServerConfig()");
    expect(source).toContain("resolveProviderSendAvailability({");
    expect(source).toContain("resolveThreadHandoffModelSelection({");
    expect(source).toContain("buildThreadHandoffImportedMessages(");
    expect(source).toContain("buildThreadHandoffImportedActivities(");
    expect(source).toContain("type: 'thread.handoff.create'");
    expect(source).toContain("type: 'thread.activity.append'");
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
