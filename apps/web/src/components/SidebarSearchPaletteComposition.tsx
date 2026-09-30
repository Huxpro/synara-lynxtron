/**
 * SidebarSearchPaletteComposition - The command palette over platform elements
 * (PaletteView/PaletteText/PaletteGlyph) that the Lynx renderer shares.
 *
 * It predates upstream's ⌘P restyle of `SidebarSearchPalette.tsx` (Electron);
 * port that restyle here before the two drift further.
 *
 * Keeps the sidebar search UX aligned with the shared command primitives so
 * keyboard navigation and shortcut labels behave like the rest of the app.
 */
import { type FilesystemBrowseResult, type ProviderKind } from "@synara/contracts";
import { isGenericChatThreadTitle } from "@synara/shared/chatThreads";
import { type ComponentType, useEffect, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatRelativeTime } from "~/lib/relativeTime";
import { readNativeApi } from "~/nativeApi";
import { isMacPlatform } from "~/lib/utils";
import { Kbd, KbdGroup } from "~/components/ui/kbd";
import {
  appendBrowsePathSegment,
  canNavigateUp,
  getBrowseDirectoryPath,
  getBrowseLeafPathSegment,
  getBrowseParentPath,
  hasTrailingPathSeparator,
  isExplicitRelativeProjectPath,
  isFilesystemBrowseQuery,
  isUnsupportedWindowsProjectPath,
  normalizeProjectPathForDispatch,
} from "~/lib/projectPaths";

import {
  type SidebarSearchAction,
  type SidebarSearchProject,
  type SidebarSearchTheme,
  type SidebarSearchThread,
  SIDEBAR_SEARCH_LIMITS,
  matchSidebarSearchActions,
  matchSidebarSearchProjects,
  matchSidebarSearchThemes,
  matchSidebarSearchThreads,
} from "./SidebarSearchPalette.logic";
import {
  SidebarSearchPaletteGlyph as PaletteGlyph,
  type SidebarSearchPaletteGlyphKind,
  SidebarSearchPaletteMark as PaletteMark,
  SidebarSearchPaletteText as PaletteText,
  SidebarSearchPaletteView as PaletteView,
} from "~/components/SidebarSearchPaletteElements";
import { useTheme } from "~/hooks/useTheme";
import { getAvailableCodeThemes, getCodeThemeSeed } from "../theme/theme.logic";
import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
} from "~/components/ui/command";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ShortcutKbd } from "~/components/ui/shortcut-kbd";

import { getNavigatorPlatform } from "~/platform/env";
export type SidebarSearchPaletteMode = "search" | "import";

interface SidebarSearchPaletteProps {
  open: boolean;
  initialQuery?: string | undefined;
  query?: string | undefined;
  mode: SidebarSearchPaletteMode;
  onModeChange: (mode: SidebarSearchPaletteMode) => void;
  onQueryChange?: ((query: string) => void) | undefined;
  onOpenChange: (open: boolean) => void;
  actions: readonly SidebarSearchAction[];
  projects: readonly SidebarSearchProject[];
  threads: readonly SidebarSearchThread[];
  searchStatus?: "ready" | "loading" | "error" | undefined;
  searchErrorMessage?: string | null | undefined;
  onRetrySearch?: (() => void) | undefined;
  onCreateChat: () => void;
  onCreateThread: () => void;
  onAddProjectPath: (
    path: string,
    options?: { createIfMissing?: boolean | undefined },
  ) => Promise<void>;
  homeDir: string | null;
  onOpenSettings: () => void;
  onOpenFeedback: () => void;
  onOpenUsageSettings: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenThread: (threadId: string) => void;
  importProviders: readonly ImportProviderKind[];
  onImportThread: (provider: ImportProviderKind, externalId: string) => Promise<void>;
  onBrowseFilesystem?:
    | ((partialPath: string) => Promise<FilesystemBrowseResult | null>)
    | undefined;
  filesystemBrowseEnabled?: boolean | undefined;
  appearanceEnabled?: boolean | undefined;
}

export type ImportProviderKind = Extract<
  ProviderKind,
  "codex" | "claudeAgent" | "cursor" | "opencode"
>;

function actionHandler(
  actionId: string,
  props: Pick<
    SidebarSearchPaletteProps,
    "onCreateChat" | "onCreateThread" | "onOpenFeedback" | "onOpenSettings" | "onOpenUsageSettings"
  >,
): (() => void) | null {
  switch (actionId) {
    case "new-chat":
      return props.onCreateChat;
    case "new-thread":
      return props.onCreateThread;
    case "settings":
      return props.onOpenSettings;
    case "feedback":
      return props.onOpenFeedback;
    case "usage-settings":
      return props.onOpenUsageSettings;
    default:
      return null;
  }
}

type IconComponent = ComponentType<{ className?: string }>;

const ACTION_GLYPHS: Record<string, SidebarSearchPaletteGlyphKind> = {
  "new-chat": "chat",
  "new-thread": "new-thread",
  "add-project": "folder-closed",
  "import-thread": "arrow-down-to-line",
  feedback: "bug",
  settings: "settings",
  "usage-settings": "settings",
};

const BROWSE_STALE_TIME_MS = 10_000;

const EMPTY_BROWSE_ENTRIES: FilesystemBrowseResult["entries"] = [];

function expandHomeInPath(value: string, homeDir: string | null): string {
  if (!homeDir) return value;
  if (value === "~") return homeDir;
  if (value.startsWith("~/") || value.startsWith("~\\")) {
    return `${homeDir}${value.slice(1)}`;
  }
  return value;
}

function PaletteIcon(props: { icon: IconComponent }) {
  const Icon = props.icon;
  return (
    <PaletteView className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
      <Icon className="size-[15px]" />
    </PaletteView>
  );
}

type ThemeCommandItem = {
  description: string;
  id: string;
  isActive: boolean;
  label: string;
  mode: "system" | "light" | "dark";
};

function queryTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function hasTokenEqual(query: string, token: string): boolean {
  return queryTokens(query).includes(token);
}

function createThemeCommandItem(
  mode: ThemeCommandItem["mode"],
  activeMode: ThemeCommandItem["mode"],
): ThemeCommandItem {
  if (mode === "system") {
    return {
      id: "theme-command:system",
      label: "Switch to system theme",
      description: "Match your OS appearance setting.",
      mode,
      isActive: activeMode === mode,
    };
  }

  return {
    id: `theme-command:${mode}`,
    label: `Switch to ${mode} theme`,
    description: mode === "light" ? "Always use the light theme." : "Always use the dark theme.",
    mode,
    isActive: activeMode === mode,
  };
}

// Treat any token of length >= 2 that is a prefix of `keyword` as a match,
// so typing `th` / `the` already starts surfacing theme actions.
function hasTokenPrefixOf(query: string, keyword: string): boolean {
  return queryTokens(query).some((token) => token.length >= 2 && keyword.startsWith(token));
}

// Keep the palette quiet by default, then expose focused appearance actions
// once the user is clearly asking about theme modes.
function buildThemeCommandItems(input: {
  query: string;
  resolvedTheme: "light" | "dark";
  theme: "system" | "light" | "dark";
}): ThemeCommandItem[] {
  const normalizedQuery = input.query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  if (
    hasTokenEqual(normalizedQuery, "system") ||
    hasTokenEqual(normalizedQuery, "auto") ||
    hasTokenEqual(normalizedQuery, "automatic") ||
    hasTokenEqual(normalizedQuery, "os")
  ) {
    return [createThemeCommandItem("system", input.theme)];
  }

  if (hasTokenEqual(normalizedQuery, "light")) {
    return [
      createThemeCommandItem("light", input.theme),
      createThemeCommandItem("system", input.theme),
    ];
  }

  if (hasTokenEqual(normalizedQuery, "dark")) {
    return [
      createThemeCommandItem("dark", input.theme),
      createThemeCommandItem("system", input.theme),
    ];
  }

  if (
    hasTokenPrefixOf(normalizedQuery, "theme") ||
    hasTokenPrefixOf(normalizedQuery, "appearance")
  ) {
    const nextMode = input.resolvedTheme === "dark" ? "light" : "dark";
    return [
      createThemeCommandItem(nextMode, input.theme),
      createThemeCommandItem("system", input.theme),
    ];
  }

  return [];
}

function CodeThemeBadge(props: { accent: string; background: string; foreground: string }) {
  return (
    <PaletteText
      aria-hidden="true"
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border font-medium text-ui-xs leading-none tracking-[-0.01em]"
      style={{
        backgroundColor: props.background,
        borderColor: `${props.foreground}26`,
        color: props.accent,
      }}
    >
      Aa
    </PaletteText>
  );
}

const THEME_MODE_GLYPHS: Record<"system" | "light" | "dark", SidebarSearchPaletteGlyphKind> = {
  system: "device-laptop",
  light: "sun",
  dark: "moon",
};

function ProviderIcon(props: { provider: ProviderKind }) {
  return (
    <PaletteView className="flex size-5 shrink-0 items-center justify-center">
      <PaletteGlyph kind="provider" provider={props.provider} className="size-[15px]" />
    </PaletteView>
  );
}

function threadMatchLabel(input: {
  matchKind: "message" | "project" | "title";
  messageMatchCount: number;
}): string | null {
  if (input.matchKind === "message") {
    return input.messageMatchCount > 1 ? `${input.messageMatchCount} chat hits` : "Chat match";
  }
  if (input.matchKind === "project") {
    return "Project match";
  }
  return null;
}

function tokenizeHighlightQuery(query: string): string[] {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .filter((token, index, allTokens) => allTokens.indexOf(token) === index);
  return tokens.sort((left, right) => right.length - left.length);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText(props: { text: string; query: string; className?: string | undefined }) {
  const tokens = tokenizeHighlightQuery(props.query);
  let segments: Array<{ key: string; text: string; highlighted: boolean }>;
  if (tokens.length === 0) {
    segments = [{ key: "full", text: props.text, highlighted: false }];
  } else {
    const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
    const parts = props.text.split(pattern).filter((part) => part.length > 0);
    let offset = 0;
    segments = parts.map((part) => {
      const segment = {
        key: `${offset}-${part.length}`,
        text: part,
        highlighted: tokens.some((token) => token === part.toLowerCase()),
      };
      offset += part.length;
      return segment;
    });
  }

  return (
    <PaletteText className={props.className}>
      {segments.map((segment) =>
        segment.highlighted ? (
          <PaletteMark
            key={segment.key}
            className="rounded-[3px] bg-amber-200/80 px-[1px] text-current dark:bg-amber-300/25"
          >
            {segment.text}
          </PaletteMark>
        ) : (
          <PaletteText key={segment.key}>{segment.text}</PaletteText>
        ),
      )}
    </PaletteText>
  );
}

export function SidebarSearchPalette(props: SidebarSearchPaletteProps) {
  const { activeTheme, resolvedTheme, setCodeThemeId, setTheme, theme } = useTheme();
  const [localQuery, setLocalQuery] = useState(() => props.initialQuery ?? "");
  const [localSearchQuery, setLocalSearchQuery] = useState(() => props.initialQuery ?? "");
  const query = props.query ?? localQuery;
  const searchQuery = props.query ?? localSearchQuery;
  const setQuery = (value: string) => {
    props.onQueryChange?.(value);
    if (props.query === undefined) setLocalQuery(value);
  };
  const setSearchQuery = setLocalSearchQuery;
  const [highlightedItemValue, setHighlightedItemValue] = useState<string | null>(null);
  const [importProviderState, setImportProvider] = useState<ImportProviderKind>(
    props.importProviders[0] ?? "codex",
  );
  const [importId, setImportId] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  // Derived fallback (no syncing effect): an unavailable provider renders as
  // the first available one, and the user's pick resurfaces if it comes back.
  const importProvider = props.importProviders.includes(importProviderState)
    ? importProviderState
    : (props.importProviders[0] ?? "codex");
  // Error keyed to the query it was produced for: editing the query derives
  // straight back to null with no state-clearing effect.
  const [addProjectErrorState, setAddProjectErrorState] = useState<{
    query: string;
    message: string;
  } | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const addProjectError =
    addProjectErrorState !== null && addProjectErrorState.query === query
      ? addProjectErrorState.message
      : null;
  const setAddProjectError = (message: string | null) =>
    setAddProjectErrorState(message === null ? null : { query, message });

  useEffect(() => {
    if (props.open) {
      return;
    }
    // Timeout-0 keeps the reset writes asynchronous (the palette is already
    // hidden), which keeps this component eligible for React Compiler.
    const timeoutId = setTimeout(() => {
      setLocalQuery("");
      setLocalSearchQuery("");
      setHighlightedItemValue(null);
      setImportProvider(props.importProviders[0] ?? "codex");
      setImportId("");
      setImportError(null);
      setIsImporting(false);
      setAddProjectError(null);
      setIsAddingProject(false);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [props.importProviders, props.open]);

  const platform = getNavigatorPlatform();
  const trimmedQuery = query.trim();
  const unsupportedWindowsPath = isUnsupportedWindowsProjectPath(trimmedQuery, platform);
  const isBrowsing =
    props.filesystemBrowseEnabled !== false &&
    trimmedQuery.length > 0 &&
    isFilesystemBrowseQuery(trimmedQuery, platform);
  useEffect(() => {
    if (isBrowsing) {
      setSearchQuery(query);
      return;
    }
    const timeoutId = setTimeout(() => {
      setSearchQuery(query);
    }, SIDEBAR_SEARCH_LIMITS.debounceMs);
    return () => clearTimeout(timeoutId);
  }, [isBrowsing, query]);
  const isSearchPending = !isBrowsing && searchQuery !== query;
  const searchStatus = props.searchStatus ?? "ready";
  const searchUnavailable = searchStatus !== "ready";
  const canBrowse = isBrowsing && !unsupportedWindowsPath;
  const browseDirectoryPath = canBrowse ? getBrowseDirectoryPath(query) : "";
  const leafSegment =
    canBrowse && !hasTrailingPathSeparator(query) ? getBrowseLeafPathSegment(query) : "";
  const expandedBrowsePath = canBrowse ? expandHomeInPath(browseDirectoryPath, props.homeDir) : "";

  const { data: browseResult, isFetching: isBrowseFetching } =
    useQuery<FilesystemBrowseResult | null>({
      queryKey: ["sidebar-palette-browse", expandedBrowsePath],
      queryFn: async () => {
        if (!canBrowse || expandedBrowsePath.length === 0) return null;
        if (props.onBrowseFilesystem) {
          return await props.onBrowseFilesystem(expandedBrowsePath);
        }
        const api = readNativeApi();
        if (!api) return null;
        return await api.filesystem.browse({ partialPath: expandedBrowsePath });
      },
      enabled: canBrowse && expandedBrowsePath.length > 0,
      staleTime: BROWSE_STALE_TIME_MS,
    });

  const browseEntries = browseResult?.entries ?? EMPTY_BROWSE_ENTRIES;
  const lowerFilter = leafSegment.toLowerCase();
  const showHidden = leafSegment.startsWith(".");
  const filteredBrowseEntries = browseEntries.filter(
    (entry) =>
      entry.name.toLowerCase().startsWith(lowerFilter) &&
      (showHidden || !entry.name.startsWith(".")),
  );

  const exactBrowseEntry =
    leafSegment.length === 0
      ? null
      : (filteredBrowseEntries.find((entry) => entry.name === leafSegment) ?? null);

  const browseParentPath = canBrowse ? getBrowseParentPath(query) : null;
  const canBrowseUp = canBrowse && canNavigateUp(query);

  const matchedActions =
    isBrowsing || isSearchPending || searchUnavailable
      ? []
      : matchSidebarSearchActions(props.actions, searchQuery);
  const themeCommandItems =
    props.appearanceEnabled === false || isBrowsing || isSearchPending || searchUnavailable
      ? []
      : buildThemeCommandItems({
          query: searchQuery,
          resolvedTheme,
          theme,
        });
  const currentCodeThemeItems: SidebarSearchTheme[] =
    props.appearanceEnabled === false
      ? []
      : getAvailableCodeThemes(resolvedTheme).map((option) => ({
          id: `theme-code:${resolvedTheme}:${option.id}`,
          type: "code-theme",
          label: option.label,
          description: `Apply to the current ${resolvedTheme} theme slot.`,
          keywords: ["appearance", "theme", resolvedTheme, option.id],
          codeThemeId: option.id,
          variant: resolvedTheme,
          isActive: activeTheme.codeThemeId === option.id,
        }));
  const matchedCurrentThemes =
    isBrowsing || isSearchPending || searchUnavailable || searchQuery.trim().length === 0
      ? []
      : matchSidebarSearchThemes(currentCodeThemeItems, searchQuery);
  const showThemeSection =
    !isBrowsing &&
    searchQuery.trim().length > 0 &&
    (themeCommandItems.length > 0 || matchedCurrentThemes.length > 0);
  const matchedProjects =
    isBrowsing || isSearchPending || searchUnavailable
      ? []
      : matchSidebarSearchProjects(props.projects, searchQuery);
  const matchedThreads =
    isBrowsing || isSearchPending || searchUnavailable
      ? []
      : matchSidebarSearchThreads(props.threads, searchQuery);
  const hasSearchResults =
    matchedActions.length > 0 ||
    themeCommandItems.length > 0 ||
    matchedCurrentThemes.length > 0 ||
    matchedProjects.length > 0 ||
    matchedThreads.length > 0;
  const importFieldLabel = importProvider === "codex" ? "Thread ID" : "Session ID";
  const importPlaceholder =
    importProvider === "claudeAgent"
      ? "Paste a Claude session id"
      : importProvider === "cursor"
        ? "Paste a Cursor session id"
        : importProvider === "opencode"
          ? "Paste an OpenCode session id"
          : "Paste a Codex thread id";

  const hasHighlightedFolderItem =
    highlightedItemValue !== null && highlightedItemValue.startsWith("folder:");
  const hasHighlightedBrowseItem =
    hasHighlightedFolderItem || highlightedItemValue === "__browse_up__";

  const highlightedFolderPath = hasHighlightedFolderItem
    ? (highlightedItemValue?.slice("folder:".length) ?? null)
    : null;

  const willCreateMissingFolder =
    canBrowse &&
    !hasHighlightedFolderItem &&
    trimmedQuery.length > 0 &&
    !hasTrailingPathSeparator(query) &&
    exactBrowseEntry === null &&
    !isBrowseFetching;

  const browseSubmitLabel = willCreateMissingFolder ? "Create & Add" : "Add";

  const resolveBrowseSubmitPath = (): string => {
    if (highlightedFolderPath) {
      return normalizeProjectPathForDispatch(highlightedFolderPath);
    }
    const raw = hasTrailingPathSeparator(query)
      ? (browseResult?.parentPath ?? expandHomeInPath(trimmedQuery, props.homeDir))
      : (exactBrowseEntry?.fullPath ?? expandHomeInPath(trimmedQuery, props.homeDir));
    return normalizeProjectPathForDispatch(raw);
  };

  const submitBrowsePath = async () => {
    if (isAddingProject) return;
    if (trimmedQuery.length === 0 && !highlightedFolderPath) {
      setAddProjectError("Enter a folder path.");
      return;
    }
    if (unsupportedWindowsPath) {
      setAddProjectError("Windows paths are not supported on this platform.");
      return;
    }
    if (!highlightedFolderPath && isExplicitRelativeProjectPath(trimmedQuery)) {
      setAddProjectError(
        "Relative paths are not supported. Use an absolute path or start with ~/.",
      );
      return;
    }
    setIsAddingProject(true);
    setAddProjectError(null);
    // Promise chain instead of async/try-finally: React Compiler does not yet
    // support try/finally, and it would skip optimizing this whole component.
    void Promise.resolve(
      props.onAddProjectPath(resolveBrowseSubmitPath(), {
        createIfMissing: willCreateMissingFolder,
      }),
    )
      .then(() => {
        props.onOpenChange(false);
      })
      .catch((cause: unknown) => {
        setAddProjectError(cause instanceof Error ? cause.message : "Failed to add project.");
      })
      .finally(() => {
        setIsAddingProject(false);
      });
  };

  const isMac = isMacPlatform(platform);
  const submitModifierLabel = isMac ? "⌘" : "Ctrl";

  const handleBrowseInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isBrowsing) return;
    const isModifierPressed = isMac ? event.metaKey : event.ctrlKey;
    if (
      event.key === "Enter" &&
      (!hasHighlightedBrowseItem || (isModifierPressed && hasHighlightedFolderItem))
    ) {
      event.preventDefault();
      void submitBrowsePath();
      return;
    }
    if (
      event.key === "Backspace" &&
      hasTrailingPathSeparator(query) &&
      browseParentPath &&
      event.currentTarget.selectionStart === query.length &&
      event.currentTarget.selectionEnd === query.length
    ) {
      event.preventDefault();
      setQuery(browseParentPath);
    }
  };

  const submitImport = () => {
    const normalizedImportId = importId.trim();
    if (!normalizedImportId || isImporting) {
      return;
    }
    setImportError(null);
    setIsImporting(true);
    void Promise.resolve(props.onImportThread(importProvider, normalizedImportId))
      .then(() => {
        props.onOpenChange(false);
      })
      .catch((error: unknown) => {
        setImportError(error instanceof Error ? error.message : "Failed to import thread.");
      })
      .finally(() => {
        setIsImporting(false);
      });
  };

  return (
    <CommandDialog open={props.open} onOpenChange={props.onOpenChange}>
      <CommandDialogPopup>
        {props.mode === "import" ? (
          <PaletteView className="flex flex-col overflow-hidden">
            <PaletteView className="border-b border-border/70 px-4 py-3">
              <PaletteView className="flex items-start gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="-ml-1 mt-[-2px] size-8 shrink-0"
                  onClick={() => {
                    setImportError(null);
                    props.onModeChange("search");
                  }}
                >
                  <PaletteGlyph kind="arrow-left" className="size-4" />
                </Button>
                <PaletteView>
                  <PaletteText className="text-ui font-medium text-foreground">
                    Import thread from provider
                  </PaletteText>
                  <PaletteText className="mt-1 text-ui text-muted-foreground">
                    Create a local app thread and resume it from an existing provider id.
                  </PaletteText>
                </PaletteView>
              </PaletteView>
            </PaletteView>
            <PaletteView className="space-y-4 px-4 py-4">
              <PaletteView className="space-y-2">
                <PaletteText className="text-ui font-medium text-muted-foreground">
                  Provider
                </PaletteText>
                <PaletteView className="flex gap-2">
                  {props.importProviders.map((provider) => (
                    <Button
                      key={provider}
                      className={
                        importProvider === provider
                          ? "flex-1 justify-start border-border bg-muted text-foreground hover:bg-muted/80"
                          : "flex-1 justify-start"
                      }
                      variant="outline"
                      onClick={() => setImportProvider(provider)}
                    >
                      <ProviderIcon provider={provider} />
                      {provider === "claudeAgent"
                        ? "Claude"
                        : provider === "cursor"
                          ? "Cursor"
                          : provider === "opencode"
                            ? "OpenCode"
                            : "Codex"}
                    </Button>
                  ))}
                </PaletteView>
                {props.importProviders.length === 0 ? (
                  <PaletteText className="text-ui text-muted-foreground">
                    No connected providers expose chat import in this build.
                  </PaletteText>
                ) : null}
              </PaletteView>
              <PaletteView className="space-y-2">
                <PaletteText className="text-ui font-medium text-muted-foreground">
                  {importFieldLabel}
                </PaletteText>
                <Input
                  autoFocus
                  nativeInput
                  placeholder={importPlaceholder}
                  value={importId}
                  disabled={props.importProviders.length === 0}
                  onChange={(event) => setImportId(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void submitImport();
                    }
                  }}
                />
                <PaletteText className="text-ui text-muted-foreground">
                  {importProvider === "claudeAgent"
                    ? "Claude resumes a persisted session by session id."
                    : importProvider === "cursor"
                      ? "Cursor resumes a persisted session by session id."
                      : importProvider === "opencode"
                        ? "OpenCode resumes a persisted session by session id."
                        : "Codex resumes a persisted thread by thread id."}
                </PaletteText>
              </PaletteView>
              {importError ? (
                <PaletteText className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-ui text-destructive">
                  {importError}
                </PaletteText>
              ) : null}
              <PaletteView className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setImportError(null);
                    props.onOpenChange(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    props.importProviders.length === 0 ||
                    importId.trim().length === 0 ||
                    isImporting
                  }
                  onClick={submitImport}
                >
                  {isImporting ? "Importing..." : "Import"}
                </Button>
              </PaletteView>
            </PaletteView>
          </PaletteView>
        ) : (
          <>
            <Command
              autoHighlight={isBrowsing ? false : "always"}
              mode="none"
              onItemHighlighted={(value) => {
                setHighlightedItemValue(typeof value === "string" ? value : null);
              }}
            >
              <CommandPanel className="overflow-hidden">
                <PaletteView className="relative">
                  <CommandInput
                    placeholder={
                      isBrowsing
                        ? "Enter project path (e.g. ~/projects/my-app)"
                        : "Search projects, threads, and actions"
                    }
                    value={query}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                    onKeyDown={handleBrowseInputKeyDown}
                    startAddon={
                      isBrowsing ? (
                        <PaletteGlyph kind="folder-plus" className="text-muted-foreground" />
                      ) : (
                        <PaletteGlyph kind="search" className="text-muted-foreground" />
                      )
                    }
                    className={
                      isBrowsing ? (willCreateMissingFolder ? "pe-36" : "pe-24") : undefined
                    }
                  />
                  {isBrowsing ? (
                    <Button
                      variant="outline"
                      size="xs"
                      tabIndex={-1}
                      className="-translate-y-1/2 absolute end-3 top-1/2 gap-1.5 pe-1 ps-2"
                      disabled={
                        isAddingProject ||
                        unsupportedWindowsPath ||
                        (trimmedQuery.length === 0 && !highlightedFolderPath) ||
                        (!highlightedFolderPath && isExplicitRelativeProjectPath(trimmedQuery))
                      }
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onClick={() => void submitBrowsePath()}
                      title={
                        hasHighlightedFolderItem
                          ? `${browseSubmitLabel} highlighted folder (${submitModifierLabel} Enter)`
                          : `${browseSubmitLabel} (Enter)`
                      }
                    >
                      <PaletteText>{browseSubmitLabel}</PaletteText>
                      <KbdGroup className="pointer-events-none -me-0.5 items-center gap-1">
                        <Kbd>
                          {hasHighlightedFolderItem ? `${submitModifierLabel} Enter` : "Enter"}
                        </Kbd>
                      </KbdGroup>
                    </Button>
                  ) : null}
                </PaletteView>
                <CommandList className="max-h-[min(24rem,60vh)] not-empty:px-1.5 not-empty:pt-0 not-empty:pb-1.5">
                  {isBrowsing ? (
                    unsupportedWindowsPath ? (
                      <CommandEmpty className="py-10">
                        <PaletteText className="text-center text-ui text-muted-foreground/79">
                          Windows paths are not supported on this platform.
                        </PaletteText>
                      </CommandEmpty>
                    ) : (
                      <>
                        {canBrowseUp || filteredBrowseEntries.length > 0 ? (
                          <CommandGroup>
                            {canBrowseUp ? (
                              <CommandItem
                                key="browse-up"
                                value="__browse_up__"
                                className="cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                }}
                                onClick={() => {
                                  if (browseParentPath) setQuery(browseParentPath);
                                }}
                              >
                                <PaletteGlyph
                                  kind="corner-left-up"
                                  className="size-3.5 text-muted-foreground/60"
                                />
                                <PaletteText className="min-w-0 flex-1 truncate text-ui text-foreground">
                                  ..
                                </PaletteText>
                              </CommandItem>
                            ) : null}
                            {filteredBrowseEntries.map((entry) => (
                              <CommandItem
                                key={entry.fullPath}
                                value={`folder:${entry.fullPath}`}
                                className="cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                }}
                                onClick={() => setQuery(appendBrowsePathSegment(query, entry.name))}
                              >
                                <PaletteGlyph
                                  kind="folder-closed"
                                  className="size-3.5 text-muted-foreground/60"
                                />
                                <PaletteText className="min-w-0 flex-1 truncate text-ui text-foreground">
                                  {entry.name}
                                </PaletteText>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ) : !isBrowseFetching ? (
                          <PaletteText className="px-3 py-2 text-ui text-muted-foreground">
                            No matching folders.
                          </PaletteText>
                        ) : null}
                        {willCreateMissingFolder ? (
                          <PaletteText className="mx-1.5 mt-2 rounded-md border border-dashed border-[color:var(--color-border)] px-3 py-2 text-ui text-muted-foreground">
                            Press Enter to create{" "}
                            <PaletteText className="text-foreground">{trimmedQuery}</PaletteText>{" "}
                            and add it as a project.
                          </PaletteText>
                        ) : null}
                        {addProjectError ? (
                          <PaletteText className="mx-1.5 mt-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-ui text-destructive">
                            {addProjectError}
                          </PaletteText>
                        ) : null}
                      </>
                    )
                  ) : null}

                  {!isBrowsing && matchedActions.length > 0 ? (
                    <CommandGroup>
                      <CommandGroupLabel className="pt-0 pb-1.5 pl-3">Suggested</CommandGroupLabel>
                      {matchedActions.map((action) => {
                        const onSelect = action.run ?? actionHandler(action.id, props);
                        const Icon = action.icon;
                        const glyph = ACTION_GLYPHS[action.id];
                        return (
                          <CommandItem
                            key={action.id}
                            value={`action:${action.id}`}
                            className="cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5"
                            onMouseDown={(event) => {
                              event.preventDefault();
                            }}
                            onClick={() => {
                              if (action.id === "import-thread") {
                                setImportError(null);
                                setImportId("");
                                setImportProvider(props.importProviders[0] ?? "codex");
                                props.onModeChange("import");
                                return;
                              }
                              if (!onSelect) return;
                              props.onOpenChange(false);
                              onSelect();
                            }}
                          >
                            {Icon ? (
                              <PaletteIcon icon={Icon} />
                            ) : glyph ? (
                              <PaletteView className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                                <PaletteGlyph kind={glyph} className="size-[15px]" />
                              </PaletteView>
                            ) : null}
                            <PaletteText className="min-w-0 flex-1 truncate text-ui text-foreground">
                              {action.label}
                            </PaletteText>
                            {action.shortcutLabel ? (
                              <ShortcutKbd
                                shortcutLabel={action.shortcutLabel}
                                groupClassName="shrink-0"
                              />
                            ) : null}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ) : null}

                  {!isBrowsing &&
                  matchedActions.length > 0 &&
                  (matchedThreads.length > 0 || matchedProjects.length > 0 || showThemeSection) ? (
                    <CommandSeparator />
                  ) : null}

                  {!isBrowsing && matchedThreads.length > 0 ? (
                    <CommandGroup>
                      <CommandGroupLabel className="py-1.5 pl-3">
                        {searchQuery ? "Threads" : "Recent"}
                      </CommandGroupLabel>
                      {matchedThreads.map(
                        ({ id, matchKind, messageMatchCount, snippet, thread }) => (
                          <CommandItem
                            key={id}
                            value={id}
                            className="cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2"
                            onMouseDown={(event) => {
                              event.preventDefault();
                            }}
                            onClick={() => {
                              props.onOpenChange(false);
                              props.onOpenThread(thread.id);
                            }}
                          >
                            {isGenericChatThreadTitle(thread.title) ? null : (
                              <ProviderIcon provider={thread.provider} />
                            )}
                            <PaletteView className="min-w-0 flex-1">
                              <PaletteView className="flex items-baseline gap-3">
                                <PaletteView className="min-w-0 flex-1 truncate text-ui text-foreground">
                                  <HighlightedText
                                    text={thread.title || "Untitled thread"}
                                    query={searchQuery}
                                  />
                                </PaletteView>
                                {/* Project only, not "project · space": this column is
                                    96px, and a thread's Space is already implied by its
                                    project. Space stays searchable — it just does not
                                    get to eat the name the user is scanning for. */}
                                <PaletteText className="w-24 shrink-0 truncate text-right text-ui-meta text-muted-foreground/79">
                                  {thread.projectName}
                                </PaletteText>
                                {thread.updatedAt || thread.createdAt ? (
                                  <PaletteText className="w-10 shrink-0 text-right text-ui-timestamp text-muted-foreground/79">
                                    {formatRelativeTime(thread.updatedAt ?? thread.createdAt)}
                                  </PaletteText>
                                ) : (
                                  <PaletteText className="w-10 shrink-0" />
                                )}
                              </PaletteView>
                              {snippet ? (
                                <PaletteView className="mt-0.5 flex items-start gap-3">
                                  <PaletteView className="min-w-0 flex-1 line-clamp-1 text-ui-meta leading-5 text-muted-foreground/78">
                                    <HighlightedText text={snippet} query={searchQuery} />
                                  </PaletteView>
                                  <PaletteView className="flex w-[8.5rem] shrink-0 justify-end">
                                    {threadMatchLabel({ matchKind, messageMatchCount }) ? (
                                      <PaletteText className="truncate text-ui-meta text-muted-foreground/58">
                                        {threadMatchLabel({ matchKind, messageMatchCount })}
                                      </PaletteText>
                                    ) : null}
                                  </PaletteView>
                                </PaletteView>
                              ) : threadMatchLabel({ matchKind, messageMatchCount }) ? (
                                <PaletteText className="mt-0.5 text-ui-meta text-muted-foreground/58">
                                  {threadMatchLabel({ matchKind, messageMatchCount })}
                                </PaletteText>
                              ) : null}
                            </PaletteView>
                          </CommandItem>
                        ),
                      )}
                    </CommandGroup>
                  ) : null}

                  {!isBrowsing &&
                  matchedThreads.length > 0 &&
                  (matchedProjects.length > 0 || showThemeSection) ? (
                    <CommandSeparator />
                  ) : null}

                  {!isBrowsing && matchedProjects.length > 0 ? (
                    <CommandGroup>
                      <CommandGroupLabel className="py-1.5 pl-3">Projects</CommandGroupLabel>
                      {matchedProjects.map(({ id, project }) => (
                        <CommandItem
                          key={id}
                          value={id}
                          className="cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5"
                          onMouseDown={(event) => {
                            event.preventDefault();
                          }}
                          onClick={() => {
                            props.onOpenChange(false);
                            props.onOpenProject(project.id);
                          }}
                        >
                          <PaletteView className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                            <PaletteGlyph kind="folder-open" className="size-[15px]" />
                          </PaletteView>
                          <PaletteView className="min-w-0 flex-1">
                            <PaletteView className="flex items-baseline gap-3">
                              <PaletteText className="min-w-0 flex-1 truncate text-ui text-foreground">
                                {project.name || "Untitled project"}
                              </PaletteText>
                              {/* Opening a project from here can switch Space, so the
                                  destination is worth naming. It rides in the same right-hand
                                  column the thread rows use for their parent, rather than
                                  in front of the path, which is what identifies a project. */}
                              <PaletteText className="w-24 shrink-0 truncate text-right text-ui-meta text-muted-foreground/79">
                                {project.spaceName}
                              </PaletteText>
                            </PaletteView>
                            <PaletteText className="truncate text-ui-meta text-muted-foreground/79">
                              {project.localName
                                ? `${project.folderName} · ${project.cwd}`
                                : project.cwd}
                            </PaletteText>
                          </PaletteView>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : null}

                  {showThemeSection && matchedProjects.length > 0 ? <CommandSeparator /> : null}

                  {showThemeSection ? (
                    <>
                      {themeCommandItems.length > 0 ? (
                        <CommandGroup>
                          <CommandGroupLabel className="py-1.5 pl-3">Configure</CommandGroupLabel>
                          {themeCommandItems.map((themeCommandItem) => (
                            <CommandItem
                              key={themeCommandItem.id}
                              value={themeCommandItem.id}
                              className="cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5"
                              onMouseDown={(event) => {
                                event.preventDefault();
                              }}
                              onClick={() => {
                                if (themeCommandItem.isActive) return;
                                props.onOpenChange(false);
                                setTheme(themeCommandItem.mode);
                              }}
                            >
                              <PaletteView className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                                <PaletteGlyph
                                  kind={THEME_MODE_GLYPHS[themeCommandItem.mode]}
                                  className="size-[15px]"
                                />
                              </PaletteView>
                              <PaletteText className="min-w-0 flex-1 truncate text-ui text-foreground">
                                {themeCommandItem.label}
                              </PaletteText>
                              <PaletteText
                                className="flex size-3.5 shrink-0 items-center justify-center"
                                aria-hidden={!themeCommandItem.isActive}
                              >
                                {themeCommandItem.isActive ? (
                                  <PaletteGlyph
                                    kind="check"
                                    className="size-3.5 text-muted-foreground/79"
                                  />
                                ) : null}
                              </PaletteText>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ) : null}
                      {matchedCurrentThemes.length > 0 ? (
                        <CommandGroup>
                          <CommandGroupLabel className="py-1.5 pl-3">
                            {resolvedTheme === "dark" ? "Dark themes" : "Light themes"}
                          </CommandGroupLabel>
                          {matchedCurrentThemes.map((themeItem) => {
                            const seed =
                              themeItem.codeThemeId && themeItem.variant
                                ? getCodeThemeSeed(themeItem.codeThemeId, themeItem.variant)
                                : null;
                            return (
                              <CommandItem
                                key={themeItem.id}
                                value={themeItem.id}
                                className="cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                }}
                                onClick={() => {
                                  if (!themeItem.codeThemeId || !themeItem.variant) return;
                                  props.onOpenChange(false);
                                  setCodeThemeId(themeItem.variant, themeItem.codeThemeId);
                                }}
                              >
                                {seed ? (
                                  <CodeThemeBadge
                                    accent={seed.accent}
                                    background={seed.surface}
                                    foreground={seed.ink}
                                  />
                                ) : null}
                                <PaletteText className="min-w-0 flex-1 truncate text-ui text-foreground">
                                  {themeItem.label}
                                </PaletteText>
                                <PaletteText className="shrink-0 text-ui-meta text-muted-foreground/79">
                                  {resolvedTheme === "dark"
                                    ? "Dark color theme"
                                    : "Light color theme"}
                                </PaletteText>
                                <PaletteText
                                  className="flex size-3.5 shrink-0 items-center justify-center"
                                  aria-hidden={!themeItem.isActive}
                                >
                                  {themeItem.isActive ? (
                                    <PaletteGlyph
                                      kind="check"
                                      className="size-3.5 text-muted-foreground/79"
                                    />
                                  ) : null}
                                </PaletteText>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      ) : null}
                    </>
                  ) : null}

                  {!isBrowsing && isSearchPending ? (
                    <CommandEmpty className="py-10">
                      <PaletteView className="flex flex-col items-center justify-center gap-2 text-center text-ui text-muted-foreground/79">
                        <PaletteGlyph kind="search" className="size-4 opacity-70" />
                        <PaletteText>Searching…</PaletteText>
                      </PaletteView>
                    </CommandEmpty>
                  ) : null}

                  {!isBrowsing && !isSearchPending && searchStatus === "loading" ? (
                    <CommandEmpty className="py-10">
                      <PaletteText className="text-center text-ui text-muted-foreground/79">
                        Loading search sources…
                      </PaletteText>
                    </CommandEmpty>
                  ) : null}

                  {!isBrowsing && !isSearchPending && searchStatus === "error" ? (
                    <CommandEmpty className="py-10">
                      <PaletteView className="flex flex-col items-center justify-center gap-2 text-center text-ui text-muted-foreground/79">
                        <PaletteText>Search sources are unavailable.</PaletteText>
                        {props.searchErrorMessage ? (
                          <PaletteText className="text-ui-meta">
                            {props.searchErrorMessage}
                          </PaletteText>
                        ) : null}
                        {props.onRetrySearch ? (
                          <Button size="xs" variant="outline" onClick={props.onRetrySearch}>
                            Retry
                          </Button>
                        ) : null}
                      </PaletteView>
                    </CommandEmpty>
                  ) : null}

                  {!isBrowsing && !isSearchPending && !searchUnavailable && !hasSearchResults ? (
                    <CommandEmpty className="py-10">
                      <PaletteView className="flex flex-col items-center justify-center gap-2 text-center text-ui text-muted-foreground/79">
                        <PaletteGlyph kind="search" className="size-4 opacity-70" />
                        <PaletteText>No matches.</PaletteText>
                      </PaletteView>
                    </CommandEmpty>
                  ) : null}
                </CommandList>
                <PaletteView className="h-1.5" />
              </CommandPanel>
              <CommandFooter>
                {isBrowsing ? (
                  <>
                    <PaletteText>
                      {isAddingProject
                        ? "Adding project..."
                        : "Type a path, ↑↓ to navigate folders."}
                    </PaletteText>
                    <PaletteText>
                      {hasHighlightedFolderItem
                        ? `Enter to open · ${submitModifierLabel}+Enter to add`
                        : hasHighlightedBrowseItem
                          ? "Enter to go up"
                          : "Enter to add project"}
                    </PaletteText>
                  </>
                ) : (
                  <>
                    <PaletteText>
                      {props.appearanceEnabled === false
                        ? "Jump to threads, projects, or actions."
                        : "Jump to threads, projects, actions, or appearance."}
                    </PaletteText>
                    <PaletteText>Enter to open</PaletteText>
                  </>
                )}
              </CommandFooter>
            </Command>
          </>
        )}
      </CommandDialogPopup>
    </CommandDialog>
  );
}
