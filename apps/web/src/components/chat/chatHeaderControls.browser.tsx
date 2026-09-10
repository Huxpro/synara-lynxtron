// FILE: chatHeaderControls.browser.tsx
// Purpose: Browser regressions for interactive versus static shared surface-tab chips.
// Layer: Chat header controls test

import "../../index.css";

import { page } from "vitest/browser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { SurfaceTabChip } from "./chatHeaderControls";

describe("SurfaceTabChip selection", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a static label when a single-pane host omits selection", async () => {
    await render(
      <SurfaceTabChip
        active
        icon={<span aria-hidden>PR</span>}
        label="PR #42"
        closeLabel="Close PR #42"
        onClose={vi.fn()}
      />,
    );

    expect(document.querySelectorAll("button")).toHaveLength(1);
    expect(page.getByRole("button", { name: "Close PR #42" })).toBeVisible();
    expect(document.body.textContent).toContain("PR #42");
    expect(document.querySelector("[aria-pressed]")).toBeNull();
  });

  it("keeps the selectable button for multi-pane hosts", async () => {
    const onSelect = vi.fn();
    await render(
      <SurfaceTabChip
        active
        icon={<span aria-hidden>PR</span>}
        label="PR #42"
        onSelect={onSelect}
      />,
    );

    const selectButton = document.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    expect(selectButton).not.toBeNull();
    selectButton?.click();
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("swaps the icon for the close target on real hover and closes from that target", async () => {
    const onClose = vi.fn();
    await render(
      <SurfaceTabChip
        active
        icon={<span data-resting-icon>TS</span>}
        label="example.ts"
        closeLabel="Close example.ts"
        onClose={onClose}
      />,
    );

    const root = document.querySelector<HTMLElement>('[class~="group/dock-tab"]');
    const restingIcon = document.querySelector<HTMLElement>("[data-resting-icon]");
    const closeIcon = document.querySelector<HTMLElement>(
      'button[aria-label="Close example.ts"] [data-slot="central-icon"]',
    );
    const closeButton = page.getByRole("button", { name: "Close example.ts" });
    expect(root).not.toBeNull();
    expect(restingIcon).not.toBeNull();
    expect(closeIcon).not.toBeNull();
    expect(getComputedStyle(restingIcon!.parentElement!).opacity).toBe("1");
    expect(getComputedStyle(closeIcon!).opacity).toBe("0");

    await page.getByText("example.ts", { exact: true }).hover();

    await vi.waitFor(() => {
      expect(getComputedStyle(restingIcon!.parentElement!).opacity).toBe("0");
      expect(getComputedStyle(closeIcon!).opacity).toBe("1");
    });
    await expect.element(closeButton).toBeVisible();
    await closeButton.click();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
