import fs from "node:fs";
import path from "node:path";
import { render } from "@lynx-js/react/testing-library";
import { describe, expect, it } from "@rstest/core";

import lynxtronDarkMarkUrl from "../../../resources/lynxtron-mark-dark.png";
import lynxtronLightMarkUrl from "../../../resources/lynxtron-mark-light.png";
import { aboutLynxVersionLine } from "./AboutLynxDialog.lynx";
import { LynxBrandMarks } from "./LynxBrandMarks.lynx";

const styles = fs.readFileSync(path.resolve(__dirname, "lynx-brand-marks.css"), "utf8");

/** The `display` a selector's own rule sets, read from the stylesheet. */
function displayOf(selector: string): string | undefined {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\n)${escaped}\\s*\\{[^}]*display:\\s*([a-z]+);`).exec(styles)?.[1];
}

describe("Lynx brand marks", () => {
  it("renders the Lynx logo and the Lynxtron mark as two labelled images", () => {
    render(<LynxBrandMarks />);
    const marks = Array.from(elementTree.root?.querySelectorAll(".LynxBrandMarksMark") ?? []);
    expect(marks.map((mark) => mark.getAttribute("accessibility-label"))).toEqual([
      "Lynx logo",
      "Lynxtron logo",
    ]);
    for (const mark of marks) {
      expect(mark.getAttribute("accessibility-trait")).toBe("image");
      expect(mark.getAttribute("style")).toContain("width: 40px");
      expect(mark.getAttribute("style")).toContain("height: 40px");
    }
    expect(marks[0]?.querySelector("svg")?.getAttribute("content")).toContain(
      'viewBox="0 0 40 40"',
    );
  });

  it("sizes both marks from the size prop", () => {
    render(<LynxBrandMarks size={14} />);
    const marks = Array.from(elementTree.root?.querySelectorAll(".LynxBrandMarksMark") ?? []);
    expect(marks).toHaveLength(2);
    for (const mark of marks) expect(mark.getAttribute("style")).toContain("width: 14px");
  });

  it("switches the Lynxtron bitmap with the theme", () => {
    render(<LynxBrandMarks />);
    const onLight = elementTree.root?.querySelector(".LynxBrandMarksLynxtron--on-light");
    const onDark = elementTree.root?.querySelector(".LynxBrandMarksLynxtron--on-dark");
    expect(lynxtronDarkMarkUrl).not.toBe(lynxtronLightMarkUrl);
    expect(onLight?.getAttribute("src")).toBe(lynxtronDarkMarkUrl);
    expect(onDark?.getAttribute("src")).toBe(lynxtronLightMarkUrl);
    // Light theme: only the dark bitmap. Dark theme (`SliceRoot--theme-dark`): only the light one.
    expect(displayOf(".LynxBrandMarksLynxtron--on-light")).toBeUndefined();
    expect(displayOf(".LynxBrandMarksLynxtron--on-dark")).toBe("none");
    expect(displayOf(".SliceRoot--theme-dark .LynxBrandMarksLynxtron--on-light")).toBe("none");
    expect(displayOf(".SliceRoot--theme-dark .LynxBrandMarksLynxtron--on-dark")).toBe("flex");
  });
});

describe("About dialog version line", () => {
  it("leaves out the engine version when the runtime does not report one", () => {
    expect(aboutLynxVersionLine("0.9.3", null)).toBe("Synara 0.9.3");
    expect(aboutLynxVersionLine("0.9.3", "3.4")).toBe("Synara 0.9.3 · Lynx engine 3.4");
  });
});
