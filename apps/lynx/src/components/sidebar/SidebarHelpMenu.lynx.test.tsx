import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import { beforeEach, describe, expect, it, rs } from "@rstest/core";

import {
  helpMenuReleaseTitle,
  resolveHelpMenuReleaseEntries,
} from "@synara-web/components/SidebarHelpMenu.logic";

import { SidebarHelpMenu } from "./SidebarHelpMenu.lynx";

// The dialog primitive schedules its open transition and focus through these.
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

async function openHelpMenu() {
  const handlers = { onOpenShortcuts: rs.fn(), onOpenFeedback: rs.fn(), onOpenDocs: rs.fn() };
  render(<SidebarHelpMenu {...handlers} />);
  const trigger = elementTree.root?.querySelector(".SidebarHelpTrigger");
  if (!trigger) throw new Error("expected the Help trigger");
  expect(trigger.getAttribute("aria-label")).toBe("Help");
  fireEvent.tap(trigger);
  const items = await waitFor(() => {
    const elements = elementTree.root?.querySelectorAll(".SidebarHelpMenuItem") ?? [];
    if (elements.length === 0) throw new Error("expected an open Help menu");
    return Array.from(elements);
  });
  return { handlers, items };
}

describe("Lynx sidebar Help menu", () => {
  it("lists the latest releases, the changelog, and the help destinations", async () => {
    const { items } = await openHelpMenu();
    const releases = resolveHelpMenuReleaseEntries();
    expect(items.map((item) => item.textContent)).toEqual([
      ...releases.map((entry) => `${helpMenuReleaseTitle(entry)}${entry.date}`),
      "Full changelog",
      "Keybindings",
      "Send feedback",
      "Docs",
      "About Synara for Lynx",
    ]);
  });

  it("sends Send feedback to its own handler only", async () => {
    const { handlers, items } = await openHelpMenu();
    const byLabel = (label: string) => items.find((item) => item.textContent === label)!;
    fireEvent.tap(byLabel("Send feedback"));
    expect(handlers.onOpenFeedback).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenShortcuts).not.toHaveBeenCalled();
  });

  it("opens the About dialog with both marks, and Close dismisses it", async () => {
    const { items } = await openHelpMenu();
    const labels = () =>
      Array.from(elementTree.root?.querySelectorAll(".LynxBrandMarksMark") ?? []).map((mark) =>
        mark.getAttribute("accessibility-label"),
      );
    expect(labels()).toEqual([]);
    fireEvent.tap(items.find((item) => item.textContent === "About Synara for Lynx")!);
    const dialog = await waitFor(() => {
      const element = elementTree.root?.querySelector(".AboutLynxDialog");
      if (!element) throw new Error("expected the About dialog");
      return element;
    });
    expect(labels()).toEqual(["Lynx logo", "Lynxtron logo"]);
    expect(dialog.textContent).toContain("Synara for Lynx");
    expect(dialog.textContent).toContain("Rendered with Lynx on Lynxtron");
    const close = Array.from(dialog.querySelectorAll(".LxButton")).find(
      (button) => button.textContent === "Close",
    );
    if (!close) throw new Error("expected the Close button");
    fireEvent.tap(close);
    await waitFor(() => {
      if (elementTree.root?.querySelector(".AboutLynxDialog")) {
        throw new Error("expected the About dialog to close");
      }
    });
  });
});
