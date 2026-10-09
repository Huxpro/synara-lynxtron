import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import { describe, expect, it, rs } from "@rstest/core";

import {
  helpMenuReleaseTitle,
  resolveHelpMenuReleaseEntries,
} from "@synara-web/components/SidebarHelpMenu.logic";

import { SidebarHelpMenu } from "./SidebarHelpMenu.lynx";

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
    ]);
  });

  it("sends Send feedback to its own handler only", async () => {
    const { handlers, items } = await openHelpMenu();
    const byLabel = (label: string) => items.find((item) => item.textContent === label)!;
    fireEvent.tap(byLabel("Send feedback"));
    expect(handlers.onOpenFeedback).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenShortcuts).not.toHaveBeenCalled();
  });
});
