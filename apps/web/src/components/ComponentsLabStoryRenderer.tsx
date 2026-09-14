import { useEffect, useState } from "react";
import { BotIcon, CheckIcon, CircleAlertIcon, CopyIcon, KanbanIcon, MessageCircleIcon, NewThreadIcon, PencilIcon, PinIcon, PlusIcon, SearchIcon as SearchStoryIcon, SettingsIcon, Undo2Icon, ZapIcon } from "~/lib/icons";
import { EditorRailAddMenuComposition } from "~/components/chat/EditorRailAddMenuComposition";
import { ComposerPickerMenuPopup } from "~/components/chat/ComposerPickerMenuPopup";
import { IconButton } from "~/components/ui/icon-button";
import { Menu, MenuCheckboxItem, MenuGroup, MenuGroupLabel, MenuItem, MenuPopupBase, MenuSeparator, MenuShortcut, MenuTrigger } from "~/components/ui/menu";
import ProjectScriptsControl from "~/components/ProjectScriptsControl";
import { ComposerModelEffortPicker } from "~/components/chat/ComposerModelEffortPicker";
import { ProviderModelPicker } from "~/components/chat/ProviderModelPicker";
import { TraitsPicker } from "~/components/chat/TraitsPicker";
import { ProjectId, SpaceId, ThreadId, type ModelSelection } from "@synara/contracts";
import {
  COMPONENT_LAB_AUTOMATION_DEFINITION,
  COMPONENT_LAB_AUTOMATION_PROJECT,
  COMPONENT_LAB_PAUSED_AUTOMATION_DEFINITION,
  COMPONENT_LAB_CODEX_MODELS,
  COMPONENT_LAB_DIFF_CODE_VIEW,
  COMPONENT_LAB_MODEL_OPTIONS_BY_PROVIDER,
  COMPONENT_LAB_MODEL_SELECTION,
  resolveComponentLabMessageActions,
  resolveComponentLabContextWindowFixture,
  resolveComponentLabComposerReferenceAttachmentsFixture,
  resolveComponentLabNavigationRow,
  resolveComponentLabCommandPaletteFixture,
  COMPONENT_LAB_OVERFLOW_CODEX_MODELS,
  COMPONENT_LAB_OVERFLOW_MODEL_OPTIONS_BY_PROVIDER,
  COMPONENT_LAB_OPENCODE_MODELS,
  COMPONENT_LAB_OPENCODE_SELECTION,
  COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_FAVORITES,
  COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_MODELS,
  COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_SELECTION,
  COMPONENT_LAB_PROVIDER_STATUSES,
  COMPONENT_LAB_RECENT_VIEW_ENTRIES,
  COMPONENT_LAB_PROVIDER_UPDATE_COPY,
  COMPONENT_LAB_RIGHT_DOCK_PANES,
  COMPONENT_LAB_RIGHT_DOCK_OVERFLOW_PANES,
  COMPONENT_LAB_VOICE_SILENCE_LEVELS,
  COMPONENT_LAB_VOICE_WAVEFORM_LEVELS,
  resolveComponentLabKanbanCardFixture,
} from "@synara/shared/componentLabFixtures";
import { AutomationDialog } from "~/routes/-automations.shared";
import {
  AutomationDetailComposition,
  AutomationDetailGroup,
  AutomationDetailRow,
} from "~/components/automation/AutomationDetailComposition";
import { buildAutomationFormWarnings, formFromDefinition } from "~/lib/automationForm";
import type { Project } from "~/types";
import { projectAutomationList } from "@synara/shared/automationList";
import { AutomationListComposition } from "~/components/automation/AutomationListComposition";
import { KanbanCardComposition } from "~/components/kanban/KanbanCardComposition";
import type { KanbanCard } from "~/components/kanban/kanban.logic";
import { ContextWindowMeter } from "~/components/chat/ContextWindowMeter";
import { SEMANTIC_ICON_TONES } from "@synara/shared/semanticIconTone";
import { SemanticIconTone } from "~/components/ui/SemanticIconTone";
import { SidebarPrimaryActionRow } from "~/components/SidebarPrimaryActionRow";
import { SidebarProvider } from "~/components/ui/sidebar";
import { SidebarSearchPalette } from "~/components/SidebarSearchPalette";
import { MessageActionButton, MESSAGE_ACTION_ICON_CLASS_NAME } from "~/components/chat/MessageActionButton";
import { SidebarProjectRowSpecimen, SidebarThreadRowSpecimen } from "~/components/SidebarRowSpecimen";
import { ToastSurfaceFixture } from "~/components/ui/toast";
import { RightDockTabs } from "~/components/chat/RightDock";
import { ComposerVoiceButton } from "~/components/chat/ComposerVoiceButton";
import { ComposerVoiceRecorderBar } from "~/components/chat/ComposerVoiceRecorderBar";
import { TerminalSearch } from "~/components/TerminalSearch";
import { WorkspaceSearchInputHeader } from "~/components/chat/workspaceExplorer";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from "~/components/ui/dialog";
import { Tooltip, TooltipPopup, TooltipTrigger } from "~/components/ui/tooltip";
import { Kbd, KbdGroup } from "~/components/ui/kbd";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Command, CommandEmpty, CommandGroup, CommandGroupLabel, CommandInput, CommandItem, CommandList, CommandPanel, CommandShortcut } from "~/components/ui/command";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Switch } from "~/components/ui/switch";
import { Checkbox } from "~/components/ui/checkbox";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { TimePicker } from "~/components/ui/time-picker";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import ChatMarkdown from "~/components/ChatMarkdown";
import { PullRequestCodeComposition } from "~/components/pullRequest/PullRequestCodeComposition";
import { WorkspaceFilePreviewErrorState } from "~/components/WorkspaceFilePreviewErrorState";
import { WorkspaceFilePreviewHeader } from "~/components/chat/WorkspaceFilePreviewHeader";
import { defaultFilePreviewMode, type FilePreviewMode } from "@synara/shared/filePreviewMode";
import { PdfViewerToolbar } from "~/components/pdf/PdfViewerToolbar";
import { nextZoomScale, previousZoomScale, resolvePdfScale, type PdfZoomMode } from "@synara/shared/pdfZoom";
import { buildProjectContextMenuItems, buildThreadContextMenuItems } from "@synara/shared/contextMenu";
import { ensureNativeApi } from "~/nativeApi";
import { SpaceProjectPickerDialog } from "~/components/SpaceProjectPickerDialog";
import { ReviewFileTreeSearchHeader } from "~/components/ReviewFileTreePanel";
import { PickerPanelSearchHeader } from "~/components/chat/PickerPanelShell";
import { SurfaceChipIcon, SurfaceTabChip } from "~/components/chat/chatHeaderControls";
import { IndependentTabRow } from "~/components/chat/IndependentTabRow";
import { FileIcon } from "~/lib/icons";
import { CentralIcon } from "~/lib/central-icons";
import { RecentViewSwitcher } from "~/components/RecentViewSwitcher";
import { ComposerReferenceAttachmentsComposition } from "~/components/chat/ComposerReferenceAttachmentsComposition";
import { ThreadErrorBanner } from "~/components/chat/ThreadErrorBanner";
import { CollapsedWorkComposition } from "~/components/chat/CollapsedWorkComposition";
import { TimelineStatusRowComposition, type TimelineStatusTone } from "~/components/chat/TimelineStatusRowComposition";
import {
  MESSAGE_ROW_HOVER_REVEAL_CLASS_NAME,
  MessageAssistantRowComposition,
  MessageUserBubbleComposition,
  MessageUserRowComposition,
} from "~/components/chat/MessageRowComposition";

const COMPONENT_LAB_SPACE = {
  id: SpaceId.makeUnsafe("component-lab-focus"), name: "Focus", icon: "target" as const,
  sortOrder: 0, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};
const COMPONENT_LAB_OTHER_SPACE = {
  id: SpaceId.makeUnsafe("component-lab-work"), name: "Work", icon: "bag" as const,
  sortOrder: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};
const COMPONENT_LAB_SPACE_PROJECTS = [
  { id: ProjectId.makeUnsafe("component-lab-alpha"), kind: "project", name: "Alpha", remoteName: "alpha", folderName: "alpha", localName: null, cwd: "/work/alpha", defaultModelSelection: null, expanded: true, spaceId: null, scripts: [] },
  { id: ProjectId.makeUnsafe("component-lab-beta"), kind: "project", name: "Beta", remoteName: "beta", folderName: "beta", localName: null, cwd: "/work/beta", defaultModelSelection: null, expanded: false, spaceId: COMPONENT_LAB_OTHER_SPACE.id, scripts: [] },
] as const;

const COMPONENT_LAB_AUTOMATION_WEB_PROJECT: Project = {
  id: COMPONENT_LAB_AUTOMATION_PROJECT.id,
  kind: "project",
  name: COMPONENT_LAB_AUTOMATION_PROJECT.name,
  remoteName: "synara",
  folderName: "synara",
  localName: null,
  cwd: COMPONENT_LAB_AUTOMATION_PROJECT.workspaceRoot,
  defaultModelSelection: COMPONENT_LAB_AUTOMATION_DEFINITION.modelSelection,
  expanded: true,
  spaceId: null,
  scripts: [],
};

function AutomationComposerDialogStory(props: {
  readonly state: string;
  readonly variant?: string;
}) {
  const editing = props.variant === "edit";
  const [form, setForm] = useState(() => {
    const initial = formFromDefinition(
      editing ? COMPONENT_LAB_AUTOMATION_DEFINITION : null,
      COMPONENT_LAB_AUTOMATION_PROJECT.id,
      COMPONENT_LAB_AUTOMATION_DEFINITION.modelSelection,
    );
    return editing
      ? initial
      : {
          ...initial,
          name: "Review renderer fidelity",
          prompt: "Compare the current automation surfaces and report any visual drift.",
          worktreeMode: "worktree" as const,
        };
  });
  return (
    <AutomationDialog
      open
      editing={editing}
      form={form}
      projects={[COMPONENT_LAB_AUTOMATION_WEB_PROJECT]}
      threads={[]}
      warnings={buildAutomationFormWarnings(form)}
      onOpenChange={() => {}}
      onFormChange={setForm}
      onSubmit={() => {}}
      busy={props.state === "saving"}
    />
  );
}

function AutomationDetailPageStory(props: { readonly variant?: string }) {
  const paused = props.variant === "paused";
  return (
    <div className="h-[520px] w-[880px] max-w-[calc(100vw-2rem)] overflow-hidden border border-border bg-background">
    <SidebarProvider defaultOpen={false}>
    <AutomationDetailComposition
      name={COMPONENT_LAB_AUTOMATION_DEFINITION.name}
      prompt={COMPONENT_LAB_AUTOMATION_DEFINITION.prompt}
      status={{
        label: paused ? "Paused" : "Active",
        dotClassName: paused ? "bg-amber-500" : "bg-emerald-500",
      }}
      nextRunAt={paused ? null : COMPONENT_LAB_AUTOMATION_DEFINITION.nextRunAt}
      lastRunAt={null}
      onBack={() => {}}
      actions={
        <>
          <Button type="button" size="icon-sm" variant="ghost" aria-label={paused ? "Resume" : "Pause"}>
            <CentralIcon name={paused ? "play" : "pause"} className="size-4" />
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" aria-label="Delete">
            <CentralIcon name="trash-can-simple" className="size-4" />
          </Button>
          <Button type="button" size="sm" className="ml-1.5">
            <CentralIcon name="play" className="size-4" />
            Run now
          </Button>
        </>
      }
    >
      <AutomationDetailGroup title="Details">
        <AutomationDetailRow label="Runs in">Worktree</AutomationDetailRow>
        <AutomationDetailRow label="Project">Synara</AutomationDetailRow>
        <AutomationDetailRow label="Repeats">Daily</AutomationDetailRow>
        <AutomationDetailRow label="Time">09:00</AutomationDetailRow>
        <AutomationDetailRow label="Timezone">America/New_York</AutomationDetailRow>
        <AutomationDetailRow label="Model">GPT-5 Codex</AutomationDetailRow>
        <AutomationDetailRow label="Mode">Standalone</AutomationDetailRow>
        <AutomationDetailRow label="Max iterations">Unlimited</AutomationDetailRow>
      </AutomationDetailGroup>
      <AutomationDetailGroup title="Previous runs">
        <div className="px-1.5 py-1 text-xs text-muted-foreground">No runs yet.</div>
      </AutomationDetailGroup>
    </AutomationDetailComposition>
    </SidebarProvider>
    </div>
  );
}

function AutomationListPageStory(props: { readonly state: string; readonly variant?: string }) {
  const definitions = props.variant === "mixed"
    ? [COMPONENT_LAB_AUTOMATION_DEFINITION, COMPONENT_LAB_PAUSED_AUTOMATION_DEFINITION]
    : [COMPONENT_LAB_AUTOMATION_DEFINITION];
  const projection = projectAutomationList({
    data: { definitions, runs: [] },
    projects: [{ id: COMPONENT_LAB_AUTOMATION_PROJECT.id, name: COMPONENT_LAB_AUTOMATION_PROJECT.name }],
    threads: [],
  });
  return (
    <div className="h-[520px] w-[880px] max-w-[calc(100vw-2rem)] overflow-hidden border border-border bg-background">
      <AutomationListComposition
        definitionsCount={definitions.length}
        isLoading={props.state === "loading"}
        projection={projection}
        triageFilter="unread"
        onDelete={() => {}}
        onOpen={() => {}}
        onOpenThread={() => {}}
        onTriageFilterChange={() => {}}
      />
    </div>
  );
}

function componentLabProjectContextMenuItems(variant: string | undefined) {
  return buildProjectContextMenuItems({
    isPinned: variant === "pinned",
    isRunning: variant === "running",
    hasOpenServer: variant === "running",
    hasArchivableThreads: true,
    hasAnyThreads: true,
    currentSpaceId: "personal",
    spaces: [
      { id: "personal", label: "Personal" },
      { id: "design", label: "Design" },
    ],
  });
}
function componentLabThreadContextMenuItems(variant: string | undefined) {
  return buildThreadContextMenuItems({
    isPinned: variant === "pinned",
    copyPathAvailable: true,
    openPathInTerminalAvailable: true,
  });
}

function ProviderUpdateNotificationStory(props: { readonly state: string }) {
  const fixture =
    COMPONENT_LAB_PROVIDER_UPDATE_COPY[
      props.state as keyof typeof COMPONENT_LAB_PROVIDER_UPDATE_COPY
    ] ?? COMPONENT_LAB_PROVIDER_UPDATE_COPY.default;
  const failure = props.state === "failure";
  const updating = props.state === "updating";
  return (
    <div className="w-96 max-w-[calc(100%-2rem)]" data-provider-update-state={props.state}>
      <ToastSurfaceFixture
        toast={{
          id: "component-lab-provider-update",
          type: failure ? "error" : updating ? "loading" : "warning",
          title: fixture.title,
          description: fixture.description,
          transitionStatus: "idle",
          actionProps: updating
            ? undefined
            : { children: failure ? "Review providers" : "Review updates", onClick: () => {} },
          data: {
            onClose: () => {},
            ...("copyText" in fixture ? { copyText: fixture.copyText } : {}),
            ...(props.state === "multiple"
              ? { secondaryActionProps: { children: "Update all", onClick: () => {} } }
              : {}),
          },
        } as never}
      />
    </div>
  );
}

function EditorRailAddMenuStory(props: { readonly open: boolean }) {
  return (
    <div className="flex min-h-52 items-center justify-center">
      <Menu key={props.open ? "open" : "closed"} defaultOpen={props.open} modal={false}>
        <MenuTrigger
          render={
            <IconButton variant="ghost" size="icon-xs" label="New editor rail item" title="New">
              <PlusIcon className="size-3.5" />
            </IconButton>
          }
        />
        <ComposerPickerMenuPopup align="start" side="bottom" sideOffset={6} className="w-44 min-w-44">
          <EditorRailAddMenuComposition onNewChat={() => {}} onNewTerminal={() => {}} />
        </ComposerPickerMenuPopup>
      </Menu>
    </div>
  );
}

function ComposerModelPickerStory(props: { readonly state: string; readonly variant?: string }) {
  const search = props.state === "search";
  const [selection, setSelection] = useState<ModelSelection>(() =>
    search ? COMPONENT_LAB_OPENCODE_SELECTION : COMPONENT_LAB_MODEL_SELECTION,
  );
  const submenuOpen = props.state === "submenu-open" || props.state === "overflow";
  const providerList = props.state === "provider-list";
  const favoriteState = props.state === "favourite";
  const groupDisclosureState = props.state === "group-disclosure";
  const [favoriteModelSlugs, setFavoriteModelSlugs] = useState<ReadonlyArray<string>>(() =>
    groupDisclosureState
      ? COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_FAVORITES
      : favoriteState
        ? ["open-model-02"]
        : [],
  );
  const runtimeModels = groupDisclosureState
    ? COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_MODELS
    : search
    ? COMPONENT_LAB_OPENCODE_MODELS
    : props.state === "overflow"
      ? COMPONENT_LAB_OVERFLOW_CODEX_MODELS
      : COMPONENT_LAB_CODEX_MODELS;
  const modelOptionsByProvider =
    groupDisclosureState
      ? { ...COMPONENT_LAB_MODEL_OPTIONS_BY_PROVIDER, opencode: COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_MODELS }
      : props.state === "overflow"
      ? COMPONENT_LAB_OVERFLOW_MODEL_OPTIONS_BY_PROVIDER
      : COMPONENT_LAB_MODEL_OPTIONS_BY_PROVIDER;
  const selectModel = (provider: ModelSelection["provider"], model: ModelSelection["model"]) =>
    setSelection((current) => ({ ...current, provider, model }));
  const effectiveSelection = groupDisclosureState
    ? COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_SELECTION
    : selection;

  if (favoriteState) {
    return <ProviderModelPicker provider="opencode" model={"open-model-01" as ModelSelection["model"]} lockedProvider="opencode" providers={COMPONENT_LAB_PROVIDER_STATUSES} modelOptionsByProvider={COMPONENT_LAB_MODEL_OPTIONS_BY_PROVIDER} initialOpen favoriteModelSlugsOverride={{ opencode: favoriteModelSlugs }} onFavoriteModelSlugsChange={(_provider, slugs) => setFavoriteModelSlugs(slugs)} onProviderModelChange={selectModel} />;
  }
  if (props.variant === "landing" && !groupDisclosureState) {
    return (
      <div className="flex items-center justify-center gap-2">
        <ProviderModelPicker compact={false} provider={selection.provider} model={selection.model} lockedProvider={selection.provider} providers={COMPONENT_LAB_PROVIDER_STATUSES} modelOptionsByProvider={modelOptionsByProvider} initialOpen={props.state === "open" || providerList || submenuOpen || search} onProviderModelChange={selectModel} />
        <TraitsPicker provider={selection.provider} threadId={ThreadId.makeUnsafe("component-lab-model-picker")} model={selection.model} runtimeModel={runtimeModels.find((model) => model.slug === selection.model)} runtimeModels={runtimeModels} runtimeAgents={[]} modelOptions={selection.options} prompt="" onPromptChange={() => {}} />
      </div>
    );
  }
  if (providerList) {
    return <ProviderModelPicker provider={selection.provider} model={selection.model} lockedProvider={null} providers={COMPONENT_LAB_PROVIDER_STATUSES} modelOptionsByProvider={COMPONENT_LAB_MODEL_OPTIONS_BY_PROVIDER} initialOpen onProviderModelChange={selectModel} />;
  }
  const compact = props.variant === "compact";
  return (
    <ComposerModelEffortPicker key={props.state} compact={compact} hideModelLabel={compact} hideStatusLabel={compact} provider={effectiveSelection.provider} model={effectiveSelection.model} lockedProvider={effectiveSelection.provider} providers={COMPONENT_LAB_PROVIDER_STATUSES} modelOptionsByProvider={modelOptionsByProvider} threadId={ThreadId.makeUnsafe("component-lab-model-picker")} runtimeModel={runtimeModels.find((model) => model.slug === effectiveSelection.model)} runtimeModels={runtimeModels} modelOptions={effectiveSelection.options} prompt="" disabled={props.state === "disabled"} initialOpen={props.state === "open" || submenuOpen || search || groupDisclosureState} initialSubmenuOpen={submenuOpen || search || groupDisclosureState} initialSearchQuery={search ? "model 12" : ""} favoriteModelSlugsOverride={{ opencode: favoriteModelSlugs }} onFavoriteModelSlugsChange={(_provider, slugs) => setFavoriteModelSlugs(slugs)} onPromptChange={() => {}} onProviderModelChange={selectModel} />
  );
}

function SpaceProjectPickerStory(props: { readonly state: string }) {
  const [open, setOpen] = useState(true);
  return (
    <SpaceProjectPickerDialog
      open={open}
      targetSpace={COMPONENT_LAB_SPACE}
      projects={COMPONENT_LAB_SPACE_PROJECTS}
      spaces={[COMPONENT_LAB_SPACE, COMPONENT_LAB_OTHER_SPACE]}
      initialQuery={props.state === "query" ? "Alpha" : ""}
      searchAutoFocus={props.state === "focus"}
      searchDisabled={props.state === "disabled"}
      onOpenChange={setOpen}
      onSubmit={() => []}
    />
  );
}

function SidebarCommandPaletteStory(props: { readonly state: string; readonly variant?: string }) {
  const fixture = resolveComponentLabCommandPaletteFixture(props.variant);
  const routeOpen = props.state === "open" || props.state === "keyboard-highlight";
  const routeQuery =
    props.state === "keyboard-highlight" && fixture.actions
      ? "settings"
      : fixture.query;
  const [queryOverride, setQueryOverride] = useState<string | null>(null);
  const [open, setOpen] = useState(routeOpen);
  const [mode, setMode] = useState<"search" | "import">("search");
  useEffect(() => setOpen(routeOpen), [routeOpen]);
  return (
    <div className="flex min-h-64 items-center justify-center">
      <button type="button" className="rounded-lg border border-border px-3 py-2 text-xs" onClick={() => setOpen(true)}>Search</button>
      <SidebarSearchPalette
        open={open} query={queryOverride ?? routeQuery} onQueryChange={setQueryOverride}
        mode={mode} onModeChange={setMode} onOpenChange={setOpen}
        actions={fixture.actions ? [{ id: "settings", label: "Settings", description: "Configure Synara" }] : []}
        projects={[{ id: "component-lab-project", name: "Synara", remoteName: "synara", folderName: "synara", localName: null, cwd: "/workspace/synara", spaceName: "Personal" }]}
        threads={fixture.threads ? [{ id: "component-lab-thread", title: "Component fidelity", projectId: "component-lab-project", projectName: "Synara", projectRemoteName: "synara", spaceName: "Personal", provider: "codex", createdAt: "2026-01-01T00:00:00.000Z", messages: [{ text: "Align the component library" }] }] : []}
        searchStatus={fixture.searchStatus} searchErrorMessage={fixture.searchStatus === "error" ? "Snapshot unavailable." : null} onRetrySearch={() => {}} onCreateChat={() => {}} onCreateThread={() => {}}
        onAddProjectPath={async () => {}} homeDir="/workspace" onOpenSettings={() => {}}
        onOpenFeedback={() => {}} onOpenUsageSettings={() => {}} onOpenProject={() => {}}
        onOpenThread={() => {}} importProviders={[]} onImportThread={async () => {}}
        filesystemBrowseEnabled={false}
      />
    </div>
  );
}

function FilePreviewErrorStory(props: { readonly state: string; readonly variant?: string }) {
  const [result, setResult] = useState("Awaiting recovery action");
  const placement = props.variant === "explorer-dock"
    ? "max-w-xs"
    : props.variant === "file-pane"
      ? "max-w-md"
      : "max-w-xl";
  const ownsClose = props.state !== "no-close-owner" && props.variant !== "explorer-dock";
  return <div className={`flex min-h-40 w-full ${placement} flex-col rounded-xl border border-border bg-background`} data-file-preview-placement={props.variant ?? "editor"}><WorkspaceFilePreviewErrorState detail={props.variant === "detailed-error" ? "ENOENT: src/components/Missing.tsx" : null} retrying={props.state === "retrying"} onRetry={() => setResult("Retry requested")} onClose={ownsClose ? () => setResult("Preview closed") : undefined} /><p aria-live="polite" className="px-3 pb-3 text-[11px] text-muted-foreground">{result}</p></div>;
}

function FileTabStory(props: { readonly state: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex h-12 w-72 items-center border border-border bg-background px-2">
      {open ? (
        <SurfaceTabChip
          active={props.state === "active"}
          closeLabel="Close example.ts"
          icon={<SurfaceChipIcon icon={FileIcon} />}
          label="example.ts"
          onClose={() => setOpen(false)}
          visualState={props.state as "default" | "hover" | "focus" | "pressed"}
        />
      ) : (
        <p aria-live="polite" className="text-[11px] text-muted-foreground">Tab closed</p>
      )}
    </div>
  );
}

function MessageRowStory(props: { readonly state: string; readonly variant?: string }) {
  const [result, setResult] = useState('Awaiting message action');
  const revealed = props.state !== "default";
  const footerClassName = `flex min-h-6 items-center gap-2 text-[10px] text-muted-foreground/45 ${
    revealed ? "opacity-100" : MESSAGE_ROW_HOVER_REVEAL_CLASS_NAME
  }`;
  const actions = (
    <>
      <MessageActionButton label="Copy message" tooltip="Copy message" onClick={() => setResult('Message copied')}>
        <CopyIcon className={MESSAGE_ACTION_ICON_CLASS_NAME} />
      </MessageActionButton>
      <MessageActionButton label="Reference message" tooltip="Reference message" onClick={() => setResult('Message referenced')}>
        <MessageCircleIcon className={MESSAGE_ACTION_ICON_CLASS_NAME} />
      </MessageActionButton>
    </>
  );
  return (
    <div className="w-full max-w-xl" data-message-row-state={props.state}>
      {props.variant === "user" ? (
        <MessageUserRowComposition>
          <MessageUserBubbleComposition>
            <p className="text-sm leading-[1.55]">Please align this preview with Electron.</p>
          </MessageUserBubbleComposition>
          <div className={`${footerClassName} justify-end pr-0.5`}><span>9:41 AM</span>{actions}</div>
        </MessageUserRowComposition>
      ) : (
        <MessageAssistantRowComposition>
          <p className="text-sm leading-[1.55]">The shared message row keeps actions quiet until the row is active.</p>
          <div className={footerClassName}>{actions}<span>9:41 AM</span></div>
        </MessageAssistantRowComposition>
      )}
      <p aria-live="polite" className="text-[11px] text-muted-foreground">{result}</p>
    </div>
  );
}

function MenuSwitchStory(props: { readonly state: string }) {
  const [checked, setChecked] = useState(true);
  const open = props.state !== "default";
  const visualClass = props.state === "hover" ? "bg-[var(--color-background-button-secondary-hover)]" : props.state === "focus" ? "ring-1 ring-ring/60" : props.state === "pressed" ? "bg-[var(--color-background-button-secondary)]" : "";
  return (
    <div className="flex min-h-52 items-center justify-center">
      <Menu key={props.state} defaultOpen={open}>
        <MenuTrigger render={<Button variant="outline">Open menu</Button>} />
        <MenuPopupBase align="start" className="w-52">
          <MenuGroup>
            <MenuGroupLabel>Actions</MenuGroupLabel>
            <MenuCheckboxItem checked={checked} className={visualClass} disabled={props.state === "disabled"} onCheckedChange={setChecked} variant="switch">Show terminal</MenuCheckboxItem>
          </MenuGroup>
        </MenuPopupBase>
      </Menu>
    </div>
  );
}

export function ComponentsLabStoryRenderer(props: { readonly state: string; readonly storyId: string; readonly variant?: string }) {
  if (props.storyId === "navigation/recent-view-switcher") {
    return (
      <RecentViewSwitcher
        entries={COMPONENT_LAB_RECENT_VIEW_ENTRIES}
        selectedIndex={props.state === "middle-selected" ? 2 : 0}
      />
    );
  }
  if (props.storyId === "automation/composer-dialog") {
    return <AutomationComposerDialogStory key={`${props.variant}:${props.state}`} state={props.state} variant={props.variant} />;
  }
  if (props.storyId === "automation/detail-page") {
    return <AutomationDetailPageStory variant={props.variant} />;
  }
  if (props.storyId === "automation/list-page") {
    return <AutomationListPageStory state={props.state} variant={props.variant} />;
  }
  if (props.storyId === "editor-rail/independent-tabs") {
    return <IndependentTabsStory state={props.state} variant={props.variant} />;
  }
  if (props.storyId === "editor/file-preview-header") {
    return <FilePreviewHeaderStory key={`${props.variant}:${props.state}`} state={props.state} variant={props.variant} />;
  }
  if (props.storyId === "ui/alert") {
    const selected = props.state;
    const variant = selected as "default" | "warning" | "error" | "success" | "info";
    return <Alert className="max-w-lg" variant={variant}><AlertTitle>Provider status</AlertTitle><AlertDescription>Review this status before starting the next turn.</AlertDescription></Alert>;
  }
  if (props.storyId === "ui/time-picker") {
    return <TimePicker value="09:30" onChange={() => {}} />;
  }
  if (props.storyId === "ui/badge") {
    const badge = {
      default: <Badge>3</Badge>,
      secondary: <Badge variant="secondary">Beta</Badge>,
      outline: <Badge size="sm" variant="outline">PDF</Badge>,
      destructive: <Badge variant="destructive">Failed</Badge>,
      status: <Badge variant="success">Ready</Badge>,
      capsule: <Badge className="rounded-full" variant="outline">Synara</Badge>,
    }[props.variant ?? "default"];
    return <div className="flex items-center justify-center">{badge}</div>;
  }
  if (props.storyId === "ui/separator") {
    const vertical = props.state === "vertical" || (props.state === "default" && props.variant === "vertical");
    return vertical ? <div className="flex h-20 items-center gap-4"><span className="text-xs">Left</span><Separator orientation="vertical" /><span className="text-xs">Right</span></div> : <div className="grid w-72 gap-3 text-xs"><span>Above</span><Separator /><span>Below</span></div>;
  }
  if (props.storyId === "ui/skeleton") {
    return <div className="grid w-72 gap-2"><Skeleton className="h-3 w-full" />{props.variant === "stack" ? <Skeleton className="h-3 w-4/5" /> : null}</div>;
  }
  if (props.storyId === "ui/spinner") {
    return <Spinner className={props.variant === "compact" ? "size-3" : "size-4"} />;
  }
  if (props.storyId === "ui/textarea") {
    const size = props.variant === "small" ? "sm" : props.variant === "large" ? "lg" : "default";
    return <Textarea aria-invalid={props.state === "invalid"} className={`w-80 ${props.state === "focus" ? "border-foreground/30 ring-1 ring-ring/60" : ""}`} defaultValue={props.state === "filled" ? "Describe the requested component change." : undefined} disabled={props.state === "disabled"} placeholder="Describe the change" size={size} />;
  }
  if (props.storyId === "ui/icon-button") {
    const stateClass = props.state === "hover" ? "bg-[var(--color-background-button-secondary-hover)]" : props.state === "focus" ? "ring-1 ring-ring/60 ring-offset-1 ring-offset-background" : "";
    const size = props.variant === "xs" ? "icon-xs" : props.variant === "sm" ? "icon-sm" : "icon";
    return <IconButton className={stateClass} data-pressed={props.state === "pressed" || undefined} disabled={props.state === "disabled" || props.variant === "disabled"} label="Add item" size={size}><PlusIcon /></IconButton>;
  }
  if (props.storyId === "ui/checkbox") {
    const selected = props.state === "default" ? props.variant ?? "unchecked" : props.state;
    const stateClass = `${selected === "focus" ? "ring-2 ring-ring ring-offset-1 ring-offset-background " : ""}${props.variant === "compact" ? "scale-90" : ""}`;
    return <Checkbox aria-label="Select project" checked={selected === "mixed" ? "indeterminate" : selected === "checked"} disabled={selected === "disabled"} className={stateClass} onCheckedChange={() => {}} />;
  }
  if (props.storyId === "ui/switch") {
    const selected = props.state === "default" ? props.variant ?? "off" : props.state;
    const stateClass = selected === "hover"
      ? "ring-1 ring-[color:var(--color-border)]"
      : selected === "focus"
        ? "ring-2 ring-[color:var(--color-border-focus)]/60 ring-offset-1 ring-offset-background"
        : "";
    return <Switch aria-label="Enable notifications" checked={selected === "on" || selected === "checked"} data-pressed={selected === "pressed" || undefined} disabled={selected === "disabled"} className={stateClass} onCheckedChange={() => {}} />;
  }
  if (props.storyId === "ui/scroll-area") {
    const selected = props.state === "default" ? props.variant ?? "vertical" : props.state;
    const horizontal = selected === "horizontal";
    return (
      <ScrollArea className="h-32 w-72 rounded-xl border border-border bg-background" hideScrollbars={selected === "hidden-scrollbar"}>
        <div className={horizontal ? "flex w-[560px] gap-2 p-3" : "grid gap-2 p-3"}>
          {Array.from({ length: 12 }, (_, index) => <div key={index} className="min-w-28 rounded-lg bg-muted px-3 py-2 text-xs">Item {index + 1}</div>)}
        </div>
      </ScrollArea>
    );
  }
  if (props.storyId === "ui/command") {
    const selected = props.state === "default" ? props.variant ?? "results" : props.state;
    const empty = selected === "empty";
    return (
      <Command autoHighlight={selected === "highlighted" ? "always" : false} value="">
        <CommandPanel className="w-80 overflow-hidden">
          <CommandInput placeholder="Search commands" />
          <CommandList>
            {empty ? <CommandEmpty>No results found.</CommandEmpty> : <CommandGroup><CommandGroupLabel>Actions</CommandGroupLabel><CommandItem value="new-chat" disabled={selected === "disabled"}>New chat<CommandShortcut>⌘N</CommandShortcut></CommandItem><CommandItem value="settings">Settings<CommandShortcut>⌘,</CommandShortcut></CommandItem></CommandGroup>}
          </CommandList>
        </CommandPanel>
      </Command>
    );
  }
  if (props.storyId === "ui/kbd") {
    return props.variant === "single"
      ? <Kbd>⌘K</Kbd>
      : <KbdGroup><Kbd>⌘</Kbd><span>+</span><Kbd>Shift</Kbd><span>+</span><Kbd>P</Kbd></KbdGroup>;
  }
  if (props.storyId === "ui/collapsible") {
    const selected = props.state === "default" ? props.variant ?? "closed" : props.state;
    return (
      <Collapsible key={`${props.variant}:${props.state}`} defaultOpen={selected === "open"} disabled={selected === "disabled"}>
        <div className="w-72 rounded-xl border border-border bg-background p-2">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm" disabled={selected === "disabled"}><span>Project details</span><span>⌄</span></CollapsibleTrigger>
          <CollapsiblePanel><div className="px-2 pt-2 text-xs text-muted-foreground">Shared disclosure content</div></CollapsiblePanel>
        </div>
      </Collapsible>
    );
  }
  if (props.storyId === "ui/tooltip") {
    const open = props.state === "open";
    return (
      <div className="flex min-h-36 items-center justify-center">
        <Tooltip key={`${props.variant}:${props.state}`} defaultOpen={open}>
          <TooltipTrigger render={<IconButton label="Copy"><CopyIcon /></IconButton>} />
          <TooltipPopup variant={props.variant === "picker" ? "picker" : "default"}>Copy to clipboard</TooltipPopup>
        </Tooltip>
      </div>
    );
  }
  if (props.storyId === "ui/dialog") {
    const open = props.state !== "default";
    const dialogLabel = {
      "title-description": "Open title dialog",
      panel: "Open panel dialog",
      footer: "Open footer dialog",
      close: "Open closable dialog",
    }[props.variant ?? "title-description"];
    return (
      <div className="flex min-h-52 items-center justify-center">
        <Button>{dialogLabel}</Button>
        <Dialog key={`${props.variant}:${props.state}`} defaultOpen={open}>
          <DialogPopup showCloseButton={props.variant === "close"}>
            {props.variant === "title-description" ? <DialogHeader><DialogTitle>Component settings</DialogTitle><DialogDescription>Shared dialog anatomy across both renderers.</DialogDescription></DialogHeader> : null}
            {props.variant === "panel" ? <DialogPanel><p className="text-sm">{props.state === "long-content" ? "This longer content verifies panel spacing and scrolling. ".repeat(12) : "Dialog panel content"}</p></DialogPanel> : null}
            {props.variant === "footer" ? <DialogFooter><Button variant="outline">Cancel</Button><Button>Save</Button></DialogFooter> : null}
            {props.variant === "close" ? <DialogHeader><DialogTitle>Closable dialog</DialogTitle></DialogHeader> : null}
            {props.state === "long-content" && props.variant !== "panel" ? <DialogPanel><p className="text-sm">{"This longer content verifies panel spacing and scrolling. ".repeat(12)}</p></DialogPanel> : null}
          </DialogPopup>
        </Dialog>
      </div>
    );
  }
  if (props.storyId === "ui/menu") {
    if (props.variant === "switch") return <MenuSwitchStory state={props.state} />;
    const open = props.state !== "default";
    const visualClass = props.state === "hover" ? "bg-[var(--color-background-button-secondary-hover)]" : props.state === "focus" ? "ring-1 ring-ring/60" : props.state === "pressed" ? "bg-[var(--color-background-button-secondary)]" : "";
    return (
      <div className="flex min-h-52 items-center justify-center">
        <Menu key={props.state} defaultOpen={open}>
          <MenuTrigger render={<Button variant="outline">Open menu</Button>} />
          <MenuPopupBase align="start" className="w-52">
            <MenuGroup>
              <MenuGroupLabel>Actions</MenuGroupLabel>
              {props.variant === "checkbox" ? (
                <MenuCheckboxItem checked className={visualClass} disabled={props.state === "disabled"}>Show terminal</MenuCheckboxItem>
              ) : props.variant === "separator" ? (
                <><MenuItem className={visualClass} disabled={props.state === "disabled"}>New chat</MenuItem><MenuSeparator /><MenuItem variant="destructive">Remove</MenuItem></>
              ) : (
                <MenuItem className={visualClass} disabled={props.state === "disabled"}>New chat{props.variant === "shortcut" ? <MenuShortcut>⌘N</MenuShortcut> : null}</MenuItem>
              )}
            </MenuGroup>
          </MenuPopupBase>
        </Menu>
      </div>
    );
  }
  if (props.storyId === "ui/button") {
    const disabled = props.state === "disabled";
    const stateClass = props.state === "hover" ? "brightness-95" : props.state === "focus" ? "ring-1 ring-ring/60 ring-offset-1 ring-offset-background" : "";
    if (props.variant === "icon") return <IconButton className={stateClass} data-pressed={props.state === "pressed" || undefined} disabled={disabled} label="Add item"><PlusIcon /></IconButton>;
    const variant = props.variant === "primary" ? "default" : props.variant as "default" | "secondary" | "outline" | "ghost" | "destructive" | "prominent";
    const label = props.variant === "primary" ? "Primary" : `${props.variant?.slice(0, 1).toUpperCase()}${props.variant?.slice(1)}`;
    return <Button className={stateClass} data-pressed={props.state === "pressed" || undefined} disabled={disabled} variant={variant}>{label}</Button>;
  }
  if (props.storyId === "ui/input") {
    const value = props.state === "filled" ? "Component fidelity" : undefined;
    const disabled = props.state === "disabled";
    const invalid = props.state === "invalid";
    const focusClass = props.state === "focus" ? "border-foreground/30 ring-1 ring-ring/60" : "";
    const size = props.variant === "small" ? "sm" : props.variant === "large" ? "lg" : "default";
    return <div className="w-80"><Input aria-invalid={invalid} className={focusClass} defaultValue={value} disabled={disabled} placeholder={`${props.variant ?? "default"} input`} size={size} variant={props.variant === "soft" ? "soft" : "default"} /></div>;
  }
  if (props.storyId === "editor-rail/add-menu") {
    return <EditorRailAddMenuStory open={props.state === "open"} />;
  }
  if (props.storyId === "project-actions/add-editor") {
    const editing = props.variant === "edit" || props.variant === "shortcut-conflict";
    const scripts = editing
      ? [{ id: "component-lab-test", name: "Test", command: "bun run test", icon: "test" as const, runOnWorktreeCreate: false }]
      : [];
    const keybindings = props.variant === "shortcut-conflict"
      ? [{ command: "script.component-lab-test.run", shortcut: { key: "t", metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, modKey: true } }] as never
      : [];
    return (
      <ProjectScriptsControl
        key={`${props.variant}:${props.state}`}
        scripts={scripts}
        keybindings={keybindings}
        preferredScriptId={editing ? "component-lab-test" : null}
        initialEditingScriptId={editing && (props.state !== "default" || props.variant === "shortcut-conflict") ? "component-lab-test" : null}
        initialDialogOpen={
          props.state === "open" ||
          props.state === "saving" ||
          props.state === "error" ||
          props.variant === "validation-error" ||
          props.variant === "shortcut-conflict"
        }
        initialSaving={props.state === "saving"}
        initialValidationError={
          props.variant === "shortcut-conflict"
            ? "Shortcut is already assigned to New thread."
            : props.variant === "validation-error" || props.state === "error"
              ? "Command is required."
              : null
        }
        onRunScript={() => {}}
        onAddScript={() => {}}
        onUpdateScript={() => {}}
        onDeleteScript={() => {}}
      />
    );
  }
  if (props.storyId === "composer/model-effort-picker") {
    return <ComposerModelPickerStory state={props.state} variant={props.variant} />;
  }
  if (props.storyId === "composer/context-window-meter") {
    const fixture = resolveComponentLabContextWindowFixture(props.variant);
    return (
      <div className="flex min-h-40 w-full items-center justify-end pr-6">
        <ContextWindowMeter
          usage={fixture.usage}
          cumulativeCostUsd={fixture.cumulativeCostUsd}
          activeWindowLabel={fixture.activeWindowLabel}
          pendingWindowLabel={fixture.pendingWindowLabel}
          initialOpen={props.state === "open"}
        />
      </div>
    );
  }
  if (props.storyId === "composer/reference-attachments") {
    const fixture = resolveComponentLabComposerReferenceAttachmentsFixture(props.variant);
    return (
      <div className="w-[640px] max-w-[calc(100vw-48px)] rounded-2xl border border-border bg-background p-4">
        <ComposerReferenceAttachmentsComposition
          assistantSelections={[...fixture.assistantSelections]}
          fileComments={[...fixture.fileComments]}
          pastedTexts={[...fixture.pastedTexts]}
          files={fixture.files.map((file) => ({ ...file, file: null as never }))}
          images={fixture.images.map((image) => ({ ...image, file: null as never }))}
          nonPersistedImageIdSet={new Set(fixture.nonPersistedImageIds)}
          onExpandImage={() => {}}
          onRemoveAssistantSelections={() => {}}
          onRemoveFileComments={() => {}}
          onRemovePastedText={() => {}}
          onShowPastedTextInField={() => {}}
          onRemoveFile={() => {}}
          onRemoveImage={() => {}}
        />
      </div>
    );
  }
  if (props.storyId === "system/semantic-icon-tones") {
    const tone = SEMANTIC_ICON_TONES.includes(props.variant as never)
      ? props.variant as (typeof SEMANTIC_ICON_TONES)[number]
      : "primary";
    return (
      <div className="flex items-center justify-center"><SemanticIconTone tone={tone} /></div>
    );
  }
  if (props.storyId === "notifications/provider-update") {
    const selected = props.state === "default"
      ? ({ single: "default", multiple: "multiple", progress: "updating", failure: "failure" }[props.variant ?? "single"] ?? "default")
      : props.state;
    return <ProviderUpdateNotificationStory key={`${props.variant}:${props.state}`} state={selected} />;
  }
  if (props.storyId === "notifications/thread-error") {
    return (
      <div className="w-[776px] max-w-full">
        <ThreadErrorBanner
          error="The coding agent stopped before the turn completed."
          onDismiss={() => {}}
        />
      </div>
    );
  }
  if (props.storyId === "transcript/collapsed-work") {
    return (
      <div className="w-[560px] max-w-full">
        <CollapsedWorkComposition
          elapsed="8.4s"
          open={props.state === "open"}
          onOpenChange={() => {}}
        >
          <p className="text-xs text-muted-foreground">Read 3 files and updated the implementation.</p>
        </CollapsedWorkComposition>
      </div>
    );
  }
  if (props.storyId === "transcript/status-row") {
    const variant = props.variant ?? "thinking";
    const Icon = variant === "error" ? CircleAlertIcon : variant === "info" ? CheckIcon : variant === "search" ? SearchStoryIcon : variant === "edit" ? PencilIcon : variant === "tool" ? ZapIcon : BotIcon;
    const tone = (variant === "error" ? "error" : variant === "tool" ? "tool" : variant === "thinking" ? "thinking" : "info") as TimelineStatusTone;
    return <div className="w-[560px] max-w-full"><TimelineStatusRowComposition displayText={`${variant} activity`} fontSizePx={12} icon={<Icon className="size-4" />} tone={tone} /></div>;
  }
  if (props.storyId === "right-dock/tab-strip") {
    const selected = ({ empty: "empty", "single-pane": "single-pane", "multi-pane": "default", overflow: "overflow", "singleton-filtering": "default" }[props.variant ?? "multi-pane"] ?? "default");
    const panes =
      selected === "empty"
        ? []
        : selected === "single-pane"
          ? [COMPONENT_LAB_RIGHT_DOCK_PANES[1]!]
          : selected === "overflow"
            ? COMPONENT_LAB_RIGHT_DOCK_OVERFLOW_PANES
            : COMPONENT_LAB_RIGHT_DOCK_PANES;
    return (
      <div className={`w-full overflow-visible border border-border bg-background ${selected === "overflow" ? "max-w-sm" : "max-w-xl"}`}>
        <RightDockTabs
          key={`${props.variant}:${props.state}`}
          activePaneId="terminal"
          addMenuKinds={props.variant === "singleton-filtering" ? ["diff", "git"] : ["diff", "browser", "git"]}
          defaultAddMenuOpen={props.state === "add-menu-open"}
          paneLabelOverrides={{ "sidechat:component-lab": "Side chat" }}
          panes={[...panes]}
          onAddPane={() => {}}
          onClosePane={() => {}}
          onCollapse={() => {}}
          onSelectPane={() => {}}
        />
      </div>
    );
  }
  if (props.storyId === "kanban/card") {
    const fixture = resolveComponentLabKanbanCardFixture(props.variant);
    const card = {
      cardId: `thread:component-lab-kanban-${props.variant ?? "default"}`,
      threadId: `component-lab-kanban-${props.variant ?? "default"}`,
      projectId: "component-lab-project",
      provider: "codex", isTerminal: false, branch: "feature/fidelity",
      envMode: null, worktreePath: null, thread: null,
      draftHasAttachments: fixture.column === "draft", sortTimestamp: 0,
      timestamp: null, ...fixture,
    } as KanbanCard;
    return <div className="w-72"><KanbanCardComposition card={card} nowMs={Date.parse('2026-01-01T00:05:00.000Z')} visualState={props.state as 'default' | 'hover' | 'focus' | 'pressed'} /></div>;
  }
  if (props.storyId === "composer/voice-recorder") {
    const selected = props.state === "default"
      ? ({ idle: "default", silence: "recording-silence", "strong-waveform": "recording-waveform", transcribing: "transcribing" }[props.variant ?? "idle"] ?? "default")
      : props.state;
    if (selected === "default") {
      return <ComposerVoiceButton isRecording={false} isTranscribing={false} durationLabel="0:00" onClick={() => {}} />;
    }
    return (
      <div className="w-full max-w-xl rounded-2xl border border-border bg-background p-3">
        <ComposerVoiceRecorderBar
          durationLabel="0:08"
          isRecording={selected !== "transcribing"}
          isTranscribing={selected === "transcribing"}
          waveformLevels={
            selected === "recording-waveform"
              ? COMPONENT_LAB_VOICE_WAVEFORM_LEVELS
              : COMPONENT_LAB_VOICE_SILENCE_LEVELS
          }
          onCancel={() => {}}
          onSubmit={() => {}}
        />
      </div>
    );
  }
  if (props.storyId === "terminal/search") {
    const selected = props.state;
    const query = selected === "default" ? "" : "missing-command";
    return (
      <div className={`relative h-24 rounded-lg bg-zinc-950 ${props.variant === "right-dock" ? "w-80" : "w-full max-w-xl"}`}>
        <TerminalSearch
          key={props.state}
          isOpen
          initialQuery={query}
          initialCaseSensitive={selected === "match-case"}
          searchAddon={({ findNext: () => false, findPrevious: () => false, clearDecorations: () => {} }) as never}
          onClose={() => {}}
        />
      </div>
    );
  }
  if (props.storyId === "editor/file-search") {
    const query = props.state === "query" ? "ComposerVoice" : "";
    return (
      <div className={`${props.variant === "right-dock" ? "w-80" : "w-60"} overflow-hidden border border-border bg-background`}>
        <WorkspaceSearchInputHeader
          query={query}
          search={{ inputQuery: query, fileMatches: [], searchResultsPending: false, searchResultsCurrent: true, isFetching: false, error: null, truncated: false }}
          onQueryChange={() => {}}
          onSelectFile={() => {}}
        />
      </div>
    );
  }
  if (props.storyId === "editor/file-tab") {
    return <FileTabStory key={props.state} state={props.state} />;
  }
  if (props.storyId === "diff/file-filter") {
    const query = props.state === "query" ? "Composer" : "";
    return (
      <div className="w-60 overflow-hidden border border-border bg-background">
        <ReviewFileTreeSearchHeader
          autoFocus={props.state === "focus"}
          disabled={props.state === "disabled"}
          query={query}
          onQueryChange={() => {}}
        />
      </div>
    );
  }
  if (props.storyId === "editor/project-search") {
    const query = props.state === "query" ? "Alpha" : "";
    return (
      <div className="w-60 overflow-hidden rounded-md border border-border bg-[var(--composer-surface)]">
        <PickerPanelSearchHeader
          autoFocus={props.state === "focus"}
          bleedParentPadding
          disabled={props.state === "disabled"}
          placeholder="Search projects"
          query={query}
          onQueryChange={() => {}}
        />
      </div>
    );
  }
  if (props.storyId === "sidebar/space-project-picker") {
    return <SpaceProjectPickerStory state={props.state} />;
  }
  if (props.storyId === "editor/file-preview-error") {
    return <FilePreviewErrorStory key={`${props.variant}:${props.state}`} state={props.state} variant={props.variant} />;
  }
  if (props.storyId === "editor/pdf-viewer") {
    return <PdfViewerToolbarStory key={props.state} state={props.state} />;
  }
  if (props.storyId === "typography/markdown-code") {
    const text =
      props.variant === "inline"
        ? "Use `font-family: var(--font-mono-family)` for inline code."
        : props.variant === "block"
          ? "```ts\nconst glyphWidth = measure('iiiiMMMM');\n```"
          : "Inline `const answer = 42` and block code:\n\n```ts\nfunction align(value: number) { return value + 1; }\n```";
    return <div className="w-full max-w-xl rounded-xl border border-border bg-background p-4"><ChatMarkdown text={text} cwd={undefined} /></div>;
  }
  if (props.storyId === "typography/diff-code") {
    return (
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-background">
        <PullRequestCodeComposition
          view={COMPONENT_LAB_DIFF_CODE_VIEW}
          truncated={false}
          renderMode={props.variant === "split" ? "split" : "stacked"}
          wordWrap={props.variant === "wrapped"}
          expandedFileKeys={[COMPONENT_LAB_DIFF_CODE_VIEW.files[0].key]}
          visibleLineCounts={{ [COMPONENT_LAB_DIFF_CODE_VIEW.files[0].key]: 3 }}
          rawVisibleLineCount={3}
          onToggleFile={() => {}}
          onShowMoreFile={() => {}}
          onShowMoreRaw={() => {}}
        />
      </div>
    );
  }
  if (props.storyId === "sidebar/navigation-row") {
    const visualState = props.state === "active" ? "default" : props.state;
    const fixture = resolveComponentLabNavigationRow(props.variant);
    const icon = {
      kanban: <KanbanIcon className="size-[15px]" />,
      "new-thread": <NewThreadIcon className="size-[15px]" />,
      search: <SearchStoryIcon className="size-[15px]" />,
      settings: <SettingsIcon className="size-[15px]" />,
    }[fixture.icon];
    return (
      <SidebarProvider>
        <div className="w-56 bg-[var(--color-background-sidebar)] p-3">
          <SidebarPrimaryActionRow
            icon={icon}
            label={fixture.label}
            active={props.state === "active"}
            onActivate={() => {}}
            visualState={visualState as "default" | "hover" | "focus" | "pressed"}
            trailing={fixture.shortcut ? <span className="text-[10px]">{fixture.shortcut}</span> : undefined}
          />
        </div>
      </SidebarProvider>
    );
  }
  if (props.storyId === "sidebar/command-palette") {
    return <SidebarCommandPaletteStory key={`${props.variant}:${props.state}`} state={props.state} variant={props.variant} />;
  }
  if (props.storyId === "transcript/message-actions") {
    const disabled = props.state === "disabled";
    const revealed = props.state !== "default";
    const visualClass = props.state === "hover"
      ? "bg-[var(--color-background-button-secondary-hover)]"
      : props.state === "focus"
        ? "ring-1 ring-ring/60"
        : "";
    const actions = resolveComponentLabMessageActions(props.variant);
    const actionIcon = {
      copy: <CopyIcon className={MESSAGE_ACTION_ICON_CLASS_NAME} />,
      edit: <NewThreadIcon className={MESSAGE_ACTION_ICON_CLASS_NAME} />,
      pin: <PinIcon className={MESSAGE_ACTION_ICON_CLASS_NAME} />,
      reference: <MessageCircleIcon className={MESSAGE_ACTION_ICON_CLASS_NAME} />,
      revert: <Undo2Icon className={MESSAGE_ACTION_ICON_CLASS_NAME} />,
    };
    return (
      <div
        className={`flex items-center gap-2 text-sm transition-opacity ${
          revealed ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        data-message-actions-visible={revealed}
        data-message-actions-variant={props.variant ?? "assistant"}
      >
        {actions.map((action) => (
          <MessageActionButton
            key={action.label}
            label={action.label}
            tooltip={action.tooltip}
            disabled={disabled}
            aria-pressed={action.pressed || props.state === "pressed"}
            className={`${action.persistent ? "text-muted-foreground/80 " : ""}${visualClass}`}
          >
            {actionIcon[action.icon]}
          </MessageActionButton>
        ))}
      </div>
    );
  }
  if (props.storyId === "transcript/message-row") {
    return <MessageRowStory key={`${props.variant}:${props.state}`} state={props.state} variant={props.variant} />;
  }
  if (props.storyId === "sidebar/project-row") {
    return <SidebarProjectRowSpecimen state={props.state as Parameters<typeof SidebarProjectRowSpecimen>[0]["state"]} variant={props.variant as Parameters<typeof SidebarProjectRowSpecimen>[0]["variant"]} onContextMenu={(position) => { void ensureNativeApi().contextMenu.show(componentLabProjectContextMenuItems(props.variant), position); }} />;
  }
  if (props.storyId === "sidebar/thread-row") {
    return <SidebarThreadRowSpecimen state={props.state as Parameters<typeof SidebarThreadRowSpecimen>[0]["state"]} variant={props.variant as Parameters<typeof SidebarThreadRowSpecimen>[0]["variant"]} onContextMenu={(position) => { void ensureNativeApi().contextMenu.show(componentLabThreadContextMenuItems(props.variant), position); }} />;
  }
  return (
    <div className="flex min-h-64 items-center justify-center px-8 text-center">
      <div className="max-w-sm">
        <p className="text-sm font-medium text-foreground">Story renderer not implemented yet</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {props.storyId} is in the shared inventory, but this state is not yet backed by the real product component.
        </p>
      </div>
    </div>
  );
}

function IndependentTabsStory(props: { readonly state: string; readonly variant?: string }) {
  const [result, setResult] = useState("Awaiting tab action");
  const terminal = props.variant !== "chat";
  const tabCount = props.state === "overflow" ? 8 : 3;
  const tabs = Array.from({ length: tabCount }, (_, index) => (
    <SurfaceTabChip
      key={`${props.variant ?? "chat"}-${index}`}
      active={index === 1}
      title={`${terminal ? "Terminal" : "Chat"} ${index + 1}`}
      label={`${terminal ? "Terminal" : "Chat"} ${index + 1}`}
      labelClassName="max-w-24"
      icon={<FileIcon className="size-3.5" />}
      closeLabel={`Close ${terminal ? "Terminal" : "Chat"} ${index + 1}`}
      onClose={() => setResult(`Closed tab ${index + 1}`)}
      onSelect={() => setResult(`Selected tab ${index + 1}`)}
    />
  ));
  return (
    <div className="grid w-[520px] max-w-[calc(100vw-3rem)] gap-3">
      <IndependentTabRow
        actionPlacement={props.variant === "chat" ? "start" : "end"}
        className="h-10 border border-border bg-background px-1.5 py-1"
        defaultCollapsed={props.state === "collapsed"}
        owner={(props.variant ?? "chat") as "chat" | "terminal-pane" | "terminal-groups"}
        tabs={tabs}
        actions={(
          <>
            <IconButton label="Add tab" size="icon-xs" variant="chrome" onClick={() => setResult("Added tab")}>
              <PlusIcon className="size-3.5" />
            </IconButton>
            <IconButton label="Split right" size="icon-xs" variant="chrome" onClick={() => setResult("Split right")}>
              <span>Ⅱ</span>
            </IconButton>
          </>
        )}
      />
      <p aria-live="polite" className="text-[11px] text-muted-foreground">{result}</p>
    </div>
  );
}

function FilePreviewHeaderStory(props: { readonly state: string; readonly variant?: string }) {
  const presentation = props.variant === "editor" ? "editor" : "dock";
  const [mode, setMode] = useState<FilePreviewMode>(() =>
    props.state === "source" || props.state === "preview"
      ? props.state
      : defaultFilePreviewMode({ filePath: "docs/guides/reference/README.md", presentation }),
  );
  return (
    <div className={props.variant === "narrow" ? "w-80 overflow-hidden border border-border" : "w-[680px] max-w-[calc(100vw-3rem)] overflow-hidden border border-border"}>
      <WorkspaceFilePreviewHeader
        actionMenuDefaultOpen={props.state === "menu-open"}
        workspaceRoot="/workspace/synara"
        filePath="docs/guides/reference/README.md"
        isMarkdown
        markdownPreviewEnabled={mode === "preview"}
        onMarkdownPreviewChange={(rendered) => setMode(rendered ? "preview" : "source")}
        onReferenceInChat={() => {}}
        onAskWhyInChat={() => {}}
        truncated={props.variant === "truncated"}
      />
      <p aria-live="polite" className="px-3 py-2 text-[11px] text-muted-foreground">{mode === "preview" ? "Preview mode" : "Source mode"}</p>
    </div>
  );
}

function PdfViewerToolbarStory(props: { readonly state: string }) {
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<PdfZoomMode>(
    props.state === "zoomed"
      ? { type: "custom", scale: 1.25 }
      : props.state === "fit-page"
        ? { type: "fit-page" }
        : { type: "fit-width" },
  );
  const scale = resolvePdfScale(mode, { width: 300, height: 180 }, { width: 648, height: 408 });
  return (
    <div className="flex h-96 w-full max-w-3xl flex-col overflow-hidden border border-border bg-[var(--app-user-message-background)]">
      <PdfViewerToolbar
        fileName="report.pdf" currentPage={page} numPages={3}
        zoomMode={mode} scale={scale} openInTarget="/workspace/report.pdf"
        initialZoomMenuOpen={props.state === "menu-open"}
        onJumpToPage={setPage}
        onZoomIn={() => setMode({ type: "custom", scale: nextZoomScale(scale) })}
        onZoomOut={() => setMode({ type: "custom", scale: previousZoomScale(scale) })}
        onSetScale={(next) => setMode({ type: "custom", scale: next })}
        onFitWidth={() => setMode({ type: "fit-width" })}
        onFitPage={() => setMode({ type: "fit-page" })}
      />
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3">
        <div className="border border-border bg-white" style={{ width: 300 * scale, height: 180 * scale }} />
      </div>
    </div>
  );
}
