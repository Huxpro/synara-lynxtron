import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import {
  PullRequestRowAuthorElement,
  PullRequestRowMetaSegmentElement,
  PullRequestRowPinElement,
  PullRequestRowStateElement,
} from "./PullRequestRowCompositionElements.lynx";

describe("Pull Request row icon fidelity", () => {
  it("renders the canonical five-state Central identities without Unicode glyphs", () => {
    render(
      <view>
        <PullRequestRowStateElement state="open" isDraft={false} />
        <PullRequestRowStateElement state="open" isDraft />
        <PullRequestRowStateElement state="open" isDraft={false} mergeability="conflicting" />
        <PullRequestRowStateElement state="merged" isDraft={false} />
        <PullRequestRowStateElement state="closed" isDraft={false} />
      </view>,
    );

    const states = Array.from(elementTree.root?.querySelectorAll(".SharedPrState") ?? []);
    expect(states.map((state) => state.getAttribute("accessibility-label"))).toEqual([
      "PR open",
      "PR draft",
      "PR has conflicts",
      "PR merged",
      "PR closed",
    ]);
    const contents = Array.from(elementTree.root?.querySelectorAll(".SharedPrStateIcon") ?? []).map(
      (icon) => icon.getAttribute("content"),
    );
    expect(contents[0]).toContain("#00a240");
    expect(contents[2]).toContain("#e02e2a");
    expect(contents[3]).toContain("#5e6ad2");
    expect(new Set(contents).size).toBe(5);

    const stateIconSource = readFileSync(
      new URL("./PullRequestStateIcon.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(stateIconSource).toContain(
      'import draftSvg from "@synara-central-icons/draft.svg?raw";',
    );
    expect(stateIconSource).toContain(
      'import pullRequestClosedSvg from "@synara-central-icons/request-closed.svg?raw";',
    );
    const source = readFileSync(
      new URL("./PullRequestRowCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch(/[◌↗◆×●○]/);
  });

  it("switches between outline and filled Central pin assets", () => {
    render(
      <view>
        <PullRequestRowPinElement
          label="Pin pull request"
          pinned={false}
          onActivate={() => undefined}
        />
        <PullRequestRowPinElement label="Unpin pull request" pinned onActivate={() => undefined} />
      </view>,
    );

    const icons = elementTree.root?.querySelectorAll(".SharedPrPinIcon") ?? [];
    expect(icons).toHaveLength(3);
    expect(icons[0]?.getAttribute("content")).not.toBe(icons[2]?.getAttribute("content"));
    expect(elementTree.root?.querySelector(".SharedPrPin--pinned")).not.toBeNull();
    expect(
      elementTree.root?.querySelector(".SharedPrPin--pinned .SharedPrPinIcon--pinned"),
    ).not.toBeNull();
    expect(
      elementTree.root?.querySelector(".SharedPrPin--pinned .SharedPrPinIcon--muted"),
    ).toBeNull();

    const styles = readFileSync(
      new URL("./pull-request-row-composition-elements.css", import.meta.url),
      "utf8",
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-md-up \.SharedPrPin--unpinned\s*\{[^}]*opacity:\s*0;/s,
    );
    expect(styles).toMatch(/\.SharedPrRow\.ui-hover \.SharedPrPin,[^{]*\{[^}]*opacity:\s*1;/s);
    expect(styles).toMatch(
      /\.SharedPrRow\.ui-hover \.SharedPrPinIcon--foreground,[^{]*\{[^}]*opacity:\s*1;/s,
    );
    expect(styles).toMatch(
      /\.SharedPrPin\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;[^}]*min-width:\s*28px;[^}]*min-height:\s*28px;[^}]*flex-shrink:\s*0;[^}]*align-self:\s*center;[^}]*margin-right:\s*4px;/s,
    );
    expect(styles).not.toMatch(/\.SharedPrPin\.ui-(?:hover|pressed)[^{]*\{[^}]*background-color:/s);
  });

  it("reuses the real actor avatar identity without rendering a row login", () => {
    render(
      <PullRequestRowAuthorElement
        actor={{
          login: "octocat",
          name: "Octo Cat",
          avatarUrl: "https://example.test/octocat.png",
        }}
      />,
    );

    const actor = elementTree.root?.querySelector(".SharedPrActorLabel--row");
    expect(actor?.getAttribute("accessibility-label")).toBe("octocat");
    expect(actor?.querySelector(".SharedPrActorAvatar")?.getAttribute("src")).toBe(
      "https://example.test/octocat.png",
    );
    expect(actor?.querySelector(".SharedPrActorLogin")).toBeNull();

    const source = readFileSync(
      new URL("./PullRequestRowCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('<PullRequestActorLabel actor={props.actor} variant="row" />');
    expect(source).not.toContain('className="SharedPrAvatar"');
  });

  it("matches the Web row title weight and 70-percent hover surface", () => {
    const styles = readFileSync(
      new URL("./pull-request-row-composition-elements.css", import.meta.url),
      "utf8",
    );
    const appStyles = readFileSync(new URL("../app/App.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.SharedPrTitle\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-lg\);[^}]*font-weight:\s*500;/s,
    );
    expect(styles).toMatch(
      /\.SharedPrRow\.ui-hover,\s*\.SharedPrRow\.ui-pressed\s*\{[^}]*background-color:\s*var\(--pr-row-hover-surface\);/s,
    );
    expect(styles).toMatch(/\.SharedPrRow--selected\s*\{[^}]*background-color:\s*var\(--muted\);/s);
    expect(styles).toMatch(
      /\.SharedPrRowAction\s*\{[^}]*padding:\s*6px 4px 6px 12px;[^}]*border-radius:\s*8px;/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--theme-light\s*\{[^}]*--pr-row-hover-surface:\s*rgba\(13,\s*13,\s*13,\s*0\.028\);/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--theme-dark\s*\{[^}]*--pr-row-hover-surface:\s*rgba\(252,\s*252,\s*252,\s*0\.0042\);/s,
    );
  });

  it("preserves Web metadata truncation bounds and full accessible labels", () => {
    render(
      <view>
        <PullRequestRowMetaSegmentElement
          title="Project with a very long title"
          truncateWidth="max-w-[12rem]"
          showSeparator={false}
        >
          Long project
        </PullRequestRowMetaSegmentElement>
        <PullRequestRowMetaSegmentElement
          title="feature/long-branch → main"
          truncateWidth="max-w-[14rem]"
          showSeparator
        >
          feature/long-branch
        </PullRequestRowMetaSegmentElement>
      </view>,
    );

    const project = elementTree.root?.querySelector(".SharedPrMetaSegmentText--project");
    const branch = elementTree.root?.querySelector(".SharedPrMetaSegmentText--branch");
    expect(project?.getAttribute("accessibility-label")).toBe("Project with a very long title");
    expect(branch?.getAttribute("accessibility-label")).toBe("feature/long-branch → main");

    const styles = readFileSync(
      new URL("./pull-request-row-composition-elements.css", import.meta.url),
      "utf8",
    );
    expect(styles).toMatch(/\.SharedPrMetaSegmentText--project\s*\{[^}]*max-width:\s*192px;/s);
    expect(styles).toMatch(/\.SharedPrMetaSegmentText--branch\s*\{[^}]*max-width:\s*224px;/s);
  });
});
