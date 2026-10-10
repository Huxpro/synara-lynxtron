import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { nativeTargetMatches, sendWithReadRetry } from "./comparison-workflow.mjs";
import { WORKFLOWS } from "./comparison-workflows.mjs";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = (path) => readFileSync(join(repositoryRoot, path), "utf8");

const node = {
  attributes: [
    "class",
    "ComposerCommandRowLynx ComposerCommandRowLynx--active",
    "aria-label",
    "math.ts",
    "data-thread-id",
    "thread-1",
  ],
};

describe("comparison workflow targets", () => {
  it("matches Native nodes by label, attribute and class tokens", () => {
    expect(nativeTargetMatches(node, { label: "math.ts" })).toBe(true);
    expect(nativeTargetMatches(node, { label: /^math\.ts$/ })).toBe(true);
    expect(nativeTargetMatches(node, { label: /^math\.test\.ts$/ })).toBe(false);
    expect(nativeTargetMatches(node, { attribute: ["data-thread-id", "thread-1"] })).toBe(true);
    expect(nativeTargetMatches(node, { attribute: ["data-thread-id", "thread-2"] })).toBe(false);
    expect(nativeTargetMatches(node, { className: ".ComposerCommandRowLynx--active" })).toBe(true);
    expect(nativeTargetMatches({ attributes: [] }, { label: "math.ts" })).toBe(false);
    const text = {
      nodeName: "TEXT",
      attributes: [],
      children: [{ attributes: ["text", "Explorer"] }],
    };
    expect(nativeTargetMatches(text, { text: "Explorer" })).toBe(true);
    expect(nativeTargetMatches(text, { text: "Diff" })).toBe(false);
  });
});

describe("Native DevTool requests", () => {
  const lostReply = () => new Error("No response found for clientId: localhost:8901");
  const failing = (failures, error = lostReply) => {
    let calls = 0;
    const sendOnce = async () => {
      calls += 1;
      if (calls <= failures) throw error();
      return { calls };
    };
    return { sendOnce, calls: () => calls };
  };

  it("asks again for a tree or box whose reply was lost", async () => {
    const request = failing(2);
    expect(await sendWithReadRetry(request.sendOnce, "DOM.getBoxModel", { delayMs: 0 })).toEqual({
      calls: 3,
    });
    const exhausted = failing(3);
    await expect(
      sendWithReadRetry(exhausted.sendOnce, "DOM.getDocument", { delayMs: 0 }),
    ).rejects.toThrow("No response found");
    expect(exhausted.calls()).toBe(3);
  });

  it("never resends input or evaluation, and never hides another error", async () => {
    for (const method of [
      "Input.emulateTouchFromMouseEvent",
      "Input.insertText",
      "Runtime.evaluate",
    ]) {
      const request = failing(1);
      await expect(sendWithReadRetry(request.sendOnce, method, { delayMs: 0 })).rejects.toThrow(
        "No response found",
      );
      expect(request.calls()).toBe(1);
    }
    const other = failing(1, () => new Error("Session closed"));
    await expect(
      sendWithReadRetry(other.sendOnce, "DOM.getDocument", { delayMs: 0 }),
    ).rejects.toThrow("Session closed");
    expect(other.calls()).toBe(1);
  });
});

describe("workflow table", () => {
  it("lists every workflow the harness documents", () => {
    expect(Object.keys(WORKFLOWS)).toEqual(["J1", "J2", "J3", "J4", "J5", "J6", "J7"]);
    for (const workflow of Object.values(WORKFLOWS)) expect(workflow).toBeTypeOf("function");
  });
});

// J2's selection step finds the selection actions and the composer's selection chip by
// upstream's attributes on Electron and by the Lynx renderer's on Native, and relies on
// Native's selectable text sitting in a scroller of its own. A rename must fail here.
describe("J2 selection targets", () => {
  const workflows = source("scripts/comparison-workflows.mjs");

  it("uses attributes both renderers' selection surfaces still carry", () => {
    const action = source("apps/web/src/components/chat/TranscriptSelectionAction.tsx");
    expect(action).toContain('data-transcript-selection-action="true"');
    expect(action).toContain('label="Add to Chat"');
    expect(action).toContain("aria-label={label}");
    expect(source("apps/web/src/components/chat/AssistantSelectionsSummaryChip.tsx")).toContain(
      'removeLabel="Remove selections"',
    );
    expect(workflows).toContain('[data-transcript-selection-action="true"]');
    const transcript = source("apps/lynx/src/app/Transcript.tsx");
    expect(transcript).toContain("className={`TranscriptSelectionToolbar ");
    expect(transcript).toContain('label="Add to Chat"');
    expect(
      source("apps/lynx/src/adapters/ComposerReferenceAttachmentsCompositionElements.lynx.tsx"),
    ).toContain('label="Remove selections"');
    expect(workflows).toContain('".TranscriptSelectionToolbar"');
    expect(workflows).toContain('{ label: "Add to Chat" }');
    expect(workflows).toContain('{ label: "Remove selections" }');
    expect(source("apps/lynx/src/components/markdown/ChatMarkdown.lynx.tsx")).toContain(
      "text-selection={props.context.selectable}",
    );
    expect(workflows).toContain('nodeAttribute(node, "text-selection") === "true"');
  });

  it("scrolls a Native transcript from the gutter, where a drag is not a text selection", () => {
    expect(workflows).toContain('driver.find({ className: ".TranscriptList" })');
    expect(source("apps/lynx/src/app/Transcript.tsx")).toContain('className="TranscriptList"');
  });
});

// J7 addresses the handoff surfaces by upstream's own attributes on Electron and by the
// Lynx renderer's classes on Native. A rename on either side must fail here, not as a
// timeout in a live run.
describe("J7 handoff targets", () => {
  const workflows = source("scripts/comparison-workflows.mjs");

  it("uses attributes upstream's handoff surfaces still carry", () => {
    const header = source("apps/web/src/components/chat/ChatHeader.tsx");
    expect(header).toContain('data-handoff-destination="this-thread"');
    expect(header).toContain('data-handoff-destination="new-thread"');
    expect(workflows).toContain('[data-handoff-destination="${destination}"]');
    expect(source("apps/web/src/components/chat/ProviderHandoffDivider.tsx")).toContain(
      'data-provider-handoff-divider="true"',
    );
    const tabs = source("apps/web/src/components/chat/ComposerModelPickerTabs.tsx");
    expect(tabs).toContain('role={props.tab === false ? undefined : "tab"}');
    expect(tabs).toContain("aria-label={props.label}");
    expect(source("apps/web/src/components/chat/ComposerModelPickerRow.tsx")).toContain(
      'aria-current={row.selected ? "true" : undefined}',
    );
  });

  it("uses classes and labels the Lynx handoff surfaces still carry", () => {
    const header = source("apps/lynx/src/app/ThreadHeaderActions.lynx.tsx");
    for (const destination of ["this-thread", "new-thread"]) {
      expect(header).toContain(`ThreadHeaderHandoffGroup--${destination}`);
    }
    expect(header).toContain('ariaLabel="Hand off thread"');
    const divider = source("apps/lynx/src/app/ProviderHandoffDivider.lynx.tsx");
    expect(divider).toContain('<view className="ProviderHandoffDivider">');
    expect(divider).toContain('"Context handoff"');
    expect(source("apps/lynx/src/components/composer/ComposerModelPicker.lynx.tsx")).toContain(
      "ComposerModelPickerRowLynx--selected",
    );
  });

  it("checks the handoff against the backend the way upstream defines it", () => {
    // Same thread, the server's outcome row, the carried context, and the new-thread import.
    for (const fact of [
      // The picked models by canonical slug, not only their providers.
      'backend.request("provider.listModels", { provider: provider.provider })',
      '["The thread\'s model after the handoff", settled.modelSelection.model]',
      '["The handoff row\'s target selection", payload.targetModelSelection?.model]',
      '["The handoff row\'s source selection", payload.sourceModelSelection?.model]',
      '["The source thread\'s model", settled.modelSelection.model]',
      // The catalog's alias entries resolve to the slug a pick stores.
      "matches[0].resolvedModel ?? matches[0].slug",
      // A draft typed while the target provider starts is neither sent nor cleared, and
      // follows the conversation into a new-thread handoff.
      "await driver.type(lateDraft);",
      "if (await threadWithMessage(backend, lateDraft))",
      "if (!keptDraft.includes(lateDraft))",
      "(await composerText(driver)).includes(lateDraft)",
      'activity.kind === "provider.handoff"',
      "payload.contextText",
      "settled.handoff?.sourceThreadId !== thread.threadId",
      "sent.id !== thread.threadId",
      "entry.handoff?.sourceThreadId === thread.threadId",
    ]) {
      expect(workflows).toContain(fact);
    }
  });
});
