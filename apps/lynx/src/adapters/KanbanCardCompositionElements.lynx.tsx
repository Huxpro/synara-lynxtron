import type { ProviderKind } from "@synara/contracts";
import { useRef, type ReactNode } from "@lynx-js/react";
import { getRectByRef } from "@lynx-js/lynx-ui";
import type { NodesRef } from "@lynx-js/types";
import forkSvg from "@synara-central-icons/fork.svg?raw";
import pinFilledSvg from "@synara-central-icons-fill/pin.svg?raw";
import terminalSvg from "@synara-central-icons/console.svg?raw";
import worktreeSvg from "@synara-central-icons/arrow-split-right.svg?raw";

import type { PrStatePresentation } from "@synara-web/components/pullRequest/pullRequestStatePresentation.logic";
import type { SidebarStatusPresentation } from "@synara-web/components/SidebarStatus.logic";
import type { KanbanColumnKey } from "@synara-web/components/kanban/kanban.logic";
import type { KanbanDragPoint } from "@synara-web/components/kanban/kanbanDnd.logic";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { GitBranchIcon, PaperclipIcon } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import {
  isNativeKanbanPrimaryPointer,
  readNativeKanbanPointer,
  type NativeKanbanPointerEvent,
} from "../app/kanbanDnd.logic";

import "./kanban-card-composition-elements.css";
import { PullRequestStateIcon } from "./PullRequestStateIcon.lynx";
import { KanbanStatusIcon } from "./KanbanStatusIcon.lynx";
import { useTheme } from "./useTheme.lynx";
import {
  lynxNestedInteractiveEventProps,
  useLynxInteractiveState,
} from "./useLynxInteractiveState";
import {
  resolveLongPressOffset,
  resolveSecondaryPointerOffset,
} from "../components/sidebar/threadContextActions.logic";
import { focusLynxNode } from "../components/ui/focus.lynx";

type ChildrenProps = { readonly children?: ReactNode };

export function KanbanCardRootElement(
  props: ChildrenProps & {
    readonly accessibleLabel: string;
    readonly isOverlay: boolean;
    readonly isDragSource: boolean;
    readonly visualState?: "default" | "hover" | "focus" | "pressed";
    readonly onActivate?: () => void;
    readonly onContextMenu?: (event: React.MouseEvent, restoreFocus: () => void) => void;
    readonly onDragPointerStart?: (point: KanbanDragPoint) => void;
  },
) {
  const rootRef = useRef<NodesRef>(null);
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedKanbanCard${
      props.isOverlay ? " SharedKanbanCard--overlay" : ""
    }${props.isDragSource ? " SharedKanbanCard--drag-source" : ""}${
      props.visualState && props.visualState !== "default" ? ` ui-${props.visualState}` : ""
    }`,
    accessibleLabel: props.accessibleLabel,
    onActivate: props.onActivate,
  });
  const openContextMenu = (offset: { readonly x: number; readonly y: number }) => {
    "background only";
    if (!props.onContextMenu) return;
    void getRectByRef(rootRef, true)
      .then((rect) => {
        props.onContextMenu?.(
          {
            clientX: rect.left + offset.x,
            clientY: rect.top + offset.y,
            preventDefault() {},
            stopPropagation() {},
          } as React.MouseEvent,
          () => focusLynxNode(rootRef),
        );
      })
      .catch(() => {
        // A menu at invented coordinates is worse than no menu.
      });
  };
  return (
    <view
      ref={rootRef}
      className={interaction.className}
      {...interaction.eventProps}
      bindmousedown={(event: {
        readonly button?: number;
        readonly buttons?: number;
        readonly clientX?: number;
        readonly clientY?: number;
        readonly detail?: NativeKanbanPointerEvent["detail"];
        readonly pageX?: number;
        readonly pageY?: number;
        readonly x?: number;
        readonly y?: number;
      }) => {
        interaction.eventProps.bindmousedown?.();
        const offset = resolveSecondaryPointerOffset(event);
        if (offset) {
          openContextMenu(offset);
          return;
        }
        if (!props.onDragPointerStart || !isNativeKanbanPrimaryPointer(event)) return;
        const point = readNativeKanbanPointer(event);
        if (point) props.onDragPointerStart(point);
      }}
      bindtouchstart={(event: NativeKanbanPointerEvent) => {
        interaction.eventProps.bindtouchstart?.();
        if (!props.onDragPointerStart) return;
        const point = readNativeKanbanPointer(event);
        if (point) props.onDragPointerStart(point);
      }}
      bindlongpress={(event) => {
        openContextMenu(resolveLongPressOffset(event) ?? { x: 12, y: 12 });
      }}
    >
      {props.children}
    </view>
  );
}

export function KanbanCardTitleRowElement(props: ChildrenProps) {
  return <view className="SharedKanbanCardTitleRow">{props.children}</view>;
}

export function KanbanCardActionsElement(props: {
  readonly label: string;
  readonly onActivate: (event: React.MouseEvent) => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedKanbanCardActions",
    accessibleLabel: props.label,
    onActivate: () =>
      props.onActivate({
        clientX: 0,
        clientY: 0,
        preventDefault() {},
        stopPropagation() {},
      } as React.MouseEvent),
  });
  return (
    <view
      className={interaction.className}
      {...lynxNestedInteractiveEventProps(interaction.eventProps)}
    >
      <text className="SharedKanbanCardActionsText">•••</text>
    </view>
  );
}

export function KanbanCardTitleElement(props: ChildrenProps) {
  return (
    <text className="SharedKanbanCardTitle" text-maxline="2">
      {props.children}
    </text>
  );
}

export function KanbanCardPinElement() {
  const { semanticIconColor } = useTheme();
  return (
    <svg
      className="SharedKanbanCardPin"
      content={colorizeLynxSvg(pinFilledSvg, semanticIconColor("secondary"))}
    />
  );
}

export function KanbanCardDraftPreviewElement(props: ChildrenProps) {
  return (
    <text className="SharedKanbanCardDraftPreview" text-maxline="2">
      {props.children}
    </text>
  );
}

export function KanbanCardMetaRowElement(props: ChildrenProps) {
  return <view className="SharedKanbanCardMetaRow">{props.children}</view>;
}

export function KanbanCardProviderElement(props: { readonly provider: ProviderKind | null }) {
  if (props.provider === null) {
    return <view className="SharedKanbanCardProviderFallback" />;
  }
  return (
    <view className="SharedKanbanCardProvider">
      <OpenAIProviderIcon provider={props.provider} />
    </view>
  );
}

export function KanbanCardBranchElement(props: { readonly label: string }) {
  const { semanticIconColor } = useTheme();
  return (
    <view className="SharedKanbanCardBranch">
      <GitBranchIcon
        className="SharedKanbanCardBranchIcon"
        color={semanticIconColor("secondary")}
        size={12}
      />
      <text className="SharedKanbanCardMetaText" text-maxline="1">
        {props.label}
      </text>
    </view>
  );
}

export function KanbanCardWorktreeElement(_props: { readonly label: string }) {
  const { semanticIconColor } = useTheme();
  return (
    <svg
      className="SharedKanbanCardMetaIcon"
      content={colorizeLynxSvg(worktreeSvg, semanticIconColor("secondary"))}
    />
  );
}

export function KanbanCardForkElement() {
  const { resolvedTheme } = useTheme();
  return (
    <svg
      className="SharedKanbanCardForkIcon"
      content={colorizeLynxSvg(forkSvg, resolvedTheme === "dark" ? "#6ee7b7" : "#059669")}
    />
  );
}

export function KanbanCardPullRequestElement(props: {
  readonly number: number;
  readonly title: string;
  readonly presentation: PrStatePresentation;
}) {
  return (
    <view className="SharedKanbanCardPr">
      <PullRequestStateIcon className="SharedKanbanCardPrIcon" presentation={props.presentation} />
      <text className="SharedKanbanCardPrText">#{props.number}</text>
    </view>
  );
}

export function KanbanCardAttachmentElement() {
  const { semanticIconColor } = useTheme();
  return (
    <PaperclipIcon
      className="SharedKanbanCardMetaIcon"
      color={semanticIconColor("secondary")}
      size={12}
    />
  );
}

export function KanbanCardTrailingElement(props: ChildrenProps) {
  return <view className="SharedKanbanCardTrailing">{props.children}</view>;
}

export function KanbanCardOptimisticStatusElement(props: { readonly elapsed: string | null }) {
  return (
    <view className="SharedKanbanCardInlineStatus">
      <view className="SharedKanbanCardStatusDot SharedKanbanCardStatusDot--working" />
      <text className="SharedKanbanCardWorking">
        {props.elapsed ? `Worked for ${props.elapsed}` : "Starting…"}
      </text>
    </view>
  );
}

export function KanbanCardStatusPillElement(props: { readonly pill: SidebarStatusPresentation }) {
  return (
    <view className="SharedKanbanCardInlineStatus">
      <view
        className={`SharedKanbanCardStatusDot${
          props.pill.pulse ? " SharedKanbanCardStatusDot--working" : ""
        }`}
      />
      <text className="SharedKanbanCardStatusText" text-maxline="1">
        {props.pill.label}
      </text>
    </view>
  );
}

export function KanbanCardTimestampElement(props: { readonly label: string }) {
  return <text className="SharedKanbanCardTimestamp">{props.label}</text>;
}

export function KanbanCardColumnStatusElement(props: {
  readonly column: KanbanColumnKey;
  readonly label: string;
  readonly isTerminal: boolean;
}) {
  const { semanticIconColor } = useTheme();
  return (
    <view className="SharedKanbanCardColumnStatus">
      {props.isTerminal ? (
        <svg
          className="SharedKanbanCardColumnIcon"
          content={colorizeLynxSvg(terminalSvg, semanticIconColor("secondary"))}
        />
      ) : (
        <KanbanStatusIcon className="SharedKanbanCardColumnIcon" column={props.column} />
      )}
      <text className="SharedKanbanCardColumnLabel">{props.label}</text>
    </view>
  );
}
