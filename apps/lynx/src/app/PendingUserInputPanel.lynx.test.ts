import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx pending user-input capability", () => {
  const panelSource = readFileSync(
    new URL("../components/composer/PendingUserInputPanel.lynx.tsx", import.meta.url),
    "utf8",
  );
  const querySource = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
  const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
  const choiceRowSource = readFileSync(
    new URL("../components/composer/ComposerChoiceRow.lynx.tsx", import.meta.url),
    "utf8",
  );
  const panelCss = readFileSync(
    new URL("../components/composer/pending-user-input-panel.css", import.meta.url),
    "utf8",
  );
  const choiceRowCss = readFileSync(
    new URL("../components/composer/composer-choice-row.css", import.meta.url),
    "utf8",
  );

  it("reuses the shared pending-input state model", () => {
    expect(panelSource).toContain("derivePendingUserInputProgress");
    expect(panelSource).toContain("togglePendingUserInputOptionSelection");
    expect(panelSource).toContain("setPendingUserInputCustomAnswer");
    expect(panelSource).toContain("buildPendingUserInputAnswers");
  });

  it("shares the responsive choice-row flow and wraps footer controls", () => {
    expect(panelSource).toContain("<scroll-view");
    expect(panelSource).toContain("ComposerDecisionPanelLynx");
    expect(panelSource).toContain("scroll-y");
    expect(panelSource).toContain("<ComposerChoiceRow");
    expect(choiceRowSource).toContain("props.description !== props.label");
    expect(choiceRowCss).toContain("word-break: break-word");
    expect(panelCss).toMatch(
      /\.PendingUserInputTitleLynx\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;/s,
    );
    expect(panelCss).toMatch(
      /\.PendingUserInputFooterLynx\s*\{[^}]*min-width:\s*0;[^}]*flex-wrap:\s*wrap;/s,
    );
  });

  it("projects canonical pending interactions into the thread summary", () => {
    expect(querySource).toContain("derivePendingUserInputs(");
    expect(querySource).toContain("thread.pendingInteractions");
    expect(querySource).toContain("pendingUserInputs: readonly PendingUserInput[]");
  });

  it("dispatches the canonical response and refreshes the thread", () => {
    expect(routerSource).toContain('type: "thread.user-input.respond"');
    expect(routerSource).toContain("requestId: activePendingUserInput.requestId");
    expect(routerSource).toContain("answers,");
    expect(routerSource).toContain("<PendingUserInputPanel");
    expect(routerSource).toContain('queryKey: ["thread-detail", threadId]');
  });
});
