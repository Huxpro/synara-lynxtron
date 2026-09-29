import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Pull Request timeline typography", () => {
  it("uses the shared PR body and meta roles instead of compressed fixed sizes", () => {
    const styles = readFileSync(
      new URL("./pull-request-timeline-composition-elements.css", import.meta.url),
      "utf8",
    );
    expect(styles).toMatch(
      /\.SharedPrTimelineTitle\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-lg\);[^}]*line-height:\s*19\.5px;/s,
    );
    expect(styles).toMatch(
      /\.SharedPrTimelineMeta,\s*\.SharedPrTimelineBody\s*\{[^}]*font-size:\s*var\(--app-font-size-ui\);[^}]*line-height:\s*18px;/s,
    );
    expect(styles).not.toMatch(
      /\.SharedPrTimeline(?:Title|Meta|Body)\s*\{[^}]*font-size:\s*10px;/s,
    );
  });

  it("matches the Web timeline inset and rail anchors", () => {
    const styles = readFileSync(
      new URL("./pull-request-timeline-composition-elements.css", import.meta.url),
      "utf8",
    );
    expect(styles).toMatch(/\.SharedPrTimelineRoot\s*\{[^}]*width:\s*100%;[^}]*padding:\s*20px;/s);
    expect(styles).toMatch(
      /\.SharedPrTimelineRail\s*\{[^}]*margin-left:\s*8px;[^}]*padding-left:\s*20px;[^}]*border-left:\s*1px solid var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.SharedPrTimelineMarker\s*\{[^}]*left:\s*-25px;[^}]*top:\s*4px;[^}]*width:\s*8px;[^}]*height:\s*8px;/s,
    );
  });
});
