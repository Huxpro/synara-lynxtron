import { readFileSync } from "node:fs";

import { describe, expect, it } from "@rstest/core";
import type { ThreadId } from "@synara/contracts";
import { hasActiveComposerSend, runComposerSendOnce } from "@synara-web/lib/composerSendOwnership";

const composer = readFileSync(new URL("./Composer.lynx.tsx", import.meta.url), "utf8");
const sendBody = composer.slice(composer.indexOf("async function activatePrimaryAction("));

describe("Lynx composer send attempt", () => {
  it("refuses a second attempt on the thread before it takes the draft out", () => {
    // Upstream's ownership joins a second send to the running one without running it. A
    // composer remounted during a handoff wait must therefore not take its draft out first.
    const guard = sendBody.indexOf("hasActiveComposerSend(threadId as never)");
    const take = sendBody.indexOf("draftStore.takeDraftContent(brandedThreadId)");
    expect(guard).toBeGreaterThan(-1);
    expect(take).toBeGreaterThan(guard);
    // The remounted composer also shows the running attempt and disables Send.
    expect(composer).toContain("const isSending = sendStartedHere || sendActiveForThread;");
    expect(composer).toMatch(/useSyncExternalStore\(\s*subscribeComposerSends,/);
  });

  it("never clears the composer after the send: what is there by then is newer", () => {
    expect(sendBody).not.toContain("clearDraft(");
    expect(sendBody).toContain("restore: (outgoing) => {");
    expect(sendBody).toContain("draftStore.restoreDraftContent(brandedThreadId, outgoing)");
  });

  it("stages attachments, then hands off, then dispatches, with the captured selection", () => {
    const stage = sendBody.indexOf("stage: () => stageNativeComposerFiles(");
    const handOff = sendBody.indexOf("providerHandoff.handOff()");
    const createdAt = sendBody.indexOf("createdAt: providerHandoff.resolveCreatedAt()");
    expect(stage).toBeGreaterThan(-1);
    expect(handOff).toBeGreaterThan(stage);
    expect(createdAt).toBeGreaterThan(handOff);
    expect(sendBody).toContain("await dispatchComposerTurnAfterStaging({");
    expect(sendBody).toContain("modelSelection: activeModelSelection as never,");
  });

  it("upstream's ownership runs one attempt per thread and frees it when it settles", async () => {
    const threadId = "thread-ownership" as ThreadId;
    let finish!: (value: boolean) => void;
    let runs = 0;
    const first = runComposerSendOnce(threadId, () => {
      runs += 1;
      return new Promise<boolean>((resolve) => {
        finish = resolve;
      });
    });
    const second = runComposerSendOnce(threadId, async () => {
      runs += 1;
      return true;
    });
    await Promise.resolve();
    expect(hasActiveComposerSend(threadId)).toBe(true);
    finish(true);
    await Promise.all([first, second]);
    expect(runs).toBe(1);
    expect(hasActiveComposerSend(threadId)).toBe(false);
  });
});
