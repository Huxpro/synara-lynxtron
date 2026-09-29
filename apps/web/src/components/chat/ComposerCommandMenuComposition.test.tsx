// FILE: ComposerCommandMenuComposition.test.tsx
// Purpose: Pin shared command-menu grouping, row metadata, and mention footer anatomy.

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/components/chat/ComposerCommandMenuCompositionElements", () => ({
  ComposerCommandMenuFrameElement: ({
    children,
    emptyText,
  }: {
    children: ReactNode;
    emptyText: string | null;
  }) => (
    <div data-frame>
      {children}
      {emptyText ? <p>{emptyText}</p> : null}
    </div>
  ),
  ComposerCommandGroupElement: ({
    children,
    separatorBefore,
  }: {
    children: ReactNode;
    separatorBefore: boolean;
  }) => <section data-separated={separatorBefore}>{children}</section>,
  ComposerCommandGroupLabelElement: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  ComposerCommandRowElement: ({
    active,
    secondaryText,
    title,
    trailingMeta,
  }: {
    active: boolean;
    secondaryText: string | null;
    title: string;
    trailingMeta: string | null;
  }) => (
    <p>
      {active ? "active:" : "row:"}
      {title}|{secondaryText ?? "-"}|{trailingMeta ?? "-"}
    </p>
  ),
  ComposerCommandSeparatorElement: () => <hr />,
  ComposerCommandMentionFilesFooterElement: () => <footer>Files:Type to search for files</footer>,
}));

import {
  ComposerCommandMenuComposition,
  type ComposerCommandItem,
} from "./ComposerCommandMenuComposition";

function expectOrdered(markup: string, values: string[]) {
  for (let index = 1; index < values.length; index += 1) {
    expect(markup.indexOf(values[index - 1]!)).toBeLessThan(markup.indexOf(values[index]!));
  }
}

describe("ComposerCommandMenuComposition", () => {
  it("owns built-in, provider, and skill section order plus row metadata", () => {
    const items: ComposerCommandItem[] = [
      {
        id: "skill:review",
        type: "skill",
        skill: {
          name: "review",
          description: "Review recent changes",
          path: "/workspace/.codex/skills/review/SKILL.md",
          enabled: true,
          scope: "project",
        },
        label: "review",
        description: "Review recent changes",
      },
      {
        id: "provider:help",
        type: "provider-native-command",
        provider: "codex",
        command: "help",
        label: "/help",
        description: "Show provider help",
      },
      {
        id: "slash:plan",
        type: "slash-command",
        command: "plan",
        label: "/plan",
        description: "Switch to plan mode",
        source: "app",
      },
    ];

    const markup = renderToStaticMarkup(
      <ComposerCommandMenuComposition
        items={items}
        resolvedTheme="dark"
        isLoading={false}
        triggerKind="slash-command"
        activeItemId="provider:help"
        onHighlightedItemChange={() => undefined}
        onSelect={() => undefined}
      />,
    );

    expectOrdered(markup, [
      "Built-in",
      "Plan Mode|Switch to plan mode|/plan",
      "Provider",
      "active:Help|Show provider help|/help",
      "Skills",
      "review|Review recent changes|Project",
    ]);
  });

  it("owns mention section order and always exposes the Files search footer", () => {
    const items: ComposerCommandItem[] = [
      {
        id: "agent:mini",
        type: "agent",
        provider: "codex",
        alias: "mini",
        color: "violet",
        label: "@mini",
        description: "Delegate to Mini",
      },
      {
        id: "path:agents",
        type: "path",
        path: "/workspace/AGENTS.md",
        pathKind: "file",
        label: "AGENTS.md",
        description: "/workspace",
      },
      {
        id: "thread:release",
        type: "thread",
        threadId: "release",
        provider: "codex",
        mention: { name: "Release prep", path: "thread://release" },
        label: "Release prep",
        description: "Synara",
      },
      {
        id: "plugin:github",
        type: "plugin",
        plugin: {
          id: "plugin/github",
          name: "GitHub",
          source: { type: "local", path: "/plugins/github" },
          interface: { displayName: "GitHub", shortDescription: "PR and CI tools" },
          installed: true,
          enabled: true,
          installPolicy: "AVAILABLE",
          authPolicy: "ON_USE",
        },
        mention: { name: "GitHub", path: "plugin://GitHub@codex" },
        label: "GitHub",
        description: "PR and CI tools",
      },
    ];

    const markup = renderToStaticMarkup(
      <ComposerCommandMenuComposition
        items={items}
        resolvedTheme="light"
        isLoading={false}
        triggerKind="mention"
        activeItemId={null}
        onHighlightedItemChange={() => undefined}
        onSelect={() => undefined}
      />,
    );

    expectOrdered(markup, [
      "Plugins",
      "GitHub",
      "Chats",
      "Release prep",
      "Local",
      "AGENTS.md",
      "Subagents",
      "@mini",
      "Files:Type to search for files",
    ]);
  });
});
