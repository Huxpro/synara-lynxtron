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

  it("keeps the shared dialog close glyph at secondary foreground times 80%", async () => {
    const screen = await renderStory("ui/dialog", "close", "open");
    try {
      const close = page.getByRole("button", { name: "Close" });
      await expect.element(close).toBeVisible();
      const button = close.element();
      const glyph = button.querySelector("svg");
      expect(getComputedStyle(button).color).toBe("rgba(13, 13, 13, 0.596)");
      expect(glyph).not.toBeNull();
      expect(getComputedStyle(glyph!).opacity).toBe("0.8");
    } finally {
      await screen.unmount();
    }
  });

  it("applies interaction state to checkbox menu anatomy", async () => {
    const screen = await renderStory("ui/menu", "checkbox", "pressed");
    try {
      const item = page.getByRole("menuitemcheckbox", { name: "Show terminal" });
      await expect.element(item).toHaveAttribute("data-checked");
      expect(item.element().className).toContain("bg-[var(--color-background-button-secondary)]");
    } finally {
      await screen.unmount();
    }
  });
});
