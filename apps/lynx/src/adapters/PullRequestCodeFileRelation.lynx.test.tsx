import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";

import { PullRequestCodeFileHeaderElement } from "./PullRequestCodeCompositionElements.lynx";

describe("Pull Request code file relation identity", () => {
  it.each([
    {
      relation: "copied" as const,
      expected: "copied from original.txt",
    },
    {
      relation: "renamed" as const,
      expected: "renamed from original.txt",
    },
  ])("renders $relation identity explicitly", ({ relation, expected }) => {
    render(
      <PullRequestCodeFileHeaderElement
        path="result.txt"
        previousPath="original.txt"
        relation={relation}
        additions={0}
        deletions={0}
        expanded={false}
        onActivate={() => {}}
      />,
    );

    expect(elementTree.root?.querySelector(".SharedPrCodeFilePrevious")?.textContent).toBe(
      expected,
    );
    expect(
      elementTree.root
        ?.querySelector(".SharedPrCodeFileHeader")
        ?.getAttribute("accessibility-label"),
    ).toBe("Expand result.txt");
  });

  it("escapes control characters without changing the logical path input", () => {
    render(
      <PullRequestCodeFileHeaderElement
        path={"line\nbreak.txt"}
        previousPath={"old\tname.txt"}
        relation="renamed"
        additions={1}
        deletions={1}
        expanded={false}
        onActivate={() => {}}
      />,
    );

    expect(elementTree.root?.querySelector(".SharedPrCodeFilePath")?.textContent).toBe(
      "line\\nbreak.txt",
    );
    expect(elementTree.root?.querySelector(".SharedPrCodeFilePrevious")?.textContent).toBe(
      "renamed from old\\tname.txt",
    );
    expect(
      elementTree.root
        ?.querySelector(".SharedPrCodeFileHeader")
        ?.getAttribute("accessibility-label"),
    ).toBe("Expand line\\nbreak.txt");
  });
});
