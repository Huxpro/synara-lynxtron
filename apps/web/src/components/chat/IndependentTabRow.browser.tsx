import "../../index.css";

import { page } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { IndependentTabRow } from "./IndependentTabRow";

describe("IndependentTabRow", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("keeps tabs mounted while collapsing and restoring actions", async () => {
    await render(
      <IndependentTabRow
        actions={<button type="button">Add tab</button>}
        tabs={<button type="button">Chat 1</button>}
      />,
    );

    await expect.element(page.getByRole("button", { name: "Chat 1" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Add tab" })).toBeVisible();
    await page.getByRole("button", { name: "Collapse to tabs only" }).click();
    expect(document.querySelector('[data-tab-row-mode="tabs-only"]')).not.toBeNull();
    await expect.element(page.getByRole("button", { name: "Chat 1" })).toBeVisible();
    expect(document.querySelector('button[aria-label="Add tab"]')).toBeNull();
    await page.getByRole("button", { name: "Restore tab actions" }).click();
    expect(document.querySelector('[data-tab-row-mode="expanded"]')).not.toBeNull();
    await expect.element(page.getByRole("button", { name: "Add tab" })).toBeVisible();
  });

  it("keeps the action lane outside the horizontal scroller", async () => {
    await render(
      <IndependentTabRow
        actions={<button type="button">Split right</button>}
        tabs={Array.from({ length: 8 }, (_, index) => (
          <button key={index} type="button">Tab {index + 1}</button>
        ))}
      />,
    );

    const scroller = document.querySelector('[data-independent-tab-scroller]');
    const actions = document.querySelector('[data-independent-tab-actions]');
    expect(scroller).not.toBeNull();
    expect(actions).not.toBeNull();
    expect(scroller?.contains(actions)).toBe(false);
  });
});
