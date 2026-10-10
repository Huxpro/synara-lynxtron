import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";
import { MessageId } from "@synara/contracts";
import { DEFAULT_PROVIDER_ORDER } from "@synara-web/providerOrdering";

import {
  buildNativeThreadHandoffMenuItems,
  resolveNativeContinueHandoffTargets,
  resolveNativeThreadHandoffMenuAction,
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
  modelSelection: { provider: "codex", model: "gpt-5.6-sol" },
  runtimeMode: "full-access",
  interactionMode: "default",
  sessionStatus: "idle",
  error: null,
  errorRevision: null,
  activeTurnId: null,
  sidechatSourceThreadId: null,
  parentThreadId: null,
  workingDirectory: null,
  latestTurnState: "completed",
  pendingApprovals: [],
  pendingUserInputs: [],
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
  boundProvider: null,
  workspaceRoot: null,
  notes: "",
  pinnedMessages: [],
  pinnedMessageTextById: {},
  pinnedRevision: "",
  lastKnownPr: null,
  checkpoints: [],
};

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
        { provider: "codex", instanceId: "codex", available: true, authStatus: "authenticated" },
        {
          provider: "claudeAgent",
          instanceId: "claudeAgent",
          available: true,
          authStatus: "authenticated",
        },
        {
          provider: "cursor",
          instanceId: "cursor",
          available: false,
          authStatus: "authenticated",
        },
        { provider: "grok", instanceId: "grok", available: true, authStatus: "authenticated" },
        { provider: "opencode", instanceId: "opencode", available: true, authStatus: "unknown" },
      ] as never,
    };
    const targets = resolveNativeThreadHandoffTargets(eligibleThread, providers);
    // Upstream's target shape: the header and the thread menu label each row with it.
    expect(targets).toEqual([
      { provider: "claudeAgent", instanceId: "claudeAgent", label: "Claude" },
      { provider: "opencode", instanceId: "opencode", label: "OpenCode" },
    ]);
    // Every other provider can also take over the same thread.
    expect(resolveNativeContinueHandoffTargets(eligibleThread, targets)).toEqual(targets);
    expect(resolveNativeContinueHandoffTargets(undefined, targets)).toEqual([]);
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

  it("leaves the handoff itself to upstream's generated hook", () => {
    const source = readFileSync(new URL("./threadHandoff.lynx.ts", import.meta.url), "utf8");
    // No second implementation of either handoff command on Lynx.
    expect(source).not.toContain("thread.handoff.create");
    expect(source).not.toContain("thread.meta.update");
    expect(source).not.toContain("dispatchCommand");
    const generated = readFileSync(
      new URL("../generated/threadHandoff.generated.ts", import.meta.url),
      "utf8",
    );
    expect(generated).toContain('type: "thread.handoff.create"');
    expect(generated).toContain("providerHandoff: true");
    expect(generated).toContain('type: "thread.activity.append"');
    for (const consumer of [
      "./ThreadHeaderActions.lynx.tsx",
      "../components/sidebar/Sidebar.lynx.tsx",
      "../components/composer/useComposerProviderHandoff.lynx.ts",
    ]) {
      expect(readFileSync(new URL(consumer, import.meta.url), "utf8")).toContain(
        'from "../generated/threadHandoff.generated"'.replace(
          "../generated",
          consumer.startsWith("./") ? "../generated" : "../../generated",
        ),
      );
    }
  });

  it("builds the thread menu's Handoff submenu as upstream's sidebar does", () => {
    const claude = { provider: "claudeAgent", instanceId: "claudeAgent", label: "Claude" } as never;
    const cursor = { provider: "cursor", instanceId: "cursor", label: "Cursor" } as never;
    expect(buildNativeThreadHandoffMenuItems([claude, cursor], [claude, cursor])).toEqual([
      {
        id: "handoff",
        label: "Handoff",
        separatorBefore: true,
        submenu: [
          { id: "handoff-here:claudeAgent", label: "Claude in this thread" },
          { id: "handoff-here:cursor", label: "Cursor in this thread" },
          { id: "handoff:claudeAgent", label: "Claude in a new thread", separatorBefore: true },
          { id: "handoff:cursor", label: "Cursor in a new thread" },
        ],
      },
    ]);
    // One choice collapses to a plain row with its full label.
    expect(buildNativeThreadHandoffMenuItems([claude], [])).toEqual([
      { id: "handoff:claudeAgent", label: "Handoff to Claude", separatorBefore: true },
    ]);
    expect(buildNativeThreadHandoffMenuItems([], [])).toEqual([]);

    expect(
      resolveNativeThreadHandoffMenuAction("handoff-here:cursor", [claude, cursor], [cursor]),
    ).toEqual({ destination: "this-thread", target: cursor });
    expect(
      resolveNativeThreadHandoffMenuAction("handoff:claudeAgent", [claude, cursor], [cursor]),
    ).toEqual({ destination: "new-thread", target: claude });
    // A target the thread cannot continue on is not reachable by a stale id.
    expect(
      resolveNativeThreadHandoffMenuAction("handoff-here:claudeAgent", [claude, cursor], [cursor]),
    ).toBeNull();
    expect(resolveNativeThreadHandoffMenuAction("rename", [claude], [claude])).toBeNull();
  });
});
