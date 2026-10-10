import { describe, expect, it, rs } from "@rstest/core";
import { render, waitFor } from "@lynx-js/react/testing-library";

const rects: Record<string, { left: number; top: number; width: number; height: number } | null> =
  {};
rs.mock("../components/ui/measure.lynx", () => ({
  measureLynxElementsById: (ids: readonly string[]) =>
    Promise.resolve(ids.map((id) => rects[id] ?? null)),
}));

const { DiffDockChangeMarkers } = await import("./DiffDockChangeMarkers.lynx");

function markers() {
  return Array.from(elementTree.root?.querySelectorAll(".DiffDockChangeMarker") ?? []).map(
    (node) => ({
      label: node.getAttribute("accessibility-label"),
      style: node.getAttribute("style") ?? "",
    }),
  );
}

describe("Diff dock change markers", () => {
  it("places upstream's markers by each file's offset in the scrolled content", async () => {
    // A 400px viewport over 800px of content, read while scrolled down by 100px.
    rects.viewport = { left: 0, top: 88, width: 484, height: 400 };
    rects.content = { left: 0, top: -12, width: 484, height: 800 };
    rects["file-0"] = { left: 8, top: -4, width: 468, height: 300 };
    rects["file-1"] = { left: 8, top: 388, width: 468, height: 300 };
    rects["file-2"] = { left: 8, top: 788, width: 468, height: 300 };

    render(
      <DiffDockChangeMarkers
        viewportId="viewport"
        contentId="content"
        files={[
          { path: "README.md", elementId: "file-0", changeType: "change" },
          { path: "src/new.ts", elementId: "file-1", changeType: "new" },
          { path: "src/old.ts", elementId: "file-2", changeType: "deleted" },
        ]}
        layoutRevision={0}
        onSelectFilePath={() => {}}
      />,
    );

    await waitFor(() => expect(markers()).toHaveLength(3));
    expect(
      elementTree.root
        ?.querySelector(".DiffDockChangeMarkers")
        ?.getAttribute("accessibility-label"),
    ).toBe("Change markers");
    expect(markers().map((marker) => marker.label)).toEqual([
      "Modified: README.md",
      "Added: src/new.ts",
      "Deleted: src/old.ts",
    ]);
    // offsetTop 8, 400 and 800 of 800 on a 400px strip; the last is clamped to 400 - 3.
    const styles = markers().map((marker) => marker.style);
    expect(styles[0]).toMatch(/top:\s*4px/);
    expect(styles[1]).toMatch(/top:\s*200px/);
    expect(styles[2]).toMatch(/top:\s*397px/);
    expect(styles.every((style) => /height:\s*3px/.test(style))).toBe(true);
    expect(styles[1]).toContain("var(--success)");
    expect(styles[2]).toContain("var(--destructive)");
  });

  it("renders no strip while the patch has not been laid out", async () => {
    delete rects.viewport;
    render(
      <DiffDockChangeMarkers
        viewportId="viewport"
        contentId="content"
        files={[{ path: "README.md", elementId: "file-0", changeType: "change" }]}
        layoutRevision={0}
        onSelectFilePath={() => {}}
      />,
    );

    await Promise.resolve();
    expect(elementTree.root?.querySelector(".DiffDockChangeMarkers")).toBeNull();
  });
});
