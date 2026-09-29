import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Kanban route header fidelity", () => {
  it("matches the Web header rail, rhythm, and action anatomy", () => {
    const styles = readFileSync(
      new URL("./kanban-route-header-composition-elements.css", import.meta.url),
      "utf8",
    );
    const appStyles = readFileSync(new URL("../app/App.css", import.meta.url), "utf8");
    const source = readFileSync(
      new URL("./KanbanRouteHeaderCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(
      /\.SharedKanbanRouteHeader\s*\{[^}]*height:\s*46px;[^}]*padding:\s*0 20px;/s,
    );

    // Electron route header: the shared layout-neutral chat-surface hairline.

    expect(styles).not.toMatch(/\.SharedKanbanRouteHeader\s*\{[^}]*border-bottom/s);

    expect(
      readFileSync(
        new URL("./KanbanRouteHeaderCompositionElements.lynx.tsx", import.meta.url),
        "utf8",
      ),
    ).toContain('className="SharedKanbanRouteHeader chat-surface-divider"');
    expect(styles).toMatch(
      /\.SharedKanbanRouteHeaderRow\s*\{[^}]*height:\s*46px;[^}]*gap:\s*12px;/s,
    );
    expect(styles).toMatch(
      /\.SharedKanbanRouteTitle\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;[^}]*font-weight:\s*500;/s,
    );
    expect(styles).toMatch(
      /\.SharedKanbanRouteCount\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s,
    );
    expect(styles).toMatch(
      /\.SharedKanbanRouteNewTask\s*\{[^}]*gap:\s*6px;[^}]*padding:\s*0 10px;/s,
    );
    expect(styles).toMatch(/\.SharedKanbanRouteNewTask--disabled\s*\{[^}]*opacity:\s*0\.64;/s);
    expect(source).toContain('className="SharedKanbanRouteNewTaskIcon"');
    expect(source).toContain('className="SharedKanbanRouteBackIcon"');
    expect(source.match(/color=\{semanticIconColor\(["']secondary["']\)\}/g)?.length).toBe(2);
    expect(source).not.toContain("SharedKanbanRouteBackGlyph");
    expect(source).not.toContain("＋ New task");
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-compact\s+\.AppMain--sidebar-closed\s+\.SharedKanbanRouteHeader,[\s\S]*?\.SliceRoot--viewport-medium\s+\.AppMain--sidebar-closed\s+\.SharedKanbanRouteHeader\s*\{[^}]*height:\s*92px;[^}]*padding:\s*46px 20px 0;/s,
    );
  });
});
