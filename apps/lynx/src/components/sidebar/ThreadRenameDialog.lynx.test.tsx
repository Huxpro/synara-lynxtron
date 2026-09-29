import { beforeEach, describe, expect, it, rs } from "@rstest/core";
import { render, waitFor } from "@lynx-js/react/testing-library";

import { ThreadRenameDialogLynx, normalizeThreadTitleInput } from "./ThreadRenameDialog.lynx";

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

describe("ThreadRenameDialogLynx", () => {
  it("normalizes titles", () => {
    expect(normalizeThreadTitleInput("  Next title  ")).toBe("Next title");
  });

  it("renders the Electron rename copy and current title", async () => {
    const onSave = rs.fn(async () => undefined);
    const onOpenChange = rs.fn();
    render(
      <ThreadRenameDialogLynx
        open
        thread={{ id: "thread-1", title: "Old title" } as never}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />,
    );
    await waitFor(() =>
      expect(elementTree.root?.querySelector(".LxDialogTitle")?.textContent).toBe("Rename chat"),
    );
    expect(elementTree.root?.querySelector(".LxDialogDescription")?.textContent).toBe(
      "Keep it short and recognizable.",
    );
    const input = elementTree.root?.querySelector('[aria-label="Thread title"]');
    expect(input?.getAttribute("value")).toBe("Old title");
    expect(
      Array.from(elementTree.root?.querySelectorAll(".LxButton") ?? []).map(
        (button) => button.textContent,
      ),
    ).toEqual(["Cancel", "Save"]);
    expect(onSave).not.toHaveBeenCalled();
  });
});
