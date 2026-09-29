import { resizeTerminalSplitWeights } from "@synara-web/terminalPaneLayout";
import type { ThreadTerminalSplitDirection } from "@synara-web/types";

export interface LynxTerminalSplitPointerEvent {
  readonly buttons?: number;
  readonly changedTouches?: readonly {
    readonly clientX?: number;
    readonly clientY?: number;
    readonly pageX?: number;
    readonly pageY?: number;
  }[];
  readonly clientX?: number;
  readonly clientY?: number;
  // Lynx touch events report page coordinates here as `x`/`y`.
  readonly detail?: {
    readonly buttons?: number;
    readonly clientX?: number;
    readonly clientY?: number;
    readonly pageX?: number;
    readonly pageY?: number;
    readonly x?: number;
    readonly y?: number;
  };
  readonly pageX?: number;
  readonly pageY?: number;
  readonly touches?: readonly {
    readonly clientX?: number;
    readonly clientY?: number;
    readonly pageX?: number;
    readonly pageY?: number;
  }[];
}

export interface LynxTerminalSplitResizeSession {
  readonly direction: ThreadTerminalSplitDirection;
  readonly groupId: string;
  readonly handleIndex: number;
  readonly splitId: string;
  readonly startCoordinate: number;
  readonly totalSize: number;
  readonly weights: number[];
}

export interface LynxTerminalSplitTapState {
  readonly at: number;
  readonly handleKey: string;
}

const TERMINAL_SPLIT_DOUBLE_TAP_MS = 300;

export function registerLynxTerminalSplitTap(input: {
  readonly handleKey: string;
  readonly now: number;
  readonly previous: LynxTerminalSplitTapState | null;
}): { readonly doubleTap: boolean; readonly next: LynxTerminalSplitTapState | null } {
  const doubleTap =
    input.previous?.handleKey === input.handleKey &&
    input.now >= input.previous.at &&
    input.now - input.previous.at <= TERMINAL_SPLIT_DOUBLE_TAP_MS;
  return {
    doubleTap,
    next: doubleTap ? null : { at: input.now, handleKey: input.handleKey },
  };
}

function finiteCoordinate(...values: readonly (number | undefined)[]): number | null {
  return values.find((value) => Number.isFinite(value)) ?? null;
}

export function readLynxTerminalSplitCoordinate(
  event: LynxTerminalSplitPointerEvent,
  direction: ThreadTerminalSplitDirection,
): number | null {
  const touch = event.touches?.[0] ?? event.changedTouches?.[0];
  return direction === "horizontal"
    ? finiteCoordinate(
        touch?.clientX,
        touch?.pageX,
        event.detail?.clientX,
        event.clientX,
        event.detail?.pageX,
        event.pageX,
      )
    : finiteCoordinate(
        touch?.clientY,
        touch?.pageY,
        event.detail?.clientY,
        event.clientY,
        event.detail?.pageY,
        event.pageY,
      );
}

export function moveLynxTerminalSplitResize(input: {
  readonly event: LynxTerminalSplitPointerEvent;
  readonly session: LynxTerminalSplitResizeSession;
}):
  | { readonly kind: "ended-missed-mouseup" }
  | { readonly kind: "ignored" }
  | { readonly kind: "moved"; readonly weights: number[] } {
  const buttons = input.event.detail?.buttons ?? input.event.buttons;
  if (buttons === 0) return { kind: "ended-missed-mouseup" };
  const currentCoordinate = readLynxTerminalSplitCoordinate(input.event, input.session.direction);
  if (currentCoordinate === null) return { kind: "ignored" };
  return {
    kind: "moved",
    weights: resizeTerminalSplitWeights({
      currentCoordinate,
      handleIndex: input.session.handleIndex,
      startCoordinate: input.session.startCoordinate,
      totalSize: input.session.totalSize,
      weights: input.session.weights,
    }),
  };
}
