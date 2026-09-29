import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import {
  buildPullRequestChecksRingSvg,
  PullRequestSummaryMetaIcon,
} from "./PullRequestSummaryMetaIcon.lynx";

const checks = [
  {
    name: "build",
    status: "success" as const,
    description: null,
    url: null,
    startedAt: null,
    completedAt: null,
  },
  {
    name: "test",
    status: "failure" as const,
    description: null,
    url: null,
    startedAt: null,
    completedAt: null,
  },
  {
    name: "lint",
    status: "pending" as const,
    description: null,
    url: null,
    startedAt: null,
    completedAt: null,
  },
  {
    name: "docs",
    status: "skipped" as const,
    description: null,
    url: null,
    startedAt: null,
    completedAt: null,
  },
];

describe("Pull Request summary meta icons", () => {
  it("builds proportional success, failure, pending, and neutral ring segments", () => {
    const svg = buildPullRequestChecksRingSvg({
      checks,
      colors: {
        success: "#00aa00",
        failure: "#cc0000",
        pending: "#dd9900",
        neutral: "#777777",
      },
    });

    expect(svg).toContain("rotate(-90 8 8)");
    expect(svg.match(/<circle/g)).toHaveLength(4);
    expect(svg).toContain('stroke="#00aa00"');
    expect(svg).toContain('stroke="#cc0000"');
    expect(svg).toContain('stroke="#dd9900"');
    expect(svg).toContain('stroke="#777777"');
    expect(svg).toContain('stroke-linecap="round"');
  });

  it("renders exact merge, reviewer, comment, and checks identities", () => {
    render(
      <>
        <PullRequestSummaryMetaIcon kind="merge" />
        <PullRequestSummaryMetaIcon kind="reviewers" />
        <PullRequestSummaryMetaIcon kind="comments" />
        <PullRequestSummaryMetaIcon kind="checks" checks={checks} />
      </>,
    );

    expect(elementTree.root?.querySelectorAll(".SharedPrSummaryMetaLabelIcon")).toHaveLength(4);
    const source = readFileSync(
      new URL("./PullRequestSummaryMetaIcon.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("pending: svgColors.warning");
    expect(source).not.toContain("buildThemeCssVariables");
    expect(source).not.toContain("pending: '#d97706'");
  });
});
