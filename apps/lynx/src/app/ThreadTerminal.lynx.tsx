import { useEffect, useMemo, useRef, useState, type ReactNode } from "@lynx-js/react";
import { getRectById, getRectByRef, type InputRef } from "@lynx-js/lynx-ui";
import type { NodesRef, SelectionChangeEvent } from "@lynx-js/types";
import type { TerminalEvent, TerminalSessionSnapshot } from "@synara/contracts";
import { TERMINAL_BOLD_FONT_WEIGHT } from "@synara/shared/terminalThreads";
import {
  createTerminalTextProjector,
  decorateTerminalTextLine,
  findTerminalTextMatches,
  flattenTerminalTextLines,
  normalizeTerminalClipboardText,
  nextTerminalTextMatchIndex,
} from "@synara/shared/terminalTextProjection";
import type {
  TerminalCursorSnapshot,
  TerminalTextColor,
  TerminalTextLine,
  TerminalTextRun,
} from "@synara/shared/terminalTextProjection";
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsBehaviorProjection,
} from "@synara-web/appSettingsStorageProjection.logic";
import { confirmTerminalTabClose } from "@synara-web/lib/terminalCloseConfirmation";
import {
  normalizeTerminalContextText,
  type TerminalContextSelection,
} from "@synara-web/lib/terminalContext";
import { buildTerminalSelectionContextMenuItems } from "@synara/shared/contextMenu";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input.lynx";
import { ChevronDownIcon, XIcon } from "../lib/icons.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { dialogs } from "../platform/dialogs";
import { clipboard } from "../platform/clipboard";
import { webStorage } from "../platform/storage";
import { platformTerminal } from "../platform/terminal";
import { bridgeCall, onGlobalEvent } from "../platform/bridge";
import {
  confirmTerminalInputFocus,
  releaseTerminalInputFocus,
  requestTerminalInputFocus,
} from "../platform/inputFocusOwnership.lynx";
import { showContextMenu } from "../platform/contextMenu";
import { scrollLynxElementIntoViewById } from "../components/ui/scrollIntoView.lynx";
import { resolveLynxTerminalTypography } from "./terminalAppearance.logic";
import { closeLynxTerminalSession } from "./terminalSessionCleanup.logic";
import { resolveTerminalPinnedFromScroll } from "./terminalScrollFollow.logic";
import { terminalCommittedInputDelta } from "./terminalInput.logic";
import { resolveLynxTerminalCursorGeometry } from "./terminalCursor.logic";
import {
  resolveTerminalSelectionLineRange,
  TERMINAL_SELECTION_SETTLE_DELAY_MS,
} from "./terminalSelection.logic";
import { resolveLynxTerminalGridSize, type LynxTerminalGridSize } from "./terminalGridSize.logic";
import { applyTerminalEventToSnapshot, utf8ByteLength } from "./terminalEventProjection.logic";
import "./thread-terminal.css";

const DEFAULT_TERMINAL_ID = "lynx-drawer";
const SEARCH_DEBOUNCE_MS = 90;
const RESIZE_DEBOUNCE_MS = 120;
const INITIAL_MEASURE_DELAYS_MS = [0, 80, 240] as const;
const DEFAULT_TERMINAL_GRID = { cols: 100, rows: 24 } as const;
const TERMINAL_BOTTOM_EPSILON = 30;
const NATIVE_SCROLL_EVENT_SOURCE = 2;
const INITIAL_TERMINAL_CURSOR: TerminalCursorSnapshot = {
  blink: true,
  cellWidth: 1,
  column: 0,
  row: 0,
  style: "bar",
  text: " ",
  visible: true,
};

function terminalLineId(threadId: string, terminalId: string, lineIndex: number): string {
  return (
    "terminal-line-" +
    (threadId + "-" + terminalId).replace(/[^a-zA-Z0-9_-]/g, "-") +
    "-" +
    String(lineIndex)
  );
}

function terminalViewportId(threadId: string, terminalId: string): string {
  return "terminal-viewport-" + (threadId + "-" + terminalId).replace(/[^a-zA-Z0-9_-]/g, "-");
}

function terminalBottomId(threadId: string, terminalId: string): string {
  return "terminal-bottom-" + (threadId + "-" + terminalId).replace(/[^a-zA-Z0-9_-]/g, "-");
}

function terminalColorClass(prefix: "fg" | "bg", color: TerminalTextColor | undefined): string {
  return color && !color.startsWith("#") ? " ThreadTerminalRun--" + prefix + "-" + color : "";
}

function terminalRunClassName(run: TerminalTextRun): string {
  const foreground = run.style.inverse
    ? (run.style.background ?? "terminal-background")
    : run.style.foreground;
  const background = run.style.inverse
    ? (run.style.foreground ?? "terminal-foreground")
    : run.style.background;
  return (
    "ThreadTerminalRun" +
    terminalColorClass("fg", foreground) +
    terminalColorClass("bg", background)
  );
}

function terminalRunStyle(run: TerminalTextRun) {
  const foreground = run.style.inverse ? run.style.background : run.style.foreground;
  const background = run.style.inverse ? run.style.foreground : run.style.background;
  return {
    ...(foreground?.startsWith("#") ? { color: foreground } : {}),
    ...(background?.startsWith("#") ? { backgroundColor: background } : {}),
    ...(run.style.bold ? { fontWeight: String(TERMINAL_BOLD_FONT_WEIGHT) } : {}),
    ...(run.style.dim ? { opacity: 0.6 } : {}),
    ...(run.style.italic ? { fontStyle: "italic" } : {}),
    ...(run.style.underline || run.style.strikethrough
      ? {
          textDecoration: [
            run.style.underline ? "underline" : "",
            run.style.strikethrough ? "line-through" : "",
          ]
            .filter(Boolean)
            .join(" "),
        }
      : {}),
  };
}

function terminalSearchRunStyle(run: TerminalTextRun, match: boolean, activeMatch: boolean) {
  return {
    ...terminalRunStyle(run),
    ...(match ? { backgroundColor: "#515c6a" } : {}),
    ...(activeMatch ? { borderColor: "#ffd33d", borderWidth: "1px", borderRadius: "2px" } : {}),
  };
}

function TerminalSearchButton(props: {
  readonly active?: boolean;
  readonly children: ReactNode;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName:
      "ThreadTerminalSearchButton" + (props.active ? " ThreadTerminalSearchButton--active" : ""),
    accessibleLabel: props.label,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      {props.children}
    </view>
  );
}

export function ThreadTerminalSearchBar(props: {
  readonly activeCaseSensitive: boolean;
  readonly hasResults: boolean | null;
  readonly inputRef?: { readonly current: InputRef | null };
  readonly query: string;
  readonly onClose: () => void;
  readonly onNext: () => void;
  readonly onPrevious: () => void;
  readonly onQueryChange: (value: string) => void;
  readonly onToggleCase: () => void;
}) {
  const { semanticIconColor } = useTheme();
  return (
    <view className="ThreadTerminalSearch">
      <Input
        ref={props.inputRef}
        nativeInput
        unstyled
        className="ThreadTerminalSearchInput"
        accessibility-label="Find"
        placeholder="Find"
        defaultValue={props.query}
        onInput={props.onQueryChange}
        onKeyDown={(event) => {
          if (event.key === "Escape") props.onClose();
          else if (event.key === "Enter") {
            if (event.shiftKey) props.onPrevious();
            else props.onNext();
          }
        }}
      />
      {props.query && props.hasResults === false ? (
        <text className="ThreadTerminalSearchEmpty">No results</text>
      ) : null}
      <TerminalSearchButton
        active={props.activeCaseSensitive}
        label="Match case"
        onActivate={props.onToggleCase}
      >
        <text className="ThreadTerminalSearchButtonText">Aa</text>
      </TerminalSearchButton>
      <TerminalSearchButton label="Previous match (Shift+Enter)" onActivate={props.onPrevious}>
        <ChevronDownIcon
          className="ThreadTerminalSearchButtonIcon ThreadTerminalSearchButtonIcon--previous"
          color={semanticIconColor("secondary")}
          size={14}
        />
      </TerminalSearchButton>
      <TerminalSearchButton label="Next match (Enter)" onActivate={props.onNext}>
        <ChevronDownIcon
          className="ThreadTerminalSearchButtonIcon"
          color={semanticIconColor("secondary")}
          size={14}
        />
      </TerminalSearchButton>
      <TerminalSearchButton label="Close search (Esc)" onActivate={props.onClose}>
        <XIcon
          className="ThreadTerminalSearchButtonIcon"
          color={semanticIconColor("secondary")}
          size={14}
        />
      </TerminalSearchButton>
    </view>
  );
}

export function ThreadTerminal({
  active = true,
  autoOpen = false,
  fontFamily,
  fontSizePx,
  open,
  presentationMode = "drawer",
  closeRequestVersion = 0,
  terminalId = DEFAULT_TERMINAL_ID,
  terminalLabel = "Terminal",
  threadId,
  workspaceRoot,
  onOpenChange,
  onCloseSettled,
  onTerminalEvent,
  onAddTerminalContext,
  showHeader = true,
}: {
  readonly active?: boolean;
  readonly autoOpen?: boolean;
  readonly fontFamily: string;
  readonly fontSizePx: number;
  readonly open: boolean;
  readonly presentationMode?: "drawer" | "workspace";
  readonly closeRequestVersion?: number;
  readonly terminalId?: string;
  readonly terminalLabel?: string;
  readonly threadId: string;
  readonly workspaceRoot: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCloseSettled?: (closed: boolean) => void;
  readonly onTerminalEvent?: (event: TerminalEvent) => void;
  readonly onAddTerminalContext?: (selection: TerminalContextSelection) => void;
  readonly showHeader?: boolean;
}) {
  const { svgColors } = useTheme();
  const [pending, setPending] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [snapshot, setSnapshot] = useState<TerminalSessionSnapshot | null>(null);
  const [projectedLines, setProjectedLines] = useState<readonly TerminalTextLine[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [pinned, setPinned] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const [projectedCursor, setProjectedCursor] =
    useState<TerminalCursorSnapshot>(INITIAL_TERMINAL_CURSOR);
  const commandInputRef = useRef<InputRef>(null);
  const searchInputRef = useRef<InputRef>(null);
  const outputTextRef = useRef<NodesRef>(null);
  const selectionActionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionRequestIdRef = useRef(0);
  const selectionMenuOpenRef = useRef(false);
  const selectedTerminalTextRef = useRef("");
  const selectionOwner = threadId + "\u0000" + terminalId;
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchNavigationDisposeRef = useRef<(() => void) | null>(null);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;
  const autoOpenAttemptKeyRef = useRef<string | null>(null);
  const handledCloseRequestVersionRef = useRef(closeRequestVersion);
  const terminalGridRef = useRef<LynxTerminalGridSize>(DEFAULT_TERMINAL_GRID);
  const backendGridRef = useRef<LynxTerminalGridSize | null>(null);
  const terminalViewportRef = useRef<{
    readonly height: number;
    readonly width: number;
  } | null>(null);
  const terminalReplayRef = useRef("");
  const pinnedRef = useRef(true);
  const terminalInputValueRef = useRef("");
  const terminalWriteQueueRef = useRef<Promise<void>>(Promise.resolve());
  const terminalInputGenerationRef = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;
  const textProjectorRef = useRef(createTerminalTextProjector(DEFAULT_TERMINAL_GRID));
  const typography = resolveLynxTerminalTypography({
    fontFamily,
    fontSizePx,
  });
  const cursorGeometry = resolveLynxTerminalCursorGeometry({
    active: active && inputFocused,
    cursor: projectedCursor,
    fontSizePx,
  });
  const searchMatches = findTerminalTextMatches(projectedLines, searchQuery, caseSensitive);
  const projectedRuns = useMemo(() => flattenTerminalTextLines(projectedLines), [projectedLines]);
  const projectedText = useMemo(
    () => projectedRuns.map((run) => run.text).join(""),
    [projectedRuns],
  );
  const clearTerminalSelectionOwner = () => {
    "background only";
    selectionRequestIdRef.current += 1;
    if (selectionActionTimerRef.current !== null) {
      clearTimeout(selectionActionTimerRef.current);
      selectionActionTimerRef.current = null;
    }
    selectedTerminalTextRef.current = "";
    void bridgeCall("shellSetTerminalSelectionEnabled", {
      enabled: false,
      owner: selectionOwner,
    }).catch(() => undefined);
  };

  function handleTerminalSelectionChange(event: SelectionChangeEvent) {
    "background only";
    selectionRequestIdRef.current += 1;
    const requestId = selectionRequestIdRef.current;
    if (selectionActionTimerRef.current !== null) {
      clearTimeout(selectionActionTimerRef.current);
      selectionActionTimerRef.current = null;
    }
    const start = event.detail.start;
    const end = event.detail.end;
    if (start < 0 || end <= start || !outputTextRef.current) {
      if (selectionMenuOpenRef.current) return;
      setTimeout(() => {
        outputTextRef.current
          ?.invoke({
            method: "getSelectedText",
            success: (result) => {
              if (requestId !== selectionRequestIdRef.current) return;
              const text = normalizeTerminalContextText(result.selectedText);
              if (text.length === 0 && selectedTerminalTextRef.current) {
                void bridgeCall("shellSetTerminalSelectionEnabled", {
                  enabled: true,
                  owner: selectionOwner,
                  text: normalizeTerminalClipboardText(selectedTerminalTextRef.current),
                }).catch(() => undefined);
                return;
              }
              selectedTerminalTextRef.current = text;
              void bridgeCall("shellSetTerminalSelectionEnabled", {
                enabled: text.length > 0,
                owner: selectionOwner,
                text: normalizeTerminalClipboardText(text),
              }).catch(() => undefined);
            },
            fail: clearTerminalSelectionOwner,
          })
          .exec();
      }, TERMINAL_SELECTION_SETTLE_DELAY_MS);
      return;
    }
    selectionActionTimerRef.current = setTimeout(() => {
      selectionActionTimerRef.current = null;
      const selectedText = new Promise<string>((resolve) => {
        outputTextRef.current
          ?.invoke({
            method: "getSelectedText",
            success: (result) => resolve(result.selectedText),
            fail: () => resolve(""),
          })
          .exec();
      });
      const selectionRect = new Promise<{
        readonly left: number;
        readonly top: number;
        readonly width: number;
        readonly height: number;
      } | null>((resolve) => {
        outputTextRef.current
          ?.invoke({
            method: "getTextBoundingRect",
            params: { start, end },
            success: (result) => resolve(result.boundingRect),
            fail: () => resolve(null),
          })
          .exec();
      });
      void Promise.all([selectedText, selectionRect, getRectByRef(outputTextRef, true)])
        .then(async ([text, localRect, elementRect]) => {
          const normalizedText = normalizeTerminalContextText(text);
          if (
            requestId !== selectionRequestIdRef.current ||
            normalizedText.length === 0 ||
            !localRect
          ) {
            clearTerminalSelectionOwner();
            return;
          }
          selectedTerminalTextRef.current = normalizedText;
          void bridgeCall("shellSetTerminalSelectionEnabled", {
            enabled: true,
            owner: selectionOwner,
            text: normalizeTerminalClipboardText(normalizedText),
          }).catch(() => undefined);
          if (!onAddTerminalContext) return;
          const range = resolveTerminalSelectionLineRange({
            text: projectedText,
            start,
            end,
          });
          selectionMenuOpenRef.current = true;
          const action = await showContextMenu(
            buildTerminalSelectionContextMenuItems(),
            {
              x: elementRect.left + localRect.left + localRect.width,
              y: elementRect.top + localRect.top + localRect.height,
            },
            {
              restoreFocus: () => {
                selectionMenuOpenRef.current = false;
                if (selectedTerminalTextRef.current) {
                  void bridgeCall("shellSetTerminalSelectionEnabled", {
                    enabled: true,
                    owner: selectionOwner,
                    text: normalizeTerminalClipboardText(selectedTerminalTextRef.current),
                  }).catch(() => undefined);
                }
                terminalInputValueRef.current = "";
                void commandInputRef.current?.setValue("").then(
                  () => restoreTerminalInputFocusAfterSelectionMenu(),
                  () => restoreTerminalInputFocusAfterSelectionMenu(),
                );
              },
            },
          );
          if (requestId !== selectionRequestIdRef.current || action !== "add-to-chat") {
            return;
          }
          onAddTerminalContext({
            terminalId,
            terminalLabel,
            ...range,
            text: normalizedText,
          });
          clearTerminalSelectionOwner();
        })
        .catch(() => {});
    }, TERMINAL_SELECTION_SETTLE_DELAY_MS);
  }
  const resolvedActiveMatchIndex =
    searchMatches.length === 0
      ? -1
      : Math.min(Math.max(activeMatchIndex, 0), searchMatches.length - 1);

  useEffect(() => {
    return () => {
      selectionRequestIdRef.current += 1;
      if (selectionActionTimerRef.current !== null) {
        clearTimeout(selectionActionTimerRef.current);
      }
      clearTerminalSelectionOwner();
    };
  }, [selectionOwner]);

  useEffect(() => {
    "background only";
    if (!active || !open) return;
    return onGlobalEvent("terminal:copy-selection", () => {
      const text = selectedTerminalTextRef.current;
      const clipboardText = normalizeTerminalClipboardText(text);
      if (clipboardText) {
        void clipboard.writeText(clipboardText).catch(() => undefined);
      }
    });
  }, [active, open]);

  const scrollToTerminalBottom = () => {
    "background only";
    scrollLynxElementIntoViewById(terminalBottomId(threadId, terminalId), "end");
  };

  const schedulePinnedScroll = () => {
    if (!activeRef.current || !pinnedRef.current) return;
    setTimeout(scrollToTerminalBottom, 0);
  };

  const jumpInteraction = useLynxInteractiveState({
    baseClassName: "ThreadTerminalJump",
    accessibleLabel: "Scroll to bottom",
    onActivate: () => {
      pinnedRef.current = true;
      setPinned(true);
      scrollToTerminalBottom();
    },
  });

  useEffect(() => {
    if (active && pinnedRef.current) schedulePinnedScroll();
  }, [active]);

  const selectSearchMatch = (direction: "next" | "previous") => {
    const nextIndex = nextTerminalTextMatchIndex(
      searchMatches.length,
      resolvedActiveMatchIndex,
      direction,
    );
    setActiveMatchIndex(nextIndex);
    const match = searchMatches[nextIndex];
    if (match) {
      scrollLynxElementIntoViewById(
        terminalLineId(threadId, terminalId, match.lineIndex),
        "nearest",
      );
    }
  };

  const closeSearch = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = null;
    setSearchOpen(false);
    setSearchQuery("");
    setActiveMatchIndex(-1);
  };

  const updateSearchQuery = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      searchTimerRef.current = null;
      setSearchQuery(value);
      const matches = findTerminalTextMatches(projectedLines, value, caseSensitive);
      setActiveMatchIndex(matches.length > 0 ? 0 : -1);
      const match = matches[0];
      if (match) {
        scrollLynxElementIntoViewById(
          terminalLineId(threadId, terminalId, match.lineIndex),
          "nearest",
        );
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  useEffect(() => {
    "background only";
    if (!active) return;
    void bridgeCall("shellSetTerminalSearchEnabled", { enabled: true }).catch(() => undefined);
    const dispose = onGlobalEvent("terminal:search", () => {
      setSearchOpen(true);
      setTimeout(() => {
        void searchInputRef.current?.focus().catch(() => undefined);
        void searchInputRef.current
          ?.setSelectionRange(0, searchQueryRef.current.length)
          .catch(() => undefined);
      }, 0);
    });
    return () => {
      dispose();
      void bridgeCall("shellSetTerminalSearchEnabled", { enabled: false }).catch(() => undefined);
    };
  }, [active]);

  const handleSearchNavigationRef = useRef(
    (event: { readonly key?: unknown; readonly shiftKey?: unknown }) => {
      if (event.key === "Escape") closeSearch();
      else if (event.key === "Enter") {
        selectSearchMatch(event.shiftKey === true ? "previous" : "next");
      }
    },
  );
  handleSearchNavigationRef.current = (event) => {
    if (event.key === "Escape") closeSearch();
    else if (event.key === "Enter") {
      selectSearchMatch(event.shiftKey === true ? "previous" : "next");
    }
  };

  useEffect(() => {
    "background only";
    if (!active) return;
    void bridgeCall("shellSetTerminalSearchNavigationEnabled", {
      enabled: searchOpen,
    }).catch(() => undefined);
    if (searchOpen) {
      searchNavigationDisposeRef.current = onGlobalEvent(
        "terminal:search-key",
        (payload: unknown) => {
          if (!payload || typeof payload !== "object") return;
          handleSearchNavigationRef.current(payload);
        },
      );
    }
    return () => {
      searchNavigationDisposeRef.current?.();
      searchNavigationDisposeRef.current = null;
      void bridgeCall("shellSetTerminalSearchNavigationEnabled", {
        enabled: false,
      }).catch(() => undefined);
    };
  }, [active, searchOpen]);

  useEffect(
    () => () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    },
    [],
  );

  const resetProjection = (data: string, grid = terminalGridRef.current) => {
    terminalReplayRef.current = data;
    textProjectorRef.current = createTerminalTextProjector(grid);
    textProjectorRef.current.reset(data);
    setProjectedLines(textProjectorRef.current.toStyledLines());
    setProjectedCursor(textProjectorRef.current.toCursor());
  };

  const queueTerminalResize = (grid: LynxTerminalGridSize) => {
    const backendGrid = backendGridRef.current;
    if (backendGrid?.cols === grid.cols && backendGrid.rows === grid.rows) return;
    if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    resizeTimerRef.current = setTimeout(() => {
      resizeTimerRef.current = null;
      void platformTerminal
        .resize({ threadId, terminalId, ...grid })
        .then(() => {
          backendGridRef.current = grid;
        })
        .catch(() => undefined);
    }, RESIZE_DEBOUNCE_MS);
  };

  const applyTerminalGrid = (viewport: { readonly height: number; readonly width: number }) => {
    "background only";
    const grid = resolveLynxTerminalGridSize({
      fontSizePx,
      height: viewport.height,
      width: viewport.width,
    });
    if (!grid) return;
    const previous = terminalGridRef.current;
    if (previous.cols === grid.cols && previous.rows === grid.rows) return;
    terminalGridRef.current = grid;
    if (previous.cols !== grid.cols || previous.rows !== grid.rows) {
      resetProjection(terminalReplayRef.current, grid);
    }
    if (backendGridRef.current === null) return;
    queueTerminalResize(grid);
  };

  const handleOutputLayout = (event: {
    readonly detail?: { readonly height?: number; readonly width?: number };
    readonly params?: { readonly height?: number; readonly width?: number };
  }) => {
    "background only";
    const detail = event.detail ?? event.params ?? {};
    if (typeof detail.height !== "number" || typeof detail.width !== "number") return;
    terminalViewportRef.current = { height: detail.height, width: detail.width };
    applyTerminalGrid(terminalViewportRef.current);
  };

  const measureTerminalViewport = () => {
    "background only";
    void getRectById(terminalViewportId(threadId, terminalId), true)
      .then((rect) => {
        terminalViewportRef.current = {
          height: rect.height,
          width: rect.width,
        };
        applyTerminalGrid(terminalViewportRef.current);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    "background only";
    if (!open) return;
    const timers = INITIAL_MEASURE_DELAYS_MS.map((delay) =>
      setTimeout(measureTerminalViewport, delay),
    );
    const dispose = onGlobalEvent("viewport:resize", measureTerminalViewport);
    return () => {
      for (const timer of timers) clearTimeout(timer);
      dispose();
    };
  }, [open]);

  useEffect(() => {
    const viewport = terminalViewportRef.current;
    if (viewport) applyTerminalGrid(viewport);
  }, [fontSizePx]);

  const refresh = async () => {
    "background only";
    const openGrid = terminalGridRef.current;
    const next = await platformTerminal.open({
      threadId,
      terminalId,
      cwd: workspaceRoot,
      cols: openGrid.cols,
      rows: openGrid.rows,
      streamOutput: true,
    });
    resetProjection(`${next.replayPreamble}${next.history}`);
    schedulePinnedScroll();
    setSnapshot(next);
    backendGridRef.current = openGrid;
    queueTerminalResize(terminalGridRef.current);
    setError(null);
    return next;
  };

  useEffect(() => {
    if (!open || !autoOpen || snapshot || pending) return;
    const attemptKey = `${threadId}\0${terminalId}\0${workspaceRoot}`;
    if (autoOpenAttemptKeyRef.current === attemptKey) return;
    autoOpenAttemptKeyRef.current = attemptKey;
    setPending(true);
    void refresh()
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => setPending(false));
  }, [autoOpen, open, pending, snapshot, terminalId, threadId, workspaceRoot]);

  useEffect(() => {
    "background only";
    let disposeTerminalStream: (() => void) | null = null;
    const acceptEvent = (event: TerminalEvent) => {
      if (event.threadId !== threadId || event.terminalId !== terminalId) return;
      onTerminalEvent?.(event);
      if (event.type === "error") setError(event.message);
      if (event.type === "started" || event.type === "restarted") setError(null);
      if (event.type === "started" || event.type === "restarted") {
        resetProjection(`${event.snapshot.replayPreamble}${event.snapshot.history}`);
        schedulePinnedScroll();
      } else if (event.type === "output") {
        terminalReplayRef.current += event.data;
        textProjectorRef.current.write(event.data);
        setProjectedLines(textProjectorRef.current.toStyledLines());
        setProjectedCursor(textProjectorRef.current.toCursor());
        schedulePinnedScroll();
      } else if (event.type === "cleared") {
        terminalReplayRef.current = "";
        textProjectorRef.current.clear();
        setProjectedLines([]);
        setProjectedCursor(textProjectorRef.current.toCursor());
        schedulePinnedScroll();
      }
      if (event.type === "output") {
        const bytes = event.byteLength ?? utf8ByteLength(event.data);
        if (bytes > 0) {
          void platformTerminal.ackOutput({ threadId, terminalId, bytes });
        }
      }
      setSnapshot((current) => {
        const next = applyTerminalEventToSnapshot({
          event,
          snapshot: current,
          terminalId,
          threadId,
        });
        return next;
      });
    };
    const disposeGlobalEvent = onGlobalEvent("synara:terminal-event", (event: unknown) => {
      if (!event || typeof event !== "object" || !("type" in event)) return;
      acceptEvent(event as TerminalEvent);
    });
    void import(/* webpackMode: "eager" */ "../data/synaraClient.lynx").then(
      ({ subscribeTerminalEvents }) => {
        disposeTerminalStream = subscribeTerminalEvents(() => {});
      },
    );
    return () => {
      disposeGlobalEvent();
      disposeTerminalStream?.();
    };
  }, [terminalId, threadId]);

  const enqueueTerminalInput = (data: string) => {
    "background only";
    if (!active || !open || !data) return;
    const generation = terminalInputGenerationRef.current;
    const ownerThreadId = threadId;
    const ownerTerminalId = terminalId;
    terminalWriteQueueRef.current = terminalWriteQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        if (terminalInputGenerationRef.current !== generation) return;
        if (backendGridRef.current === null) await refresh();
        if (terminalInputGenerationRef.current !== generation) return;
        await platformTerminal.write({
          threadId: ownerThreadId,
          terminalId: ownerTerminalId,
          data,
        });
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : String(cause));
      });
  };

  const handleTerminalInput = (value: string, isComposing: boolean) => {
    "background only";
    if (!active || isComposing) return;
    const data = terminalCommittedInputDelta(terminalInputValueRef.current, value);
    terminalInputValueRef.current = value;
    enqueueTerminalInput(data);
  };

  const submitTerminalInput = () => {
    "background only";
    if (!active) return;
    terminalInputValueRef.current = "";
    enqueueTerminalInput("\r");
    void commandInputRef.current?.setValue("").catch(() => undefined);
  };

  const focusTerminalInput = () => {
    "background only";
    if (!active || searchOpen) return;
    clearTerminalSelectionOwner();
    requestTerminalInputFocus(selectionOwner);
    void commandInputRef.current?.focus().catch(() => {
      releaseTerminalInputFocus(selectionOwner);
      setInputFocused(false);
    });
  };

  const restoreTerminalInputFocusAfterSelectionMenu = () => {
    "background only";
    if (!active || searchOpen) return;
    requestTerminalInputFocus(selectionOwner);
    void commandInputRef.current?.focus().catch(() => {
      releaseTerminalInputFocus(selectionOwner);
      setInputFocused(false);
    });
  };

  useEffect(() => {
    "background only";
    if (!active || !open || !inputFocused) return;
    const owner = threadId + "\u0000" + terminalId;
    void bridgeCall("shellSetTerminalInputEnabled", {
      enabled: true,
      owner,
    }).catch(() => undefined);
    const dispose = onGlobalEvent("terminal:input-key", (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("data" in payload)) return;
      const data = (payload as { readonly data?: unknown }).data;
      if (typeof data === "string") enqueueTerminalInput(data);
    });
    return () => {
      dispose();
      void bridgeCall("shellSetTerminalInputEnabled", {
        enabled: false,
        owner,
      }).catch(() => undefined);
    };
  }, [active, inputFocused, open, terminalId, threadId]);

  const close = async () => {
    "background only";
    if (pending || confirmingClose) return;
    const confirmationEnabled = readSettingsBehaviorProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
    ).confirmTerminalTabClose;
    if (snapshot?.status === "running") {
      setConfirmingClose(true);
      try {
        if (
          !(await confirmTerminalTabClose({
            dialogs,
            enabled: confirmationEnabled,
            terminalTitle: "Terminal",
          }))
        ) {
          onCloseSettled?.(false);
          return;
        }
      } finally {
        setConfirmingClose(false);
      }
    }
    setPending(true);
    onOpenChange(false);
    terminalInputGenerationRef.current += 1;
    try {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = null;
      await closeLynxTerminalSession({
        threadId,
        terminalId,
        close: platformTerminal.close,
        writeExit: platformTerminal.write,
      });
    } finally {
      autoOpenAttemptKeyRef.current = null;
      backendGridRef.current = null;
      setSnapshot(null);
      terminalReplayRef.current = "";
      textProjectorRef.current.clear();
      setProjectedLines([]);
      setProjectedCursor(INITIAL_TERMINAL_CURSOR);
      setInputFocused(false);
      terminalInputValueRef.current = "";
      await commandInputRef.current?.setValue("");
      setError(null);
      setPending(false);
      onCloseSettled?.(true);
    }
  };

  useEffect(() => {
    if (handledCloseRequestVersionRef.current === closeRequestVersion) return;
    if (pending || confirmingClose) return;
    handledCloseRequestVersionRef.current = closeRequestVersion;
    void close();
  }, [closeRequestVersion, confirmingClose, pending]);

  if (!open) return null;

  return (
    <view className={`ThreadTerminal ThreadTerminal--${presentationMode}`}>
      {showHeader ? (
        <view className="ThreadTerminalHeader">
          <text className="ThreadTerminalTitle">Terminal</text>
          <text className="ThreadTerminalStatus">{snapshot?.status ?? "ready"}</text>
          <view className="ThreadTerminalSpacer" />
          <Button
            variant="ghost"
            size="xs"
            disabled={pending}
            onClick={() =>
              void refresh().catch((cause) => {
                setError(cause instanceof Error ? cause.message : String(cause));
              })
            }
          >
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="xs"
            disabled={pending || confirmingClose}
            onClick={() => void close()}
          >
            Close
          </Button>
        </view>
      ) : null}
      <view
        id={terminalViewportId(threadId, terminalId)}
        flatten={false}
        className="ThreadTerminalOutputViewport"
        bindlayoutchange={handleOutputLayout}
      >
        <scroll-view
          className="ThreadTerminalOutputScroller"
          scroll-orientation="vertical"
          scroll-y={true}
          scroll-event-throttle={24}
          lower-threshold={TERMINAL_BOTTOM_EPSILON}
          bindscroll={(event: {
            readonly detail?: {
              readonly deltaY?: number;
              readonly eventSource?: number;
              readonly isDragging?: boolean;
              readonly scrollHeight?: number;
              readonly scrollTop?: number;
            };
          }) => {
            "background only";
            const nextPinned = resolveTerminalPinnedFromScroll({
              bottomEpsilon: TERMINAL_BOTTOM_EPSILON,
              currentPinned: pinnedRef.current,
              detail: event.detail,
              nativeUserEventSource: NATIVE_SCROLL_EVENT_SOURCE,
              viewportHeight: terminalViewportRef.current?.height ?? null,
            });
            if (nextPinned !== pinnedRef.current) {
              pinnedRef.current = nextPinned;
              setPinned(nextPinned);
            }
          }}
          bindscrolltolower={() => {
            "background only";
            if (!pinnedRef.current) {
              pinnedRef.current = true;
              setPinned(true);
            }
          }}
        >
          <view
            className="ThreadTerminalScreen"
            bindmousedown={focusTerminalInput}
            bindtap={focusTerminalInput}
            style={{ minHeight: cursorGeometry.screenMinHeight }}
          >
            {searchOpen && projectedLines.length > 0 ? (
              <text
                ref={outputTextRef}
                className="ThreadTerminalOutput"
                style={typography}
                text-selection={true}
                custom-context-menu={onAddTerminalContext !== undefined}
                flatten={false}
                bindselectionchange={handleTerminalSelectionChange}
              >
                {projectedLines.map((line, lineIndex) => (
                  <text
                    id={terminalLineId(threadId, terminalId, line.index)}
                    key={String(line.index)}
                    className="ThreadTerminalOutputLine"
                    style={typography}
                  >
                    {line.runs.length > 0
                      ? decorateTerminalTextLine(line, searchMatches, resolvedActiveMatchIndex).map(
                          (run, index) => (
                            <text
                              key={String(index)}
                              className={terminalRunClassName(run)}
                              style={terminalSearchRunStyle(run, run.match, run.activeMatch)}
                            >
                              {run.text}
                            </text>
                          ),
                        )
                      : " "}
                    {lineIndex < projectedLines.length - 1 ? "\n" : ""}
                  </text>
                ))}
              </text>
            ) : projectedRuns.length > 0 ? (
              <text
                ref={outputTextRef}
                className="ThreadTerminalOutput"
                style={typography}
                text-selection={true}
                custom-context-menu={onAddTerminalContext !== undefined}
                flatten={false}
                bindselectionchange={handleTerminalSelectionChange}
              >
                {projectedRuns.map((run, index) => (
                  <text
                    key={String(index)}
                    className={terminalRunClassName(run)}
                    style={terminalRunStyle(run)}
                  >
                    {run.text}
                  </text>
                ))}
              </text>
            ) : (
              <text className="ThreadTerminalOutput" style={typography}>
                {" "}
              </text>
            )}
            {snapshot && projectedCursor.visible ? (
              <view
                accessibility-element={false}
                className={
                  "ThreadTerminalCursor" +
                  (cursorGeometry.blink ? " ThreadTerminalCursor--blink" : "")
                }
                style={cursorGeometry.cursorStyle}
              >
                {cursorGeometry.renderText ? (
                  <text className="ThreadTerminalCursorText" style={typography}>
                    {projectedCursor.text}
                  </text>
                ) : null}
              </view>
            ) : null}
            <view className="ThreadTerminalInputProxyAnchor" style={cursorGeometry.inputProxyStyle}>
              <Input
                ref={commandInputRef}
                nativeInput
                unstyled
                className="ThreadTerminalInputProxy"
                accessibility-label="Terminal input"
                disabled={!active || pending}
                maxLength={4096}
                showSoftInputOnFocus={false}
                onFocus={() => {
                  if (confirmTerminalInputFocus(selectionOwner)) {
                    setInputFocused(true);
                  } else {
                    setInputFocused(false);
                    void commandInputRef.current?.blur().catch(() => undefined);
                  }
                }}
                onBlur={() => {
                  setInputFocused(false);
                  releaseTerminalInputFocus(selectionOwner);
                }}
                onInput={(value, _selectionStart, _selectionEnd, isComposing) =>
                  handleTerminalInput(value, isComposing)
                }
                onConfirm={submitTerminalInput}
              />
            </view>
            <view id={terminalBottomId(threadId, terminalId)} />
          </view>
        </scroll-view>
      </view>
      {!pinned ? (
        <view className={jumpInteraction.className} {...jumpInteraction.eventProps}>
          <ArrowDownIcon className="ThreadTerminalJumpIcon" color={svgColors.mutedForeground} />
        </view>
      ) : null}
      {searchOpen ? (
        <ThreadTerminalSearchBar
          inputRef={searchInputRef}
          query={searchQuery}
          hasResults={searchQuery ? searchMatches.length > 0 : null}
          activeCaseSensitive={caseSensitive}
          onQueryChange={updateSearchQuery}
          onClose={closeSearch}
          onPrevious={() => selectSearchMatch("previous")}
          onNext={() => selectSearchMatch("next")}
          onToggleCase={() => {
            const nextCaseSensitive = !caseSensitive;
            const matches = findTerminalTextMatches(projectedLines, searchQuery, nextCaseSensitive);
            setCaseSensitive(nextCaseSensitive);
            setActiveMatchIndex(matches.length > 0 ? 0 : -1);
            const match = matches[0];
            if (match) {
              scrollLynxElementIntoViewById(
                terminalLineId(threadId, terminalId, match.lineIndex),
                "nearest",
              );
            }
          }}
        />
      ) : null}
      {error ? <text className="ThreadTerminalError">{error}</text> : null}
    </view>
  );
}
