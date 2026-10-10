import { render } from "@lynx-js/react/testing-library";
import { describe, expect, it } from "@rstest/core";

import { PullRequestCompareIcon } from "./PullRequestCompareIcon.lynx";

describe("sidebar pull request icon", () => {
  it("renders the exact Web IoIosGitCompare path", () => {
    render(
      <PullRequestCompareIcon className="PullRequestCompareIcon" color="rgba(31, 31, 31, 0.65)" />,
    );

    const icon = elementTree.root?.querySelector(".PullRequestCompareIcon");
    expect(icon?.nodeName).toBe("SVG");
    expect(icon?.getAttribute("class")).toContain("PullRequestCompareIcon");
    expect(icon?.getAttribute("content")).toContain("M233.9 328.1");
    expect(icon?.getAttribute("content")).toContain('viewBox="0 0 512 512"');
    expect(icon?.getAttribute("content")).toContain('fill="rgba(31, 31, 31, 0.65)"');
  });
});
