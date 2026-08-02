import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  PullRequestDetailCapabilityComposition,
  PullRequestDetailTabsComposition,
} from "./PullRequestDetailTabsComposition";

describe("PullRequestDetailTabsComposition", () => {
  it("owns canonical tab order and active state", () => {
    const markup = renderToStaticMarkup(
      <PullRequestDetailTabsComposition
        activeTab="timeline"
        availableTabs={["summary", "timeline", "code"]}
        onSelectTab={vi.fn()}
      />,
    );

    expect(markup.indexOf(">Summary<")).toBeLessThan(markup.indexOf(">Timeline<"));
    expect(markup.indexOf(">Timeline<")).toBeLessThan(markup.indexOf(">Code<"));
    expect(markup).toContain('aria-pressed="true"');
    expect(markup.match(/aria-disabled="false"/g)).toHaveLength(3);
    expect(markup).not.toContain('aria-disabled="true"');
  });

  it("owns unavailable tab semantics and capability copy", () => {
    const markup = renderToStaticMarkup(
      <>
        <PullRequestDetailTabsComposition
          activeTab="summary"
          availableTabs={["summary"]}
          onSelectTab={vi.fn()}
        />
        <PullRequestDetailCapabilityComposition availableTabs={["summary"]} />
      </>,
    );

    expect(markup.match(/aria-disabled="true"/g)).toHaveLength(2);
    expect(markup).toContain("Timeline and Code are unavailable in this runtime.");
  });
});
