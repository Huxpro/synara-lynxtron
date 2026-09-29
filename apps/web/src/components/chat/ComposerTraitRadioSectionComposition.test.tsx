import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./ComposerTraitRadioSectionCompositionElements", () => ({
  ComposerTraitFastModeToggleElement: ({ enabled }: { enabled: boolean }) => (
    <button type="button">{enabled ? "fast:on" : "fast:off"}</button>
  ),
  ComposerTraitSectionElement: ({
    children,
    label,
    labelTrailing,
  }: {
    children: ReactNode;
    label: string;
    labelTrailing?: ReactNode;
  }) => (
    <section>
      <h2>
        {label}
        {labelTrailing}
      </h2>
      {children}
    </section>
  ),
  ComposerTraitRadioGroupElement: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ComposerTraitRadioItemElement: ({
    active,
    isDefault,
    label,
    value,
  }: {
    active: boolean;
    isDefault: boolean;
    label: string;
    value: string;
  }) => (
    <span>
      {active ? "active:" : "option:"}
      {value}:{label}
      {isDefault ? ":default" : ""}
    </span>
  ),
}));

import { ComposerTraitRadioSectionComposition } from "./ComposerTraitRadioSectionComposition";

describe("ComposerTraitRadioSectionComposition", () => {
  it("owns section, option order, active state, and default anatomy", () => {
    const markup = renderToStaticMarkup(
      <ComposerTraitRadioSectionComposition
        label="Effort"
        value="high"
        options={[
          { value: "medium", label: "Medium", isDefault: true },
          { value: "high", label: "High" },
          { value: "xhigh", label: "Extra High" },
        ]}
        onValueChange={() => undefined}
      />,
    );

    const order = [
      "Effort",
      "option:medium:Medium:default",
      "active:high:High",
      "option:xhigh:Extra High",
    ];
    for (let index = 1; index < order.length; index += 1) {
      expect(markup.indexOf(order[index - 1]!)).toBeLessThan(markup.indexOf(order[index]!));
    }
  });

  it("owns the optional fast-mode control in the section header", () => {
    const markup = renderToStaticMarkup(
      <ComposerTraitRadioSectionComposition
        label="Effort"
        fastModeControl={{ enabled: true, onToggle: () => undefined }}
        value="high"
        options={[{ value: "high", label: "High" }]}
        onValueChange={() => undefined}
      />,
    );

    expect(markup).toContain("Effort");
    expect(markup).toContain("fast:on");
    expect(markup.indexOf("fast:on")).toBeLessThan(markup.indexOf("active:high:High"));
  });
});
