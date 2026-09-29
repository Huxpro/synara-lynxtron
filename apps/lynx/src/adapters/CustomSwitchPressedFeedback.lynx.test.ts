import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

const switchStyles = [
  new URL("./settings-general-composition-elements.css", import.meta.url),
  new URL("./settings-appearance-composition-elements.css", import.meta.url),
  new URL("./settings-provider-picker-composition-elements.css", import.meta.url),
  new URL("./theme-pack-editor-composition-elements.css", import.meta.url),
  new URL("../app/kanban-new-task-dialog.css", import.meta.url),
];

describe("custom switch pressed feedback", () => {
  it("keeps the track stable instead of dimming the whole control", () => {
    for (const styleUrl of switchStyles) {
      const styles = readFileSync(styleUrl, "utf8");
      expect(styles).not.toMatch(/Switch\.ui-pressed\s*\{[^}]*opacity:/s);
    }
  });

  it("keeps the Kanban task controls on explicit physical borders", () => {
    const styles = readFileSync(
      new URL("../app/kanban-new-task-dialog.css", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(
      /\.KanbanNewTaskProject\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.KanbanNewTaskProject--selected\s*\{[^}]*border-left-color:\s*var\(--foreground\);[^}]*border-right-color:\s*var\(--foreground\);[^}]*border-top-color:\s*var\(--foreground\);[^}]*border-bottom-color:\s*var\(--foreground\);[^}]*background-color:\s*var\(--accent\);/s,
    );
    expect(styles).toMatch(
      /\.KanbanNewTaskInput\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.KanbanNewTaskDraftSwitch\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--settings-switch-border\);[^}]*border-right-color:\s*var\(--settings-switch-border\);[^}]*border-top-color:\s*var\(--settings-switch-border\);[^}]*border-bottom-color:\s*var\(--settings-switch-border\);/s,
    );
  });
});
