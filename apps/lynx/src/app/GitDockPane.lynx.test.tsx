import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Native Git right-dock pane", () => {
  it("uses canonical staged and unstaged RPCs plus the portable diff renderer", () => {
    const source = readFileSync(new URL("./GitDockPane.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain(
      'gitWorkingTreeDiffQueryOptions({ cwd: props.workspaceRoot, scope: "staged" })',
    );
    expect(source).toContain(
      'gitWorkingTreeDiffQueryOptions({ cwd: props.workspaceRoot, scope: "unstaged" })',
    );
    expect(source).toContain("buildPullRequestCodeView");
    expect(source).toContain("<PullRequestCodeComposition");
    expect(source).toContain(
      "gitStageFilesMutationOptions({ cwd: props.workspaceRoot, queryClient })",
    );
    expect(source).toContain(
      "gitUnstageFilesMutationOptions({ cwd: props.workspaceRoot, queryClient })",
    );
    expect(source).toContain("fallbackSection");
    expect(source).toContain('color={semanticIconColor("secondary")}');
    expect(source).toContain('selectedResolved?.section === "staged"');
    expect(source).toContain('selectedResolved?.section === "unstaged"');
  });

  it("is wired as a singleton shared right-dock pane", () => {
    const router = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    expect(router).toContain('activePane?.kind === "git"');
    expect(router).toContain(`"diff",
          "explorer",
          "terminal",
          "sidechat",
          "git",`);
    expect(router).toContain("<GitDockPane");
  });

  it("places the source-control dividers where Electron's GitPanel does", () => {
    const styles = readFileSync(new URL("./git-dock-pane.css", import.meta.url), "utf8");
    const source = readFileSync(new URL("./GitDockPane.lynx.tsx", import.meta.url), "utf8");
    // Pane header: the shared dock header row with its layout-neutral hairline.
    expect(source).toContain("<DockPaneHeader");
    expect(source).toContain('title="Source control"');
    // List/diff split: border-t border-border/70 on the diff viewport, not the list.
    expect(styles).not.toMatch(/\.GitDockFileList\s*\{[^}]*border-bottom/s);
    expect(styles).toMatch(
      /\.GitDockDiff\s*\{[^}]*border-top-width:\s*1px;[^}]*border-top-style:\s*solid;[^}]*border-top-color:\s*color-mix\(in oklab, var\(--color-border\) 70%, transparent\);/s,
    );
  });
});
