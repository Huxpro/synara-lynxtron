import type { RightDockPaneKind } from "@synara/shared/rightDock";
import type { RightDockLauncherEntry } from "@synara-web/components/chat/rightDockLauncher.logic";

import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { useTheme } from "../adapters/useTheme.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { RIGHT_DOCK_PANE_GLYPHS } from "./rightDockGlyphs.lynx";
import "./thread-right-dock-launcher.css";

function LauncherButton(props: {
  readonly entry: RightDockLauncherEntry;
  readonly onOpen: (kind: RightDockPaneKind) => void;
}) {
  const { svgColors } = useTheme();
  const glyph = RIGHT_DOCK_PANE_GLYPHS[props.entry.kind];
  const interaction = useLynxInteractiveState({
    baseClassName: "ThreadRightDockLauncherItem",
    accessibleLabel: `Open ${props.entry.label}`,
    onActivate: () => props.onOpen(props.entry.kind),
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
  readonly onOpen: (kind: RightDockPaneKind) => void;
}) {
  return (
    <view className="ThreadRightDockLauncher" aria-label="Open a panel">
      <view className="ThreadRightDockLauncherList">
        {props.entries.map((entry) => (
          <LauncherButton key={entry.kind} entry={entry} onOpen={props.onOpen} />
        ))}
      </view>
    </view>
  );
}
