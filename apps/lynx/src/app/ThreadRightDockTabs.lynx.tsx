import type { RightDockPane, RightDockPaneKind } from "@synara/shared/rightDock";
import differenceSvg from "@synara-central-icons/difference-modified.svg?raw";
import foldersSvg from "@synara-central-icons/folders.svg?raw";
import terminalSvg from "@synara-central-icons/console.svg?raw";
import sidechatSvg from "@synara-central-icons/bubble-text.svg?raw";
import gitSvg from "@synara-central-icons/fork.svg?raw";

import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { GlobeIcon, PanelRightCloseIcon, PlusIcon } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "../components/ui/menu.lynx";
import { EditorSurfaceTab } from "./EditorSurfaceTab.lynx";
import { FileEntryIcon } from "../components/FileEntryIcon.lynx";

import "./thread-right-dock-tabs.css";

const DEFAULT_ADD_KINDS: readonly RightDockPaneKind[] = [
  "diff",
  "explorer",
  "terminal",
  "sidechat",
];

function paneLabel(pane: RightDockPane): string {
  if (pane.kind === "browser") return "Browser";
  if (pane.kind === "diff") return "Diff";
  if (pane.kind === "explorer") return "Explorer";
  if (pane.kind === "terminal") return "Terminal";
  if (pane.kind === "sidechat") return "Side";
  if (pane.kind === "git") return "Git";
  if (pane.kind === "file" && pane.filePath) {
    return pane.filePath.replace(/\\/g, "/").split("/").filter(Boolean).at(-1) ?? pane.filePath;
  }
  return pane.kind;
}

function PaneIcon(props: { readonly kind: RightDockPaneKind }) {
  const { semanticIconColor } = useTheme();
  const content =
    props.kind === "diff"
      ? differenceSvg
      : props.kind === "git"
        ? gitSvg
        : props.kind === "terminal"
          ? terminalSvg
          : props.kind === "sidechat"
            ? sidechatSvg
            : foldersSvg;
  return (
    <svg
      className="ThreadRightDockTabIcon"
      content={colorizeLynxSvg(content, semanticIconColor("secondary"))}
    />
  );
}

function RightDockPaneIcon(props: { readonly pane: RightDockPane }) {
  const { semanticIconColor } = useTheme();
  if (props.pane.kind === "browser") {
    return <GlobeIcon color={semanticIconColor("secondary")} size={14} />;
  }
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
      <PanelRightCloseIcon color={semanticIconColor("secondary")} size={14} />
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
      {addKinds.length > 0 ? (
        <Menu defaultOpen={props.defaultAddMenuOpen}>
          <MenuTrigger ariaLabel="Add panel" className="ThreadRightDockHeaderButton">
            <PlusIcon color={semanticIconColor("secondary")} size={14} />
          </MenuTrigger>
          <MenuPopup align="end" side="bottom" className="ThreadRightDockAddMenu">
            <MenuGroup>
              <MenuGroupLabel>Panel</MenuGroupLabel>
              {addKinds.map((kind) => (
                <MenuItem key={kind} onClick={() => props.onAddPane(kind)}>
                  {kind === "browser" ? (
                    <GlobeIcon color={semanticIconColor("secondary")} size={14} />
                  ) : (
                    <PaneIcon kind={kind} />
                  )}
                  <text>
                    {kind === "browser"
                      ? "Browser"
                      : kind === "diff"
                        ? "Diff"
                        : kind === "git"
                          ? "Git"
                          : kind === "terminal"
                            ? "Terminal"
                            : kind === "sidechat"
                              ? "Side"
                              : "Explorer"}
                  </text>
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
