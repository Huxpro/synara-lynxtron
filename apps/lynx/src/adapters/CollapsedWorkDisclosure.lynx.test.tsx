import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Collapsed work disclosure fidelity", () => {
  it("uses the shared chevron motion while preserving transcript measurement policy", () => {
    const source = readFileSync(
      new URL("./CollapsedWorkCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(
      new URL("./collapsed-work-composition-elements.css", import.meta.url),
      "utf8",
    );

    expect(source).toContain("<ChevronRightIcon");
    expect(source).toContain("disclosureChevronClassName(");
    expect(source).toContain('color={semanticIconColor("secondary")}');
    expect(source).toContain("preserveOnClose: false");
    expect(source).not.toContain(">›</text>");
    expect(styles).toMatch(
      /\.SharedCollapsedWorkChevron\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;[^}]*flex-shrink:\s*0;[^}]*opacity:\s*0\.55;/s,
    );
    // Upstream's trigger is `-ml-0.5 pb-2`, 4px down its 24px line box.
    expect(styles).toMatch(
      /\.SharedCollapsedWorkTrigger\s*\{[^}]*margin-left:\s*-2px;[^}]*padding-top:\s*4px;[^}]*padding-bottom:\s*8px;/s,
    );
    expect(styles).toMatch(
      /\.SharedCollapsedWorkLabel\s*\{[^}]*font-size:\s*var\(--app-font-size-chat, 13px\);/s,
    );
    expect(styles).toMatch(
      /\.SharedCollapsedWorkTrigger\.ui-hover \.SharedCollapsedWorkLabel,[^{]*\{[^}]*opacity:\s*0\.9;/s,
    );
    expect(styles).not.toMatch(
      /\.SharedCollapsedWorkTrigger\.ui-(?:hover|pressed)\s*\{[^}]*(?:background-color|opacity):/s,
    );
  });
});
