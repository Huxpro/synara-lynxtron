import { describe, expect, it } from "vitest";

import type { ComponentLabStory } from "@synara/contracts";
import {
  COMPONENT_LAB_IMPLEMENTED_STORY_IDS,
  COMPONENT_LAB_STORIES,
  componentLabCases,
  isComponentLabStoryImplemented,
  summarizeComponentLabCoverage,
  validateComponentLabStories,
} from "./componentLab";

describe("component lab manifest", () => {
  it("keeps every seeded story paired and reusable", () => {
    expect(validateComponentLabStories(COMPONENT_LAB_STORIES)).toEqual([]);
    expect(COMPONENT_LAB_STORIES.map((story) => story.id)).toEqual([
      "editor-rail/add-menu",
      "composer/model-effort-picker",
      "composer/context-window-meter",
      "project-actions/add-editor",
      "sidebar/command-palette",
      "sidebar/navigation-row",
      "sidebar/project-row",
      "sidebar/thread-row",
      "transcript/message-actions",
      "system/semantic-icon-tones",
      "notifications/provider-update",
      "right-dock/tab-strip",
      "composer/voice-recorder",
      "terminal/search",
      "editor/file-search",
      "sidebar/space-project-picker",
      "editor/file-preview-error",
      "editor/pdf-viewer",
      "typography/markdown-code",
      "typography/diff-code",
      "ui/button",
      "ui/input",
      "ui/menu",
      "ui/dialog",
      "ui/tooltip",
      "ui/kbd",
      "ui/collapsible",
      "ui/command",
      "ui/scroll-area",
      "ui/switch",
      "ui/checkbox",
      "ui/icon-button",
      "ui/textarea",
      "ui/skeleton",
      "ui/spinner",
      "ui/separator",
      "ui/badge",
      "ui/time-picker",
      "ui/alert",
    ]);
  });

  it("reports real renderer coverage without treating seeded placeholders as complete", () => {
    expect(COMPONENT_LAB_IMPLEMENTED_STORY_IDS).toEqual([
      "editor-rail/add-menu",
      "composer/model-effort-picker",
      "composer/context-window-meter",
      "project-actions/add-editor",
      "system/semantic-icon-tones",
      "sidebar/navigation-row",
      "sidebar/command-palette",
      "transcript/message-actions",
      "sidebar/project-row",
      "sidebar/thread-row",
      "notifications/provider-update",
      "right-dock/tab-strip",
      "composer/voice-recorder",
      "terminal/search",
      "editor/file-search",
      "sidebar/space-project-picker",
      "editor/file-preview-error",
      "editor/pdf-viewer",
      "typography/markdown-code",
      "typography/diff-code",
      "ui/button",
      "ui/input",
      "ui/menu",
      "ui/dialog",
      "ui/tooltip",
      "ui/kbd",
      "ui/collapsible",
      "ui/command",
      "ui/scroll-area",
      "ui/switch",
      "ui/checkbox",
      "ui/icon-button",
      "ui/textarea",
      "ui/skeleton",
      "ui/spinner",
      "ui/separator",
      "ui/badge",
      "ui/time-picker",
      "ui/alert",
    ]);
    expect(isComponentLabStoryImplemented("editor-rail/add-menu")).toBe(true);
    expect(isComponentLabStoryImplemented("composer/model-effort-picker")).toBe(true);
    expect(isComponentLabStoryImplemented("composer/context-window-meter")).toBe(true);
    expect(isComponentLabStoryImplemented("system/semantic-icon-tones")).toBe(true);
    expect(isComponentLabStoryImplemented("sidebar/navigation-row")).toBe(true);
    expect(isComponentLabStoryImplemented("sidebar/command-palette")).toBe(true);
    expect(isComponentLabStoryImplemented("transcript/message-actions")).toBe(true);
    expect(isComponentLabStoryImplemented("sidebar/project-row")).toBe(true);
    expect(isComponentLabStoryImplemented("sidebar/thread-row")).toBe(true);
    expect(isComponentLabStoryImplemented("sidebar/space-project-picker")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/button")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/input")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/menu")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/dialog")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/tooltip")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/kbd")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/collapsible")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/command")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/scroll-area")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/switch")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/checkbox")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/icon-button")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/textarea")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/skeleton")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/spinner")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/separator")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/badge")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/time-picker")).toBe(true);
    expect(isComponentLabStoryImplemented("ui/alert")).toBe(true);
  });

  it("rejects duplicate IDs and divergent consumer mappings", () => {
    const source = COMPONENT_LAB_STORIES[0]!;
    const invalid: ComponentLabStory = {
      ...source,
      states: ["open"],
      renderers: {
        ...source.renderers,
        lynx: { ...source.renderers.lynx, consumers: [] },
      },
    };
    expect(validateComponentLabStories([invalid, invalid])).toEqual(
      expect.arrayContaining([
        "editor-rail/add-menu: missing default state",
        "editor-rail/add-menu: lynx has no consumers",
        "editor-rail/add-menu: Lynx missing consumer editor-view/sidechat-header",
        "duplicate story id: editor-rail/add-menu",
      ])
    );
  });

  it("rejects reverse consumer drift and one Electron identity mapping to two Lynx components", () => {
    const source = COMPONENT_LAB_STORIES[0]!;
    const divergentConsumers: ComponentLabStory = {
      ...source,
      id: "test/divergent-consumers",
      renderers: {
        ...source.renderers,
        lynx: { ...source.renderers.lynx, consumers: [...source.renderers.lynx.consumers, "lynx-only/consumer"] },
      },
    };
    const divergentCounterpart: ComponentLabStory = {
      ...source,
      id: "test/divergent-counterpart",
      renderers: {
        ...source.renderers,
        lynx: { ...source.renderers.lynx, component: "AdHocReplacement" },
      },
    };
    expect(validateComponentLabStories([source, divergentConsumers, divergentCounterpart])).toEqual(
      expect.arrayContaining([
        "test/divergent-consumers: Electron missing consumer lynx-only/consumer",
        expect.stringContaining("maps to both"),
      ])
    );
  });

  it("reports the complete renderer/theme/viewport/state matrix", () => {
    expect(summarizeComponentLabCoverage(COMPONENT_LAB_STORIES)).toEqual({
      stories: 39,
      rendererMappings: 78,
      matrixCells: 2872,
      interactiveStories: 20,
    });
  });

  it("enumerates every variant and state for story automation", () => {
    expect(componentLabCases({ variants: ["a", "b"], states: ["x", "y"] })).toEqual([
      { variant: "a", state: "x" },
      { variant: "a", state: "y" },
      { variant: "b", state: "x" },
      { variant: "b", state: "y" },
    ]);
  });

  it("rejects duplicated semantic values across variant and state axes", () => {
    const source = COMPONENT_LAB_STORIES[0]!;
    const invalid: ComponentLabStory = {
      ...source,
      id: "test/duplicate-axes",
      variants: ["open"],
      states: ["default", "open"],
    };
    expect(validateComponentLabStories([invalid])).toContain(
      "test/duplicate-axes: variants duplicate states open"
    );
  });
});
