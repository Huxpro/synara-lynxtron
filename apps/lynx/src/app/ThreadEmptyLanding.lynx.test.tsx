import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("empty Thread landing fidelity", () => {
  it("centers the shared heading and composer as one stack", () => {
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");

    const emptyThreadBranch = routerSource.slice(
      routerSource.indexOf('bodyState.kind === "empty" ? ('),
    );
    expect(emptyThreadBranch).toContain("<CenteredEmptyLandingStack>");
    expect(routerSource).toContain("<CenteredEmptyLanding projectName={currentThread?.project} />");
    expect(routerSource).toContain("<EmptyThreadContextTray");
    expect(routerSource).toContain('{bodyState.kind === "empty" ? null : composer}');
    expect(routerSource).not.toContain(
      "<ChatEmptyStateHero projectName={currentThread?.project} />",
    );
  });

  it("uses a real project-context tray with route-owned temporary state", () => {
    const traySource = readFileSync(
      new URL("./EmptyThreadContextTray.lynx.tsx", import.meta.url),
      "utf8",
    );
    const lifecycleSource = readFileSync(
      new URL("./temporaryThreadLifecycle.lynx.ts", import.meta.url),
      "utf8",
    );
    const trayStyles = readFileSync(
      new URL("./empty-thread-context-tray.css", import.meta.url),
      "utf8",
    );

    expect(traySource).toContain('"aria-pressed": props.temporary');
    expect(traySource).toContain("onClick={props.onTemporaryChange}");
    expect(traySource).not.toContain("aria-disabled");
    expect(traySource).not.toContain("accessibility-state={{ disabled: true }}");
    expect(traySource).toContain('checked={props.envMode === "worktree"}');
    expect(traySource).toContain('props.onEnvModeChange?.(checked ? "worktree" : "local")');
    expect(traySource).toContain("props.branch ? (");
    expect(traySource).toContain("{props.branch}");
    expect(traySource).not.toContain("props.branch ?? 'main'");
    expect(lifecycleSource).toContain('type: "thread.delete"');
    expect(lifecycleSource).toContain("shouldDeleteDepartingTemporaryThread(");
    expect(trayStyles).toMatch(
      /\.EmptyThreadContextTray\s*\{[^}]*width:\s*calc\(100% - 24px\);[^}]*max-width:\s*var\(--app-chat-max-width, 736px\);[^}]*min-height:\s*58px;[^}]*margin:\s*-20px auto 0;[^}]*padding:\s*24px 8px 6px;/s,
    );
  });

  it("sizes and names the heading as Web's <h2>", () => {
    const headingSource = readFileSync(
      new URL("../adapters/CenteredEmptyLandingElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    const headingStyles = readFileSync(
      new URL("../adapters/centered-empty-landing-elements.css", import.meta.url),
      "utf8",
    );

    expect(headingStyles).toMatch(
      /\.CenteredEmptyLandingFrame\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*var\(--app-chat-max-width, 736px\);[^}]*box-sizing:\s*border-box;[^}]*align-self:\s*center;/s,
    );
    // Upstream's <h2> box: as wide as the one-line text, the whole column once it wraps.
    expect(headingStyles).toMatch(
      /\.CenteredEmptyLandingHeadingBox\s*\{[^}]*max-width:\s*100%;[^}]*align-items:\s*stretch;[^}]*align-self:\s*center;/s,
    );
    expect(headingStyles).toMatch(
      /\.CenteredEmptyLandingHeadingSizer\s*\{[^}]*height:\s*0;[^}]*visibility:\s*hidden;[^}]*white-space:\s*nowrap;/s,
    );
    expect(headingStyles).toMatch(
      /\.SliceRoot--viewport-compact \.CenteredEmptyLandingHeadingBox\s*\{[^}]*max-width:\s*calc\(100% - 48px\);/s,
    );
    // Upstream names the project heading and makes the project name its picker trigger.
    expect(headingSource).toContain("accessibility-label={projectName ? plainHeading : undefined}");
    expect(headingSource).toContain("landingProjectHeadingLabel(projectName)");
    expect(headingSource).toContain("bindtap={openLandingProjectPicker}");
  });

  it("prioritizes the composer in short Thread viewports", () => {
    const appStyles = readFileSync(new URL("./App.css", import.meta.url), "utf8");
    const trayStyles = readFileSync(
      new URL("./empty-thread-context-tray.css", import.meta.url),
      "utf8",
    );

    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+\.CenteredEmptyLandingFrame\s*\{[^}]*display:\s*none;/s,
    );
    expect(appStyles).not.toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+\.EmptyThreadContextTray\s*\{[^}]*display:\s*none;/s,
    );
    expect(trayStyles).toMatch(
      /\.SliceRoot--viewport-short-height \.ThreadPage \.EmptyThreadContextTray\s*\{[^}]*position:\s*fixed;[^}]*left:\s*calc\(50% - 14px\);[^}]*bottom:\s*2px;[^}]*width:\s*28px;[^}]*min-height:\s*28px;/s,
    );
    expect(trayStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+\.EmptyThreadTemporaryButton\s*\{[^}]*width:\s*28px;[^}]*min-width:\s*28px;[^}]*height:\s*28px;[^}]*min-height:\s*28px;/s,
    );
    expect(trayStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+\.EmptyThreadTemporaryLabel\s*\{[^}]*display:\s*none;/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ProviderHealthBannerFrame\s*\{[^}]*display:\s*none;/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-short-height \.ThreadPage\s*\{[^}]*--app-density-composer-editor-min-height:\s*20px;[^}]*--app-density-composer-editor-padding-top:\s*4px;[^}]*--app-density-composer-editor-padding-bottom:\s*2px;/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+\.TranscriptBottomInset\s*\{[^}]*height:\s*8px;/s,
    );
    expect(appStyles).not.toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadsLanding\s+\.CenteredEmptyLandingFrame\s*\{[^}]*display:\s*none;/s,
    );
  });
});
