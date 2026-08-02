// FILE: ComposerInputComposition.test.tsx
// Purpose: Pins the shared composer shell/editor/footer anatomy.

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ComposerEditorRegionComposition,
  ComposerFooterContentComposition,
  ComposerFooterRowComposition,
  ComposerInputSurfaceComposition,
  ComposerPrimaryActionComposition,
} from "./ComposerInputComposition";
import {
  COMPOSER_EDITOR_PADDING_CLASS_NAME,
  COMPOSER_FOOTER_ROW_CLASS_NAME,
  COMPOSER_INPUT_SHELL_CLASS_NAME,
  COMPOSER_INPUT_SURFACE_CLASS_NAME,
} from "./composerPickerStyles";

describe("ComposerInputComposition", () => {
  it("owns the shell, surface, editor, and footer nesting", () => {
    const markup = renderToStaticMarkup(
      <ComposerInputSurfaceComposition
        focused
        overflowVisible
        providerFrameClassName="provider-frame"
        providerSurfaceClassName="provider-surface"
      >
        <ComposerEditorRegionComposition overflowVisible>
          <span data-region="editor" />
        </ComposerEditorRegionComposition>
        <ComposerFooterRowComposition compact>
          <ComposerFooterContentComposition
            compact
            leading={<span data-region="leading">Leading</span>}
            actions={
              <ComposerPrimaryActionComposition mode="send" onActivate={() => undefined} />
            }
          />
        </ComposerFooterRowComposition>
      </ComposerInputSurfaceComposition>,
    );

    for (const className of [
      COMPOSER_INPUT_SHELL_CLASS_NAME,
      COMPOSER_INPUT_SURFACE_CLASS_NAME,
      COMPOSER_EDITOR_PADDING_CLASS_NAME,
      COMPOSER_FOOTER_ROW_CLASS_NAME,
    ]) {
      for (const token of className.split(/\s+/)) {
        expect(markup).toContain(token);
      }
    }
    expect(markup).toContain('data-composer-focused="true"');
    expect(markup).toContain("provider-frame");
    expect(markup).toContain("provider-surface");
    expect(markup.indexOf('data-region="editor"')).toBeLessThan(
      markup.indexOf('data-region="leading"'),
    );
    expect(markup.indexOf('data-chat-composer-leading="true"')).toBeLessThan(
      markup.indexOf('data-chat-composer-actions="right"'),
    );
    expect(markup).toContain('aria-label="Send message"');
    expect(markup).toContain("gap-1.5");
  });

  it("omits absent footer clusters and owns the stop presentation", () => {
    const markup = renderToStaticMarkup(
      <ComposerFooterRowComposition>
        <ComposerFooterContentComposition
          actions={
            <ComposerPrimaryActionComposition mode="stop" onActivate={() => undefined} />
          }
        />
      </ComposerFooterRowComposition>,
    );

    expect(markup).not.toContain("data-chat-composer-leading");
    expect(markup).toContain('data-chat-composer-actions="right"');
    expect(markup).toContain('aria-label="Stop generation"');
  });
});
