import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import {
  findComposerMenuActiveItem,
  nudgeComposerMenuActiveItemId,
  resolveComposerMenuActiveItemId,
} from "./composerMenuNavigation.logic";

const items = [
  {
    id: "slash:plan",
    type: "slash-command" as const,
    command: "plan" as const,
    label: "Plan",
    description: "Use plan mode",
    source: "app" as const,
  },
  {
    id: "slash:default",
    type: "slash-command" as const,
    command: "default" as const,
    label: "Default",
    description: "Use default mode",
    source: "app" as const,
  },
  {
    id: "slash:subagents",
    type: "slash-command" as const,
    command: "subagents" as const,
    label: "Subagents",
    description: "Delegate work",
    source: "app" as const,
  },
];

describe("Native Composer menu navigation", () => {
  it("falls back to the first available item when the highlight is stale", () => {
    expect(
      resolveComposerMenuActiveItemId({
        activeItemId: "missing",
        items,
      }),
    ).toBe("slash:plan");
    expect(
      resolveComposerMenuActiveItemId({
        activeItemId: "slash:default",
        items,
      }),
    ).toBe("slash:default");
    expect(
      resolveComposerMenuActiveItemId({
        activeItemId: null,
        items: [],
      }),
    ).toBeNull();
  });

  it("wraps next and previous navigation like the Web authority", () => {
    expect(
      nudgeComposerMenuActiveItemId({
        activeItemId: "slash:subagents",
        direction: "next",
        items,
      }),
    ).toBe("slash:plan");
    expect(
      nudgeComposerMenuActiveItemId({
        activeItemId: "slash:plan",
        direction: "previous",
        items,
      }),
    ).toBe("slash:subagents");
    expect(
      nudgeComposerMenuActiveItemId({
        activeItemId: null,
        direction: "next",
        items,
      }),
    ).toBe("slash:plan");
    expect(
      nudgeComposerMenuActiveItemId({
        activeItemId: null,
        direction: "previous",
        items,
      }),
    ).toBe("slash:subagents");
  });

  it("selects the highlighted item and falls back to the first item", () => {
    expect(
      findComposerMenuActiveItem({
        activeItemId: "slash:default",
        items,
      })?.id,
    ).toBe("slash:default");
    expect(
      findComposerMenuActiveItem({
        activeItemId: "missing",
        items,
      })?.id,
    ).toBe("slash:plan");
    expect(
      findComposerMenuActiveItem({
        activeItemId: null,
        items: [],
      }),
    ).toBeNull();
  });

  it("wires every menu kind to one highlight owner without catching unrelated keys", () => {
    const source = readFileSync(new URL("./Composer.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain("catchkeydown={handleComposerMenuKey}");
    expect(source).not.toContain("bindkeydown={handleComposerMenuKey}");
    expect(source).toContain('confirm-type="send"');
    expect(source).toContain("bindconfirm={() => {");
    expect(source).toContain("event.key === 'Enter'");
    expect(source).toContain("event.shiftKey !== true");
    expect(source).toContain("!nativeEditorSnapshotRef.current.isComposing");
    expect(source).toContain("void activatePrimaryAction()");
    expect(source.match(/activeItemId=\{activeComposerMenuItemId\}/g)).toHaveLength(3);
    expect(source.match(/onHighlightedItemChange=\{setComposerHighlightedItemId\}/g)).toHaveLength(
      3,
    );
    expect(source).not.toContain("onHighlightedItemChange={() => undefined}");
    const adapterSource = readFileSync(
      new URL("../../adapters/ComposerCommandMenuCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(adapterSource).toContain("scrollLynxElementIntoViewById(");
    expect(adapterSource).toContain("'nearest'");
    expect(adapterSource).toContain("id={composerCommandRowId(props.item.id)}");
  });
});
