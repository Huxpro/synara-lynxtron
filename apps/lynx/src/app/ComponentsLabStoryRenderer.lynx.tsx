import { useEffect, useState, type ReactNode } from '@lynx-js/react';
import type { ModelSelection } from '@synara/contracts';
import { CopyIcon, KanbanIcon, MessageCircleIcon, NewThreadIcon, PlusIcon, SearchIcon, SettingsIcon, Undo2Icon } from '../lib/icons.lynx';
import pinSvg from '@synara-central-icons/pin.svg?raw';
import { EditorRailAddMenu } from './EditorRailAddMenu.lynx';
import { ProjectActionEditor } from './ProjectActionEditor.lynx';
import { Button } from '../components/ui/button';
import { ComposerModelControl } from '../components/composer/ComposerModelControl.lynx';
import {
  COMPONENT_LAB_CODEX_MODELS,
  COMPONENT_LAB_DIFF_CODE_VIEW,
  COMPONENT_LAB_MODEL_SELECTION,
  resolveComponentLabMessageActions,
  resolveComponentLabContextWindowFixture,
  resolveComponentLabNavigationRow,
  resolveComponentLabCommandPaletteFixture,
  COMPONENT_LAB_OVERFLOW_CODEX_MODELS,
  COMPONENT_LAB_OPENCODE_MODELS,
  COMPONENT_LAB_OPENCODE_SELECTION,
  COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_FAVORITES,
  COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_MODELS,
  COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_SELECTION,
  COMPONENT_LAB_PROVIDER_UPDATE_COPY,
  COMPONENT_LAB_RIGHT_DOCK_PANES,
  COMPONENT_LAB_RIGHT_DOCK_OVERFLOW_PANES,
  COMPONENT_LAB_VOICE_SILENCE_LEVELS,
  COMPONENT_LAB_VOICE_WAVEFORM_LEVELS,
  COMPONENT_LAB_PROVIDER_STATUSES,
  resolveComponentLabKanbanCardFixture,
} from '@synara/shared/componentLabFixtures';
import { KanbanCardComposition } from '@synara-web/components/kanban/KanbanCardComposition';
import type { KanbanCard } from '@synara-web/components/kanban/kanban.logic';
import { deriveContextWindowMeterDisplay } from '@synara-web/lib/contextWindow';
import { ComposerContextWindowMeterElement } from '../adapters/ComposerInputCompositionElements.lynx';
import { SEMANTIC_ICON_TONES } from '@synara/shared/semanticIconTone';
import { SemanticIconTone } from '../adapters/SemanticIconTone.lynx';
import { SidebarPrimaryActionRow } from '@synara-web/components/SidebarPrimaryActionRow';
import { SidebarSearchPalette } from '@synara-web/components/SidebarSearchPalette';
import { MessageActionButtonLynx } from '../components/ui/MessageActionButton.lynx';
import { useLynxInteractiveState } from '../components/ui/interactive-state.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from '../adapters/useTheme.lynx';
import { SidebarProjectRowSpecimen, SidebarThreadRowSpecimen } from './SidebarRowSpecimen.lynx';
import { ProviderUpdatePromptSurface } from './ProviderUpdatePrompt.lynx';
import { ThreadRightDockTabs } from './ThreadRightDockTabs.lynx';
import { ProjectActionAddButton } from './ThreadHeaderActions.lynx';
import { ComposerVoiceButton, ComposerVoiceRecorderBar } from '../components/composer/ComposerVoiceControls.lynx';
import { ThreadTerminalSearchBar } from './ThreadTerminal.lynx';
import { ExplorerSearchInputHeader } from './ExplorerDock.lynx';
import { Input } from '../components/ui/input.lynx';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from '../components/ui/dialog.lynx';
import { Menu, MenuCheckboxItem, MenuGroupLabel, MenuItem, MenuPopupBase, MenuSeparator, MenuShortcut, MenuTrigger } from '../components/ui/menu.lynx';
import { Tooltip, TooltipPopup, TooltipTrigger } from '../components/ui/tooltip.lynx';
import { Kbd, KbdGroup } from '../components/ui/kbd.lynx';
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '../components/ui/collapsible.lynx';
import { Command, CommandEmpty, CommandGroup, CommandGroupLabel, CommandInput, CommandItem, CommandList, CommandPanel, CommandShortcut } from '../components/ui/command.lynx';
import { ScrollArea } from '../components/ui/scroll-area.lynx';
import { Switch } from '../components/ui/switch.lynx';
import { CheckboxIndicator } from '../components/ui/checkbox.lynx';
import { IconButton } from '../components/ui/icon-button.lynx';
import { Textarea } from '../components/ui/textarea.lynx';
import { Skeleton } from '../components/ui/skeleton.lynx';
import { Spinner } from '../components/ui/spinner.lynx';
import { Separator } from '../components/ui/separator.lynx';
import { Badge } from '../components/ui/badge.lynx';
import { TimePicker } from '../components/ui/time-picker.lynx';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.lynx';
import { ChatMarkdown } from '../components/markdown/ChatMarkdown.lynx';
import { PullRequestCodeComposition } from '@synara-web/components/pullRequest/PullRequestCodeComposition';
import { WorkspaceFilePreviewErrorState } from '@synara-web/components/WorkspaceFilePreviewErrorState';
import { defaultFilePreviewMode, type FilePreviewMode } from '@synara/shared/filePreviewMode';
import { SpaceProjectPickerDialogLynx } from '../components/sidebar/SpaceProjectPickerDialog.lynx';
import { ExplorerPdfFallback } from './ExplorerPdfFallback.lynx';
import { buildProjectContextMenuItems, buildThreadContextMenuItems } from '@synara/shared/contextMenu';
import { ReviewFileTreeSearchHeader } from './DiffDock.lynx';
import { EditorProjectSwitchSearchHeader } from './EditorProjectSwitchMenu.lynx';
import { ExplorerFileTab } from './ExplorerFileTab.lynx';
import { ExplorerPreviewHeader } from './ExplorerPreviewHeader.lynx';
import { IndependentTabRow } from './IndependentTabRow.lynx';
import { EditorSurfaceTab } from './EditorSurfaceTab.lynx';
import {
  MessageAssistantRowComposition,
  MessageUserBubbleComposition,
  MessageUserRowComposition,
} from '@synara-web/components/chat/MessageRowComposition';
import './components-lab.css';

const COMPONENT_LAB_SPACE = { id: 'component-lab-focus' as never, name: 'Focus', icon: 'target' as const };
const COMPONENT_LAB_OTHER_SPACE = { id: 'component-lab-work' as never, name: 'Work', icon: 'bag' as const };
const COMPONENT_LAB_SPACE_PROJECTS = [
  { id: 'component-lab-alpha', kind: 'project' as const, title: 'Alpha', workspaceRoot: '/work/alpha', defaultModelSelection: null, scripts: [], spaceId: null },
  { id: 'component-lab-beta', kind: 'project' as const, title: 'Beta', workspaceRoot: '/work/beta', defaultModelSelection: null, scripts: [], spaceId: COMPONENT_LAB_OTHER_SPACE.id },
];

function ProjectRowContextMenuStory(props: {
  readonly state: Parameters<typeof SidebarProjectRowSpecimen>[0]['state'];
  readonly variant?: Parameters<typeof SidebarProjectRowSpecimen>[0]['variant'];
}) {
  const openContextMenu = (
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void
  ) => {
    'background only';
    const items = buildProjectContextMenuItems({
      isPinned: props.variant === 'pinned',
      isRunning: props.variant === 'running',
      hasOpenServer: props.variant === 'running',
      hasArchivableThreads: true,
      hasAnyThreads: true,
      currentSpaceId: 'personal',
      spaces: [
        { id: 'personal', label: 'Personal' },
        { id: 'design', label: 'Design' },
      ],
    });
    void import(/* webpackMode: "eager" */ '../platform/contextMenu').then(
      ({ showContextMenu }) =>
        showContextMenu(items, position, {
          restoreFocus,
        })
    );
  };
  return (
    <SidebarProjectRowSpecimen
      state={props.state}
      variant={props.variant}
      onContextMenu={openContextMenu}
    />
  );
}

function ThreadRowContextMenuStory(props: {
  readonly state: Parameters<typeof SidebarThreadRowSpecimen>[0]['state'];
  readonly variant?: Parameters<typeof SidebarThreadRowSpecimen>[0]['variant'];
}) {
  const openContextMenu = (
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void
  ) => {
    'background only';
    const items = buildThreadContextMenuItems({
      isPinned: props.variant === 'pinned',
      copyPathAvailable: true,
      openPathInTerminalAvailable: true,
    });
    void import(/* webpackMode: "eager" */ '../platform/contextMenu').then(
      ({ showContextMenu }) => showContextMenu(items, position, { restoreFocus })
    );
  };
  return (
    <SidebarThreadRowSpecimen
      state={props.state}
      variant={props.variant}
      onContextMenu={openContextMenu}
    />
  );
}

export function ComponentsLabStoryRendererLynx(props: { readonly state: string; readonly storyId: string; readonly variant?: string }) {
  if (props.storyId === 'ui/alert') {
    const selected = props.state === 'default' ? props.variant ?? 'default' : props.state;
    const variant = selected as 'default' | 'warning' | 'error' | 'success' | 'info';
    return <Alert className="ComponentsLabAlert" variant={variant} accessibilityLabel="Provider status. Review this status before starting the next turn."><view><AlertTitle>Provider status</AlertTitle><AlertDescription><text>Review this status before starting the next turn.</text></AlertDescription></view></Alert>;
  }
  if (props.storyId === 'ui/time-picker') {
    return <TimePicker value="09:30" onChange={() => {}} />;
  }
  if (props.storyId === 'ui/badge') {
    const badge = {
      default: <Badge>3</Badge>,
      secondary: <Badge variant="secondary">Beta</Badge>,
      outline: <Badge size="sm" variant="outline">PDF</Badge>,
      status: <Badge variant="success">Ready</Badge>,
      capsule: <Badge shape="capsule" variant="outline">Synara</Badge>,
    }[props.variant ?? 'default'];
    return <view className="ComponentsLabPrimitiveGrid">{badge}</view>;
  }
  if (props.storyId === 'ui/separator') {
    const vertical = props.state === 'vertical' || (props.state === 'default' && props.variant === 'vertical');
    return vertical ? <view className="ComponentsLabVerticalSeparator"><text>Left</text><Separator orientation="vertical" /><text>Right</text></view> : <view className="ComponentsLabHorizontalSeparator"><text>Above</text><Separator /><text>Below</text></view>;
  }
  if (props.storyId === 'ui/skeleton') {
    return <view className="ComponentsLabSkeletonGrid"><Skeleton className="ComponentsLabSkeletonLine" />{props.variant === 'stack' ? <Skeleton className="ComponentsLabSkeletonLine ComponentsLabSkeletonLine--short" /> : null}</view>;
  }
  if (props.storyId === 'ui/spinner') {
    return <Spinner size={props.variant === 'compact' ? 12 : 16} />;
  }
  if (props.storyId === 'ui/textarea') {
    const size = props.variant === 'small' ? 'sm' : props.variant === 'large' ? 'lg' : 'default';
    return <Textarea aria-invalid={props.state === 'invalid'} className={`ComponentsLabTextarea${props.state === 'focus' ? ' ComponentsLabPrimitiveFocus' : ''}`} defaultValue={props.state === 'filled' ? 'Describe the requested component change.' : undefined} disabled={props.state === 'disabled'} nativeInput placeholder="Describe the change" size={size} />;
  }
  if (props.storyId === 'ui/icon-button') {
    const active = props.state === 'hover' || props.state === 'pressed';
    const stateClass = `${active ? ' ui-active' : ''}${props.state === 'focus' ? ' ComponentsLabPrimitiveFocus' : ''}`;
    const size = props.variant === 'xs' ? 'icon-xs' : props.variant === 'sm' ? 'icon-sm' : 'icon';
    return <view className="ComponentsLabPrimitiveGrid"><IconButton className={stateClass} disabled={props.state === 'disabled' || props.variant === 'disabled'} label="Add item" size={size}><PlusIcon size={14} /></IconButton></view>;
  }
  if (props.storyId === 'ui/checkbox') {
    const selected = props.state === 'default' ? props.variant ?? 'unchecked' : props.state;
    return <view className={`${selected === 'focus' ? 'ComponentsLabPrimitiveFocus' : ''}${props.variant === 'compact' ? ' ComponentsLabPrimitiveCompact' : ''}`} style={{ opacity: selected === 'disabled' ? 0.64 : 1 }}><CheckboxIndicator checked={selected === 'checked'} mixed={selected === 'mixed'} /></view>;
  }
  if (props.storyId === 'ui/switch') {
    const selected = props.state === 'default' ? props.variant ?? 'off' : props.state;
    const stateClass = selected === 'hover' ? 'ui-hover' : selected === 'focus' ? 'ui-focus' : selected === 'pressed' ? 'ui-pressed' : '';
    return <Switch ariaLabel="Enable notifications" checked={selected === 'on' || selected === 'checked'} disabled={selected === 'disabled'} className={stateClass} onCheckedChange={() => {}} />;
  }
  if (props.storyId === 'ui/scroll-area') {
    const selected = props.state === 'default' ? props.variant ?? 'vertical' : props.state;
    const horizontal = selected === 'horizontal';
    return (
      <ScrollArea className="ComponentsLabScrollArea" hideScrollbars={selected === 'hidden-scrollbar'} orientation={horizontal ? 'horizontal' : 'vertical'}>
        <view className={horizontal ? 'ComponentsLabScrollContent ComponentsLabScrollContent--horizontal' : 'ComponentsLabScrollContent'}>
          {Array.from({ length: 12 }, (_, index) => <view key={index} className="ComponentsLabScrollItem"><text>Item {index + 1}</text></view>)}
        </view>
      </ScrollArea>
    );
  }
  if (props.storyId === 'ui/command') {
    const selected = props.state === 'default' ? props.variant ?? 'results' : props.state;
    const empty = selected === 'empty';
    return (
      <Command autoHighlight={selected === 'highlighted' ? 'always' : false}>
        <CommandPanel className="ComponentsLabCommandPanel">
          <CommandInput placeholder="Search commands" />
          <CommandList>
            {empty ? <CommandEmpty>No results found.</CommandEmpty> : <CommandGroup><CommandGroupLabel>Actions</CommandGroupLabel><CommandItem value="new-chat" disabled={selected === 'disabled'} onClick={() => {}}><text>New chat</text><CommandShortcut><text>⌘N</text></CommandShortcut></CommandItem><CommandItem value="settings" onClick={() => {}}><text>Settings</text><CommandShortcut><text>⌘,</text></CommandShortcut></CommandItem></CommandGroup>}
          </CommandList>
        </CommandPanel>
      </Command>
    );
  }
  if (props.storyId === 'ui/kbd') {
    return props.variant === 'single'
      ? <Kbd>⌘K</Kbd>
      : <KbdGroup><Kbd>⌘</Kbd><text>+</text><Kbd>Shift</Kbd><text>+</text><Kbd>P</Kbd></KbdGroup>;
  }
  if (props.storyId === 'ui/collapsible') {
    const selected = props.state === 'default' ? props.variant ?? 'closed' : props.state;
    return (
      <Collapsible key={`${props.variant}:${props.state}`} defaultOpen={selected === 'open'} disabled={selected === 'disabled'}>
        <view className="ComponentsLabCollapsible">
          <CollapsibleTrigger className="ComponentsLabCollapsibleTrigger" disabled={selected === 'disabled'}><text>Project details</text><text>⌄</text></CollapsibleTrigger>
          <CollapsiblePanel><text className="ComponentsLabCollapsibleContent">Shared disclosure content</text></CollapsiblePanel>
        </view>
      </Collapsible>
    );
  }
  if (props.storyId === 'ui/tooltip') {
    const selected = props.state === 'default' ? props.variant ?? 'default' : props.state;
    return (
      <view className="ComponentsLabRealStory">
        <Tooltip key={`${props.variant}:${props.state}`} defaultOpen={selected !== 'default'}>
          <TooltipTrigger><Button aria-label="Copy" size="icon-xs" variant="ghost"><CopyIcon size={14} /></Button></TooltipTrigger>
          <TooltipPopup variant={selected === 'picker' ? 'picker' : 'default'}>Copy to clipboard</TooltipPopup>
        </Tooltip>
      </view>
    );
  }
  if (props.storyId === 'ui/dialog') {
    return (
      <view className="ComponentsLabRealStory">
        <Button>Open dialog</Button>
        <Dialog key={`${props.variant}:${props.state}`} defaultOpen={props.state !== 'default'}>
          <DialogPopup showCloseButton={props.variant === 'close'}>
            {props.variant === 'title-description' ? <DialogHeader><DialogTitle>Component settings</DialogTitle><DialogDescription>Shared dialog anatomy across both renderers.</DialogDescription></DialogHeader> : null}
            {props.variant === 'panel' ? <DialogPanel><text className="ComponentsLabPrimitiveCopy">{props.state === 'long-content' ? 'This longer content verifies panel spacing and scrolling. '.repeat(12) : 'Dialog panel content'}</text></DialogPanel> : null}
            {props.variant === 'footer' ? <DialogFooter><Button variant="outline">Cancel</Button><Button>Save</Button></DialogFooter> : null}
            {props.variant === 'close' ? <DialogHeader><DialogTitle>Closable dialog</DialogTitle></DialogHeader> : null}
          </DialogPopup>
        </Dialog>
      </view>
    );
  }
  if (props.storyId === 'ui/menu') {
    const visualClass = props.state === 'hover' ? 'ui-hover' : props.state === 'focus' ? 'ui-focus' : props.state === 'pressed' ? 'ui-pressed' : '';
    return (
      <view className="ComponentsLabRealStory">
        <Menu key={props.state} defaultOpen={props.state !== 'default'}>
          <MenuTrigger><Button variant="outline">Open menu</Button></MenuTrigger>
          <MenuPopupBase align="start" className="ComponentsLabPrimitiveMenu">
            <MenuGroupLabel>Actions</MenuGroupLabel>
            {props.variant === 'checkbox' ? (
              <MenuCheckboxItem checked onCheckedChange={() => {}}>Show terminal</MenuCheckboxItem>
            ) : props.variant === 'separator' ? (
              <><MenuItem onClick={() => {}}>New chat</MenuItem><MenuSeparator /><MenuItem onClick={() => {}}>Remove</MenuItem></>
            ) : (
              <MenuItem className={visualClass} disabled={props.state === 'disabled'} trailing={props.variant === 'shortcut' ? <MenuShortcut>⌘N</MenuShortcut> : undefined} onClick={() => {}}>New chat</MenuItem>
            )}
          </MenuPopupBase>
        </Menu>
      </view>
    );
  }
  if (props.storyId === 'ui/button') {
    const active = props.state === 'hover' || props.state === 'pressed';
    const disabled = props.state === 'disabled';
    const stateClass = `${active ? ' ui-active' : ''}${props.state === 'focus' ? ' ComponentsLabPrimitiveFocus' : ''}`;
    if (props.variant === 'icon') return <Button aria-label="Add item" className={stateClass} disabled={disabled} size="icon-xs" variant="ghost"><PlusIcon size={14} /></Button>;
    const variant = props.variant === 'primary' ? 'default' : props.variant as 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    const label = props.variant === 'primary' ? 'Primary' : `${props.variant?.slice(0, 1).toUpperCase()}${props.variant?.slice(1)}`;
    return <Button className={stateClass} disabled={disabled} variant={variant}>{label}</Button>;
  }
  if (props.storyId === 'ui/input') {
    const value = props.state === 'filled' ? 'Component fidelity' : undefined;
    const disabled = props.state === 'disabled';
    const invalid = props.state === 'invalid';
    const focusClass = props.state === 'focus' ? 'ComponentsLabPrimitiveFocus' : '';
    const size = props.variant === 'small' ? 'sm' : props.variant === 'large' ? 'lg' : 'default';
    return <view className="ComponentsLabInputGrid"><Input aria-invalid={invalid} className={focusClass} defaultValue={value} disabled={disabled} placeholder={`${props.variant ?? 'default'} input`} size={size} variant={props.variant === 'soft' ? 'soft' : 'default'} /></view>;
  }
  if (props.storyId === 'editor-rail/add-menu') {
    return (
      <view className="ComponentsLabRealStory">
        <EditorRailAddMenu key={props.state} defaultOpen={props.state === 'open'} onNewChat={() => {}} onNewTerminal={() => {}} trigger={<view className="ComponentsLabEditorRailAddTrigger"><PlusIcon size={14} /></view>} />
      </view>
    );
  }
  if (props.storyId === 'editor-rail/independent-tabs') {
    return <IndependentTabsStory state={props.state} variant={props.variant} />;
  }
  if (props.storyId === 'editor/file-preview-header') {
    return <FilePreviewHeaderStory key={`${props.variant}:${props.state}`} state={props.state} variant={props.variant} />;
  }
  if (props.storyId === 'project-actions/add-editor') {
    return <ProjectActionEditorStory key={`${props.variant}:${props.state}`} state={props.state} variant={props.variant} />;
  }
  if (props.storyId === 'composer/model-effort-picker') {
    return props.state === 'search' ? (
      <SearchableComposerModelPickerStory />
    ) : (
      <ComposerModelPickerStory key={`${props.variant}:${props.state}`} state={props.state} variant={props.variant} />
    );
  }
  if (props.storyId === 'composer/context-window-meter') {
    const fixture = resolveComponentLabContextWindowFixture(props.variant);
    return (
      <view className="ComponentsLabRealStory ComponentsLabContextMeterStory">
        <ComposerContextWindowMeterElement
          key={props.state}
          usage={fixture.usage}
          display={deriveContextWindowMeterDisplay(fixture.usage)}
          cumulativeCostUsd={fixture.cumulativeCostUsd}
          activeWindowLabel={fixture.activeWindowLabel}
          pendingWindowLabel={fixture.pendingWindowLabel}
          initialOpen={props.state === 'open'}
        />
      </view>
    );
  }
  if (props.storyId === 'system/semantic-icon-tones') {
    const tone = SEMANTIC_ICON_TONES.includes(props.variant as never)
      ? props.variant as (typeof SEMANTIC_ICON_TONES)[number]
      : 'primary';
    return (
      <view className="ComponentsLabIconToneGrid"><SemanticIconTone tone={tone} /></view>
    );
  }
  if (props.storyId === 'notifications/provider-update') {
    const selected = props.state === 'default'
      ? ({ single: 'default', multiple: 'multiple', progress: 'updating', failure: 'failure' }[props.variant ?? 'single'] ?? 'default')
      : props.state;
    const fixture =
      COMPONENT_LAB_PROVIDER_UPDATE_COPY[
        selected as keyof typeof COMPONENT_LAB_PROVIDER_UPDATE_COPY
      ] ?? COMPONENT_LAB_PROVIDER_UPDATE_COPY.default;
    return (
      <view className="ComponentsLabNotificationStory">
        <ProviderUpdatePromptSurface
          title={fixture.title}
          description={fixture.description}
          state={selected as 'default' | 'multiple' | 'updating' | 'failure'}
          copyText={'copyText' in fixture ? fixture.copyText : undefined}
          onCopy={() => {}}
          onDismiss={() => {}}
          onReview={() => {}}
          onUpdateAll={() => {}}
        />
      </view>
    );
  }
  if (props.storyId === 'right-dock/tab-strip') {
    const selected = props.state === 'default'
      ? ({ empty: 'empty', 'single-pane': 'single-pane', 'multi-pane': 'default', overflow: 'overflow', 'singleton-filtering': 'add-menu-open' }[props.variant ?? 'multi-pane'] ?? 'default')
      : props.state;
    const panes =
      selected === 'empty'
        ? []
        : selected === 'single-pane'
          ? [COMPONENT_LAB_RIGHT_DOCK_PANES[1]!]
          : selected === 'overflow'
            ? COMPONENT_LAB_RIGHT_DOCK_OVERFLOW_PANES
            : COMPONENT_LAB_RIGHT_DOCK_PANES;
    return (
      <view className={`ComponentsLabRightDockStory${selected === 'overflow' ? ' ComponentsLabRightDockStory--narrow' : ''}`}>
        <ThreadRightDockTabs
          key={`${props.variant}:${props.state}`}
          activePaneId="terminal"
          addMenuKinds={['diff', 'browser', 'git']}
          defaultAddMenuOpen={selected === 'add-menu-open'}
          paneLabelOverrides={{ 'sidechat:component-lab': 'Side chat' }}
          panes={panes}
          onAddPane={() => {}}
          onClosePane={() => {}}
          onCollapse={() => {}}
          onSelectPane={() => {}}
        />
      </view>
    );
  }
  if (props.storyId === 'kanban/card') {
    const fixture = resolveComponentLabKanbanCardFixture(props.variant);
    const card = {
      cardId: `thread:component-lab-kanban-${props.variant ?? 'default'}`,
      threadId: `component-lab-kanban-${props.variant ?? 'default'}`,
      projectId: 'component-lab-project',
      provider: 'codex', isTerminal: false, branch: 'feature/fidelity',
      envMode: null, worktreePath: null, thread: null,
      draftHasAttachments: fixture.column === 'draft', sortTimestamp: 0,
      timestamp: null, ...fixture,
    } as KanbanCard;
    return <view className="ComponentsLabKanbanCardStory"><KanbanCardComposition card={card} nowMs={Date.parse('2026-01-01T00:05:00.000Z')} visualState={props.state as 'default' | 'hover' | 'focus' | 'pressed'} /></view>;
  }
  if (props.storyId === 'composer/voice-recorder') {
    const selected = props.state === 'default'
      ? ({ idle: 'default', silence: 'recording-silence', 'strong-waveform': 'recording-waveform', transcribing: 'transcribing' }[props.variant ?? 'idle'] ?? 'default')
      : props.state;
    if (selected === 'default') {
      return <ComposerVoiceButton disabled={false} onActivate={() => {}} />;
    }
    return (
      <view className="ComponentsLabVoiceStory">
        <ComposerVoiceRecorderBar
          durationLabel="0:08"
          transcribing={selected === 'transcribing'}
          waveformLevels={
            selected === 'recording-waveform'
              ? COMPONENT_LAB_VOICE_WAVEFORM_LEVELS
              : COMPONENT_LAB_VOICE_SILENCE_LEVELS
          }
          onCancel={() => {}}
          onSubmit={() => {}}
        />
      </view>
    );
  }
  if (props.storyId === 'terminal/search') {
    const selected = props.state;
    const query = selected === 'default' ? '' : 'missing-command';
    return (
      <view className={`ComponentsLabTerminalStory${props.variant === 'right-dock' ? ' ComponentsLabTerminalStory--rightDock' : ''}`}>
        <ThreadTerminalSearchBar
          query={query}
          hasResults={query ? false : null}
          activeCaseSensitive={selected === 'match-case'}
          onQueryChange={() => {}}
          onClose={() => {}}
          onPrevious={() => {}}
          onNext={() => {}}
          onToggleCase={() => {}}
        />
      </view>
    );
  }
  if (props.storyId === 'editor/file-search') {
    return (
      <view className={`ComponentsLabEditorSearchStory${props.variant === 'right-dock' ? ' ComponentsLabEditorSearchStory--rightDock' : ''}`}>
        <ExplorerSearchInputHeader
          query={props.state === 'query' ? 'ComposerVoice' : ''}
          onQueryChange={() => {}}
        />
      </view>
    );
  }
  if (props.storyId === 'editor/file-tab') {
    return <FileTabStory key={props.state} state={props.state} />;
  }
  if (props.storyId === 'diff/file-filter') {
    const handleQueryChange = () => { 'background only'; };
    return (
      <view className="ComponentsLabDiffFilterStory">
        <ReviewFileTreeSearchHeader
          autoFocus={props.state === 'focus'}
          disabled={props.state === 'disabled'}
          query={props.state === 'query' ? 'Composer' : ''}
          onQueryChange={handleQueryChange}
        />
      </view>
    );
  }
  if (props.storyId === 'editor/project-search') {
    const handleQueryChange = () => { 'background only'; };
    return (
      <view className="ComponentsLabProjectSearchStory">
        <EditorProjectSwitchSearchHeader
          autoFocus={props.state === 'focus'}
          disabled={props.state === 'disabled'}
          query={props.state === 'query' ? 'Alpha' : ''}
          onQueryChange={handleQueryChange}
        />
      </view>
    );
  }
  if (props.storyId === 'sidebar/space-project-picker') {
    return <SpaceProjectPickerStory state={props.state} />;
  }
  if (props.storyId === 'editor/file-preview-error') {
    return <FilePreviewErrorStory key={`${props.variant}:${props.state}`} state={props.state} variant={props.variant} />;
  }
  if (props.storyId === 'editor/pdf-viewer') {
    const initialZoomMode =
      props.state === 'zoomed'
        ? ({ type: 'custom', scale: 1.25 } as const)
        : props.state === 'fit-page'
          ? ({ type: 'fit-page' } as const)
          : ({ type: 'fit-width' } as const);
    return <view className="ComponentsLabPdfStory"><ExplorerPdfFallback key={props.state} path="report.pdf" workspaceRoot="/workspace" metadataError={false} metadataPending={false} pageCount={3} pageWidth={300} pageHeight={180} previewError={false} previewPending={false} previewUrl="component-lab://pdf" initialZoomMode={initialZoomMode} zoomMenuDefaultOpen={props.state === 'menu-open'} pagePreviewUrlBuilder={() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lvONNwAAAABJRU5ErkJggg=='} /></view>;
  }
  if (props.storyId === 'typography/markdown-code') {
    const markdown =
      props.variant === 'inline'
        ? 'Use `font-family: var(--font-mono-family)` for inline code.'
        : props.variant === 'block'
          ? "```ts\nconst glyphWidth = measure('iiiiMMMM');\n```"
          : "Inline `const answer = 42` and block code:\n\n```ts\nfunction align(value: number) { return value + 1; }\n```";
    return <view className="ComponentsLabTypographyStory"><ChatMarkdown text={markdown} /></view>;
  }
  if (props.storyId === 'typography/diff-code') {
    return <view className="ComponentsLabTypographyStory ComponentsLabDiffTypographyStory"><PullRequestCodeComposition view={COMPONENT_LAB_DIFF_CODE_VIEW} truncated={false} renderMode={props.variant === 'split' ? 'split' : 'stacked'} wordWrap={props.variant === 'wrapped'} expandedFileKeys={[COMPONENT_LAB_DIFF_CODE_VIEW.files[0].key]} visibleLineCounts={{ [COMPONENT_LAB_DIFF_CODE_VIEW.files[0].key]: 3 }} rawVisibleLineCount={3} onToggleFile={() => {}} onShowMoreFile={() => {}} onShowMoreRaw={() => {}} /></view>;
  }
  if (props.storyId === 'sidebar/navigation-row') {
    const visualState = props.state === 'active' ? 'default' : props.state;
    const fixture = resolveComponentLabNavigationRow(props.variant);
    const icon = {
      kanban: <KanbanIcon size={15} />,
      'new-thread': <NewThreadIcon size={15} />,
      search: <SearchIcon size={15} />,
      settings: <SettingsIcon size={15} />,
    }[fixture.icon];
    return (
      <view className="ComponentsLabSidebarRowStory">
        <SidebarPrimaryActionRow
          icon={icon}
          label={fixture.label}
          active={props.state === 'active'}
          onActivate={() => {}}
          visualState={visualState as 'default' | 'hover' | 'focus' | 'pressed'}
          trailing={fixture.shortcut ? <text className="ComponentsLabSidebarShortcut">{fixture.shortcut}</text> : undefined}
        />
      </view>
    );
  }
  if (props.storyId === 'sidebar/command-palette') {
    return <SidebarCommandPaletteStory key={`${props.variant}:${props.state}`} state={props.state} variant={props.variant} />;
  }
  if (props.storyId === 'transcript/message-actions') {
    return <TranscriptMessageActionsStory state={props.state} variant={props.variant} />;
  }
  if (props.storyId === 'transcript/message-row') {
    return <MessageRowStory key={`${props.variant}:${props.state}`} state={props.state} variant={props.variant} />;
  }
  if (props.storyId === 'sidebar/project-row') {
    return <ProjectRowContextMenuStory state={props.state as Parameters<typeof SidebarProjectRowSpecimen>[0]['state']} variant={props.variant as Parameters<typeof SidebarProjectRowSpecimen>[0]['variant']} />;
  }
  if (props.storyId === 'sidebar/thread-row') {
    return <ThreadRowContextMenuStory state={props.state as Parameters<typeof SidebarThreadRowSpecimen>[0]['state']} variant={props.variant as Parameters<typeof SidebarThreadRowSpecimen>[0]['variant']} />;
  }
  return <view className="ComponentsLabPendingStory"><text>Renderer pending · {props.storyId} · {props.state}</text></view>;
}

function IndependentTabsStory(props: { readonly state: string; readonly variant?: string }) {
  const [result, setResult] = useState('Awaiting tab action');
  const terminal = props.variant !== 'chat';
  const tabCount = props.state === 'overflow' ? 8 : 3;
  const tabs = Array.from({ length: tabCount }, (_, index) => (
    <EditorSurfaceTab
      key={`${props.variant ?? 'chat'}-${index}`}
      active={index === 1}
      className="ComponentsLabIndependentTab"
      closeLabel={`Close ${terminal ? 'Terminal' : 'Chat'} ${index + 1}`}
      icon={terminal ? <text className="ThreadEditorRailTerminalGlyph">&gt;_</text> : <OpenAIProviderIcon provider="codex" />}
      label={`${terminal ? 'Terminal' : 'Chat'} ${index + 1}`}
      onClose={() => setResult(`Closed tab ${index + 1}`)}
      onSelect={() => setResult(`Selected tab ${index + 1}`)}
    />
  ));
  const actionPlacement = props.variant === 'chat' ? 'start' : 'end';
  return (
    <view className="ComponentsLabIndependentTabsStory">
      <IndependentTabRow
        actionPlacement={actionPlacement}
        className="ComponentsLabIndependentTabsRow"
        defaultCollapsed={props.state === 'collapsed'}
        owner={(props.variant ?? 'chat') as 'chat' | 'terminal-pane' | 'terminal-groups'}
        tabs={tabs}
        actions={(
          <>
            <Button size="icon-xs" variant="chrome" aria-label="Add tab" onClick={() => setResult('Added tab')}>
              <PlusIcon size={14} />
            </Button>
            <Button size="icon-xs" variant="chrome" aria-label="Split right" onClick={() => setResult('Split right')}>
              <text>Ⅱ</text>
            </Button>
          </>
        )}
      />
      <text className="ComponentsLabIndependentTabsResult" aria-live="polite">{result}</text>
    </view>
  );
}

function FilePreviewHeaderStory(props: { readonly state: string; readonly variant?: string }) {
  const presentation = props.variant === 'editor' ? 'editor' : 'dock';
  const [mode, setMode] = useState<FilePreviewMode>(() =>
    props.state === 'source' || props.state === 'preview'
      ? props.state
      : defaultFilePreviewMode({ filePath: 'docs/guides/reference/README.md', presentation })
  );
  return (
    <view className={`ComponentsLabFilePreviewHeaderStory${props.variant === 'narrow' ? ' ComponentsLabFilePreviewHeaderStory--narrow' : ''}`}>
      <ExplorerPreviewHeader
        actionMenuDefaultOpen={props.state === 'menu-open'}
        path="docs/guides/reference/README.md"
        isMarkdown
        markdownPreviewEnabled={mode === 'preview'}
        onMarkdownPreviewChange={(rendered) => setMode(rendered ? 'preview' : 'source')}
        threadId="component-lab-thread"
        truncated={props.variant === 'truncated'}
        workspaceRoot="/workspace/synara"
      />
      <text className="ComponentsLabFilePreviewHeaderResult" aria-live="polite">{mode === 'preview' ? 'Preview mode' : 'Source mode'}</text>
    </view>
  );
}

function FilePreviewErrorStory(props: { readonly state: string; readonly variant?: string }) {
  const [result, setResult] = useState('Awaiting recovery action');
  const placementClass = props.variant === 'explorer-dock'
    ? ' ComponentsLabFileErrorStory--explorer'
    : props.variant === 'file-pane'
      ? ' ComponentsLabFileErrorStory--pane'
      : '';
  const ownsClose = props.state !== 'no-close-owner' && props.variant !== 'explorer-dock';
  return <view className={`ComponentsLabFileErrorStory${placementClass}`} data-file-preview-placement={props.variant ?? 'editor'}><WorkspaceFilePreviewErrorState detail={props.variant === 'detailed-error' ? 'ENOENT: src/components/Missing.tsx' : null} retrying={props.state === 'retrying'} onRetry={() => setResult('Retry requested')} onClose={ownsClose ? () => setResult('Preview closed') : undefined} /><text className="ComponentsLabFileErrorResult">{result}</text></view>;
}

function FileTabStory(props: { readonly state: string }) {
  const [open, setOpen] = useState(true);
  return (
    <view className="ComponentsLabFileTabStory">
      {open ? (
        <ExplorerFileTab
          path="src/example.ts"
          visualState={props.state as 'default' | 'hover' | 'focus' | 'pressed'}
          onClose={() => {
            'background only';
            setOpen(false);
          }}
        />
      ) : (
        <text aria-live="polite">Tab closed</text>
      )}
    </view>
  );
}

function MessageRowStory(props: { readonly state: string; readonly variant?: string }) {
  const [result, setResult] = useState('Awaiting message action');
  const visualState = ['hover', 'focus', 'pressed'].includes(props.state)
    ? ` ui-${props.state}`
    : '';
  const actions = (
    <>
      <TranscriptMessageActionStory label="Copy message" disabled={false} persistent={false} pressed={false} visualState="" onActivate={() => setResult('Message copied')}><CopyIcon className="TranscriptMessageActionIcon" size={13} /></TranscriptMessageActionStory>
      <TranscriptMessageActionStory label="Reference message" disabled={false} persistent={false} pressed={false} visualState="" onActivate={() => setResult('Message referenced')}><MessageCircleIcon className="TranscriptMessageActionIcon" size={13} /></TranscriptMessageActionStory>
    </>
  );
  const footerClassName = `TranscriptMessageFooter${props.state === 'default' ? '' : ' TranscriptMessageFooter--persistent'}`;
  return (
    <view className={`ComponentsLabMessageRowStory TranscriptMessageHoverRegion${visualState}`}>
      {props.variant === 'user' ? (
        <MessageUserRowComposition>
          <MessageUserBubbleComposition><text>Please align this preview with Electron.</text></MessageUserBubbleComposition>
          <view className={`${footerClassName} TranscriptMessageFooter--user`}><text className="TranscriptMessageTimestamp">9:41 AM</text>{actions}</view>
        </MessageUserRowComposition>
      ) : (
        <MessageAssistantRowComposition>
          <text>The shared message row keeps actions quiet until the row is active.</text>
          <view className={footerClassName}>{actions}<text className="TranscriptMessageTimestamp">9:41 AM</text></view>
        </MessageAssistantRowComposition>
      )}
      <text aria-live="polite">{result}</text>
    </view>
  );
}

function TranscriptMessageActionsStory(props: { readonly state: string; readonly variant?: string }) {
  const { svgColors } = useTheme();
  const disabled = props.state === 'disabled';
  const revealed = props.state !== 'default';
  const visualState = ['hover', 'focus', 'pressed'].includes(props.state)
    ? ` ui-${props.state}`
    : '';
  const actions = resolveComponentLabMessageActions(props.variant);
  const actionIcon = {
    copy: <CopyIcon className="TranscriptMessageActionIcon" size={13} />,
    edit: <NewThreadIcon className="TranscriptMessageActionIcon" size={13} />,
    pin: <svg className="TranscriptMessageActionIcon" content={colorizeLynxSvg(pinSvg, svgColors.iconSecondary)} />,
    reference: <MessageCircleIcon className="TranscriptMessageActionIcon" size={13} />,
    revert: <Undo2Icon className="TranscriptMessageActionIcon" size={13} />,
  };
  return (
    <view
      className={`ComponentsLabMessageActions${
        revealed ? '' : ' ComponentsLabMessageActions--hidden'
      }`}
      data-message-actions-visible={revealed}
      data-message-actions-variant={props.variant ?? 'assistant'}
    >
      {actions.map((action) => (
        <TranscriptMessageActionStory
          key={action.label}
          label={action.label}
          disabled={disabled}
          persistent={action.persistent ?? false}
          pressed={action.pressed ?? false}
          visualState={visualState}
        >
          {actionIcon[action.icon]}
        </TranscriptMessageActionStory>
      ))}
    </view>
  );
}

function TranscriptMessageActionStory(props: {
  readonly children: ReactNode;
  readonly disabled: boolean;
  readonly label: string;
  readonly persistent: boolean;
  readonly pressed: boolean;
  readonly visualState: string;
  readonly onActivate?: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `TranscriptMessageAction${
      props.persistent ? ' TranscriptMessageAction--persistent' : ''
    }`,
    accessibleLabel: props.label,
    disabled: props.disabled,
    onActivate: props.onActivate ?? (() => {}),
  });
  return (
    <MessageActionButtonLynx
      className={`${interaction.className}${props.visualState}${
        props.disabled ? ' ui-disabled' : ''
      }`}
      eventProps={{
        ...interaction.eventProps,
        ...(props.pressed
          ? { 'aria-pressed': true, 'accessibility-state': { selected: true } }
          : {}),
      }}
    >
      {props.children}
    </MessageActionButtonLynx>
  );
}

function SidebarCommandPaletteStory(props: { readonly state: string; readonly variant?: string }) {
  const fixture = resolveComponentLabCommandPaletteFixture(props.variant);
  const routeOpen = props.state === 'open' || props.state === 'keyboard-highlight';
  const routeQuery =
    props.state === 'keyboard-highlight' && fixture.actions
      ? 'settings'
      : fixture.query;
  const [queryOverride, setQueryOverride] = useState<string | null>(null);
  const [open, setOpen] = useState(routeOpen);
  const [mode, setMode] = useState<'search' | 'import'>('search');
  useEffect(() => setOpen(routeOpen), [routeOpen]);
  return (
    <view className="ComponentsLabRealStory">
      <Button size="sm" variant="chrome-outline" onClick={() => setOpen(true)}>Search</Button>
      <SidebarSearchPalette
        open={open} query={queryOverride ?? routeQuery} onQueryChange={setQueryOverride}
        mode={mode} onModeChange={setMode} onOpenChange={setOpen}
        actions={fixture.actions ? [{ id: 'settings', label: 'Settings', description: 'Configure Synara' }] : []}
        projects={[{ id: 'component-lab-project', name: 'Synara', remoteName: 'synara', folderName: 'synara', localName: null, cwd: '/workspace/synara', spaceName: 'Personal' }]}
        threads={fixture.threads ? [{ id: 'component-lab-thread', title: 'Component fidelity', projectId: 'component-lab-project', projectName: 'Synara', projectRemoteName: 'synara', spaceName: 'Personal', provider: 'codex', createdAt: '2026-01-01T00:00:00.000Z', messages: [{ text: 'Align the component library' }] }] : []}
        searchStatus={fixture.searchStatus} searchErrorMessage={fixture.searchStatus === 'error' ? 'Snapshot unavailable.' : null} onRetrySearch={() => {}} onCreateChat={() => {}} onCreateThread={() => {}}
        onAddProjectPath={async () => {}} homeDir="/workspace" onOpenSettings={() => {}}
        onOpenFeedback={() => {}} onOpenUsageSettings={() => {}} onOpenProject={() => {}}
        onOpenThread={() => {}} importProviders={[]} onImportThread={async () => {}}
        filesystemBrowseEnabled={false}
      />
    </view>
  );
}

function ComposerModelPickerStory(props: { readonly state: string; readonly variant?: string }) {
  const [selection, setSelection] = useState<ModelSelection>(
    COMPONENT_LAB_MODEL_SELECTION
  );
  const [catalogProvider, setCatalogProvider] = useState(selection.provider);
  const submenuOpen = props.state === 'submenu-open' || props.state === 'overflow';
  const providerList = props.state === 'provider-list';
  const favoriteState = props.state === 'favourite';
  const groupDisclosureState = props.state === 'group-disclosure';
  const [favoriteModelSlugs, setFavoriteModelSlugs] = useState<ReadonlyArray<string>>(() =>
    groupDisclosureState
      ? COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_FAVORITES
      : favoriteState
        ? ['open-model-02']
        : []
  );
  const runtimeModels = groupDisclosureState
    ? COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_MODELS
    : catalogProvider === 'opencode'
    ? COMPONENT_LAB_OPENCODE_MODELS
    : props.state === 'overflow'
      ? COMPONENT_LAB_OVERFLOW_CODEX_MODELS
      : COMPONENT_LAB_CODEX_MODELS;
  const handleCatalogProviderChange = (provider: ModelSelection['provider']) => {
    'background only';
    setCatalogProvider(provider);
  };
  const handleModelSelectionChange = (nextSelection: ModelSelection) => {
    'background only';
    setSelection(nextSelection);
    setCatalogProvider(nextSelection.provider);
  };
  const handleFavoriteModelSlugsChange = (
    _provider: 'cursor' | 'kilo' | 'opencode' | 'pi',
    slugs: ReadonlyArray<string>
  ) => {
    'background only';
    setFavoriteModelSlugs(slugs);
  };
  return (
    <view className="ComponentsLabRealStory">
      <ComposerModelControl
        key={props.state}
        modelSelection={groupDisclosureState ? COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_SELECTION : favoriteState ? COMPONENT_LAB_OPENCODE_SELECTION : selection}
        catalogModelSelection={groupDisclosureState ? COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_SELECTION : favoriteState ? COMPONENT_LAB_OPENCODE_SELECTION : selection}
        catalogProvider={groupDisclosureState || favoriteState ? 'opencode' : catalogProvider}
        runtimeModels={groupDisclosureState ? COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_MODELS : favoriteState ? COMPONENT_LAB_OPENCODE_MODELS : runtimeModels}
        modelOptionsOverride={groupDisclosureState ? COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_MODELS : favoriteState ? COMPONENT_LAB_OPENCODE_MODELS : runtimeModels}
        modelsLoading={false}
        compact={props.variant === 'compact'}
        providers={COMPONENT_LAB_PROVIDER_STATUSES}
        initialPanel={providerList ? 'providers' : undefined}
        initialOpen={props.state === 'open' || providerList || submenuOpen || favoriteState || groupDisclosureState}
        initialSubmenuOpen={submenuOpen || groupDisclosureState}
        initialSearchQuery=""
        disabled={props.state === 'disabled'}
        splitTraits={props.variant === 'landing' || providerList}
        favoriteModelSlugsOverride={{ opencode: favoriteModelSlugs }}
        onFavoriteModelSlugsChange={handleFavoriteModelSlugsChange}
        onCatalogProviderChange={handleCatalogProviderChange}
        onModelSelectionChange={handleModelSelectionChange}
      />
    </view>
  );
}

function SpaceProjectPickerStory(props: { readonly state: string }) {
  const [open, setOpen] = useState(true);
  const handleOpenChange = (nextOpen: boolean) => {
    'background only';
    setOpen(nextOpen);
  };
  const handleSubmit = async () => {
    'background only';
    return [] as const;
  };
  return (
    <SpaceProjectPickerDialogLynx
      activeSpaceId={null}
      open={open}
      projects={COMPONENT_LAB_SPACE_PROJECTS}
      spaces={[COMPONENT_LAB_SPACE, COMPONENT_LAB_OTHER_SPACE]}
      initialQuery={props.state === 'query' ? 'Alpha' : ''}
      searchAutoFocus={props.state === 'focus'}
      searchDisabled={props.state === 'disabled'}
      targetSpace={COMPONENT_LAB_SPACE}
      onOpenChange={handleOpenChange}
      onSubmit={handleSubmit}
    />
  );
}

function SearchableComposerModelPickerStory() {
  return (
    <view className="ComponentsLabRealStory">
      <view className="ComponentsLabSearchableModelFixture">
        <ComposerModelControl
          modelSelection={COMPONENT_LAB_OPENCODE_SELECTION}
          catalogProvider="opencode"
          runtimeModels={COMPONENT_LAB_OPENCODE_MODELS}
          modelOptionsOverride={COMPONENT_LAB_OPENCODE_MODELS}
          modelsLoading={false}
          providers={COMPONENT_LAB_PROVIDER_STATUSES}
          initialOpen
          initialSubmenuOpen
          initialSearchQuery="model 12"
          onCatalogProviderChange={() => {}}
          onModelSelectionChange={() => {}}
        />
      </view>
    </view>
  );
}

function ProjectActionEditorStory(props: { readonly state: string; readonly variant?: string }) {
  const editing = props.variant === 'edit' || props.variant === 'shortcut-conflict';
  const [open, setOpen] = useState(
    props.state === 'open' ||
      props.state === 'saving' ||
      props.state === 'error' ||
      props.variant === 'validation-error' ||
      props.variant === 'shortcut-conflict'
  );
  return (
    <view className="ComponentsLabRealStory">
      <ProjectActionAddButton compact onActivate={() => setOpen(true)} />
      <ProjectActionEditor
        open={open}
        busy={props.state === 'saving'}
        error={props.variant === 'shortcut-conflict'
          ? 'Shortcut is already assigned to New thread.'
          : props.variant === 'validation-error' || props.state === 'error'
            ? 'Command is required.'
            : null}
        initialValue={editing ? { name: 'Test', command: 'bun run test', icon: 'test', keybinding: props.variant === 'shortcut-conflict' ? 'mod+t' : null, runOnWorktreeCreate: false } : undefined}
        onDelete={editing ? () => {} : undefined}
        onOpenChange={setOpen}
        onSave={() => {}}
      />
    </view>
  );
}
