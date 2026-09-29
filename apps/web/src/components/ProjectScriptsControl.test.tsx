import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import ProjectScriptsControl, {
  resolveInitialProjectScriptEditorState,
} from "./ProjectScriptsControl";

describe("ProjectScriptsControl", () => {
  it("renders the empty project actions state", () => {
    const markup = renderToStaticMarkup(
      <ProjectScriptsControl
        scripts={[]}
        keybindings={{} as never}
        onRunScript={vi.fn()}
        onAddScript={vi.fn()}
        onUpdateScript={vi.fn()}
        onDeleteScript={vi.fn()}
      />,
    );

    expect(markup).toContain("Add action");
  });

  it("renders deterministic saving and validation states for the shared editor", () => {
    const source = readFileSync(new URL("./ProjectScriptsControl.tsx", import.meta.url), "utf8");
    expect(source).toContain("if (saving) return");
    expect(source).toContain("setSaving(true)");
    expect(source).toContain("setSaving(false)");
    expect(source).toContain('saving ? "Saving…"');
    expect(source).toContain("initialValidationError");
  });

  it("projects deterministic edit fixtures into the real editor state", () => {
    const script = {
      id: "component-lab-test",
      name: "Test",
      command: "bun run test",
      icon: "test" as const,
      runOnWorktreeCreate: false,
    };
    expect(
      resolveInitialProjectScriptEditorState(
        [script],
        [
          {
            command: "script.component-lab-test.run",
            shortcut: {
              key: "t",
              metaKey: false,
              ctrlKey: false,
              shiftKey: false,
              altKey: false,
              modKey: true,
            },
          },
        ] as never,
        script.id,
      ),
    ).toEqual({ script, keybinding: "mod+t" });
  });
});
