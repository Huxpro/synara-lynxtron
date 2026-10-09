import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Kanban project typography fidelity", () => {
  it("matches Web column title and count line boxes", () => {
    const styles = readFileSync(
      new URL("./kanban-column-composition-elements.css", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(
      /\.SharedKanbanColumnTitle\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-lg, 14px\);[^}]*font-weight:\s*500;[^}]*line-height:\s*21px;[^}]*opacity:\s*0\.9;/s,
    );
    expect(styles).toMatch(
      /\.SharedKanbanColumnCount\s*\{[^}]*font-size:\s*var\(--app-font-size-ui, 13px\);[^}]*line-height:\s*17\.875px;[^}]*opacity:\s*0\.7;/s,
    );
    expect(styles).toMatch(
      /\.SharedKanbanColumnHeader\s*\{[^}]*height:\s*32px;[^}]*gap:\s*8px;[^}]*padding:\s*0 6px 8px;/s,
    );
  });

  it("matches Web card material and title identity", () => {
    const styles = readFileSync(
      new URL("./kanban-card-composition-elements.css", import.meta.url),
      "utf8",
    );
    const source = readFileSync(
      new URL("./KanbanCardCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(
      /\.SharedKanbanCard\s*\{[^}]*gap:\s*6px;[^}]*padding:\s*10px 12px;[^}]*border-radius:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.SharedKanbanCardTitle\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-lg, 14px\);[^}]*font-weight:\s*500;[^}]*line-height:\s*19\.25px;/s,
    );
    expect(styles).not.toContain(".SharedKanbanCardActionsText");
    expect(styles).toMatch(
      /\.SharedKanbanCardMetaText,[\s\S]*\.SharedKanbanCardWorking\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-sm, 12px\);[^}]*line-height:\s*16\.5px;[^}]*opacity:\s*0\.7;/s,
    );
    expect(styles).toMatch(
      /\.SharedKanbanCardMetaRow\s*\{[^}]*margin-top:\s*0;[^}]*padding-top:\s*2px;/s,
    );
    expect(styles).toMatch(/\.SharedKanbanCardBranch\s*\{[^}]*gap:\s*4px;/s);
    expect(source).toMatch(
      /<GitBranchIcon\s+className="SharedKanbanCardBranchIcon"\s+color=\{semanticIconColor\("secondary"\)\}\s+size=\{12\}\s+\/>/,
    );
  });

  it("lets the route-owned three-column grid shrink each vertical scroller", () => {
    const styles = readFileSync(
      new URL("./kanban-column-composition-elements.css", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(/\.SharedKanbanColumnRoot\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s);
    expect(styles).not.toMatch(/\.SharedKanbanColumnRoot\s*\{[^}]*min-width:\s*256px;/s);
    expect(styles).toMatch(
      /\.SharedKanbanColumnScroller\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*min-height:\s*96px;/s,
    );
    expect(styles).toMatch(
      /\.SharedKanbanColumnCardList\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*padding:\s*4px;/s,
    );
  });

  it("uses horizontal scrolling instead of crushing compact columns", () => {
    const appStyles = readFileSync(new URL("../app/App.css", import.meta.url), "utf8");
    const source = readFileSync(new URL("../app/FeatureListsPage.tsx", import.meta.url), "utf8");

    expect(source).toContain(
      '<scroll-view className="KanbanScroller" scroll-orientation="horizontal"',
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-compact \.KanbanColumns\s*\{[^}]*width:\s*824px;/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-compact \.KanbanColumnHost\s*\{[^}]*flex:\s*none;[^}]*width:\s*256px;[^}]*min-width:\s*256px;/s,
    );
  });
});
