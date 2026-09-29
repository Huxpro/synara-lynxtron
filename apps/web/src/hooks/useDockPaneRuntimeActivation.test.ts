import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("useDockPaneRuntimeActivation", () => {
  it("does not restart deferred hydration when an equivalent pane object is recreated", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./useDockPaneRuntimeActivation.ts", import.meta.url)),
      "utf8",
    );

    expect(source).toContain("}, [activePaneKey, activePaneKind, hydratedPaneKey]);");
    expect(source).not.toContain("}, [activePaneKey, hydratedPaneKey, input.activePane]);");
  });
});
