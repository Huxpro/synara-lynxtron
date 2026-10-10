import type { RightDockPane, RightDockPaneKind } from "@synara/shared/rightDock";
import { useContext, useEffect } from "@lynx-js/react";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import expandSvg from "@synara-central-icons/expand-45.svg?raw";
import minimizeSvg from "@synara-central-icons/minimize-45.svg?raw";
import sidebarRightSvg from "@synara-central-icons/sidebar-simple-right-wide.svg?raw";
import { PlusIcon } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { Menu, MenuGroup, MenuItem, MenuPopup, MenuTrigger } from "../components/ui/menu.lynx";
import { toastManager } from "../components/ui/toast.lynx";
import { contentTabListStyle, EditorSurfaceTab } from "./EditorSurfaceTab.lynx";
import { FileEntryIcon } from "../components/FileEntryIcon.lynx";
import { RIGHT_DOCK_PANE_GLYPHS } from "./rightDockGlyphs.lynx";
import { RightDockMaximizeContext } from "./ThreadRightDockHost.lynx";

import "./thread-right-dock-tabs.css";

const DEFAULT_ADD_KINDS: readonly RightDockPaneKind[] = [
  "diff",
  "explorer",
  "terminal",
  "sidechat",
];

/** Electron's RIGHT_DOCK_PANE_META labels, used for tabs and the add menu. */
const PANE_KIND_LABELS: Partial<Record<RightDockPaneKind, string>> = {
  browser: "Browser",
  device: "iOS Simulator",
  diff: "Diff",
  explorer: "Explorer",
  git: "Git",
  sidechat: "Side chats",
  terminal: "Terminal",
};

function paneLabel(pane: RightDockPane): string {
  if (pane.kind === "file" && pane.filePath) {
    const segments = pane.filePath.replace(/\\/g, "/").split("/").filter(Boolean);
    return segments[segments.length - 1] ?? pane.filePath;
  }
  return PANE_KIND_LABELS[pane.kind] ?? pane.kind;
}

function PaneIcon(props: { readonly kind: RightDockPaneKind }) {
  const { semanticIconColor } = useTheme();
  const content = RIGHT_DOCK_PANE_GLYPHS[props.kind] ?? RIGHT_DOCK_PANE_GLYPHS.explorer!;
  return (
    <svg
      className="ThreadRightDockTabIcon"
      content={colorizeLynxSvg(content, semanticIconColor("secondary"))}
    />
  );
}

function RightDockPaneIcon(props: { readonly pane: RightDockPane }) {
  if (props.pane.kind === "file" && props.pane.filePath) {
    return <FileEntryIcon pathValue={props.pane.filePath} />;
  }
  return <PaneIcon kind={props.pane.kind} />;
}

/** Pane kinds the Native dock can show as a tab (the rest of the contract is not ported). */
const TAB_PANE_KINDS: ReadonlySet<RightDockPaneKind> = new Set([
  "browser",
  "diff",
  "explorer",
  "file",
  "git",
  "sidechat",
  "terminal",
]);

function HeaderButton(props: {
  readonly glyph: string;
  readonly label: string;
  readonly pressed?: boolean;
  readonly onActivate: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: "ThreadRightDockHeaderButton",
    accessibleLabel: props.label,
    accessibilityValue: props.pressed === undefined ? undefined : props.pressed ? "On" : "Off",
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <svg
        className="ThreadRightDockHeaderIcon"
        content={colorizeLynxSvg(props.glyph, semanticIconColor("secondary"))}
      />
    </view>
  );
}

export function ThreadRightDockTabs(props: {
  readonly activePaneId: string | null;
  /** Upstream's add menu: every kind the empty dock's launcher offers, in its order. */
  readonly addMenuKinds?: readonly RightDockPaneKind[];
  /**
   * The kinds this chat can open in the Native app. An add-menu entry outside it says so
   * instead of opening (as the launcher does). Omitted: every listed kind opens.
   */
  readonly openableKinds?: readonly RightDockPaneKind[];
  readonly defaultAddMenuOpen?: boolean;
  readonly paneLabelOverrides?: Readonly<Record<string, string | undefined>>;
  readonly panes: readonly RightDockPane[];
  readonly onAddPane: (kind: RightDockPaneKind) => void;
  readonly onClosePane: (paneId: string) => void;
  readonly onCollapse: () => void;
  readonly onSelectPane: (paneId: string) => void;
}) {
  const { semanticIconColor } = useTheme();
  const addKinds = props.addMenuKinds ?? DEFAULT_ADD_KINDS;
  const panes = props.panes.filter((pane) => TAB_PANE_KINDS.has(pane.kind));
  const maximize = useContext(RightDockMaximizeContext);
  const maximized = maximize?.maximized ?? false;
  const { onCollapse } = props;
  const setMaximized = maximize?.setMaximized;
  // Upstream: a maximized dock whose last pane closes restores and collapses.
  useEffect(() => {
    "background only";
    if (!maximized || panes.length > 0) return;
    setMaximized?.(false);
    onCollapse();
  }, [maximized, onCollapse, panes.length, setMaximized]);
  const addPane = (kind: RightDockPaneKind) => {
    "background only";
    if (props.openableKinds && !props.openableKinds.includes(kind)) {
      toastManager.add({
        type: "info",
        title: `${PANE_KIND_LABELS[kind] ?? kind} is not available here in the Native app yet`,
      });
      return;
    }
    props.onAddPane(kind);
  };
  return (
    <view className="ThreadRightDockTabHeader chat-surface-divider">
      {/* Upstream SurfaceContentTabs: `<nav aria-label="Open panels" class="flex min-w-0 flex-1">`. */}
      <view
        className="ThreadRightDockTabStrip"
        accessibility-element={true}
        accessibility-label="Open panels"
        accessibility-trait="none"
      >
        <scroll-view className="ThreadRightDockTabScroller" scroll-orientation="horizontal">
          <view className="ThreadRightDockTabList" style={contentTabListStyle(panes.length)}>
            {panes.map((pane) => (
              <EditorSurfaceTab
                key={pane.id}
                active={pane.id === props.activePaneId}
                closePlacement="trailing"
                closeLabel={`Close ${props.paneLabelOverrides?.[pane.id] ?? paneLabel(pane)}`}
                icon={<RightDockPaneIcon pane={pane} />}
                label={props.paneLabelOverrides?.[pane.id] ?? paneLabel(pane)}
                onClose={() => props.onClosePane(pane.id)}
                onSelect={() => props.onSelectPane(pane.id)}
              />
            ))}
          </view>
        </scroll-view>
      </view>
      {/* Electron offers "Add panel" only once a pane is open; the launcher covers the rest. */}
      {addKinds.length > 0 && panes.length > 0 ? (
        <Menu defaultOpen={props.defaultAddMenuOpen}>
          <MenuTrigger ariaLabel="Add panel" className="ThreadRightDockHeaderButton">
            <PlusIcon color={semanticIconColor("secondary")} size={16} />
          </MenuTrigger>
          <MenuPopup align="end" side="bottom" className="LxPickerMenuPopup ThreadRightDockAddMenu">
            <MenuGroup>
              {addKinds.map((kind) => (
                <MenuItem key={kind} onClick={() => addPane(kind)}>
                  <PaneIcon kind={kind} />
                  <text>{PANE_KIND_LABELS[kind] ?? kind}</text>
                </MenuItem>
              ))}
            </MenuGroup>
          </MenuPopup>
        </Menu>
      ) : null}
      {maximize && (maximized || (panes.length > 0 && props.activePaneId !== null)) ? (
        <HeaderButton
          glyph={maximized ? minimizeSvg : expandSvg}
          label={maximized ? "Restore panel" : "Maximize panel"}
          pressed={maximized}
          onActivate={() => maximize.setMaximized(!maximized)}
        />
      ) : null}
      <HeaderButton glyph={sidebarRightSvg} label="Collapse panel" onActivate={props.onCollapse} />
    </view>
  );
}
