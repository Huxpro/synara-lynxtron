import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Electron Components Lab menu navigation", () => {
  it("routes the native menu action from the root shell", () => {
    const root = readFileSync(new URL("./__root.tsx", import.meta.url), "utf8");
    const desktop = readFileSync(new URL("../../../desktop/src/main.ts", import.meta.url), "utf8");
    expect(desktop).toContain('label: "Components Lab…"');
    expect(desktop).toContain('dispatchMenuAction("open-components-lab")');
    expect(root).toContain("<GlobalComponentsLabMenuNavigation />");
    expect(root).toContain('action !== "open-components-lab"');
    expect(root).toContain('navigate({ to: "/components-lab", search: {} })');
  });

  it("keeps every global service mounted on the lab route", () => {
    const root = readFileSync(new URL("./__root.tsx", import.meta.url), "utf8");
    // Unmounting the session-sync engine on navigation strands its in-flight
    // subscriptions, and an unmounted notifier leaves its prompt toast behind.
    expect(root).not.toContain("componentsLabActive");
    expect(root).not.toMatch(/\? null : \(\s*<>\s*<GitProgressToastPreviewDev/);
    expect(root).toContain(
      "<GlobalComponentsLabMenuNavigation />\n          <GitProgressToastPreviewDev />",
    );
  });
});
