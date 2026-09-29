// FILE: ComposerModelComposition.test.tsx
// Purpose: Pin shared model trigger anatomy and grouped option ordering.

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./ComposerModelTriggerCompositionElements", () => ({
  ComposerModelTriggerFrameElement: ({ children }: { children: ReactNode }) => (
    <div data-trigger>{children}</div>
  ),
  ComposerModelTriggerProviderIconElement: ({ provider }: { provider: string }) => (
    <span>provider:{provider}</span>
  ),
  ComposerModelTriggerModelLabelElement: ({
    children,
    hidden,
  }: {
    children: ReactNode;
    hidden: boolean;
  }) => (
    <span>
      {hidden ? "hidden-model:" : "model:"}
      {children}
    </span>
  ),
  ComposerModelTriggerFastBadgeElement: () => <span>fast</span>,
  ComposerModelTriggerStatusIconElement: ({ accessibleLabel }: { accessibleLabel: string }) => (
    <span>status-icon:{accessibleLabel}</span>
  ),
  ComposerModelTriggerStatusLabelElement: ({ children }: { children: ReactNode }) => (
    <span>status:{children}</span>
  ),
  ComposerModelTriggerChevronElement: () => <span>chevron</span>,
}));

vi.mock("./ProviderModelOptionGroupListCompositionElements", () => ({
  ProviderModelOptionListFrameElement: ({ children }: { children: ReactNode }) => (
    <div data-model-list>{children}</div>
  ),
  ProviderModelGroupElement: ({ children }: { children: ReactNode }) => (
    <section>{children}</section>
  ),
  ProviderModelGroupLabelElement: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  ProviderModelCollapsibleGroupElement: ({
    children,
    label,
    count,
  }: {
    children: ReactNode;
    label: string;
    count: number;
  }) => (
    <section>
      <h2>
        {label}:{count}
      </h2>
      {children}
    </section>
  ),
  ProviderModelRadioItemElement: ({
    active,
    modelName,
    modelSlug,
  }: {
    active: boolean;
    modelName: string;
    modelSlug: string;
  }) => (
    <span>
      {active ? "active:" : "option:"}
      {modelSlug}:{modelName}
    </span>
  ),
}));

import { ComposerModelTriggerComposition } from "./ComposerModelTriggerComposition";
import { ProviderModelOptionGroupListComposition } from "./ProviderModelOptionGroupListComposition";

describe("Composer model shared compositions", () => {
  it("owns provider, model, fast, status, and chevron order", () => {
    const markup = renderToStaticMarkup(
      <ComposerModelTriggerComposition
        provider="codex"
        modelLabel="GPT-5.6 Sol"
        statusLabel="High"
        showFastBadge
        hideModelLabel={false}
        hideStatusLabel={false}
      />,
    );
    const order = ["provider:codex", "model:GPT-5.6 Sol", "fast", "status:High", "chevron"];
    for (let index = 1; index < order.length; index += 1) {
      expect(markup.indexOf(order[index - 1]!)).toBeLessThan(markup.indexOf(order[index]!));
    }
  });

  it("owns group and option order while marking the active model", () => {
    const markup = renderToStaticMarkup(
      <ProviderModelOptionGroupListComposition
        groupedOptions={[
          {
            key: "openai",
            label: "OpenAI",
            options: [
              { slug: "gpt-5.6-sol", name: "GPT-5.6 Sol" },
              { slug: "gpt-5.4", name: "GPT-5.4" },
            ],
          },
          {
            key: "other",
            label: null,
            options: [{ slug: "custom", name: "Custom" }],
          },
        ]}
        provider="codex"
        activeModel="gpt-5.6-sol"
        isSearching={false}
        favoriteProvider={null}
        favoriteModelSlugSet={undefined}
        onToggleFavorite={() => undefined}
        onSelectModel={() => undefined}
      />,
    );
    const order = ["OpenAI", "active:gpt-5.6-sol", "option:gpt-5.4", "option:custom"];
    for (let index = 1; index < order.length; index += 1) {
      expect(markup.indexOf(order[index - 1]!)).toBeLessThan(markup.indexOf(order[index]!));
    }
  });
});
