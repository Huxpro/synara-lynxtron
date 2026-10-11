import { describe, expect, it } from "@rstest/core";
import { userInlineChipSegments } from "./userInlineChips.logic";
describe("upstream user chip transform on Native", () => {
  it("keeps terminal references distinct from file mentions and preserves context bodies", () => {
    const context = { header: "Terminal 1 lines 2-3", body: "npm test\npass" };
    const segments = userInlineChipSegments("@terminal-1:2-3 inspect @src/math.ts", [], [context]);
    expect(segments[0]).toEqual({ type: "transcript-terminal", context });
    expect(segments).toContainEqual(
      expect.objectContaining({ type: "mention", path: "src/math.ts" }),
    );
    expect(segments.map((s) => s.type)).toEqual(["transcript-terminal", "text", "mention"]);
  });
});
