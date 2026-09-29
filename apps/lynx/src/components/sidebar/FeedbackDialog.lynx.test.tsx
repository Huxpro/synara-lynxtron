import { beforeEach, describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";
import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";

import { FeedbackDialogLynx } from "./FeedbackDialog.lynx";

const context = {
  provider: "codex",
  model: "gpt-5.6-sol",
  projectKind: "project",
  environmentMode: "local",
  runtimeMode: "full-access",
  interactionMode: "default",
  sessionStatus: "ready",
  latestTurnState: "completed",
  messageCount: 2,
  activityCount: 1,
  hasPendingApproval: false,
  hasPendingUserInput: false,
  hasThreadError: false,
};

beforeEach(() => {
  Object.assign(lynx, {
    requestAnimationFrame(callback: () => void) {
      callback();
      return 0;
    },
    createSelectorQuery() {
      return {
        select() {
          return this;
        },
        invoke() {
          return this;
        },
        exec() {},
      };
    },
  });
});

describe("Native Feedback dialog parity", () => {
  it("reuses the shared feedback policy and exposes a real Native form", () => {
    const source = readFileSync(new URL("./FeedbackDialog.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./feedback-dialog.css", import.meta.url), "utf8");

    expect(source).toContain("FEEDBACK_CATEGORIES.map");
    expect(source).toContain("buildFeedbackSubmission({");
    expect(source).toContain('await bridgeCall("feedbackSubmit", {');
    expect(source).toContain("await bridgeCall<{");
    expect(source).toContain('>("windowGetViewport");');
    expect(source).toContain('placeholder: "Share details (required)"');
    expect(source).toContain("maxlength: 5000");
    expect(source).toContain("Diagnostics include app version");
    expect(source).toContain("fetchSynaraThreadDetailSnapshot(props.activeThreadId!)");
    expect(source).toContain("messageCount: thread.messages.length");
    expect(source).toContain("activityCount: thread.activities.length");
    expect(source).toContain("props.onOpenChange(false);");
    const hostSource = readFileSync(
      new URL("../../main/desktop/hostServices.ts", import.meta.url),
      "utf8",
    );
    const desktopSource = readFileSync(
      new URL("../../main/desktop/main.ts", import.meta.url),
      "utf8",
    );
    expect(hostSource).toContain('case "feedbackSubmit":');
    expect(hostSource).toContain("await submitFeedbackPayload(submission);");
    expect(desktopSource).toContain('name === "feedbackSubmit" ||');
    expect(styles).toMatch(
      /\.FeedbackDialogLynx\s*\{[^}]*width:\s*576px;[^}]*border-radius:\s*18px;/s,
    );
    expect(styles).toMatch(
      /\.FeedbackCategoryChip\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-left-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.FeedbackDetailsInput\s*\{[^}]*min-height:\s*128px;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-left-color:\s*var\(--border\);/s,
    );
  });

  it("is connected to the shared palette feedback action", () => {
    const paletteSource = readFileSync(
      new URL("./SidebarSearchPalette.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(paletteSource).toContain("onOpenFeedback={() => setFeedbackOpen(true)}");
    expect(paletteSource).toContain("<FeedbackDialogLynx");
    expect(paletteSource).toContain("activeThreadId={props.activeThreadId}");
  });

  it("renders Electron-equivalent categories and a gated submit action", async () => {
    render(<FeedbackDialogLynx open fallbackContext={context} onOpenChange={() => undefined} />);

    await waitFor(() =>
      expect(elementTree.root?.querySelector(".FeedbackDialogLynx")).toBeTruthy(),
    );
    expect(elementTree.root?.querySelector(".FeedbackDialogTitle")?.textContent).toBe(
      "Share feedback",
    );
    expect(elementTree.root?.querySelectorAll(".FeedbackCategoryChip")).toHaveLength(6);
    expect(
      elementTree.root?.querySelector(".FeedbackDetailsInput")?.getAttribute("placeholder"),
    ).toBe("Share details (required)");
    const submit = elementTree.root?.querySelector(".FeedbackSubmitButton");
    expect(submit?.getAttribute("accessibility-state")).toBe('{"disabled":true}');

    const bug = elementTree.root?.querySelector('[accessibility-label="Bug feedback"]');
    if (!bug) throw new Error("expected Bug category");
    fireEvent.tap(bug);
    expect(bug.getAttribute("class")).toContain("FeedbackCategoryChip--selected");
  });
});
