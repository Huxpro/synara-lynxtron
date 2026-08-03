// FILE: ComposerExtrasMenuComposition.test.tsx
// Purpose: Pins the physical shared extras-menu anatomy without a browser runtime.

import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/components/ui/menu", () => ({
  Menu: ({ children }: { children?: ReactNode }) => <div data-menu>{children}</div>,
  MenuTrigger: ({ render }: { render?: ReactNode }) => <>{render}</>,
  MenuCheckboxItem: ({ children }: { children?: ReactNode }) => (
    <div data-checkbox-item>{children}</div>
  ),
  MenuRadioGroup: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  MenuRadioItem: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  MenuSeparator: () => <hr />,
  MenuSub: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  MenuSubTrigger: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ComposerExtrasMenuCompositionElements", () => ({
  ComposerExtrasMenuTriggerHostElement: ({ open }: { open: boolean }) => (
    <button aria-label="Composer extras" aria-expanded={open} />
  ),
  ComposerExtrasMenuPopupElement: ({ children }: { children?: ReactNode }) => (
    <div data-popup>{children}</div>
  ),
  ComposerExtrasSubPopupElement: ({ children }: { children?: ReactNode }) => (
    <div data-sub-popup>{children}</div>
  ),
  ComposerExtrasImageItemElement: () => <div data-image-item>Add image</div>,
  ComposerExtrasPlanLabelElement: () => <span>Plan mode</span>,
  ComposerExtrasFastLabelElement: () => <span>Fast</span>,
}));

import { ComposerExtrasMenuComposition } from "./ComposerExtrasMenuComposition";

describe("ComposerExtrasMenuComposition", () => {
  it("owns attachment, plan, and optional fast control ordering", () => {
    const markup = renderToStaticMarkup(
      <ComposerExtrasMenuComposition
        interactionMode="plan"
        supportsFastMode
        fastModeEnabled
        onAddPhotos={() => undefined}
        onToggleFastMode={() => undefined}
        onSetPlanMode={() => undefined}
      />,
    );

    expect(markup).toContain("data-image-item");
    expect(markup).toContain('aria-label="Composer extras"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup.indexOf("Add image")).toBeLessThan(markup.indexOf("Plan mode"));
    expect(markup.indexOf("Plan mode")).toBeLessThan(markup.indexOf("Fast"));
  });

  it("omits the unsupported fast branch", () => {
    const markup = renderToStaticMarkup(
      <ComposerExtrasMenuComposition
        interactionMode="default"
        supportsFastMode={false}
        fastModeEnabled={false}
        onAddPhotos={() => undefined}
        onToggleFastMode={() => undefined}
        onSetPlanMode={() => undefined}
      />,
    );

    expect(markup).toContain("Plan mode");
    expect(markup).not.toContain(">Fast<");
  });
});
