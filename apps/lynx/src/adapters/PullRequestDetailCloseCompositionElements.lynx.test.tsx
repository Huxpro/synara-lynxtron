import { describe, expect, it } from "@rstest/core";
import { fireEvent, render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import {
  PullRequestDetailCloseButtonElement,
  PullRequestDetailExternalButtonElement,
} from "./PullRequestDetailCloseCompositionElements.lynx";

describe("Pull Request detail close fidelity", () => {
  it("uses the full-strength 28px shared header control", () => {
    let closes = 0;
    render(
      <PullRequestDetailCloseButtonElement
        accessibleLabel="Close pull request details"
        tooltip="Close"
        onActivate={() => {
          closes += 1;
        }}
      />,
    );

    const close = elementTree.root?.querySelector(".SharedPrDetailCloseButton");
    expect(close?.getAttribute("accessibility-label")).toBe("Close pull request details");
    expect(close?.querySelector("svg")?.getAttribute("content")).toContain('stroke="#0d0d0d"');
    fireEvent.tap(close!);
    expect(closes).toBe(1);

    const styles = readFileSync(
      new URL("./pull-request-detail-close-composition-elements.css", import.meta.url),
      "utf8",
    );
    const source = readFileSync(
      new URL("./PullRequestDetailCloseCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('color="var(--foreground)"');
    expect(source).not.toContain('color="var(--muted-foreground)"');
    expect(styles).toMatch(
      /\.SharedPrDetailCloseButton\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;[^}]*border-radius:\s*8px;/s,
    );
  });

  it("matches the adjacent external-browser header action", () => {
    render(
      <PullRequestDetailExternalButtonElement url="https://github.com/example/repo/pull/42" />,
    );

    const external = elementTree.root?.querySelector(".SharedPrDetailExternalButton");
    expect(external?.getAttribute("accessibility-label")).toBe("Open in external browser");
    expect(external?.querySelector("svg")?.getAttribute("content")).toContain('stroke="#0d0d0d"');
    const routeSource = readFileSync(
      new URL("../app/FeatureListsPage.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(
      new URL("./pull-request-detail-close-composition-elements.css", import.meta.url),
      "utf8",
    );
    expect(routeSource).toContain("<PullRequestDetailExternalButtonElement");
    expect(routeSource).toContain("url={selectedDetail.url}");
    const source = readFileSync(
      new URL("./PullRequestDetailCloseCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("'background only';");
    expect(source).toContain("openExternalBestEffort(props.url);");
    expect(styles).toMatch(/\.SharedPrDetailExternalButton\s*\{[^}]*margin-left:\s*0;/s);
    expect(styles).not.toMatch(/\.SharedPrDetailExternalButton\s*\{[^}]*margin-right:/);
    const appStyles = readFileSync(new URL("../app/App.css", import.meta.url), "utf8");
    expect(appStyles).toMatch(
      /\.SharedPrDetailDockActions\s*\{[^}]*margin-left:\s*auto;[^}]*gap:\s*4px;/s,
    );
  });
});
