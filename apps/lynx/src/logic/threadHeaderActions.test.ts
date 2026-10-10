import { describe, expect, it } from "@rstest/core";

import { resolveThreadHeaderActionState } from "./threadHeaderActions";

const baseInput = {
  diffDisabledReason: null,
  diffOpen: false,
  diffTotals: { additions: 3, deletions: 2, hasChanges: true },
  environmentEnabled: true,
  hasProject: true,
  hasProjectActionSurface: true,
  isGitRepo: true,
  gitActionsAvailable: true,
  surface: {
    kind: "thread",
    layout: "single",
    primary: "chat",
    sidechat: false,
  },
} as const;

describe("resolveThreadHeaderActionState", () => {
  it("projects the full project-thread action row and previews diff totals", () => {
    expect(resolveThreadHeaderActionState(baseInput)).toEqual({
      diffDisabled: false,
      diffStats: { additions: 3, deletions: 2 },
      showDiff: true,
      showEnvironment: true,
      showGitActions: false,
      showHandoff: true,
      showLegacyOpenIn: false,
      showProjectActions: true,
      showProviderUsage: false,
    });
  });

  it("suppresses thread actions on an editor rail while preserving explicit surface controls", () => {
    expect(
      resolveThreadHeaderActionState({
        ...baseInput,
        environmentEnabled: false,
        hasProjectActionSurface: false,
        surface: { ...baseInput.surface, kind: "editor-rail" },
      }),
    ).toMatchObject({
      diffStats: null,
      showDiff: false,
      showEnvironment: false,
      showHandoff: false,
      showProjectActions: false,
      showProviderUsage: false,
    });
  });

  it("keeps main-thread actions available in split and sidechat layouts", () => {
    for (const surface of [
      { ...baseInput.surface, layout: "split" as const },
      { ...baseInput.surface, sidechat: true },
    ]) {
      expect(resolveThreadHeaderActionState({ ...baseInput, surface })).toMatchObject({
        showDiff: true,
        showHandoff: true,
        showProjectActions: true,
      });
    }
  });

  it("suppresses handoff and usage on terminal-primary threads without hiding diff", () => {
    expect(
      resolveThreadHeaderActionState({
        ...baseInput,
        environmentEnabled: false,
        surface: { ...baseInput.surface, primary: "terminal" },
      }),
    ).toMatchObject({
      showDiff: true,
      showHandoff: false,
      showProviderUsage: false,
    });
  });

  it("falls back to legacy project controls only when the Environment surface is absent", () => {
    expect(
      resolveThreadHeaderActionState({
        ...baseInput,
        environmentEnabled: false,
      }),
    ).toMatchObject({
      showEnvironment: false,
      showGitActions: true,
      showLegacyOpenIn: true,
    });
    expect(
      resolveThreadHeaderActionState({
        ...baseInput,
        environmentEnabled: false,
        hasProject: false,
        hasProjectActionSurface: false,
        isGitRepo: false,
      }),
    ).toMatchObject({
      diffDisabled: true,
      showGitActions: false,
      showLegacyOpenIn: false,
      showProjectActions: false,
    });
  });

  it("keeps an already-open diff closable while a pending environment disables opening", () => {
    expect(
      resolveThreadHeaderActionState({
        ...baseInput,
        diffDisabledReason: "The worktree is still being prepared.",
        diffOpen: true,
      }).diffDisabled,
    ).toBe(false);
    expect(
      resolveThreadHeaderActionState({
        ...baseInput,
        diffDisabledReason: "The worktree is still being prepared.",
      }).diffDisabled,
    ).toBe(true);
  });
});
