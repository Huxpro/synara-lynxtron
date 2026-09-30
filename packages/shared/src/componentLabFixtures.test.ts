import { describe, expect, it } from "vitest";
import {
  COMPONENT_LAB_CODEX_MODELS,
  COMPONENT_LAB_CONTEXT_WINDOW_USAGE,
  COMPONENT_LAB_CONTEXT_WINDOW_BY_VARIANT,
  COMPONENT_LAB_COMMAND_PALETTE_BY_VARIANT,
  COMPONENT_LAB_DIFF_CODE_VIEW,
  COMPONENT_LAB_MODEL_SELECTION,
  COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_FAVORITES,
  COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_MODELS,
  COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_SELECTION,
  COMPONENT_LAB_MESSAGE_ACTIONS_BY_VARIANT,
  COMPONENT_LAB_NAVIGATION_ROW_BY_VARIANT,
  COMPONENT_LAB_OVERFLOW_CODEX_MODELS,
  COMPONENT_LAB_OVERFLOW_MODEL_OPTIONS_BY_PROVIDER,
  COMPONENT_LAB_PROVIDER_UPDATE_COPY,
  COMPONENT_LAB_VOICE_SILENCE_LEVELS,
  COMPONENT_LAB_VOICE_WAVEFORM_LEVELS,
  resolveComponentLabMessageActions,
  resolveComponentLabContextWindowFixture,
  resolveComponentLabCommandPaletteFixture,
  resolveComponentLabNavigationRow,
  resolveComponentLabKanbanCardFixture,
} from "./componentLabFixtures";

describe("Components Lab model fixture", () => {
  it("keeps the model submenu and effort regression deterministic", () => {
    expect(COMPONENT_LAB_CODEX_MODELS).toHaveLength(11);
    expect(
      COMPONENT_LAB_CODEX_MODELS.some(
        (model) => model.slug === COMPONENT_LAB_MODEL_SELECTION.model,
      ),
    ).toBe(true);
    const selection = COMPONENT_LAB_MODEL_SELECTION;
    expect(selection.provider === "codex" ? selection.options?.reasoningEffort : null).toBe("low");
  });

  it("uses a genuinely overflowing model catalog for the overflow state", () => {
    expect(COMPONENT_LAB_OVERFLOW_CODEX_MODELS.length).toBeGreaterThan(
      COMPONENT_LAB_CODEX_MODELS.length,
    );
    expect(COMPONENT_LAB_OVERFLOW_CODEX_MODELS.at(-1)?.name).toBe("GPT Archive 12");
    expect(COMPONENT_LAB_OVERFLOW_MODEL_OPTIONS_BY_PROVIDER.codex).toHaveLength(
      COMPONENT_LAB_OVERFLOW_CODEX_MODELS.length,
    );
  });

  it("keeps the provider-group disclosure fixture deterministic", () => {
    expect(COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_SELECTION).toMatchObject({
      provider: "opencode",
      model: "anthropic/claude-favorite-sort",
    });
    expect(COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_FAVORITES).toEqual(["openai/gpt-favorite-sort"]);
    expect(
      COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_MODELS.map((model) => model.upstreamProviderName),
    ).toEqual(["Anthropic", "OpenAI", "Google"]);
  });

  it("keeps the context meter partial ring and optional rows deterministic", () => {
    expect(COMPONENT_LAB_CONTEXT_WINDOW_USAGE.usedPercentage).toBe(7.4);
    expect(COMPONENT_LAB_CONTEXT_WINDOW_USAGE.usedTokens).toBe(14_800);
    expect(COMPONENT_LAB_CONTEXT_WINDOW_USAGE.maxTokens).toBe(200_000);
    expect(COMPONENT_LAB_CONTEXT_WINDOW_USAGE.totalProcessedTokens).toBeGreaterThan(
      COMPONENT_LAB_CONTEXT_WINDOW_USAGE.usedTokens,
    );
    expect(COMPONENT_LAB_CONTEXT_WINDOW_USAGE.compactsAutomatically).toBe(true);
  });

  it("keeps context-window variants behaviorally distinct", () => {
    const ratio = COMPONENT_LAB_CONTEXT_WINDOW_BY_VARIANT["percentage-and-ratio"];
    const optional = COMPONENT_LAB_CONTEXT_WINDOW_BY_VARIANT["optional-rows"];
    const high = COMPONENT_LAB_CONTEXT_WINDOW_BY_VARIANT["high-usage"];
    expect(ratio.usage.usedPercentage).toBe(7.4);
    expect(ratio.usage.totalProcessedTokens).toBeNull();
    expect(ratio.pendingWindowLabel).toBeNull();
    expect(optional.usage.totalProcessedTokens).toBe(38_400);
    expect(optional.usage.compactsAutomatically).toBe(true);
    expect(optional.pendingWindowLabel).toBe("1M");
    expect(high.usage.usedPercentage).toBe(90);
    expect(high.usage.remainingTokens).toBe(20_000);
    expect(resolveComponentLabContextWindowFixture(undefined)).toBe(ratio);
  });

  it("keeps provider-update notification states deterministic", () => {
    expect(COMPONENT_LAB_PROVIDER_UPDATE_COPY.multiple.title).toBe("2 provider updates available");
    expect(COMPONENT_LAB_PROVIDER_UPDATE_COPY.updating.description).toBe("Updating 2 providers.");
    expect(COMPONENT_LAB_PROVIDER_UPDATE_COPY.failure.copyText).toContain("claude-code");
  });

  it("keeps voice silence and strong-waveform fixtures distinct", () => {
    expect(COMPONENT_LAB_VOICE_SILENCE_LEVELS).toHaveLength(36);
    expect(Math.max(...COMPONENT_LAB_VOICE_SILENCE_LEVELS)).toBe(0.04);
    expect(COMPONENT_LAB_VOICE_WAVEFORM_LEVELS).toHaveLength(72);
    expect(Math.max(...COMPONENT_LAB_VOICE_WAVEFORM_LEVELS)).toBe(1);
  });

  it("keeps Kanban content variants deterministic", () => {
    expect(resolveComponentLabKanbanCardFixture("long-title").title.length).toBeGreaterThan(60);
    expect(resolveComponentLabKanbanCardFixture("draft")).toMatchObject({ column: "draft" });
    expect(resolveComponentLabKanbanCardFixture("draft").draftPrompt).not.toBe("");
    expect(resolveComponentLabKanbanCardFixture("working")).toMatchObject({
      column: "inProgress",
      isOptimisticDispatch: true,
    });
  });

  it("keeps the typography diff fixture deterministic", () => {
    expect(COMPONENT_LAB_DIFF_CODE_VIEW.kind).toBe("files");
    expect(COMPONENT_LAB_DIFF_CODE_VIEW.files).toHaveLength(1);
    expect(COMPONENT_LAB_DIFF_CODE_VIEW.files[0]?.lines.map((line) => line.kind)).toEqual([
      "deletion",
      "addition",
      "context",
    ]);
  });

  it("models the Electron transcript footer actions for every variant", () => {
    expect(COMPONENT_LAB_MESSAGE_ACTIONS_BY_VARIANT.assistant.map(({ label }) => label)).toEqual([
      "Pin to panel",
      "Copy message",
      "Reference whole assistant message",
    ]);
    expect(COMPONENT_LAB_MESSAGE_ACTIONS_BY_VARIANT.pinned.map(({ label }) => label)).toEqual([
      "Unpin from panel",
      "Copy message",
      "Reference whole assistant message",
    ]);
    expect(COMPONENT_LAB_MESSAGE_ACTIONS_BY_VARIANT.pinned[0]).toMatchObject({
      persistent: true,
      pressed: true,
    });
    expect(COMPONENT_LAB_MESSAGE_ACTIONS_BY_VARIANT.user.map(({ label }) => label)).toEqual([
      "Copy message",
      "Edit message",
      "Revert to this message",
    ]);
    expect(COMPONENT_LAB_MESSAGE_ACTIONS_BY_VARIANT.tool).toHaveLength(0);
    expect(resolveComponentLabMessageActions(undefined)).toBe(
      COMPONENT_LAB_MESSAGE_ACTIONS_BY_VARIANT.assistant,
    );
  });

  it("models every Electron primary navigation-row variant", () => {
    expect(COMPONENT_LAB_NAVIGATION_ROW_BY_VARIANT).toEqual({
      "new-thread": { icon: "new-thread", label: "New thread", shortcut: "⌘N" },
      search: { icon: "search", label: "Search", shortcut: "⌘K" },
      kanban: { icon: "kanban", label: "Kanban", shortcut: null },
      settings: { icon: "settings", label: "Settings", shortcut: null },
    });
    expect(resolveComponentLabNavigationRow(undefined)).toBe(
      COMPONENT_LAB_NAVIGATION_ROW_BY_VARIANT.search,
    );
  });

  it("models distinct production command-palette inputs", () => {
    expect(COMPONENT_LAB_COMMAND_PALETTE_BY_VARIANT.suggested).toMatchObject({
      query: "",
      actions: true,
      threads: false,
      searchStatus: "ready",
    });
    expect(COMPONENT_LAB_COMMAND_PALETTE_BY_VARIANT.recent).toMatchObject({
      query: "",
      actions: false,
      threads: true,
      searchStatus: "ready",
    });
    expect(COMPONENT_LAB_COMMAND_PALETTE_BY_VARIANT.filtered.query).toBe("settings");
    expect(COMPONENT_LAB_COMMAND_PALETTE_BY_VARIANT.empty.query).toBe("no matching component");
    expect(COMPONENT_LAB_COMMAND_PALETTE_BY_VARIANT.error.searchStatus).toBe("error");
    expect(resolveComponentLabCommandPaletteFixture(undefined)).toBe(
      COMPONENT_LAB_COMMAND_PALETTE_BY_VARIANT.suggested,
    );
  });
});
