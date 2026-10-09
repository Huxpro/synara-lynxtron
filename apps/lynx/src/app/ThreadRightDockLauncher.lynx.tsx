import type { RightDockPaneKind } from "@synara/shared/rightDock";
import type { RightDockLauncherEntry } from "@synara-web/components/chat/rightDockLauncher.logic";

import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { useTheme } from "../adapters/useTheme.lynx";
import { toastManager } from "../components/ui/toast.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { RIGHT_DOCK_PANE_GLYPHS } from "./rightDockGlyphs.lynx";
import "./thread-right-dock-launcher.css";

function LauncherButton(props: {
  readonly entry: RightDockLauncherEntry;
  /** False for a pane this chat cannot open in the Native app (not ported, or no saved thread). */
  readonly openable: boolean;
  readonly onOpen: (kind: RightDockPaneKind) => void;
}) {
  const { svgColors } = useTheme();
  const glyph = RIGHT_DOCK_PANE_GLYPHS[props.entry.kind];
  const interaction = useLynxInteractiveState({
    baseClassName: "ThreadRightDockLauncherItem",
    accessibleLabel: `Open ${props.entry.label}`,
    accessibilityValue: props.openable ? undefined : "Not available in the Native app yet",
    onActivate: () => {
      "background only";
      if (props.openable) {
        props.onOpen(props.entry.kind);
        return;
      }
      toastManager.add({
        type: "info",
        title: `${props.entry.label} is not available here in the Native app yet`,
      });
    },
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      {glyph ? (
        <svg
          className="ThreadRightDockLauncherIcon"
          content={colorizeLynxSvg(glyph, svgColors.foreground)}
        />
      ) : null}
      <text className="ThreadRightDockLauncherLabel">{props.entry.label}</text>
    </view>
  );
}

/** Electron's empty right dock: a centered column of tools to open ("Open a panel"). */
export function ThreadRightDockLauncher(props: {
  readonly entries: readonly RightDockLauncherEntry[];
  readonly openableKinds: readonly RightDockPaneKind[];
  readonly onOpen: (kind: RightDockPaneKind) => void;
}) {
  return (
    <view
      className="ThreadRightDockLauncher"
      aria-label="Open a panel"
      accessibility-element={true}
      accessibility-label="Open a panel"
      accessibility-trait="none"
    >
      <view className="ThreadRightDockLauncherList">
        {props.entries.map((entry) => (
          <LauncherButton
            key={entry.kind}
            entry={entry}
            openable={props.openableKinds.includes(entry.kind)}
            onOpen={props.onOpen}
          />
        ))}
      </view>
    </view>
  );
}
