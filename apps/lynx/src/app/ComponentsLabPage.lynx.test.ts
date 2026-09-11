import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('paired Components Lab route', () => {
  it('uses the shared manifest and the same story/state URL contract', () => {
    const page = readFileSync(new URL('./ComponentsLabPage.lynx.tsx', import.meta.url), 'utf8');
    const router = readFileSync(new URL('./router.tsx', import.meta.url), 'utf8');
    const styles = readFileSync(new URL('./components-lab.css', import.meta.url), 'utf8');
    const sidebarStyles = readFileSync(
      new URL('../components/sidebar/sidebar.css', import.meta.url),
      'utf8'
    );
    const renderer = readFileSync(
      new URL('./ComponentsLabStoryRenderer.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(page).toContain("from '@synara/shared/componentLab'");
    expect(page).toContain('data-component-lab-story={story.id}');
    expect(page).toContain('key={`${story.id}:${variant}:${state}`}');
    expect(router).toContain("routePathname === '/components-lab'");
    expect(router).toContain("search.get('story')");
    expect(router).toContain("search.get('state')");
    expect(router).toContain("search.get('variant')");
    expect(router).toContain("search.get('embed') === '1'");
    expect(page).toContain('props.embedded');
    expect(page).toContain('ComponentsLabEmbedded');
    expect(page).toContain('onSelectState');
    expect(page).toContain('onSelectVariant');
    expect(page).toContain('variant={variant}');
    expect(page).toContain('key={`${story.id}:${variant}:${state}`}');
    expect(page).toContain('accessibility-label={`Show ${item} state`}');
    expect(renderer).toContain(
      "key={props.state} defaultOpen={props.state === 'open'}"
    );
    expect(renderer).toContain("props.storyId === 'editor-rail/independent-tabs'");
    expect(renderer).toContain('<IndependentTabsStory');
    expect(renderer).toContain('<IndependentTabRow');
    expect(renderer).toContain("defaultCollapsed={props.state === 'collapsed'}");
    expect(renderer).toContain("const tabCount = props.state === 'overflow' ? 8 : 3;");
    expect(styles).toContain('.ComponentsLabIndependentTabsStory');
    expect(renderer).toContain('<ProjectActionEditorStory key={`${props.variant}:${props.state}`}');
    expect(renderer).toContain("props.state === 'saving'");
    expect(renderer).toContain("busy={props.state === 'saving'}");
    expect(renderer).toContain("props.variant === 'shortcut-conflict'");
    expect(renderer).toContain("props.variant === 'validation-error'");
    expect(renderer).toContain('initialValue={editing ?');
    expect(renderer).toContain('onDelete={editing ?');
    expect(renderer).toContain("props.storyId === 'composer/context-window-meter'");
    expect(renderer).toContain('<ComposerContextWindowMeterElement');
    expect(renderer).toContain('resolveComponentLabContextWindowFixture(props.variant)');
    expect(renderer).toContain('usage={fixture.usage}');
    expect(renderer).toContain('deriveContextWindowMeterDisplay(fixture.usage)');
    expect(renderer).toMatch(
      /storyId === 'composer\/context-window-meter'[\s\S]*?className="ComponentsLabRealStory ComponentsLabContextMeterStory"/
    );
    expect(renderer).toContain("props.state === 'overflow'");
    expect(renderer).toContain("props.state === 'search'");
    expect(renderer).toContain("props.state === 'provider-list'");
    expect(renderer).toContain("props.state === 'favourite'");
    expect(renderer).toContain('favoriteModelSlugsOverride={{ opencode: favoriteModelSlugs }}');
    expect(renderer).toContain('onFavoriteModelSlugsChange={handleFavoriteModelSlugsChange}');
    expect(renderer).toContain("disabled={props.state === 'disabled'}");
    expect(renderer).toContain('COMPONENT_LAB_OVERFLOW_CODEX_MODELS');
    expect(renderer).toContain('COMPONENT_LAB_OPENCODE_MODELS');
    expect(renderer).toContain('<SearchableComposerModelPickerStory');
    expect(renderer).toContain('initialSearchQuery="model 12"');
    expect(renderer).toContain(
      'const [selection, setSelection] = useState<ModelSelection>'
    );
    expect(renderer).toContain('key={props.state}');
    expect(renderer).toContain('onModelSelectionChange={handleModelSelectionChange}');
    expect(renderer).toContain("modelOptionsOverride={favoriteState ? COMPONENT_LAB_OPENCODE_MODELS : runtimeModels}");
    expect(renderer).toContain("compact={props.variant === 'compact'}");
    expect(renderer).toContain("splitTraits={props.variant === 'landing' || providerList}");
    expect(renderer).toContain("initialOpen={props.state === 'open'}");
    expect(renderer).toContain("props.storyId === 'system/semantic-icon-tones'");
    expect(renderer).toContain('SEMANTIC_ICON_TONES.includes(props.variant as never)');
    expect(renderer).toContain('<SemanticIconTone');
    expect(renderer).toContain("props.storyId === 'sidebar/navigation-row'");
    expect(sidebarStyles).toMatch(
      /\.AppSidebarPrimaryNav\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*gap:\s*2px;/s
    );
    expect(renderer).toContain('<SidebarPrimaryActionRow');
    expect(renderer).toContain('onActivate={() => {}}');
    expect(renderer).toContain('resolveComponentLabNavigationRow(props.variant)');
    expect(renderer).toContain('label={fixture.label}');
    expect(renderer).toContain('fixture.shortcut ?');
    expect(renderer).toContain("props.storyId === 'sidebar/command-palette'");
    expect(renderer).toContain("props.state === 'keyboard-highlight' && fixture.actions");
    expect(renderer).toContain('<SidebarSearchPalette');
    expect(renderer).toContain('query={queryOverride ?? routeQuery}');
    expect(renderer).toContain('onQueryChange={setQueryOverride}');
    expect(renderer).toContain('resolveComponentLabCommandPaletteFixture(props.variant)');
    expect(renderer).toContain('searchStatus={fixture.searchStatus}');
    expect(renderer).toContain("fixture.searchStatus === 'error'");
    expect(renderer).toContain("props.storyId === 'transcript/message-actions'");
    expect(renderer).toContain("props.storyId === 'transcript/message-row'");
    expect(renderer).toContain('<MessageUserRowComposition>');
    expect(renderer).toContain('<MessageUserBubbleComposition>');
    expect(renderer).toContain('<MessageAssistantRowComposition>');
    expect(renderer).toContain("onActivate={() => setResult('Message copied')}");
    expect(renderer).toContain('<text aria-live="polite">{result}</text>');
    expect(renderer).toContain('<MessageActionButtonLynx');
    expect(renderer).toContain("const revealed = props.state !== 'default'");
    expect(renderer).toContain('ComponentsLabMessageActions--hidden');
    expect(renderer).toContain('resolveComponentLabMessageActions(props.variant)');
    expect(renderer).toContain("data-message-actions-variant={props.variant ?? 'assistant'}");
    expect(renderer).toContain("props.persistent ? ' TranscriptMessageAction--persistent'");
    expect(renderer).toContain("'aria-pressed': true, 'accessibility-state': { selected: true }");
    expect(styles).toMatch(
      /\.ComponentsLabMessageActions--hidden\s*\{[^}]*opacity:\s*0;[^}]*pointer-events:\s*none;/s
    );
    expect(renderer).toContain('<SidebarProjectRowSpecimen');
    expect(renderer).toContain('variant={props.variant}');
    expect(renderer).toContain("isPinned: props.variant === 'pinned'");
    expect(renderer).toContain("isRunning: props.variant === 'running'");
    expect(renderer).toContain('buildProjectContextMenuItems({');
    expect(renderer).toContain('webpackMode: "eager"');
    expect(renderer).toContain('../platform/contextMenu');
    expect(renderer).toContain('<SidebarThreadRowSpecimen');
    expect(renderer).toContain("props.storyId === 'notifications/provider-update'");
    expect(renderer).toContain('<ProviderUpdatePromptSurface');
    expect(renderer).toContain('COMPONENT_LAB_PROVIDER_UPDATE_COPY');
    expect(renderer).toContain("progress: 'updating'");
    expect(renderer).toContain("props.storyId === 'right-dock/tab-strip'");
    expect(renderer).toContain("props.storyId === 'kanban/card'");
    expect(renderer).toContain('<KanbanCardComposition');
    expect(renderer).toContain('resolveComponentLabKanbanCardFixture');
    expect(renderer).toContain('<ThreadRightDockTabs');
    expect(renderer).toContain("defaultAddMenuOpen={selected === 'add-menu-open'}");
    expect(renderer).toContain('COMPONENT_LAB_RIGHT_DOCK_OVERFLOW_PANES');
    expect(renderer).toContain("'singleton-filtering': 'add-menu-open'");
    expect(renderer).toContain("selected === 'single-pane'");
    expect(renderer).toContain("props.storyId === 'composer/voice-recorder'");
    expect(renderer).toContain('<ComposerVoiceButton');
    expect(renderer).toContain('<ComposerVoiceRecorderBar');
    expect(renderer).toContain('COMPONENT_LAB_VOICE_WAVEFORM_LEVELS');
    expect(renderer).toContain("'strong-waveform': 'recording-waveform'");
    expect(renderer).toContain("props.storyId === 'terminal/search'");
    expect(renderer).toContain('<ThreadTerminalSearchBar');
    expect(renderer).toContain("'case-sensitive': 'match-case'");
    expect(renderer).toContain("props.storyId === 'editor/file-search'");
    expect(renderer).toContain('<ExplorerSearchInputHeader');
    expect(renderer).toContain("props.variant === 'query'");
    expect(renderer).toContain("props.storyId === 'editor/file-tab'");
    expect(renderer).toContain('<ExplorerFileTab');
    expect(renderer).toContain("return <FileTabStory key={props.state} state={props.state} />;");
    expect(renderer).toContain('setOpen(false);');
    expect(renderer).toContain('>Tab closed</text>');
    expect(renderer).toContain("visualState={props.state as 'default' | 'hover' | 'focus' | 'pressed'}");
    expect(renderer).toContain("props.storyId === 'diff/file-filter'");
    expect(renderer).toContain('<ReviewFileTreeSearchHeader');
    expect(renderer).toContain("props.storyId === 'editor/project-search'");
    expect(renderer).toContain('<EditorProjectSwitchSearchHeader');
    expect(renderer).toContain("autoFocus={props.state === 'focus'}");
    expect(renderer).toContain("disabled={props.state === 'disabled'}");
    expect(renderer).toContain('<SpaceProjectPickerStory state={props.state}');
    expect(renderer).toContain("initialQuery={props.state === 'query' ? 'Alpha' : ''}");
    expect(renderer).toContain("searchAutoFocus={props.state === 'focus'}");
    expect(renderer).toContain("searchDisabled={props.state === 'disabled'}");
    expect(renderer).toContain("props.storyId === 'editor/file-preview-error'");
    expect(renderer).toContain('<WorkspaceFilePreviewErrorState');
    expect(renderer).toContain("props.variant === 'explorer-dock'");
    expect(renderer).toContain("props.variant === 'file-pane'");
    expect(renderer).toContain('data-file-preview-placement=');
    expect(styles).toContain('.ComponentsLabFileErrorStory--explorer');
    expect(styles).toContain('.ComponentsLabFileErrorStory--pane');
    expect(renderer).toContain("props.storyId === 'editor/pdf-viewer'");
    expect(renderer).toContain('<ExplorerPdfFallback');
    expect(renderer).toContain('pagePreviewUrlBuilder=');
    expect(renderer).toContain("props.storyId === 'typography/markdown-code'");
    expect(renderer).toContain('<ChatMarkdown text={markdown}');
    expect(renderer).toContain("props.storyId === 'typography/diff-code'");
    expect(renderer).toContain('<PullRequestCodeComposition');
    expect(renderer).toContain('view={COMPONENT_LAB_DIFF_CODE_VIEW}');
    expect(renderer).toContain("props.storyId === 'ui/button'");
    expect(renderer).toContain('<Button className={stateClass}');
    expect(renderer).toContain("props.variant === 'icon'");
    expect(renderer).toContain("props.storyId === 'ui/input'");
    expect(renderer).toContain('<Input aria-invalid={invalid}');
    expect(renderer).toContain("props.variant === 'small' ? 'sm'");
    expect(renderer).toContain("props.storyId === 'ui/menu'");
    expect(renderer).toContain('<MenuPopupBase align="start"');
    expect(renderer).toContain("props.variant === 'checkbox'");
    expect(renderer).toContain("props.variant === 'separator'");
    expect(renderer).toContain("props.variant === 'shortcut' ? <MenuShortcut>⌘N</MenuShortcut>");
    expect(renderer).not.toContain('value="new-chat" onActivate');
    expect(renderer).toContain("props.storyId === 'ui/dialog'");
    expect(renderer).toContain("showCloseButton={props.variant === 'close'}");
    expect(renderer).toContain("props.variant === 'title-description'");
    expect(renderer).toContain("props.variant === 'panel'");
    expect(renderer).toContain("props.variant === 'footer'");
    expect(renderer).toContain("props.storyId === 'ui/tooltip'");
    expect(renderer).toContain('<TooltipPopup variant=');
    expect(renderer).toContain("props.storyId === 'ui/kbd'");
    expect(renderer).toContain('<KbdGroup>');
    expect(renderer).toContain("props.variant === 'single'");
    expect(renderer).toContain("props.storyId === 'ui/collapsible'");
    expect(renderer).toContain('<CollapsiblePanel>');
    expect(renderer).toContain("props.storyId === 'ui/command'");
    expect(renderer).toContain('<CommandPanel className=');
    expect(renderer).toContain("props.storyId === 'ui/scroll-area'");
    expect(renderer).toContain('<ScrollArea className=');
    expect(renderer).toContain("props.storyId === 'ui/switch'");
    expect(renderer).toContain('<Switch ariaLabel="Enable notifications"');
    expect(renderer).toContain("props.storyId === 'ui/checkbox'");
    expect(renderer).toContain('<CheckboxIndicator checked=');
    expect(renderer).toContain("props.storyId === 'ui/icon-button'");
    expect(renderer).toContain("props.variant === 'xs' ? 'icon-xs'");
    expect(renderer).toContain("props.storyId === 'ui/textarea'");
    expect(renderer).toContain('<Textarea aria-invalid=');
    expect(renderer).toContain("props.storyId === 'ui/skeleton'");
    expect(renderer).toContain("props.storyId === 'ui/spinner'");
    expect(renderer).toContain("props.variant === 'compact' ? 12 : 16");
    expect(renderer).toContain('<Skeleton className=');
    expect(renderer).toContain("props.storyId === 'ui/separator'");
    expect(renderer).toContain('<Separator orientation="vertical"');
    expect(renderer).toContain("props.storyId === 'ui/badge'");
    expect(renderer).toContain('<Badge size="sm" variant="outline">PDF</Badge>');
    expect(renderer).toContain("}[props.variant ?? 'default']");
    expect(renderer).toContain("props.storyId === 'ui/time-picker'");
    expect(renderer).toContain('<TimePicker value="09:30"');
    expect(renderer).toContain("props.storyId === 'ui/alert'");
    expect(renderer).toContain('<Alert className="ComponentsLabAlert"');
    const rowSpecimen = readFileSync(
      new URL('./SidebarRowSpecimen.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(rowSpecimen).toContain('<ProjectPinAction');
    expect(rowSpecimen).toContain('actions={<Actions>');
    expect(rowSpecimen).toContain('pinned ? pinFilledSvg : pinSvg');
    expect(rowSpecimen).toContain('svgColors.iconSecondary');
    expect(rowSpecimen).toContain(
      "pinned ? 'AppSidebarProjectFolder--hidden'"
    );
    expect(router).toContain('<ComponentsLabPageLynx');
    expect(router).toContain("if (route.pathname === '/components-lab')");
    expect(router).toContain(
      '<view className="AppNotificationStack AppNotificationStack--hidden" />'
    );
    expect(router).toContain("route.pathname === '/components-lab'");
    expect(router).toContain("' AppNotificationStack--hidden'");
    const appStyles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');
    expect(appStyles).toMatch(
      /\.AppNotificationStack--hidden\s*\{[^}]*display:\s*none;/s
    );
    expect(page).toContain('ComponentsLabSidebarHeader AppWindowDragRegion');
    expect(page).toContain('ComponentsLabMainDragRegion AppWindowDragRegion');
    expect(page).toContain('<scroll-view className="ComponentsLabSidebar" scroll-orientation="vertical">');
    expect(page).toContain('<view className="ComponentsLabSidebarContent">');
    expect(page).toContain('<scroll-view className="ComponentsLabMain" scroll-orientation="vertical">');
    expect(page).toContain('accessibility-label={`Show ${item.title}`}');
    expect(page).toContain('accessibility-label={`Show ${item} state`}');
    expect(page).toContain('accessibility-state={{ selected: item === state }}');
    expect(styles).toMatch(
      /\.ComponentsLabStoryLink, \.ComponentsLabState\s*\{[^}]*-x-app-region:\s*no-drag;/s
    );
    expect(styles).toMatch(
      /\.ComponentsLabSidebarHeader\s*\{[^}]*padding:\s*10px 0 6px 70px;/s
    );
    expect(styles).toMatch(
      /\.ComponentsLabSidebar\s*\{[^}]*overflow-y:\s*auto;/s
    );
    expect(styles).toMatch(
      /\.ComponentsLabSidebarContent\s*\{[^}]*flex-shrink:\s*0;/s
    );
    expect(renderer).toContain('function SpaceProjectPickerStory(props: { readonly state: string })');
    expect(renderer).toContain('const [open, setOpen] = useState(true)');
    expect(renderer).toContain('onOpenChange={handleOpenChange}');
    expect(renderer).toContain('onSubmit={handleSubmit}');
    expect(renderer).not.toContain('<SpaceProjectPickerDialogLynx activeSpaceId={null} open projects=');
    expect(renderer).toContain('const [catalogProvider, setCatalogProvider] = useState(selection.provider)');
    expect(renderer).toContain("catalogProvider={favoriteState ? 'opencode' : catalogProvider}");
    expect(renderer).toContain('catalogModelSelection={favoriteState ? COMPONENT_LAB_OPENCODE_SELECTION : selection}');
    expect(renderer).toContain('onCatalogProviderChange={handleCatalogProviderChange}');
    expect(renderer).toContain('onModelSelectionChange={handleModelSelectionChange}');
  });
});
