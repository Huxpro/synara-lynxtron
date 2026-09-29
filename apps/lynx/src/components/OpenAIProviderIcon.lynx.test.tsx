import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";

import { hasLynxProviderIcon, OpenAIProviderIcon } from "./OpenAIProviderIcon.lynx";

describe("Lynx provider icon coverage", () => {
  it("renders canonical icons for every provider that previously fell back to text", () => {
    for (const provider of ["droid", "kilo", "pi"]) {
      expect(hasLynxProviderIcon(provider)).toBe(true);
    }

    render(
      <>
        <OpenAIProviderIcon provider="droid" />
        <OpenAIProviderIcon provider="kilo" />
        <OpenAIProviderIcon provider="pi" />
      </>,
    );

    const icons = elementTree.root?.querySelectorAll(".OpenAIProviderIcon") ?? [];
    expect(icons).toHaveLength(3);
    expect(icons[0]?.getAttribute("content")).toContain('viewBox="0 0 67 65"');
    expect(icons[1]?.getAttribute("content")).toContain('viewBox="0 0 100 100"');
    expect(icons[2]?.getAttribute("content")).toContain('viewBox="0 0 800 800"');
  });

  it("uses an explicit semantic paint when a surface overrides the default icon tone", () => {
    render(<OpenAIProviderIcon provider="codex" color="#ffffff" />);

    const icon = elementTree.root?.querySelector(".OpenAIProviderIcon");
    expect(icon?.getAttribute("content")).toContain("#ffffff");
  });
});
