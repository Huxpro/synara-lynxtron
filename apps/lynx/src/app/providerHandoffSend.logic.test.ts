import { describe, expect, it } from "@rstest/core";
import type { ModelSelection, OrchestrationThreadActivity } from "@synara/contracts";
import { makeThread } from "@synara-web/storeTestFixtures";
import type { ChatMessage, Thread } from "@synara-web/types";

import {
  isProviderHandoffDisabled,
  needsProviderHandoffForSend,
  resolveProviderHandoffSendRefusal,
  resolveSendCreatedAtAfterProviderHandoff,
} from "./providerHandoffSend.logic";
import { projectThreadTranscriptRows } from "./threadPageProjection.logic";

const CODEX: ModelSelection = { provider: "codex", model: "gpt-5.6-luna" } as ModelSelection;
const CLAUDE: ModelSelection = {
  provider: "claudeAgent",
  model: "claude-opus-5-5",
} as ModelSelection;

const message = (id: string, role: "user" | "assistant", text: string): ChatMessage =>
  ({
    id,
    role,
    text,
    turnId: null,
    streaming: false,
    source: "native",
    createdAt: "2026-10-10T00:00:00.000Z",
  }) as ChatMessage;

function startedThread(overrides: Partial<Thread> = {}): Thread {
  return makeThread({
    modelSelection: CODEX,
    messages: [message("m1", "user", "Remember PLUM"), message("m2", "assistant", "Noted.")],
    ...overrides,
  });
}

function handoffActivity(
  kind: "provider.handoff" | "provider.handoff.failed",
  createdAt: string,
  payload: Record<string, unknown> = {},
): OrchestrationThreadActivity {
  return {
    id: `${kind}:${createdAt}`,
    kind,
    tone: kind === "provider.handoff" ? "info" : "error",
    summary: "Handed off",
    payload: {
      sourceProvider: "codex",
      sourceModel: CODEX.model,
      targetProvider: "claudeAgent",
      targetModel: CLAUDE.model,
      ...payload,
    },
    turnId: null,
    createdAt,
  } as unknown as OrchestrationThreadActivity;
}

describe("in-thread provider handoff on send", () => {
  it("needs a handoff only when a started thread sends with another provider", () => {
    expect(needsProviderHandoffForSend(startedThread(), CLAUDE)).toBe(true);
    // The thread's own provider, whatever the model: an ordinary send.
    expect(
      needsProviderHandoffForSend(startedThread(), { provider: "codex" } as ModelSelection),
    ).toBe(false);
    // A thread that has not run yet is not bound to a provider: the send just uses the pick.
    expect(
      needsProviderHandoffForSend(startedThread({ messages: [], latestTurn: null }), CLAUDE),
    ).toBe(false);
  });

  it("refuses the send up front, with upstream's toast copy, while the thread cannot hand off", () => {
    expect(
      resolveProviderHandoffSendRefusal({
        providerHandoffPendingForSend: true,
        handoffDisabled: true,
        selectedProvider: "claudeAgent",
      }),
    ).toEqual({
      title: "Cannot switch to Claude yet",
      description:
        "Wait for the current turn to finish and answer any pending request, then send again.",
    });
    for (const input of [
      { providerHandoffPendingForSend: false, handoffDisabled: true },
      { providerHandoffPendingForSend: true, handoffDisabled: false },
    ]) {
      expect(
        resolveProviderHandoffSendRefusal({ ...input, selectedProvider: "claudeAgent" }),
      ).toBeNull();
    }
  });

  it("disables the handoff by upstream's rule: busy, nothing to carry, or an imported-only thread", () => {
    expect(isProviderHandoffDisabled(startedThread())).toBe(false);
    expect(isProviderHandoffDisabled(startedThread({ messages: [] }))).toBe(true);
    expect(
      isProviderHandoffDisabled(
        startedThread({
          session: { orchestrationStatus: "running" } as Thread["session"],
        }),
      ),
    ).toBe(true);
    // A thread that is itself a handoff needs a native message of its own first.
    const handoff = {
      sourceThreadId: "t",
      sourceProvider: "codex",
    } as unknown as Thread["handoff"];
    expect(
      isProviderHandoffDisabled(
        startedThread({
          handoff,
          messages: [{ ...message("m1", "user", "Imported"), source: "handoff-import" } as never],
        }),
      ),
    ).toBe(true);
    expect(isProviderHandoffDisabled(startedThread({ handoff }))).toBe(false);
  });

  it("positions the send after the handoff row, also when the server clock is ahead", () => {
    const nowMs = Date.parse("2026-10-10T00:00:10.000Z");
    const messageCreatedAt = "2026-10-10T00:00:10.000Z";
    // Server ahead of this clock: one millisecond past the handoff row.
    expect(
      resolveSendCreatedAtAfterProviderHandoff({
        thread: startedThread({
          activities: [
            handoffActivity("provider.handoff", "2026-10-10T00:00:05.000Z"),
            handoffActivity("provider.handoff", "2026-10-10T00:00:30.000Z"),
          ],
        }),
        messageCreatedAt,
        nowMs,
      }),
    ).toBe("2026-10-10T00:00:30.001Z");
    // Server behind: now.
    expect(
      resolveSendCreatedAtAfterProviderHandoff({
        thread: startedThread({
          activities: [handoffActivity("provider.handoff", "2026-10-10T00:00:05.000Z")],
        }),
        messageCreatedAt,
        nowMs,
      }),
    ).toBe("2026-10-10T00:00:10.000Z");
    // No handoff row yet (or only a failed one): never earlier than the message itself.
    expect(
      resolveSendCreatedAtAfterProviderHandoff({
        thread: startedThread({
          activities: [handoffActivity("provider.handoff.failed", "2026-10-10T00:00:40.000Z")],
        }),
        messageCreatedAt,
        nowMs,
      }),
    ).toBe("2026-10-10T00:00:10.001Z");
  });

  it("projects a handoff activity as its own transcript row carrying upstream's handoff info", () => {
    const rows = projectThreadTranscriptRows(
      startedThread({
        activities: [
          handoffActivity("provider.handoff", "2026-10-10T00:00:05.000Z", {
            contextText: "User: Remember PLUM",
          }),
          handoffActivity("provider.handoff.failed", "2026-10-10T00:00:06.000Z", {
            detail: "claude is not signed in",
          }),
        ],
      }),
    );
    const handoffs = rows.flatMap((row) =>
      row.kind === "work"
        ? row.groupedEntries.flatMap((entry) =>
            entry.providerHandoff ? [entry.providerHandoff] : [],
          )
        : [],
    );
    expect(handoffs).toMatchObject([
      {
        status: "completed",
        sourceProvider: "codex",
        targetProvider: "claudeAgent",
        contextText: "User: Remember PLUM",
      },
      { status: "failed", failureDetail: "claude is not signed in" },
    ]);
    // Never folded into a message row's work group.
    expect(
      rows.some(
        (row) =>
          row.kind === "message" &&
          [...(row.leadingWorkEntries ?? []), ...(row.inlineWorkEntries ?? [])].some(
            (entry) => entry.providerHandoff,
          ),
      ),
    ).toBe(false);
  });
});
