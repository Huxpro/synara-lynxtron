import { describe, expect, it, rs } from "@rstest/core";
import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { FileIcon } from "../lib/icons.lynx";
import { EditorSurfaceTab } from "./EditorSurfaceTab.lynx";

describe("Lynx editor surface tab", () => {
  it("matches the Web tab resting and close glyph treatment", () => {
    const source = readFileSync(new URL("./EditorSurfaceTab.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./editor-surface-tab.css", import.meta.url), "utf8");

    expect(source).toContain('color={semanticIconColor("secondary")}');
    expect(source).toContain("className={`${close.className} EditorSurfaceTabIconSlot`}");
    expect(styles).toMatch(/\.EditorSurfaceTabRestingIcon\s*\{[^}]*opacity:\s*0\.7;/s);
    expect(styles).toMatch(
      /\.EditorSurfaceTab\.ui-hover \.EditorSurfaceTabRestingIcon,[^}]*opacity:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.EditorSurfaceTab\.ui-focus \.EditorSurfaceTabCloseGlyph[^}]*opacity:\s*1;/s,
    );
  });

  it("keeps decorative glyphs out of the shared slot hit target", () => {
    const styles = readFileSync(new URL("./editor-surface-tab.css", import.meta.url), "utf8");

    expect(styles).toContain("  pointer-events: none;");
    expect(styles).toContain(".EditorSurfaceTabCloseGlyph svg {");
  });

  it("keeps the resting icon and close glyph in one shared slot", async () => {
    const onClose = rs.fn();
    const onSelect = rs.fn();
    render(
      <EditorSurfaceTab
        active
        closeLabel="Close Diff"
        icon={<FileIcon />}
        label="Diff"
        onClose={onClose}
        onSelect={onSelect}
      />,
    );

    const tab = elementTree.root?.querySelector(".EditorSurfaceTab");
    const slot = elementTree.root?.querySelector(".EditorSurfaceTabIconSlot");
    const icon = elementTree.root?.querySelector(".EditorSurfaceTabRestingIcon");
    const close = elementTree.root?.querySelector(".EditorSurfaceTabClose");
    expect(tab?.getAttribute("class")).toContain("EditorSurfaceTab--active");
    expect(slot).not.toBeNull();
    expect(icon).not.toBeNull();
    expect(close?.getAttribute("accessibility-label")).toBe("Close Diff");
    expect(close?.getAttribute("class")).toContain("EditorSurfaceTabIconSlot");

    fireEvent(tab!, new Event("bindEvent:mouseenter", { bubbles: true }));
    await waitFor(() => expect(tab?.getAttribute("class")).toContain("ui-hover"));

    close!.dispatchEvent(new CustomEvent("catchEvent:tap", { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("accepts a deterministic visual state without replacing live events", () => {
    render(
      <EditorSurfaceTab
        closeLabel="Close Diff"
        icon={<FileIcon />}
        label="Diff"
        visualState="focus"
        onClose={() => {}}
      />,
    );
    expect(elementTree.root?.querySelector(".EditorSurfaceTab")?.getAttribute("class")).toContain(
      "ui-focus",
    );
  });
});
