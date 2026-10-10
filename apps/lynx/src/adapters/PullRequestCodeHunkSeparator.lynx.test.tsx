import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";
import { PullRequestCodeComposition } from "@synara-web/components/pullRequest/PullRequestCodeComposition";
import { buildPullRequestCodeView } from "@synara-web/components/pullRequest/pullRequestCode.logic";

import {
  buildDiffHunkSeparators,
  buildDiffLineNumberDigits,
} from "../app/diffHunkSeparators.logic";
import {
  PullRequestCodeHunkSeparatorsContext,
  PullRequestCodeLineNumberDigitsContext,
} from "./PullRequestCodeCompositionElements.lynx";

const PATCH = `diff --git a/src/math.ts b/src/math.ts
index 1111111..2222222 100644
--- a/src/math.ts
+++ b/src/math.ts
@@ -5,3 +5,4 @@ export function add() {
 a
 b
+c
 d
@@ -20,3 +21,2 @@ export function sub() {
 e
-f
 g
`;

function all(selector: string): Element[] {
  return Array.from(elementTree.root?.querySelectorAll(selector) ?? []);
}

function renderPatch(options: {
  readonly renderMode: "split" | "stacked";
  readonly dockAnatomy: boolean;
}) {
  const view = buildPullRequestCodeView(PATCH, "test");
  if (view.kind !== "files") throw new Error(`expected files, got ${view.kind}`);
  const hunkSeparators = options.dockAnatomy ? buildDiffHunkSeparators(view.files) : null;
  const lineNumberDigits = options.dockAnatomy ? buildDiffLineNumberDigits(view.files) : null;
  render(
    <PullRequestCodeHunkSeparatorsContext.Provider value={hunkSeparators}>
      <PullRequestCodeLineNumberDigitsContext.Provider value={lineNumberDigits}>
        <PullRequestCodeComposition
          view={view}
          truncated={false}
          renderMode={options.renderMode}
          expandedFileKeys={view.files.map((file) => file.key)}
          visibleLineCounts={{}}
          rawVisibleLineCount={0}
          onToggleFile={() => {}}
          onShowMoreFile={() => {}}
          onShowMoreRaw={() => {}}
        />
      </PullRequestCodeLineNumberDigitsContext.Provider>
    </PullRequestCodeHunkSeparatorsContext.Provider>,
  );
  return {
    separators: all(".SharedPrCodeHunkSeparator"),
    separatorTexts: all(".SharedPrCodeHunkSeparatorText").map((node) => node.textContent),
    hunkRows: all(".SharedPrCodeLine--hunk"),
    lineNumbers: all(".SharedPrCodeLineNumber"),
  };
}

describe("Pull Request code hunk separators (diff dock anatomy)", () => {
  it("puts upstream's unmodified-lines band in front of each hunk of the split grid", () => {
    const { separators, separatorTexts, hunkRows } = renderPatch({
      renderMode: "split",
      dockAnatomy: true,
    });

    expect(separatorTexts).toEqual(["4 unmodified lines", "12 unmodified lines"]);
    // Only the band under the file header drops its top margin.
    expect(separators.map((node) => node.getAttribute("class"))).toEqual([
      "SharedPrCodeHunkSeparator SharedPrCodeHunkSeparator--first",
      "SharedPrCodeHunkSeparator",
    ]);
    // Each band is the sibling right before its hunk's first split row.
    for (const separator of separators) {
      expect(separator.nextElementSibling?.getAttribute("class")).toBe("SharedPrCodeSplitRow");
    }
    expect(hunkRows).toHaveLength(0);
  });

  it("replaces the raw @@ rows of the stacked view with the same bands", () => {
    const { separatorTexts, hunkRows } = renderPatch({ renderMode: "stacked", dockAnatomy: true });

    expect(separatorTexts).toEqual(["4 unmodified lines", "12 unmodified lines"]);
    expect(hunkRows).toHaveLength(0);
  });

  it("leaves surfaces without the provider as they were", () => {
    const split = renderPatch({ renderMode: "split", dockAnatomy: false });
    expect(split.separators).toHaveLength(0);

    const stacked = renderPatch({ renderMode: "stacked", dockAnatomy: false });
    expect(stacked.separators).toHaveLength(0);
    expect(stacked.hunkRows).toHaveLength(2);
  });

  it("pads split line numbers to the file's widest number so none wraps", () => {
    const { lineNumbers } = renderPatch({ renderMode: "split", dockAnatomy: true });
    const texts = lineNumbers.map((node) => node.textContent ?? "");

    expect(texts.length).toBeGreaterThan(0);
    // The file reaches line 22: one-digit numbers get a leading no-break space.
    expect(new Set(texts.map((text) => text.length))).toEqual(new Set([2]));
    expect(texts).toContain(" 5");
    expect(texts).toContain("22");
    expect(
      lineNumbers.every((node) =>
        (node.getAttribute("class") ?? "").includes("SharedPrCodeLineNumber--intrinsic"),
      ),
    ).toBe(true);
  });

  it("keeps the fixed number column where no digit count is provided", () => {
    const { lineNumbers } = renderPatch({ renderMode: "split", dockAnatomy: false });

    expect(lineNumbers.map((node) => node.textContent)).toContain("5");
    expect(
      lineNumbers.some((node) =>
        (node.getAttribute("class") ?? "").includes("SharedPrCodeLineNumber--intrinsic"),
      ),
    ).toBe(false);
  });
});
