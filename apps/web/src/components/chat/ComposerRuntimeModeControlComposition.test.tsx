// FILE: ComposerRuntimeModeControlComposition.test.tsx
// Purpose: Pins shared permission-control visibility and option ordering.

import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/components/ui/menu", () => ({
  Menu: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  MenuTrigger: ({ render }: { render?: ReactNode }) => <>{render}</>,
  MenuRadioGroup: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  MenuRadioItem: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ComposerRuntimeModeControlCompositionElements", () => ({
  ComposerRuntimeModeTriggerElement: ({ runtimeMode }: { runtimeMode: string }) => (
    <button data-runtime-mode={runtimeMode} />
  ),
  ComposerRuntimeModePopupElement: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
  ComposerRuntimeFullAccessLabelElement: () => <span>Full access</span>,
  ComposerRuntimeRestrictedLabelElement: () => <span>Default permissions</span>,
}));

import { ComposerRuntimeModeControlComposition } from "./ComposerRuntimeModeControlComposition";

describe("ComposerRuntimeModeControlComposition", () => {
  it("owns current mode and full-access then restricted option ordering", () => {
    const markup = renderToStaticMarkup(
      <ComposerRuntimeModeControlComposition
        runtimeMode="approval-required"
        onRuntimeModeChange={() => undefined}
      />,
    );

    expect(markup).toContain('data-runtime-mode="approval-required"');
    expect(markup.indexOf("Full access")).toBeLessThan(markup.indexOf("Default permissions"));
  });

  it("omits the control without a real mode transition", () => {
    expect(
      renderToStaticMarkup(<ComposerRuntimeModeControlComposition runtimeMode="full-access" />),
    ).toBe("");
  });
});
