import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { PullRequestCodeFileHeaderElement } from "./PullRequestCodeCompositionElements";

describe("PullRequestCodeFileHeaderElement", () => {
  it("renders escaped control paths in text and accessible identity", () => {
    const markup = renderToStaticMarkup(
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

    expect(markup).toContain("line\\nbreak.txt");
    expect(markup).toContain("renamed from");
    expect(markup).toContain("old\\tname.txt");
    expect(markup).toContain('aria-label="Expand line\\nbreak.txt"');
  });
});
