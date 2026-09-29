import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { PullRequestWarningBanner } from "./PullRequestWarningBanner.lynx";

describe("Pull Request warning banner fidelity", () => {
  it("announces a readable full-width amber status banner", () => {
    render(
      <PullRequestWarningBanner>
        Could not refresh pull request details. Showing saved data.
      </PullRequestWarningBanner>,
    );

    const banner = elementTree.root?.querySelector(".SharedPrWarningBanner");
    expect(banner?.getAttribute("accessibility-label")).toBe(
      "Could not refresh pull request details. Showing saved data.",
    );
    expect(banner?.querySelector(".SharedPrWarningBannerText")?.textContent).toBe(
      "Could not refresh pull request details. Showing saved data.",
    );

    const styles = readFileSync(
      new URL("./pull-request-warning-banner.css", import.meta.url),
      "utf8",
    );
    const appStyles = readFileSync(new URL("../app/App.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.SharedPrWarningBanner\s*\{[^}]*width:\s*100%;[^}]*padding:\s*8px 12px;[^}]*background-color:\s*var\(--pr-warning-surface\);/s,
    );
    expect(styles).toMatch(
      /\.SharedPrWarningBanner--banner\s*\{[^}]*border-bottom:\s*1px solid var\(--pr-warning-border\);/s,
    );
    expect(styles).toMatch(
      /\.SharedPrWarningBanner--callout\s*\{[^}]*margin-top:\s*12px;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--pr-warning-border\);[^}]*border-right-color:\s*var\(--pr-warning-border\);[^}]*border-top-color:\s*var\(--pr-warning-border\);[^}]*border-bottom-color:\s*var\(--pr-warning-border\);[^}]*border-radius:\s*8px;/s,
    );
    expect(styles).toMatch(
      /\.SharedPrWarningBanner--note\s*\{[^}]*margin-bottom:\s*8px;[^}]*padding:\s*6px 8px;[^}]*border:\s*1px solid var\(--pr-warning-border\);[^}]*border-radius:\s*6px;/s,
    );
    expect(styles).toMatch(
      /\.SharedPrWarningBannerText\s*\{[^}]*color:\s*var\(--foreground\);[^}]*font-size:\s*var\(--app-font-size-ui-sm\);[^}]*line-height:\s*18px;/s,
    );
    expect(appStyles).toContain("--pr-warning-surface: rgba(217, 119, 6, 0.04);");
    expect(appStyles).toContain("--pr-warning-border: rgba(245, 180, 74, 0.32);");
  });

  it("flattens mixed JSX text fragments into one visible and accessible label", () => {
    render(
      <PullRequestWarningBanner>
        {1} project {"repository was"} unavailable. Healthy repositories are still shown.
      </PullRequestWarningBanner>,
    );

    const banner = elementTree.root?.querySelector(".SharedPrWarningBanner");
    const expected = "1 project repository was unavailable. Healthy repositories are still shown.";
    expect(banner?.getAttribute("accessibility-label")).toBe(expected);
    expect(banner?.querySelector(".SharedPrWarningBannerText")?.textContent).toBe(expected);
  });

  it("keeps cached detail visible when only the background refresh failed", () => {
    const source = readFileSync(new URL("../app/FeatureListsPage.tsx", import.meta.url), "utf8");

    expect(source).toContain("{selectedDetailError && selectedDetail ? (");
    expect(source).toContain("Could not refresh pull request details. Showing saved data.");
    expect(source).toContain(") : selectedDetailError && !selectedDetail ? (");
  });

  it("surfaces retained-list truncation, partial failures, and refresh errors", () => {
    const source = readFileSync(new URL("../app/FeatureListsPage.tsx", import.meta.url), "utf8");
    const styles = readFileSync(
      new URL("./pull-request-warning-banner.css", import.meta.url),
      "utf8",
    );

    expect(source).toContain("const truncatedRepositoryCount =");
    expect(source).toContain("Showing the first 50 matching pull requests for");
    expect(source).toContain("Healthy repositories are still shown.");
    expect(source).toContain("The latest background refresh failed. Showing the last available");
    expect(source).toContain('<PullRequestWarningBanner shape="callout">');
    expect(styles).toMatch(
      /\.SharedPrListFootnote\s*\{[^}]*margin-top:\s*12px;[^}]*padding:\s*0 4px;[^}]*font-size:\s*var\(--app-font-size-ui-sm\);[^}]*line-height:\s*18px;/s,
    );
  });

  it("reuses the compact warning note for incomplete Summary comments", () => {
    const source = readFileSync(
      new URL("./PullRequestSummaryCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(
      new URL("./pull-request-summary-composition-elements.css", import.meta.url),
      "utf8",
    );

    expect(source).toContain('<PullRequestWarningBanner shape="note">');
    expect(source).not.toContain('className="SharedPrSummaryWarning"');
    expect(styles).not.toContain(".SharedPrSummaryWarning");
  });
});
