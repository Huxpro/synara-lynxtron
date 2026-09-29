import { describe, expect, it } from "vitest";

import {
  DEFAULT_CHAT_COMPOSER_PLACEHOLDER,
  resolveEmptyComposerEditorMinHeightPx,
} from "./composerPlaceholder";

describe("composer placeholder", () => {
  it("describes the shared mention and slash-command affordances", () => {
    expect(DEFAULT_CHAT_COMPOSER_PLACEHOLDER).toBe(
      "Ask anything, @tag files/folders, or use / to show available commands",
    );
  });

  it("reserves the wrapped placeholder height across pane widths", () => {
    expect(
      resolveEmptyComposerEditorMinHeightPx({ availableWidthPx: 1024, chatFontSizePx: 18 }),
    ).toBe(39);
    expect(
      resolveEmptyComposerEditorMinHeightPx({ availableWidthPx: 328, chatFontSizePx: 18 }),
    ).toBe(58.5);
    expect(
      resolveEmptyComposerEditorMinHeightPx({ availableWidthPx: 192, chatFontSizePx: 18 }),
    ).toBe(117);
    expect(resolveEmptyComposerEditorMinHeightPx({ availableWidthPx: 0, chatFontSizePx: 18 })).toBe(
      39,
    );
  });
});
