import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import ProjectScriptsControl from "./ProjectScriptsControl";

describe("ProjectScriptsControl", () => {
  it("renders the empty project actions state", () => {
    const markup = renderToStaticMarkup(
      <ProjectScriptsControl
        scripts={[]}
        keybindings={{} as never}
        onRunScript={vi.fn()}
        onAddScript={vi.fn()}
        onUpdateScript={vi.fn()}
        onDeleteScript={vi.fn()}
      />,
    );

    expect(markup).toContain("Add action");
  });
});
