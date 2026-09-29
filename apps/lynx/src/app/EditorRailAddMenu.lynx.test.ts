import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("EditorRailAddMenu component identity", () => {
  it("reuses one shared composition in the product and removes the modal substitute", () => {
    const menu = readFileSync(new URL("./EditorRailAddMenu.lynx.tsx", import.meta.url), "utf8");
    const tabs = readFileSync(new URL("./EditorRailTabs.lynx.tsx", import.meta.url), "utf8");
    const router = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./editor-rail-add-menu.css", import.meta.url), "utf8");
    const adapter = readFileSync(
      new URL("../adapters/EditorRailAddMenuCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    const composition = readFileSync(
      new URL("../../../web/src/components/chat/EditorRailAddMenuComposition.tsx", import.meta.url),
      "utf8",
    );
    expect(menu).toContain("EditorRailAddMenuComposition");
    expect(menu).toContain('MenuPopup className="ThreadEditorAddMenuPopup"');
    expect(menu).toContain("autoHighlightFirst={false}");
    expect(composition).toContain('label="New chat"');
    expect(composition).toContain('label="New terminal"');
    expect(composition).toContain("EditorRailAddMenuChatIconElement");
    expect(composition).toContain("EditorRailAddMenuTerminalIconElement");
    expect(adapter).toContain(
      '<MessageCircleIcon color={semanticIconColor("primary")} size={14} />',
    );
    expect(adapter).toContain("@synara-central-icons/console.svg?raw");
    expect(adapter.match(/semanticIconColor\(["']primary["']\)/g)).toHaveLength(2);
    expect(adapter).not.toContain("svgColors.iconSecondary");
    expect(adapter).toContain('className="ThreadEditorAddMenuSvgIcon"');
    expect(tabs).toContain("<EditorRailAddMenu");
    expect(router).not.toContain("ThreadEditorNewDialog");
    expect(styles).toContain("height: 26px");
    expect(styles).toContain("justify-content: flex-start");
    expect(styles).toContain(".ThreadEditorAddMenuContent");
    expect(styles).toContain("text-align: left");
  });
});
