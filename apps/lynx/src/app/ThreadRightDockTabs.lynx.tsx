import type { RightDockPane, RightDockPaneKind } from "@synara/shared/rightDock";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import sidebarRightSvg from "@synara-central-icons/sidebar-simple-right-wide.svg?raw";
import { PlusIcon } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { Menu, MenuGroup, MenuItem, MenuPopup, MenuTrigger } from "../components/ui/menu.lynx";
import { EditorSurfaceTab } from "./EditorSurfaceTab.lynx";
import { FileEntryIcon } from "../components/FileEntryIcon.lynx";
import { RIGHT_DOCK_PANE_GLYPHS } from "./rightDockGlyphs.lynx";

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

function CollapseButton(props: { readonly onCollapse: () => void }) {
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: "ThreadRightDockHeaderButton",
    accessibleLabel: "Collapse panel",
    onActivate: props.onCollapse,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <svg
        className="ThreadRightDockHeaderIcon"
        content={colorizeLynxSvg(sidebarRightSvg, semanticIconColor("secondary"))}
      />
    </view>
  );
}

export function ThreadRightDockTabs(props: {
  readonly activePaneId: string | null;
  readonly addMenuKinds?: readonly RightDockPaneKind[];
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
  return (
    <view className="ThreadRightDockTabHeader chat-surface-divider">
      <scroll-view className="ThreadRightDockTabScroller" scroll-orientation="horizontal">
        <view className="ThreadRightDockTabList">
          {props.panes.map((pane) => (
            <EditorSurfaceTab
              key={pane.id}
              active={pane.id === props.activePaneId}
              className="ThreadRightDockTab"
              closeLabel={`Close ${props.paneLabelOverrides?.[pane.id] ?? paneLabel(pane)}`}
              icon={<RightDockPaneIcon pane={pane} />}
              label={props.paneLabelOverrides?.[pane.id] ?? paneLabel(pane)}
              onClose={() => props.onClosePane(pane.id)}
              onSelect={() => props.onSelectPane(pane.id)}
            />
          ))}
        </view>
      </scroll-view>
      {/* Electron offers "Add panel" only once a pane is open; the launcher covers the rest. */}
      {addKinds.length > 0 && props.panes.length > 0 ? (
        <Menu defaultOpen={props.defaultAddMenuOpen}>
          <MenuTrigger ariaLabel="Add panel" className="ThreadRightDockHeaderButton">
            <PlusIcon color={semanticIconColor("secondary")} size={14} />
          </MenuTrigger>
          <MenuPopup align="end" side="bottom" className="LxPickerMenuPopup ThreadRightDockAddMenu">
            <MenuGroup>
              {addKinds.map((kind) => (
                <MenuItem key={kind} onClick={() => props.onAddPane(kind)}>
                  <PaneIcon kind={kind} />
                  <text>{PANE_KIND_LABELS[kind] ?? kind}</text>
                </MenuItem>
              ))}
            </MenuGroup>
          </MenuPopup>
        </Menu>
      ) : null}
      <CollapseButton onCollapse={props.onCollapse} />
    </view>
  );
}
