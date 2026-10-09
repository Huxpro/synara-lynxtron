import temporaryThreadSvg from "@synara-central-icons/bubble-annotation-5.svg?raw";
import type { ReactNode } from "@lynx-js/react";

import { useTheme } from "../adapters/useTheme.lynx";
import { Button } from "../components/ui/button";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { CheckIcon, FolderIcon, GitBranchIcon, XIcon } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";

import "./empty-thread-context-tray.css";

/** Upstream ProjectPicker reset: a `size-5` button over the trigger's glyph, live on hover. */
function ProjectResetButton(props: { readonly onReset: () => void }) {
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: "EmptyThreadProjectReset",
    accessibleLabel: "Don't work in a project",
    onActivate: props.onReset,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <view className="EmptyThreadProjectResetGlyph">
        <XIcon color={semanticIconColor("inverse")} size={8} strokeWidth={3} />
      </view>
    </view>
  );
}

/** Upstream's composer-row "Worktree" checkbox: new chats start in a fresh worktree. */
function WorktreeToggle(props: {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: `EmptyThreadWorktreeToggle${
      props.checked ? " EmptyThreadWorktreeToggle--checked" : ""
    }`,
    accessibleLabel: "Worktree",
    accessibilityValue: props.checked ? "Checked" : "Unchecked",
    onActivate: () => props.onChange(!props.checked),
  });
  return (
    <view
      className={interaction.className}
      aria-checked={props.checked}
      {...interaction.eventProps}
    >
      <text className="EmptyThreadTemporaryLabel">Worktree</text>
      <view className="EmptyThreadWorktreeBox">
        {props.checked ? (
          <CheckIcon color={semanticIconColor("accent")} size={12} strokeWidth={2.5} />
        ) : null}
      </view>
    </view>
  );
}

export function EmptyThreadContextTray(props: {
  readonly branch: string | null;
  readonly className?: string;
  readonly envMode: "local" | "worktree";
  readonly onEnvModeChange?: (envMode: "local" | "worktree") => void;
  /** Upstream's "Don't work in a project": shown over the project glyph on hover. */
  readonly onResetProject?: () => void;
  readonly onTemporaryChange: () => void;
  readonly projectControl?: ReactNode;
  readonly projectName: string;
  readonly temporary: boolean;
}) {
  const { semanticIconColor } = useTheme();
  const secondaryIconColor = semanticIconColor("secondary");

  return (
    <view className={`EmptyThreadContextTray${props.className ? ` ${props.className}` : ""}`}>
      {props.projectControl ? (
        <view className="EmptyThreadProjectPicker">
          {props.projectControl}
          {props.onResetProject ? <ProjectResetButton onReset={props.onResetProject} /> : null}
        </view>
      ) : (
        <view className="EmptyThreadContextIdentity">
          <FolderIcon className="EmptyThreadContextIcon" color={secondaryIconColor} size={14} />
          <text className="EmptyThreadContextLabel">{props.projectName}</text>
        </view>
      )}
      {props.branch ? (
        <view className="EmptyThreadContextStatus">
          <GitBranchIcon className="EmptyThreadContextIcon" color={secondaryIconColor} size={14} />
          <text className="EmptyThreadContextLabel">{props.branch}</text>
        </view>
      ) : null}
      <view className="EmptyThreadContextSpacer" />
      <Button
        variant="ghost"
        size="sm"
        aria-label="Temporary chat"
        buttonProps={{
          "aria-pressed": props.temporary,
          "accessibility-state": { selected: props.temporary },
        }}
        className={`EmptyThreadTemporaryButton${
          props.temporary ? " EmptyThreadTemporaryButton--active" : ""
        }`}
        onClick={props.onTemporaryChange}
      >
        <svg
          className="EmptyThreadTemporaryIcon"
          content={colorizeLynxSvg(
            temporaryThreadSvg,
            props.temporary ? semanticIconColor("accent") : secondaryIconColor,
          )}
        />
        <text className="EmptyThreadTemporaryLabel">Temporary</text>
      </Button>
      {props.onEnvModeChange ? (
        <WorktreeToggle
          checked={props.envMode === "worktree"}
          onChange={(checked) => props.onEnvModeChange?.(checked ? "worktree" : "local")}
        />
      ) : props.envMode === "worktree" ? (
        <view className="EmptyThreadContextStatus">
          <GitBranchIcon className="EmptyThreadContextIcon" color={secondaryIconColor} size={14} />
          <text className="EmptyThreadContextLabel">Worktree</text>
        </view>
      ) : null}
    </view>
  );
}
