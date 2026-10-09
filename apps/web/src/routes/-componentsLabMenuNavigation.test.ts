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

  it("isolates the lab from product-global services", () => {
    const root = readFileSync(new URL("./__root.tsx", import.meta.url), "utf8");
    expect(root).toMatch(
      /const componentsLabActive =\s+useRouterState\(\{ select: \(state\) => state\.location\.pathname \}\) === "\/components-lab"/,
    );
    // One gate around every global mount keeps the hook a single block in upstream's file.
    const gated = root.slice(
      root.indexOf("{componentsLabActive ? null : ("),
      root.indexOf("<Outlet />"),
    );
    for (const mount of [
      "<EventRouter />",
      "<ProviderStatusRefreshCoordinator />",
      "<TaskCompletionNotifications />",
    ]) {
      expect(gated).toContain(mount);
    }
  });
});
