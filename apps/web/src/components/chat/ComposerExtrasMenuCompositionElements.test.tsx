// FILE: ComposerExtrasMenuCompositionElements.test.tsx
// Purpose: Pins the Web image-picker host contract used by the shared extras menu.

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ComposerExtrasImageItemElement } from "./ComposerExtrasMenuCompositionElements";
import { Menu } from "../ui/menu";

describe("ComposerExtrasMenuCompositionElements", () => {
  it("keeps the Web image picker image-only and multi-select", () => {
    const markup = renderToStaticMarkup(
      <Menu>
        <ComposerExtrasImageItemElement available onAddPhotos={() => undefined} />
      </Menu>,
    );

    expect(markup).toContain('data-testid="composer-photo-input"');
    expect(markup).toContain('accept="image/*"');
    expect(markup).toContain("multiple");
    expect(markup).toContain("Add image");
  });
});
