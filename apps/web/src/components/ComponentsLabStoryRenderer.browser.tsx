import "../index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { page } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { ComponentsLabStoryRenderer } from "./ComponentsLabStoryRenderer";

function renderStory(storyId: string, variant: string, state: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ComponentsLabStoryRenderer storyId={storyId} variant={variant} state={state} />
    </QueryClientProvider>,
  );
}

describe("Components Lab overlay truthfulness", () => {
  it("keeps tooltip style and visibility on independent axes", async () => {
    const closed = await renderStory("ui/tooltip", "picker", "default");
    await expect.element(page.getByRole("button", { name: "Copy" })).toBeVisible();
    expect(document.querySelector('[data-slot="tooltip-popup"]')).toBeNull();
    await closed.unmount();

    const open = await renderStory("ui/tooltip", "picker", "open");
    await expect.element(page.getByText("Copy to clipboard")).toBeVisible();
    await open.unmount();
  });

  it("keeps closed dialog anatomy variants identifiable", async () => {
    for (const [variant, label] of [
      ["title-description", "Open title dialog"],
      ["panel", "Open panel dialog"],
      ["footer", "Open footer dialog"],
      ["close", "Open closable dialog"],
    ] as const) {
      const screen = await renderStory("ui/dialog", variant, "default");
      await expect.element(page.getByRole("button", { name: label })).toBeVisible();
      await screen.unmount();
    }
  });

  it("applies interaction state to checkbox menu anatomy", async () => {
    const screen = await renderStory("ui/menu", "checkbox", "pressed");
    try {
      const item = page.getByRole("menuitemcheckbox", { name: "Show terminal" });
      await expect.element(item).toHaveAttribute("data-checked");
      expect(item.element().className).toContain(
        "bg-[var(--color-background-button-secondary)]",
      );
    } finally {
      await screen.unmount();
    }
  });
});
