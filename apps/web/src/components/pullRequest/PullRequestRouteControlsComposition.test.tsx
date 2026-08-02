import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  PullRequestRouteFiltersComposition,
  PullRequestRouteHeaderComposition,
} from "./PullRequestRouteControlsComposition";

describe("PullRequestRouteControlsComposition", () => {
  it("owns the canonical header, tab order, search, and project filter anatomy", () => {
    const markup = renderToStaticMarkup(
      <>
        <PullRequestRouteHeaderComposition
          scopedProjectName="Synara"
          refreshDisabled={false}
          refreshing={false}
          navigationAvailable={false}
          onRefresh={vi.fn()}
        />
        <PullRequestRouteFiltersComposition
          involvement="all"
          state="open"
          projects={[]}
          searchQuery=""
          searchCapability="editable"
          onInvolvementChange={vi.fn()}
          onStateChange={vi.fn()}
          onProjectChange={vi.fn()}
          onSearchChange={vi.fn()}
        />
      </>,
    );

    expect(markup.indexOf("Pull requests")).toBeLessThan(markup.indexOf("Synara"));
    expect(markup.indexOf(">All<")).toBeLessThan(markup.indexOf(">Reviewing<"));
    expect(markup.indexOf(">Reviewing<")).toBeLessThan(markup.indexOf(">Authored<"));
    expect(markup.indexOf(">Open<")).toBeLessThan(markup.indexOf(">Closed<"));
    expect(markup).toContain('placeholder="Search pull requests"');
    expect(markup).toContain("Filter pull requests by project: All projects");
  });

  it("renders an explicit unavailable search capability instead of a fake input", () => {
    const markup = renderToStaticMarkup(
      <PullRequestRouteFiltersComposition
        involvement="reviewing"
        state="open"
        projects={[]}
        searchQuery=""
        searchCapability="unavailable"
        onInvolvementChange={vi.fn()}
        onStateChange={vi.fn()}
        onProjectChange={vi.fn()}
      />,
    );

    expect(markup).toContain("Search unavailable in this runtime");
    expect(markup).not.toContain('placeholder="Search pull requests"');
  });
});
