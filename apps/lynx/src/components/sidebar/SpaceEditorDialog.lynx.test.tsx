import { beforeEach, describe, expect, it, rs } from "@rstest/core";
import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";

import { SpaceEditorDialogLynx } from "./SpaceEditorDialog.lynx";

const space = {
  id: "space-a" as never,
  name: "Focus",
  icon: "tree" as const,
  sortOrder: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
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

describe("Native Space editor dialog", () => {
  it("renders all icons and saves changed icon metadata", async () => {
    const onSave = rs.fn().mockResolvedValue(undefined);
    render(
      <SpaceEditorDialogLynx
        open
        space={space}
        existingNames={["Work"]}
        onOpenChange={() => undefined}
        onSave={onSave}
      />,
    );
    await waitFor(() =>
      expect(elementTree.root?.querySelector(".AppSidebarSpaceEditorDialog")).toBeTruthy(),
    );
    expect(elementTree.root?.querySelectorAll(".AppSidebarSpaceIconOption")).toHaveLength(20);
    expect(elementTree.root?.querySelector(".LxInput")?.getAttribute("value")).toBe("Focus");
    const rocket = elementTree.root?.querySelector('[accessibility-label="Rocket"]');
    if (!rocket) throw new Error("expected Rocket icon option");
    fireEvent.tap(rocket);
    const buttons = [...(elementTree.root?.querySelectorAll(".LxButton") ?? [])];
    const save = buttons[buttons.length - 1];
    if (!save) throw new Error("expected Save button");
    fireEvent.tap(save);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ name: "Focus", icon: "rocket" }));
  });

  it("supports create mode without an existing Space row", async () => {
    const onSave = rs.fn().mockResolvedValue(undefined);
    render(
      <SpaceEditorDialogLynx
        mode="create"
        open
        space={null}
        existingNames={[]}
        onOpenChange={() => undefined}
        onSave={onSave}
      />,
    );
    await waitFor(() =>
      expect(elementTree.root?.querySelector(".LxDialogTitle")?.textContent).toBe("New space"),
    );
    expect(elementTree.root?.querySelector(".LxInput")?.getAttribute("value")).toBe("");
    expect(elementTree.root?.querySelectorAll(".AppSidebarSpaceIconOption")).toHaveLength(20);
  });
});
