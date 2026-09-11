import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ComponentsLabStoryRenderer } from "./ComponentsLabStoryRenderer";
import { COMPONENT_LAB_STORIES, componentLabCases } from "@synara/shared/componentLab";

describe("Components Lab story renderer", () => {
  it("mounts every normalized variant and state case with its required product context", () => {
    for (const story of COMPONENT_LAB_STORIES) {
      for (const testCase of componentLabCases(story)) {
        expect(() => {
          try {
            return renderToStaticMarkup(
            createElement(
              QueryClientProvider,
              { client: new QueryClient() },
              createElement(ComponentsLabStoryRenderer, {
                storyId: story.id,
                state: testCase.state,
                variant: testCase.variant,
              }),
            ),
            );
          } catch (error) {
            throw new Error(
              `Failed to render ${story.id}:${testCase.variant}:${testCase.state}`,
              { cause: error },
            );
          }
        }).not.toThrow();
      }
    }
  });

  it("uses the same-origin Lynx preview surface instead of a hard-coded port", () => {
    const source = readFileSync(
      new URL("./ComponentsLabPage.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('`/lynx/?route=');
    expect(source).not.toContain('localhost:8080');
    expect(source).toContain('COMPONENT_LAB_RELAY_STORAGE_KEY');
    expect(source).toContain('getDesktopBridge()?.getWsUrl?.()');
    expect(source).toContain('if (props.embedded) return true;');
    expect(source).toContain('DESKTOP_TOP_BAR_TRAFFIC_LIGHT_GUTTER_CLASS');
    expect(source).toContain('className={`drag-region flex h-12');
    expect(source).toContain('selectedStory?.variants.includes');
    expect(source).toContain('variant={selectedVariant}');
    expect(source).toContain('aria-label="Story variants"');
    expect(source).toContain('componentLabCases(selectedStory)');
    expect(source).toContain('Run all story variants and states');
    expect(source).toContain('target.variant !== selectedVariant');
    expect(source).toContain('target.state !== selectedState');
  });

  it("renders the model picker in the same locked Codex catalog state on both renderers", () => {
    const source = readFileSync(
      new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain('props.storyId === "composer/model-effort-picker"');
    expect(source).toContain('<ProviderModelPicker');
    expect(source).toContain('lockedProvider={null}');
    expect(source).toContain('lockedProvider={selection.provider}');
    expect(source).toContain('initialSubmenuOpen={submenuOpen || search}');
    expect(source).toContain('props.state === "overflow"');
    expect(source).toContain('props.state === "search"');
    expect(source).toContain('props.state === "provider-list"');
    expect(source).toContain('props.state === "favourite"');
    expect(source).toContain('favoriteModelSlugsOverride={{ opencode: favoriteModelSlugs }}');
    expect(source).toContain('onFavoriteModelSlugsChange={(_provider, slugs) => setFavoriteModelSlugs(slugs)}');
    expect(source).toContain('disabled={props.state === "disabled"}');
    expect(source).toContain('COMPONENT_LAB_OVERFLOW_CODEX_MODELS');
    expect(source).toContain('COMPONENT_LAB_OPENCODE_MODELS');
    expect(source).toContain('initialSearchQuery={search ? "model 12" : ""}');
    expect(source).toContain('runtimeModels={runtimeModels}');
    expect(source).toContain('modelOptionsByProvider={modelOptionsByProvider}');
    expect(source).toContain('props.variant === "landing"');
    expect(source).toContain('<TraitsPicker');
    expect(source).toContain('const compact = props.variant === "compact"');
    expect(source).toContain('hideModelLabel={compact}');
    expect(source).toContain('const [selection, setSelection] = useState<ModelSelection>');
    expect(source).toContain('onProviderModelChange={selectModel}');
  });

  it("drives real Add Action saving and error states", () => {
    const source = readFileSync(
      new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('props.state === "saving"');
    expect(source).toContain('initialSaving={props.state === "saving"}');
    expect(source).toContain('initialEditingScriptId={editing && (props.state !== "default" || props.variant === "shortcut-conflict")');
    expect(source).toContain('props.variant === "shortcut-conflict"');
    expect(source).toContain('command: "script.component-lab-test.run"');
    expect(source).toContain('props.variant === "validation-error"');
    expect(source).toContain('initialValidationError={');
    expect(source).toContain('"Command is required."');
  });

  it("renders the real context meter with its deterministic open state", () => {
    const source = readFileSync(
      new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain('props.storyId === "composer/context-window-meter"');
    expect(source).toContain("<ContextWindowMeter");
    expect(source).toContain('resolveComponentLabContextWindowFixture(props.variant)');
    expect(source).toContain('usage={fixture.usage}');
    expect(source).toContain('pendingWindowLabel={fixture.pendingWindowLabel}');
    expect(source).toContain('justify-end pr-6');
    expect(source).toContain('initialOpen={props.state === "open"}');
  });

  it("renders every shared semantic icon tone", () => {
    const source = readFileSync(
      new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('props.storyId === "system/semantic-icon-tones"');
    expect(source).toContain('SEMANTIC_ICON_TONES.includes(props.variant as never)');
    expect(source).toContain('<SemanticIconTone');
  });

  it("renders navigation-row states through the shared product row", () => {
    const source = readFileSync(
      new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('props.storyId === "sidebar/navigation-row"');
    expect(source).toContain('<SidebarPrimaryActionRow');
    expect(source).toContain('active={props.state === "active"}');
    expect(source).toContain('onActivate={() => {}}');
    expect(source).toContain('visualState={visualState');
    expect(source).toContain('resolveComponentLabNavigationRow(props.variant)');
    expect(source).toContain('label={fixture.label}');
    expect(source).toContain('fixture.shortcut ?');
  });

  it("provides the product sidebar context required by navigation rows", () => {
    const markup = renderToStaticMarkup(
      createElement(ComponentsLabStoryRenderer, {
        storyId: "sidebar/navigation-row",
        state: "default",
        variant: "new-thread",
      }),
    );

    expect(markup).toContain('aria-label="New thread"');
    expect(markup).toContain(">⌘N<");
  });

  it("renders the real shared command palette with deterministic content", () => {
    const source = readFileSync(
      new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('props.storyId === "sidebar/command-palette"');
    expect(source).toContain('useEffect(() => setOpen(routeOpen), [routeOpen])');
    expect(source).toContain('<SidebarSearchPalette');
    expect(source).toContain('query={queryOverride ?? routeQuery}');
    expect(source).toContain('onQueryChange={setQueryOverride}');
    expect(source).toContain('resolveComponentLabCommandPaletteFixture(props.variant)');
    expect(source).toContain('props.state === "keyboard-highlight" && fixture.actions');
    expect(source).toContain('searchStatus={fixture.searchStatus}');
    expect(source).toContain('fixture.searchStatus === "error"');
  });

  it("renders transcript actions through the product action primitive", () => {
    const source = readFileSync(
      new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('props.storyId === "transcript/message-actions"');
    expect(source).toContain('<MessageActionButton');
    expect(source).toContain('MESSAGE_ACTION_ICON_CLASS_NAME');
    expect(source).toContain('import { CopyIcon,');
    expect(source).toContain('const revealed = props.state !== "default"');
    expect(source).toContain('data-message-actions-visible={revealed}');
    expect(source).toContain('resolveComponentLabMessageActions(props.variant)');
    expect(source).toContain('data-message-actions-variant={props.variant ?? "assistant"}');
    expect(source).toContain('aria-pressed={action.pressed}');
    expect(source).toContain('action.persistent ? "text-muted-foreground/80"');
  });

  it("renders assistant and user rows through the shared row compositions", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain('props.storyId === "transcript/message-row"');
    expect(source).toContain('<MessageUserRowComposition>');
    expect(source).toContain('<MessageUserBubbleComposition>');
    expect(source).toContain('<MessageAssistantRowComposition>');
    expect(source).toContain("onClick={() => setResult('Message copied')}");
    expect(source).toContain('>{result}</p>');
    expect(source).toContain('data-message-row-state={props.state}');
  });

  it("renders the independent chat and terminal tab-row contract", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain('props.storyId === "editor-rail/independent-tabs"');
    expect(source).toContain('<IndependentTabsStory');
    expect(source).toContain('<IndependentTabRow');
    expect(source).toContain('defaultCollapsed={props.state === "collapsed"}');
    expect(source).toContain('const tabCount = props.state === "overflow" ? 8 : 3;');
    expect(source).toContain('props.variant === "chat" ? "start" : "end"');
  });

  it("renders project and thread rows through shared product specimens", () => {
    const source = readFileSync(
      new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('<SidebarProjectRowSpecimen');
    expect(source).toContain('buildProjectContextMenuItems({');
    expect(source).toContain('ensureNativeApi().contextMenu.show(');
    expect(source).toContain('<SidebarThreadRowSpecimen');
    const specimens = readFileSync(
      new URL('./SidebarRowSpecimen.tsx', import.meta.url),
      "utf8",
    );
    expect(source).toContain('variant={props.variant as Parameters<typeof SidebarProjectRowSpecimen>');
    expect(source).toContain('componentLabProjectContextMenuItems(props.variant)');
    expect(source).toContain('componentLabThreadContextMenuItems(props.variant)');
    expect(specimens).toContain(
      "const pinned = props.variant === 'pinned' || props.state === 'pinned';",
    );
    expect(specimens).toContain(
      "const running = props.variant === 'running';",
    );
    expect(specimens).toContain(
      "const active = props.variant === 'active' || props.state === 'active'",
    );
    expect(specimens).toContain("aria-label={pinned ? 'Unpin project' : 'Pin project'}");
    expect(specimens).toContain('<Actions reveal={reveal}>');
  });

  it("renders provider updates through the production toast surface", () => {
    const source = readFileSync(
      new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('props.storyId === "notifications/provider-update"');
    expect(source).toContain('<ProviderUpdateNotificationStory');
    expect(source).toContain('<ToastSurfaceFixture');
    expect(source).toContain('COMPONENT_LAB_PROVIDER_UPDATE_COPY');
    expect(source).toContain('progress: "updating"');
    expect(source).toContain('props.state === "updating"');
    expect(source).toContain('props.state === "failure"');
  });

  it("renders the production right-dock tab strip and add menu", () => {
    const source = readFileSync(
      new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url),
      "utf8",
    );
    const dockSource = readFileSync(
      new URL("./chat/RightDock.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('props.storyId === "right-dock/tab-strip"');
    expect(source).toContain('<RightDockTabs');
    expect(source).toContain('defaultAddMenuOpen={selected === "add-menu-open"}');
    expect(source).toContain('COMPONENT_LAB_RIGHT_DOCK_OVERFLOW_PANES');
    expect(source).toContain('"singleton-filtering": "add-menu-open"');
    expect(source).toContain('selected === "single-pane"');
    expect(dockSource).toContain('export function RightDockTabs');
    expect(dockSource).toContain('<RightDockTabs');
  });

  it("renders deterministic Kanban states through the shared production card", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain('props.storyId === "kanban/card"');
    expect(source).toContain('<KanbanCardComposition');
    expect(source).toContain('resolveComponentLabKanbanCardFixture');
    expect(source).toContain('visualState={props.state as');
  });

  it("renders real idle, waveform, and transcribing voice controls", () => {
    const source = readFileSync(
      new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('props.storyId === "composer/voice-recorder"');
    expect(source).toContain('<ComposerVoiceButton');
    expect(source).toContain('<ComposerVoiceRecorderBar');
    expect(source).toContain('COMPONENT_LAB_VOICE_WAVEFORM_LEVELS');
    expect(source).toContain('"strong-waveform": "recording-waveform"');
    expect(source).toContain('isTranscribing={selected === "transcribing"}');
  });

  it("renders terminal search through the production component", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain('props.storyId === "terminal/search"');
    expect(source).toContain('<TerminalSearch');
    expect(source).toContain('"case-sensitive": "match-case"');
    expect(source).toContain('initialCaseSensitive={selected === "match-case"}');
  });

  it("renders editor file search through the production component", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain('props.storyId === "editor/file-search"');
    expect(source).toContain('<WorkspaceSearchInputHeader');
    expect(source).toContain('props.variant === "query"');
  });

  it("renders editor file-tab states through the shared surface tab", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain('props.storyId === "editor/file-tab"');
    expect(source).toContain('<SurfaceTabChip');
    expect(source).toContain('return <FileTabStory key={props.state} state={props.state} />;');
    expect(source).toContain('onClose={() => setOpen(false)}');
    expect(source).toContain('>Tab closed</p>');
    expect(source).toContain('closeLabel="Close example.ts"');
    expect(source).toContain('visualState={props.state as');
  });

  it("renders real Diff and editor project search headers with focus and disabled states", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain('props.storyId === "diff/file-filter"');
    expect(source).toContain('<ReviewFileTreeSearchHeader');
    expect(source).toContain('props.storyId === "editor/project-search"');
    expect(source).toContain('<PickerPanelSearchHeader');
    expect(source).toContain('autoFocus={props.state === "focus"}');
    expect(source).toContain('disabled={props.state === "disabled"}');
  });

  it("drives Space project search through real dialog props", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain('<SpaceProjectPickerStory state={props.state}');
    expect(source).toContain('initialQuery={props.state === "query" ? "Alpha" : ""}');
    expect(source).toContain('searchAutoFocus={props.state === "focus"}');
    expect(source).toContain('searchDisabled={props.state === "disabled"}');
  });

  it("renders file preview recovery through the shared product composition", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain('props.storyId === "editor/file-preview-error"');
    expect(source).toContain('<WorkspaceFilePreviewErrorState');
    expect(source).toContain('props.state === "retrying"');
    expect(source).toContain('props.state !== "no-close-owner"');
    expect(source).toContain('props.variant === "explorer-dock"');
    expect(source).toContain('props.variant === "file-pane"');
    expect(source).toContain('data-file-preview-placement=');
    expect(source).toContain('const ownsClose =');
  });

  it("renders the product PDF toolbar with shared zoom policy", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain('props.storyId === "editor/pdf-viewer"');
    expect(source).toContain('<PdfViewerToolbarStory');
    expect(source).toContain('<PdfViewerToolbar');
    expect(source).toContain('resolvePdfScale(mode');
    expect(source).toContain('initialZoomMenuOpen={props.state === "menu-open"}');
  });

  it("renders real Markdown and diff typography components", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain('props.storyId === "typography/markdown-code"');
    expect(source).toContain('<ChatMarkdown text={text}');
    expect(source).toContain('props.storyId === "typography/diff-code"');
    expect(source).toContain('<PullRequestCodeComposition');
    expect(source).toContain('view={COMPONENT_LAB_DIFF_CODE_VIEW}');
  });

  it("renders real button and input primitive matrices", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain('props.storyId === "ui/button"');
    expect(source).toContain('<Button className={stateClass}');
    expect(source).toContain('<IconButton className={stateClass}');
    expect(source).toContain('props.variant === "icon"');
    expect(source).toContain('props.storyId === "ui/input"');
    expect(source).toContain('<Input aria-invalid={invalid}');
    expect(source).toContain('props.variant === "small" ? "sm"');
    expect(source).toContain('props.storyId === "ui/menu"');
    expect(source).toContain('<MenuPopupBase align="start"');
    expect(source).toContain('props.variant === "checkbox"');
    expect(source).toContain('props.variant === "separator"');
    expect(source).toContain('props.variant === "shortcut"');
    expect(source).toContain('props.storyId === "ui/dialog"');
    expect(source).toContain('<DialogPopup showCloseButton=');
    expect(source).toContain('showCloseButton={props.variant === "close"}');
    expect(source).toContain('props.variant === "title-description"');
    expect(source).toContain('props.variant === "panel"');
    expect(source).toContain('props.variant === "footer"');
    expect(source).toContain('props.storyId === "ui/tooltip"');
    expect(source).toContain('<TooltipPopup variant=');
    expect(source).toContain('props.storyId === "ui/kbd"');
    expect(source).toContain('<KbdGroup>');
    expect(source).toContain('props.variant === "single"');
    expect(source).toContain('props.storyId === "ui/collapsible"');
    expect(source).toContain('<CollapsiblePanel>');
    expect(source).toContain('props.storyId === "ui/command"');
    expect(source).toContain('<CommandPanel className=');
    expect(source).toContain('props.storyId === "ui/scroll-area"');
    expect(source).toContain('<ScrollArea className=');
    expect(source).toContain('props.storyId === "ui/switch"');
    expect(source).toContain('<Switch aria-label="Enable notifications"');
    expect(source).toContain('props.storyId === "ui/checkbox"');
    expect(source).toContain('<Checkbox aria-label="Select project"');
    expect(source).toContain('props.storyId === "ui/icon-button"');
    expect(source).toContain('props.variant === "xs" ? "icon-xs"');
    expect(source).toContain('props.storyId === "ui/textarea"');
    expect(source).toContain('<Textarea aria-invalid=');
    expect(source).toContain('props.storyId === "ui/skeleton"');
    expect(source).toContain('props.storyId === "ui/spinner"');
    expect(source).toContain('props.variant === "compact" ? "size-3" : "size-4"');
    expect(source).toContain('<Skeleton className=');
    expect(source).toContain('props.storyId === "ui/separator"');
    expect(source).toContain('<Separator orientation="vertical"');
    expect(source).toContain('props.storyId === "ui/badge"');
    expect(source).toContain('<Badge size="sm" variant="outline">PDF</Badge>');
    expect(source).toContain('}[props.variant ?? "default"]');
    expect(source).toContain('props.storyId === "ui/time-picker"');
    expect(source).toContain('<TimePicker value="09:30"');
    expect(source).toContain('props.storyId === "ui/alert"');
    expect(source).toContain('<Alert className="max-w-lg"');
  });

  it("keeps the Space project picker story controlled after submit", () => {
    const source = readFileSync(new URL("./ComponentsLabStoryRenderer.tsx", import.meta.url), "utf8");
    expect(source).toContain("function SpaceProjectPickerStory(props: { readonly state: string })");
    expect(source).toContain("const [open, setOpen] = useState(true)");
    expect(source).toContain("onOpenChange={setOpen}");
    expect(source).not.toContain("<SpaceProjectPickerDialog open targetSpace=");
  });
});
