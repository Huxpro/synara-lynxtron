import type { ComponentLabStory } from "@synara/contracts";

export const COMPONENT_LAB_RELAY_STORAGE_KEY =
  "synara:components-lab:relay-url:v1";

export const COMPONENT_LAB_VIEWPORTS = [
  { id: "desktop-1280x820", width: 1280, height: 820 },
  { id: "desktop-1440x900", width: 1440, height: 900 },
] as const;

const INTERACTIVE_STATES = [
  "default",
  "hover",
  "focus",
  "pressed",
] as const;

export const COMPONENT_LAB_STORIES: readonly ComponentLabStory[] = [
  {
    id: "automation/composer-dialog",
    title: "Automation composer dialog",
    category: "automation",
    owner: "AutomationDialog",
    fixtureId: "automation-composer",
    variants: ["create", "edit"],
    states: ["default", "saving"],
    themes: ["light", "dark"],
    viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: {
        renderer: "electron",
        component: "AutomationDialog",
        module: "apps/web/src/routes/-automations.shared.tsx",
        consumers: ["automations/create", "automations/edit"],
      },
      lynx: {
        renderer: "lynx",
        component: "AutomationCreateDialog / AutomationEditDialog",
        module: "apps/lynx/src/app/AutomationCreateDialog.lynx.tsx",
        consumers: ["automations/create", "automations/edit"],
      },
    },
  },
  {
    id: "kanban/card", title: "Kanban card", category: "kanban", owner: "KanbanCardComposition", fixtureId: "kanban-card-states", variants: ["default", "long-title", "draft", "working"], states: [...INTERACTIVE_STATES], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "KanbanCardComposition", module: "apps/web/src/components/kanban/KanbanCardComposition.tsx", consumers: ["kanban/overview", "kanban/project"] },
      lynx: { renderer: "lynx", component: "KanbanCardComposition", module: "apps/web/src/components/kanban/KanbanCardComposition.tsx", consumers: ["kanban/overview", "kanban/project"] },
    },
  },
  {
    id: "editor-rail/add-menu",
    title: "Editor rail add menu",
    category: "editor-rail",
    owner: "EditorRailAddMenu",
    fixtureId: "editor-rail-with-sidechat",
    variants: ["chat-and-terminal"],
    states: ["default", "open"],
    themes: ["light", "dark"],
    viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: {
        renderer: "electron",
        component: "EditorRailAddMenuComposition",
        module: "apps/web/src/components/chat/EditorRailAddMenuComposition.tsx",
        consumers: ["editor-view/sidechat-header"],
      },
      lynx: {
        renderer: "lynx",
        component: "EditorRailAddMenu",
        module: "apps/lynx/src/app/EditorRailAddMenu.lynx.tsx",
        consumers: ["editor-view/sidechat-header"],
      },
    },
  },
  {
    id: "editor-rail/independent-tabs",
    title: "Independent tab rows",
    category: "editor-rail",
    owner: "IndependentTabRow",
    fixtureId: "chat-and-terminal-tab-rows",
    variants: ["chat", "terminal-pane", "terminal-groups"],
    states: ["default", "collapsed", "overflow"],
    themes: ["light", "dark"],
    viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: {
        renderer: "electron",
        component: "IndependentTabRow",
        module: "apps/web/src/components/chat/IndependentTabRow.tsx",
        consumers: ["editor-view/chat-tabs", "terminal/pane-tabs", "terminal/group-tabs"],
      },
      lynx: {
        renderer: "lynx",
        component: "IndependentTabRow",
        module: "apps/lynx/src/app/IndependentTabRow.lynx.tsx",
        consumers: ["editor-view/chat-tabs", "terminal/pane-tabs", "terminal/group-tabs"],
      },
    },
  },
  {
    id: "composer/model-effort-picker",
    title: "Composer model and effort picker",
    category: "composer",
    owner: "ComposerModelControl",
    fixtureId: "codex-model-catalog",
    variants: ["thread", "landing", "compact"],
    states: ["default", "open", "provider-list", "submenu-open", "overflow", "search", "favourite", "group-disclosure", "disabled"],
    cases: [
      { variant: "thread", state: "default" },
      { variant: "thread", state: "open" },
      { variant: "thread", state: "provider-list" },
      { variant: "thread", state: "submenu-open" },
      { variant: "thread", state: "overflow" },
      { variant: "thread", state: "search" },
      { variant: "thread", state: "favourite" },
      { variant: "thread", state: "group-disclosure" },
      { variant: "thread", state: "disabled" },
      { variant: "landing", state: "default" },
      { variant: "landing", state: "open" },
      { variant: "compact", state: "default" },
      { variant: "compact", state: "open" },
      { variant: "compact", state: "submenu-open" },
      { variant: "compact", state: "overflow" },
      { variant: "compact", state: "disabled" },
    ],
    themes: ["light", "dark"],
    viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: {
        renderer: "electron",
        component: "ComposerModelEffortPicker",
        module: "apps/web/src/components/chat/ComposerModelEffortPicker.tsx",
        consumers: ["thread-composer", "landing-composer"],
      },
      lynx: {
        renderer: "lynx",
        component: "ComposerModelControl",
        module: "apps/lynx/src/components/composer/ComposerModelControl.lynx.tsx",
        consumers: ["thread-composer", "landing-composer"],
      },
    },
  },
  {
    id: "composer/context-window-meter",
    title: "Context window meter and card",
    category: "composer",
    owner: "ContextWindowMeter",
    fixtureId: "context-window-7-4-percent",
    variants: ["percentage-and-ratio", "optional-rows", "high-usage"],
    states: ["default", "open"],
    themes: ["light", "dark"],
    viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: {
        renderer: "electron",
        component: "ContextWindowMeter",
        module: "apps/web/src/components/chat/ContextWindowMeter.tsx",
        consumers: ["thread-composer", "slash-status-dialog"],
      },
      lynx: {
        renderer: "lynx",
        component: "ComposerContextWindowMeterElement",
        module: "apps/lynx/src/adapters/ComposerInputCompositionElements.lynx.tsx",
        consumers: ["thread-composer", "slash-status-dialog"],
      },
    },
  },
  {
    id: "project-actions/add-editor",
    title: "Add project action editor",
    category: "project-actions",
    owner: "ProjectActionEditor",
    fixtureId: "project-action-new",
    variants: ["create", "edit", "validation-error", "shortcut-conflict"],
    states: ["default", "open", "saving", "error"],
    cases: [
      { variant: "create", state: "default" },
      { variant: "create", state: "open" },
      { variant: "create", state: "saving" },
      { variant: "create", state: "error" },
      { variant: "edit", state: "default" },
      { variant: "edit", state: "open" },
      { variant: "edit", state: "saving" },
      { variant: "edit", state: "error" },
      { variant: "validation-error", state: "default" },
      { variant: "shortcut-conflict", state: "default" },
    ],
    themes: ["light", "dark"],
    viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: {
        renderer: "electron",
        component: "ProjectScriptsControl",
        module: "apps/web/src/components/ProjectScriptsControl.tsx",
        consumers: ["thread-header/add-action"],
      },
      lynx: {
        renderer: "lynx",
        component: "ProjectActionEditor",
        module: "apps/lynx/src/app/ProjectActionEditor.lynx.tsx",
        consumers: ["thread-header/add-action"],
      },
    },
  },
  {
    id: "sidebar/command-palette",
    title: "Sidebar command palette",
    category: "navigation",
    owner: "SidebarSearchPalette",
    fixtureId: "sidebar-search-default",
    variants: ["suggested", "recent", "filtered", "empty", "error"],
    states: ["default", "open", "keyboard-highlight"],
    cases: [
      { variant: "suggested", state: "default" },
      { variant: "suggested", state: "open" },
      { variant: "suggested", state: "keyboard-highlight" },
      { variant: "recent", state: "open" },
      { variant: "filtered", state: "open" },
      { variant: "empty", state: "open" },
      { variant: "error", state: "open" },
    ],
    themes: ["light", "dark"],
    viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: {
        renderer: "electron",
        component: "SidebarSearchPalette",
        module: "apps/web/src/components/SidebarSearchPalette.tsx",
        consumers: ["sidebar/search", "global/cmd-k"],
      },
      lynx: {
        renderer: "lynx",
        component: "SidebarSearchPaletteLynx",
        module: "apps/lynx/src/components/sidebar/SidebarSearchPalette.lynx.tsx",
        consumers: ["sidebar/search", "global/cmd-k"],
      },
    },
  },
  {
    id: "sidebar/navigation-row",
    title: "Sidebar navigation row",
    category: "navigation",
    owner: "SidebarPrimaryNavigationRow",
    fixtureId: "sidebar-navigation-primary",
    variants: ["new-thread", "search", "kanban", "settings"],
    states: [...INTERACTIVE_STATES, "active"],
    themes: ["light", "dark"],
    viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "SidebarPrimaryActionRow", module: "apps/web/src/components/SidebarPrimaryActionRow.tsx", consumers: ["sidebar/new-thread", "sidebar/search", "sidebar/kanban", "sidebar/settings"] },
      lynx: { renderer: "lynx", component: "SidebarPrimaryActionRow", module: "apps/web/src/components/SidebarPrimaryActionRow.tsx", consumers: ["sidebar/new-thread", "sidebar/search", "sidebar/kanban", "sidebar/settings"] },
    },
  },
  {
    id: "sidebar/project-row", title: "Sidebar project row", category: "navigation", owner: "SidebarProjectRow", fixtureId: "sidebar-project-running", variants: ["default", "running", "pinned"], states: [...INTERACTIVE_STATES], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "SidebarProjectSummary", module: "apps/web/src/components/Sidebar.tsx", consumers: ["sidebar/project-row"] },
      lynx: { renderer: "lynx", component: "SidebarNavigationRow", module: "apps/lynx/src/components/sidebar/Sidebar.lynx.tsx", consumers: ["sidebar/project-row"] },
    },
  },
  {
    id: "sidebar/thread-row", title: "Sidebar thread row", category: "navigation", owner: "SidebarThreadRow", fixtureId: "sidebar-thread-active", variants: ["default", "active", "pinned"], states: [...INTERACTIVE_STATES, "active-hover"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "SidebarThreadRow", module: "apps/web/src/components/Sidebar.tsx", consumers: ["sidebar/thread-row"] },
      lynx: { renderer: "lynx", component: "SidebarNavigationRow", module: "apps/lynx/src/components/sidebar/Sidebar.lynx.tsx", consumers: ["sidebar/thread-row"] },
    },
  },
  {
    id: "transcript/message-actions", title: "Transcript message actions", category: "transcript", owner: "MessageActions", fixtureId: "assistant-and-user-messages", variants: ["assistant", "user", "tool", "pinned"], states: [...INTERACTIVE_STATES, "revealed", "disabled"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    cases: [
      ...["assistant", "user", "pinned"].flatMap((variant) =>
        [...INTERACTIVE_STATES, "revealed", "disabled"].map((state) => ({ variant, state }))
      ),
      { variant: "tool", state: "default" },
    ],
    renderers: {
      electron: { renderer: "electron", component: "MessageActionButton", module: "apps/web/src/components/chat/MessageActionButton.tsx", consumers: ["transcript/assistant-actions", "transcript/user-actions"] },
      lynx: { renderer: "lynx", component: "MessageActionButtonLynx", module: "apps/lynx/src/components/ui/MessageActionButton.lynx.tsx", consumers: ["transcript/assistant-actions", "transcript/user-actions"] },
    },
  },
  {
    id: "transcript/message-row", title: "Transcript message row", category: "transcript", owner: "MessageRowComposition", fixtureId: "message-row-copy", variants: ["assistant", "user"], states: [...INTERACTIVE_STATES], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "MessageAssistantRowComposition", module: "apps/web/src/components/chat/MessageRowComposition.tsx", consumers: ["thread/transcript/assistant", "thread/transcript/user"] },
      lynx: { renderer: "lynx", component: "MessageAssistantRowComposition", module: "apps/web/src/components/chat/MessageRowComposition.tsx", consumers: ["thread/transcript/assistant", "thread/transcript/user"] },
    },
  },
  {
    id: "system/semantic-icon-tones", title: "Semantic icon tones", category: "design-system", owner: "SemanticIconTone", fixtureId: "icon-tone-matrix", variants: ["primary", "secondary", "tertiary", "accent", "inverse", "disabled"], states: ["default"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "SemanticIconTone", module: "apps/web/src/components/ui/SemanticIconTone.tsx", consumers: ["composer/actions", "transcript/actions", "sidebar/actions", "header/actions", "environment/actions"] },
      lynx: { renderer: "lynx", component: "SemanticIconTone", module: "apps/lynx/src/adapters/SemanticIconTone.lynx.tsx", consumers: ["composer/actions", "transcript/actions", "sidebar/actions", "header/actions", "environment/actions"] },
    },
  },
  {
    id: "notifications/provider-update", title: "Provider update notification", category: "notifications", owner: "ProviderUpdateNotification", fixtureId: "provider-update-statuses", variants: ["provider-update"], states: ["default", "multiple", "updating", "failure"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "ToastSurface", module: "apps/web/src/components/ui/toast.tsx", consumers: ["global/provider-update-notification"] },
      lynx: { renderer: "lynx", component: "ProviderUpdatePromptSurface", module: "apps/lynx/src/app/ProviderUpdatePrompt.lynx.tsx", consumers: ["global/provider-update-notification"] },
    },
  },
  {
    id: "right-dock/tab-strip", title: "Right dock tabs and add menu", category: "right-dock", owner: "RightDockTabs", fixtureId: "explorer-terminal-sidechat", variants: ["empty", "single-pane", "multi-pane", "overflow", "singleton-filtering"], states: ["default", "add-menu-open"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "RightDockTabs", module: "apps/web/src/components/chat/RightDock.tsx", consumers: ["thread/right-dock-header"] },
      lynx: { renderer: "lynx", component: "ThreadRightDockTabs", module: "apps/lynx/src/app/ThreadRightDockTabs.lynx.tsx", consumers: ["thread/right-dock-header"] },
    },
  },
  {
    id: "composer/voice-recorder", title: "Voice recorder", category: "composer", owner: "ComposerVoiceRecorderBar", fixtureId: "voice-waveform", variants: ["recorder"], states: ["default", "recording-silence", "recording-waveform", "transcribing"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "ComposerVoiceRecorderBar", module: "apps/web/src/components/chat/ComposerVoiceRecorderBar.tsx", consumers: ["thread-composer/voice", "landing-composer/voice"] },
      lynx: { renderer: "lynx", component: "ComposerVoiceRecorderBar", module: "apps/lynx/src/components/composer/ComposerVoiceControls.lynx.tsx", consumers: ["thread-composer/voice", "landing-composer/voice"] },
    },
  },
  {
    id: "terminal/search", title: "Terminal search", category: "terminal", owner: "TerminalSearch", fixtureId: "terminal-search", variants: ["thread", "right-dock"], states: ["default", "no-results", "match-case"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "TerminalSearch", module: "apps/web/src/components/TerminalSearch.tsx", consumers: ["thread/terminal-search", "right-dock/terminal-search"] },
      lynx: { renderer: "lynx", component: "ThreadTerminalSearchBar", module: "apps/lynx/src/app/ThreadTerminal.lynx.tsx", consumers: ["thread/terminal-search", "right-dock/terminal-search"] },
    },
  },
  {
    id: "editor/file-search", title: "Editor file search", category: "editor", owner: "WorkspaceSearchInputHeader", fixtureId: "editor-file-search", variants: ["editor", "right-dock"], states: ["default", "query"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "WorkspaceSearchInputHeader", module: "apps/web/src/components/chat/workspaceExplorer.tsx", consumers: ["editor/file-search", "right-dock/file-search"] },
      lynx: { renderer: "lynx", component: "ExplorerSearchInputHeader", module: "apps/lynx/src/app/ExplorerDock.lynx.tsx", consumers: ["editor/file-search", "right-dock/file-search"] },
    },
  },
  {
    id: "editor/file-tab", title: "Editor file tab", category: "editor", owner: "SurfaceTabChip", fixtureId: "editor-file-tab", variants: ["typescript"], states: ["default", "hover", "focus", "pressed", "active"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "SurfaceTabChip", module: "apps/web/src/components/chat/chatHeaderControls.tsx", consumers: ["editor/file-preview-tab", "right-dock/tab-strip"] },
      lynx: { renderer: "lynx", component: "ExplorerFileTab", module: "apps/lynx/src/app/ExplorerFileTab.lynx.tsx", consumers: ["editor/file-preview-tab", "right-dock/tab-strip"] },
    },
  },
  {
    id: "editor/file-preview-header", title: "File preview header", category: "editor", owner: "WorkspaceFilePreviewHeader", fixtureId: "deep-markdown-path", variants: ["editor", "dock", "narrow", "truncated"], states: ["default", "source", "preview", "menu-open"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "WorkspaceFilePreviewHeader", module: "apps/web/src/components/chat/WorkspaceFilePreviewHeader.tsx", consumers: ["editor/file-preview", "right-dock/explorer-preview", "right-dock/file-preview"] },
      lynx: { renderer: "lynx", component: "ExplorerPreviewHeader", module: "apps/lynx/src/app/ExplorerPreviewHeader.lynx.tsx", consumers: ["editor/file-preview", "right-dock/explorer-preview", "right-dock/file-preview"] },
    },
  },
  {
    id: "diff/file-filter", title: "Diff file filter", category: "diff", owner: "ReviewFileTreeSearchHeader", fixtureId: "diff-file-filter", variants: ["review-tree"], states: ["default", "query", "focus", "disabled"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "ReviewFileTreeSearchHeader", module: "apps/web/src/components/ReviewFileTreePanel.tsx", consumers: ["diff/review-file-tree"] },
      lynx: { renderer: "lynx", component: "ReviewFileTreeSearchHeader", module: "apps/lynx/src/app/DiffDock.lynx.tsx", consumers: ["diff/review-file-tree"] },
    },
  },
  {
    id: "editor/project-search", title: "Editor project search", category: "editor", owner: "ProjectMenuPicker search header", fixtureId: "editor-project-search", variants: ["project-switcher"], states: ["default", "query", "focus", "disabled"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "PickerPanelSearchHeader", module: "apps/web/src/components/chat/PickerPanelShell.tsx", consumers: ["editor/project-switcher", "project-menu-picker"] },
      lynx: { renderer: "lynx", component: "EditorProjectSwitchSearchHeader", module: "apps/lynx/src/app/EditorProjectSwitchMenu.lynx.tsx", consumers: ["editor/project-switcher", "project-menu-picker"] },
    },
  },
  {
    id: "sidebar/space-project-picker", title: "Space project picker", category: "navigation", owner: "SpaceProjectPickerDialog", fixtureId: "space-project-assignment", variants: ["grouped-projects"], states: ["default", "query", "focus", "disabled"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "SpaceProjectPickerDialog", module: "apps/web/src/components/SpaceProjectPickerDialog.tsx", consumers: ["sidebar/empty-space/move-projects"] },
      lynx: { renderer: "lynx", component: "SpaceProjectPickerDialogLynx", module: "apps/lynx/src/components/sidebar/SpaceProjectPickerDialog.lynx.tsx", consumers: ["sidebar/empty-space/move-projects"] },
    },
  },
  {
    id: "editor/file-preview-error", title: "File preview recovery", category: "editor", owner: "WorkspaceFilePreviewErrorState", fixtureId: "missing-workspace-file", variants: ["editor", "explorer-dock", "file-pane", "detailed-error"], states: ["default", "retrying", "no-close-owner"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    cases: [
      { variant: "editor", state: "default" },
      { variant: "editor", state: "retrying" },
      { variant: "editor", state: "no-close-owner" },
      { variant: "explorer-dock", state: "default" },
      { variant: "explorer-dock", state: "retrying" },
      { variant: "file-pane", state: "default" },
      { variant: "file-pane", state: "retrying" },
      { variant: "file-pane", state: "no-close-owner" },
      { variant: "detailed-error", state: "default" },
      { variant: "detailed-error", state: "retrying" },
    ],
    renderers: {
      electron: { renderer: "electron", component: "WorkspaceFilePreviewErrorState", module: "apps/web/src/components/WorkspaceFilePreviewErrorState.tsx", consumers: ["editor/file-preview", "right-dock/explorer-preview", "right-dock/file-preview"] },
      lynx: { renderer: "lynx", component: "WorkspaceFilePreviewErrorState", module: "apps/web/src/components/WorkspaceFilePreviewErrorState.tsx", consumers: ["editor/file-preview", "right-dock/explorer-preview", "right-dock/file-preview"] },
    },
  },
  {
    id: "editor/pdf-viewer", title: "PDF viewer", category: "editor", owner: "PdfViewerToolbar", fixtureId: "pdf-page-300x180", variants: ["landscape"], states: ["default", "zoomed", "fit-page", "menu-open"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "PdfViewerToolbar", module: "apps/web/src/components/pdf/PdfViewerToolbar.tsx", consumers: ["editor/pdf-preview", "right-dock/pdf-preview"] },
      lynx: { renderer: "lynx", component: "ExplorerPdfFallback", module: "apps/lynx/src/app/ExplorerPdfFallback.lynx.tsx", consumers: ["editor/pdf-preview", "right-dock/pdf-preview"] },
    },
    platformDeltas: [{ renderer: "lynx", rationale: "Native uses server-rasterized pages because Lynx does not expose the browser pdf.js canvas, selectable text, or link-layer runtime. Toolbar zoom, fit, page navigation, and Open remain behaviorally paired.", evidence: "ExplorerPdfFallback and localPdfPreview" }],
  },
  {
    id: "typography/markdown-code", title: "Markdown code typography", category: "typography", owner: "ChatMarkdown", fixtureId: "markdown-code-sample", variants: ["inline", "block", "mixed"], states: ["default"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "ChatMarkdown", module: "apps/web/src/components/ChatMarkdown.tsx", consumers: ["transcript/assistant-markdown", "transcript/user-markdown"] },
      lynx: { renderer: "lynx", component: "ChatMarkdown", module: "apps/lynx/src/components/markdown/ChatMarkdown.lynx.tsx", consumers: ["transcript/assistant-markdown", "transcript/user-markdown"] },
    },
  },
  {
    id: "typography/diff-code", title: "Diff code typography", category: "typography", owner: "PullRequestCodeComposition", fixtureId: "diff-code-lines", variants: ["stacked", "wrapped", "split"], states: ["default"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "PullRequestCodeComposition", module: "apps/web/src/components/pullRequest/PullRequestCodeComposition.tsx", consumers: ["pull-request/code", "thread/diff"] },
      lynx: { renderer: "lynx", component: "PullRequestCodeComposition", module: "apps/web/src/components/pullRequest/PullRequestCodeComposition.tsx", consumers: ["pull-request/code", "thread/diff"] },
    },
  },
  {
    id: "ui/button", title: "Button primitives", category: "design-system", owner: "Button", fixtureId: "button-variants", variants: ["primary", "secondary", "outline", "ghost", "destructive", "prominent", "icon"], states: [...INTERACTIVE_STATES, "disabled"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Button", module: "apps/web/src/components/ui/button.tsx", consumers: ["global/button", "dialog/actions", "toolbar/icon-button"] },
      lynx: { renderer: "lynx", component: "Button", module: "apps/lynx/src/components/ui/button.lynx.tsx", consumers: ["global/button", "dialog/actions", "toolbar/icon-button"] },
    },
  },
  {
    id: "ui/input", title: "Input primitives", category: "design-system", owner: "Input", fixtureId: "input-sizes-and-validation", variants: ["default", "small", "large", "soft"], states: ["default", "filled", "focus", "disabled", "invalid"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Input", module: "apps/web/src/components/ui/input.tsx", consumers: ["forms/input", "settings/input", "search/input"] },
      lynx: { renderer: "lynx", component: "Input", module: "apps/lynx/src/components/ui/input.lynx.tsx", consumers: ["forms/input", "settings/input", "search/input"] },
    },
  },
  {
    id: "ui/menu", title: "Menu primitives", category: "design-system", owner: "Menu", fixtureId: "menu-items", variants: ["item", "checkbox", "separator", "shortcut"], states: ["default", "open", "hover", "focus", "pressed", "disabled"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    cases: [
      { variant: "item", state: "default" },
      ...["item", "checkbox", "separator", "shortcut"].flatMap((variant) =>
        ["open", "hover", "focus", "pressed", "disabled"].map((state) => ({ variant, state }))
      ),
    ],
    renderers: {
      electron: { renderer: "electron", component: "Menu", module: "apps/web/src/components/ui/menu.tsx", consumers: ["global/menu", "composer/menu", "toolbar/menu"] },
      lynx: { renderer: "lynx", component: "Menu", module: "apps/lynx/src/components/ui/menu.lynx.tsx", consumers: ["global/menu", "composer/menu", "toolbar/menu"] },
    },
  },
  {
    id: "ui/dialog", title: "Dialog primitives", category: "design-system", owner: "Dialog", fixtureId: "dialog-anatomy", variants: ["title-description", "panel", "footer", "close"], states: ["default", "open", "long-content"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Dialog", module: "apps/web/src/components/ui/dialog.tsx", consumers: ["global/dialog", "settings/dialog", "project-action/dialog"] },
      lynx: { renderer: "lynx", component: "Dialog", module: "apps/lynx/src/components/ui/dialog.lynx.tsx", consumers: ["global/dialog", "settings/dialog", "project-action/dialog"] },
    },
  },
  {
    id: "ui/tooltip", title: "Tooltip primitives", category: "design-system", owner: "Tooltip", fixtureId: "tooltip-copy", variants: ["default", "picker"], states: ["default", "open"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    cases: [
      { variant: "default", state: "default" },
      { variant: "default", state: "open" },
      { variant: "picker", state: "open" },
    ],
    renderers: {
      electron: { renderer: "electron", component: "Tooltip", module: "apps/web/src/components/ui/tooltip.tsx", consumers: ["global/tooltip", "toolbar/tooltip", "composer/tooltip"] },
      lynx: { renderer: "lynx", component: "Tooltip", module: "apps/lynx/src/components/ui/tooltip.lynx.tsx", consumers: ["global/tooltip", "toolbar/tooltip", "composer/tooltip"] },
    },
  },
  {
    id: "ui/kbd", title: "Keyboard hints", category: "design-system", owner: "Kbd", fixtureId: "keyboard-shortcuts", variants: ["single", "group"], states: ["default"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Kbd", module: "apps/web/src/components/ui/kbd.tsx", consumers: ["command/shortcut", "menu/shortcut", "settings/shortcut"] },
      lynx: { renderer: "lynx", component: "Kbd", module: "apps/lynx/src/components/ui/kbd.lynx.tsx", consumers: ["command/shortcut", "menu/shortcut", "settings/shortcut"] },
    },
  },
  {
    id: "ui/collapsible", title: "Collapsible disclosure", category: "design-system", owner: "Collapsible", fixtureId: "collapsible-content", variants: ["project-details"], states: ["default", "open", "disabled"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Collapsible", module: "apps/web/src/components/ui/collapsible.tsx", consumers: ["sidebar/disclosure", "settings/disclosure", "composer/suggestions"] },
      lynx: { renderer: "lynx", component: "Collapsible", module: "apps/lynx/src/components/ui/collapsible.lynx.tsx", consumers: ["sidebar/disclosure", "settings/disclosure", "composer/suggestions"] },
    },
  },
  {
    id: "ui/command", title: "Command primitives", category: "design-system", owner: "Command", fixtureId: "command-results", variants: ["actions"], states: ["default", "highlighted", "empty", "disabled"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Command", module: "apps/web/src/components/ui/command.tsx", consumers: ["command-palette/results", "command-palette/search"] },
      lynx: { renderer: "lynx", component: "Command", module: "apps/lynx/src/components/ui/command.lynx.tsx", consumers: ["command-palette/results", "command-palette/search"] },
    },
  },
  {
    id: "ui/scroll-area", title: "Scroll area primitives", category: "design-system", owner: "ScrollArea", fixtureId: "scroll-overflow", variants: ["content"], states: ["default", "horizontal", "hidden-scrollbar"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "ScrollArea", module: "apps/web/src/components/ui/scroll-area.tsx", consumers: ["dialog/panel", "command/results", "dock/content"] },
      lynx: { renderer: "lynx", component: "ScrollArea", module: "apps/lynx/src/components/ui/scroll-area.lynx.tsx", consumers: ["dialog/panel", "command/results", "dock/content"] },
    },
  },
  {
    id: "ui/switch", title: "Switch primitives", category: "design-system", owner: "Switch", fixtureId: "switch-states", variants: ["setting"], states: ["default", "checked", "hover", "focus", "pressed", "disabled"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Switch", module: "apps/web/src/components/ui/switch.tsx", consumers: ["settings/boolean", "menu/switch", "project-action/autorun"] },
      lynx: { renderer: "lynx", component: "Switch", module: "apps/lynx/src/components/ui/switch.lynx.tsx", consumers: ["settings/boolean", "menu/switch", "project-action/autorun"] },
    },
  },
  {
    id: "ui/checkbox", title: "Checkbox primitives", category: "design-system", owner: "Checkbox", fixtureId: "checkbox-states", variants: ["standard", "compact"], states: ["default", "checked", "mixed", "focus", "disabled"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Checkbox", module: "apps/web/src/components/ui/checkbox.tsx", consumers: ["settings/project-choice", "environment/file-choice", "markdown/task-marker"] },
      lynx: { renderer: "lynx", component: "CheckboxIndicator", module: "apps/lynx/src/components/ui/checkbox.lynx.tsx", consumers: ["settings/project-choice", "environment/file-choice", "markdown/task-marker"] },
    },
    platformDeltas: [{ renderer: "lynx", rationale: "Native product rows own the checkbox hit target and accessibility semantics; the shared primitive owns only the visual indicator.", evidence: "SettingsIntegrations ProjectChoice and EnvironmentInteractiveRow" }],
  },
  {
    id: "ui/icon-button", title: "Icon button primitives", category: "design-system", owner: "IconButton", fixtureId: "icon-button-sizes", variants: ["xs", "sm", "default"], states: ["default", "hover", "focus", "pressed", "disabled"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "IconButton", module: "apps/web/src/components/ui/icon-button.tsx", consumers: ["toolbar/action", "notification/dismiss", "settings/reset"] },
      lynx: { renderer: "lynx", component: "IconButton", module: "apps/lynx/src/components/ui/icon-button.lynx.tsx", consumers: ["toolbar/action", "notification/dismiss", "settings/reset"] },
    },
  },
  {
    id: "ui/textarea", title: "Textarea primitives", category: "design-system", owner: "Textarea", fixtureId: "textarea-content", variants: ["default", "small", "large"], states: ["default", "filled", "focus", "disabled", "invalid"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Textarea", module: "apps/web/src/components/ui/textarea.tsx", consumers: ["project-action/command", "editor/comment", "environment/notes"] },
      lynx: { renderer: "lynx", component: "Textarea", module: "apps/lynx/src/components/ui/textarea.lynx.tsx", consumers: ["project-action/command", "editor/comment", "environment/notes"] },
    },
  },
  {
    id: "ui/skeleton", title: "Skeleton primitives", category: "design-system", owner: "Skeleton", fixtureId: "loading-skeleton", variants: ["line", "stack"], states: ["default"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Skeleton", module: "apps/web/src/components/ui/skeleton.tsx", consumers: ["environment/recap-loading", "global/loading"] },
      lynx: { renderer: "lynx", component: "Skeleton", module: "apps/lynx/src/components/ui/skeleton.lynx.tsx", consumers: ["environment/recap-loading", "global/loading"] },
    },
  },
  {
    id: "ui/spinner", title: "Spinner primitives", category: "design-system", owner: "Spinner", fixtureId: "loading-spinner", variants: ["default", "compact"], states: ["default"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Spinner", module: "apps/web/src/components/ui/spinner.tsx", consumers: ["voice/transcribing", "global/loading"] },
      lynx: { renderer: "lynx", component: "Spinner", module: "apps/lynx/src/components/ui/spinner.lynx.tsx", consumers: ["voice/transcribing", "global/loading"] },
    },
    platformDeltas: [{ renderer: "lynx", rationale: "Native spinner uses a CSS ring while Electron renders the shared Loader2 glyph; both expose the same status semantics.", evidence: "Composer voice transcribing state" }],
  },
  {
    id: "ui/separator", title: "Separator primitives", category: "design-system", owner: "Separator", fixtureId: "separator-directions", variants: ["separator"], states: ["default", "vertical"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Separator", module: "apps/web/src/components/ui/separator.tsx", consumers: ["sidebar/hover-card", "environment/sections", "toolbar/groups"] },
      lynx: { renderer: "lynx", component: "Separator", module: "apps/lynx/src/components/ui/separator.lynx.tsx", consumers: ["sidebar/hover-card", "environment/sections", "toolbar/groups"] },
    },
  },
  {
    id: "ui/badge", title: "Badge primitives", category: "design-system", owner: "Badge", fixtureId: "badge-variants", variants: ["default", "secondary", "outline", "status", "capsule"], states: ["default"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Badge", module: "apps/web/src/components/ui/badge.tsx", consumers: ["sidebar/count", "editor/file-type", "profile/identity"] },
      lynx: { renderer: "lynx", component: "Badge", module: "apps/lynx/src/components/ui/badge.lynx.tsx", consumers: ["sidebar/count", "editor/file-type", "profile/identity"] },
    },
  },
  {
    id: "ui/time-picker", title: "Time picker", category: "design-system", owner: "TimePicker", fixtureId: "time-09-30", variants: ["hours-minutes"], states: ["default"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "TimePicker", module: "apps/web/src/components/ui/time-picker.tsx", consumers: ["automation/create-schedule", "automation/edit-schedule"] },
      lynx: { renderer: "lynx", component: "TimePicker", module: "apps/lynx/src/components/ui/time-picker.lynx.tsx", consumers: ["automation/create-schedule", "automation/edit-schedule"] },
    },
  },
  {
    id: "ui/alert", title: "Alert primitives", category: "design-system", owner: "Alert", fixtureId: "alert-variants", variants: ["status"], states: ["default", "warning", "error", "success", "info"], themes: ["light", "dark"], viewports: COMPONENT_LAB_VIEWPORTS,
    renderers: {
      electron: { renderer: "electron", component: "Alert", module: "apps/web/src/components/ui/alert.tsx", consumers: ["provider-health", "thread/error", "automation/warning"] },
      lynx: { renderer: "lynx", component: "Alert", module: "apps/lynx/src/components/ui/alert.lynx.tsx", consumers: ["provider-health", "thread/error", "automation/warning"] },
    },
  },
];

export const COMPONENT_LAB_IMPLEMENTED_STORY_IDS = [
  "automation/composer-dialog",
  "editor-rail/add-menu",
  "editor-rail/independent-tabs",
  "composer/model-effort-picker",
  "composer/context-window-meter",
  "project-actions/add-editor",
  "system/semantic-icon-tones",
  "sidebar/navigation-row",
  "sidebar/command-palette",
  "transcript/message-actions",
  "transcript/message-row",
  "sidebar/project-row",
  "sidebar/thread-row",
  "notifications/provider-update",
  "right-dock/tab-strip",
  "composer/voice-recorder",
  "terminal/search",
  "editor/file-search",
  "editor/file-tab",
  "editor/file-preview-header",
  "diff/file-filter",
  "editor/project-search",
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
] as const satisfies readonly ComponentLabStory["id"][];

const COMPONENT_LAB_IMPLEMENTED_STORY_ID_SET = new Set<string>(
  COMPONENT_LAB_IMPLEMENTED_STORY_IDS,
);

export function isComponentLabStoryImplemented(storyId: string): boolean {
  return COMPONENT_LAB_IMPLEMENTED_STORY_ID_SET.has(storyId);
}

export interface ComponentLabCoverageSummary {
  readonly stories: number;
  readonly rendererMappings: number;
  readonly matrixCells: number;
  readonly interactiveStories: number;
}

export interface ComponentLabCase {
  readonly state: string;
  readonly variant: string;
}

export function componentLabCases(
  story: Pick<ComponentLabStory, 'cases' | 'states' | 'variants'>
): readonly ComponentLabCase[] {
  if (story.cases) return story.cases;
  return story.variants.flatMap((variant) =>
    story.states.map((state) => ({ state, variant }))
  );
}

export function summarizeComponentLabCoverage(
  stories: readonly ComponentLabStory[]
): ComponentLabCoverageSummary {
  return {
    stories: stories.length,
    rendererMappings: stories.length * 2,
    matrixCells: stories.reduce(
      (total, story) =>
        total + componentLabCases(story).length * story.themes.length * story.viewports.length * 2,
      0
    ),
    interactiveStories: stories.filter((story) =>
      story.states.some((state) =>
        ["hover", "focus", "pressed", "open", "disabled"].includes(state)
      )
    ).length,
  };
}

export function validateComponentLabStories(
  stories: readonly ComponentLabStory[]
): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const counterpartByElectronIdentity = new Map<string, string>();
  for (const story of stories) {
    if (ids.has(story.id)) errors.push(`duplicate story id: ${story.id}`);
    ids.add(story.id);
    if (!story.states.includes("default")) {
      errors.push(`${story.id}: missing default state`);
    }
    const explicitCaseKeys = new Set<string>();
    for (const item of story.cases ?? []) {
      const key = `${item.variant}:${item.state}`;
      if (explicitCaseKeys.has(key)) {
        errors.push(`${story.id}: duplicate case ${key}`);
      }
      explicitCaseKeys.add(key);
      if (!story.variants.includes(item.variant)) {
        errors.push(`${story.id}: unknown case variant ${item.variant}`);
      }
      if (!story.states.includes(item.state)) {
        errors.push(`${story.id}: unknown case state ${item.state}`);
      }
    }
    if (story.cases) {
      for (const variant of story.variants) {
        if (!story.cases.some((item) => item.variant === variant)) {
          errors.push(`${story.id}: cases omit variant ${variant}`);
        }
      }
      for (const state of story.states) {
        if (!story.cases.some((item) => item.state === state)) {
          errors.push(`${story.id}: cases omit state ${state}`);
        }
      }
    }
    const duplicateAxes = story.variants.filter(
      (variant) => variant !== "default" && story.states.includes(variant)
    );
    if (duplicateAxes.length > 0) {
      errors.push(
        `${story.id}: variants duplicate states ${duplicateAxes.join(", ")}`
      );
    }
    if (story.themes.length === 0) errors.push(`${story.id}: missing themes`);
    if (story.viewports.length === 0) errors.push(`${story.id}: missing viewports`);
    for (const theme of ["light", "dark"] as const) {
      if (!story.themes.includes(theme)) errors.push(`${story.id}: missing ${theme} theme`);
    }
    for (const viewport of COMPONENT_LAB_VIEWPORTS) {
      if (!story.viewports.some((candidate) => candidate.id === viewport.id)) {
        errors.push(`${story.id}: missing ${viewport.id} viewport`);
      }
    }
    for (const renderer of ["electron", "lynx"] as const) {
      const entry = story.renderers[renderer];
      if (!entry || entry.renderer !== renderer) {
        errors.push(`${story.id}: missing ${renderer} renderer`);
        continue;
      }
      if (!entry.component.trim() || !entry.module.trim()) {
        errors.push(`${story.id}: incomplete ${renderer} entry`);
      }
      if (entry.consumers.length === 0) {
        errors.push(`${story.id}: ${renderer} has no consumers`);
      }
    }
    const electronConsumers = story.renderers.electron.consumers;
    const lynxConsumers = story.renderers.lynx.consumers;
    for (const consumer of electronConsumers) {
      if (!lynxConsumers.includes(consumer)) {
        errors.push(`${story.id}: Lynx missing consumer ${consumer}`);
      }
    }
    for (const consumer of lynxConsumers) {
      if (!electronConsumers.includes(consumer)) {
        errors.push(`${story.id}: Electron missing consumer ${consumer}`);
      }
    }
    const electronIdentity = `${story.renderers.electron.module}#${story.renderers.electron.component}`;
    const lynxIdentity = `${story.renderers.lynx.module}#${story.renderers.lynx.component}`;
    const existingCounterpart = counterpartByElectronIdentity.get(electronIdentity);
    if (existingCounterpart && existingCounterpart !== lynxIdentity) {
      errors.push(
        `${story.id}: Electron identity ${electronIdentity} maps to both ${existingCounterpart} and ${lynxIdentity}`
      );
    } else {
      counterpartByElectronIdentity.set(electronIdentity, lynxIdentity);
    }
  }
  return errors;
}
