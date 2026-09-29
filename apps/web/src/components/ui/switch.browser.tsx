import "../../index.css";

import { page } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { Switch } from "./switch";

describe("Switch deterministic interaction states", () => {
  it("exposes the pressed-state thumb deformation", async () => {
    const screen = await render(
      <Switch
        aria-label="Enable notifications"
        checked={false}
        data-pressed
        onCheckedChange={() => {}}
      />,
    );
    try {
      const thumb = page
        .getByRole("switch", { name: "Enable notifications" })
        .element()
        .querySelector<HTMLElement>('[data-slot="switch-thumb"]');
      expect(thumb).not.toBeNull();
      expect(getComputedStyle(thumb!).scale).not.toBe("none");
    } finally {
      await screen.unmount();
    }
  });
});
