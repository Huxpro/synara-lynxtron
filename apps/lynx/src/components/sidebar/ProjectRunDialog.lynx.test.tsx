import { beforeEach, describe, expect, it } from "@rstest/core";
import { render, waitFor } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { normalizeProjectRunCommand, ProjectRunDialogLynx } from "./ProjectRunDialog.lynx";

const project = {
  id: "project-a",
  kind: "project" as const,
  title: "Synara",
  remoteName: "Synara",
  folderName: "synara",
  localName: null,
  workspaceRoot: "/work/synara",
  defaultModelSelection: null,
  scripts: [],
  spaceId: null,
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

describe("Native project run dialog", () => {
  it("matches Electron copy and pre-fills the discovered command", async () => {
    render(
      <ProjectRunDialogLynx
        open
        project={project}
        initialCommand="bun run dev"
        loading={false}
        onOpenChange={() => undefined}
        onRun={async () => undefined}
      />,
    );
    await waitFor(() =>
      expect(elementTree.root?.querySelector(".LxDialogTitle")?.textContent).toContain("Start dev"),
    );
    expect(elementTree.root?.querySelector(".LxDialogDescription")?.textContent).toBe("Synara");
    expect(elementTree.root?.querySelector(".LxInput")?.getAttribute("value")).toBe("bun run dev");
    expect(elementTree.root?.querySelector(".LxInput")?.getAttribute("placeholder")).toBe(
      "e.g. npm run dev",
    );
  });

  it("normalizes commands and preserves empty validation", () => {
    expect(normalizeProjectRunCommand("  bun run dev  ")).toBe("bun run dev");
    expect(normalizeProjectRunCommand("   ")).toBe("");
  });

  it("does not couple the open reset effect to discovery updates", () => {
    const source = readFileSync(new URL("./ProjectRunDialog.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain("if (!props.open || editedRef.current) return;");
    expect(source).toContain("editedRef.current = true;");
    expect(source).toContain("}, [props.open, props.project?.id]);");
  });
});
