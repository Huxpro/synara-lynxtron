import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("ComposerChoiceRow responsive copy", () => {
  const source = readFileSync(new URL("./ComposerChoiceRow.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("./composerPickerStyles.ts", import.meta.url), "utf8");
  const approval = readFileSync(
    new URL("./ComposerPendingApprovalPanel.tsx", import.meta.url),
    "utf8",
  );
  const userInput = readFileSync(new URL("./UserInputQuestionForm.tsx", import.meta.url), "utf8");

  it("allows labels and descriptions to break inside a narrow composer card", () => {
    expect(source).toContain("min-w-0 flex-1 break-words leading-snug");
    expect(source).toContain("break-words text-ui-lg font-medium");
    expect(source).toContain("ml-1.5 break-words text-ui");
  });

  it("keeps both decision cards vertically reachable in short windows", () => {
    expect(styles).toContain("COMPOSER_DECISION_PANEL_CLASS_NAME");
    expect(styles).toContain("max-h-[calc(100vh-210px)]");
    expect(styles).toContain("overflow-y-auto");
    expect(approval).toContain("COMPOSER_DECISION_PANEL_CLASS_NAME");
    expect(userInput).toContain("COMPOSER_DECISION_PANEL_CLASS_NAME");
  });
});
