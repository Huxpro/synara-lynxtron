import {
  THREAD_MAIN_CONTENT_MIN_WIDTH,
  THREAD_SIDEBAR_DEFAULT_WIDTH,
  THREAD_SIDEBAR_MIN_WIDTH,
  clampSidebarWidth,
  sidebarWidthFromPointer,
} from '@synara-web/components/sidebarResize.logic';

export interface LynxSidebarPointerEvent {
  readonly button?: number;
  readonly buttons?: number;
  readonly changedTouches?: readonly {
    readonly clientX?: number;
    readonly pageX?: number;
  }[];
  readonly clientX?: number;
  readonly detail?: {
    readonly buttons?: number;
    readonly clientX?: number;
    readonly pageX?: number;
    readonly x?: number;
  };
  readonly pageX?: number;
  readonly touches?: readonly {
    readonly clientX?: number;
    readonly pageX?: number;
  }[];
  readonly x?: number;
}

export interface LynxSidebarResizeSession {
  readonly moved: boolean;
  readonly side: 'left' | 'right';
  readonly startWidth: number;
  readonly startX: number;
  readonly width: number;
}

export type LynxSidebarResizeMoveResult =
  | { readonly kind: 'ended-missed-mouseup' }
  | { readonly kind: 'ignored' }
  | {
      readonly kind: 'moved';
      readonly session: LynxSidebarResizeSession;
    };

function finiteCoordinate(
  ...values: readonly (number | undefined)[]
): number | null {
  const value = values.find((candidate) => Number.isFinite(candidate));
  return value ?? null;
}

export function readLynxSidebarPointerX(
  event: LynxSidebarPointerEvent
): number | null {
  const touch = event.touches?.[0] ?? event.changedTouches?.[0];
  return finiteCoordinate(
    touch?.clientX,
    touch?.pageX,
    event.detail?.clientX,
    event.clientX,
    event.detail?.x,
    event.x,
    event.detail?.pageX,
    event.pageX
  );
}

export function readLynxSidebarButtons(
  event: LynxSidebarPointerEvent
): number | null {
  const buttons = event.detail?.buttons ?? event.buttons;
  return typeof buttons === 'number' ? buttons : null;
}

export function isLynxSidebarPrimaryPointer(
  event: LynxSidebarPointerEvent
): boolean {
  const buttons = readLynxSidebarButtons(event);
  return (
    event.touches !== undefined ||
    event.button === undefined ||
    event.button === 0 ||
    (event.button === 1 && buttons === 1)
  );
}

export function resolveLynxSidebarWidth(input: {
  readonly requestedWidth: number;
  readonly viewportWidth: number;
}): number {
  if (input.viewportWidth <= 0) return THREAD_SIDEBAR_DEFAULT_WIDTH;
  if (input.viewportWidth < 768) {
    return Math.max(0, input.viewportWidth - 12);
  }
  return clampSidebarWidth(input.requestedWidth, {
    minWidth: THREAD_SIDEBAR_MIN_WIDTH,
    minimumContentWidth: THREAD_MAIN_CONTENT_MIN_WIDTH,
    viewportWidth: input.viewportWidth,
  });
}

export function resolveLynxSidebarPresentedWidth(input: {
  readonly requestedWidth: number;
  readonly viewportWidth: number;
}): number {
  if (input.viewportWidth <= 0) return THREAD_SIDEBAR_DEFAULT_WIDTH;
  if (input.viewportWidth < 768) {
    return Math.max(0, input.viewportWidth - 12);
  }
  return clampSidebarWidth(input.requestedWidth, {
    minWidth: THREAD_SIDEBAR_MIN_WIDTH,
  });
}

export function createLynxSidebarResizeSession(input: {
  readonly side?: 'left' | 'right';
  readonly startWidth: number;
  readonly startX: number;
}): LynxSidebarResizeSession {
  return {
    moved: false,
    side: input.side ?? 'left',
    startWidth: input.startWidth,
    startX: input.startX,
    width: input.startWidth,
  };
}

export function moveLynxSidebarResizeSession(input: {
  readonly event: LynxSidebarPointerEvent;
  readonly maxWidth?: number;
  readonly minimumContentWidth?: number;
  readonly minWidth?: number;
  readonly session: LynxSidebarResizeSession;
  readonly viewportWidth: number;
}): LynxSidebarResizeMoveResult {
  if (readLynxSidebarButtons(input.event) === 0) {
    return { kind: 'ended-missed-mouseup' };
  }
  const currentX = readLynxSidebarPointerX(input.event);
  if (currentX === null) return { kind: 'ignored' };
  const requestedWidth = sidebarWidthFromPointer({
    currentX,
    side: input.session.side,
    startWidth: input.session.startWidth,
    startX: input.session.startX,
  });
  const width =
    input.minWidth === undefined
      ? resolveLynxSidebarWidth({
          requestedWidth,
          viewportWidth: input.viewportWidth,
        })
      : clampSidebarWidth(requestedWidth, {
          maxWidth: input.maxWidth,
          minWidth: input.minWidth,
          minimumContentWidth: input.minimumContentWidth,
          viewportWidth: input.viewportWidth,
        });
  return {
    kind: 'moved',
    session: {
      ...input.session,
      moved:
        input.session.moved ||
        Math.abs(currentX - input.session.startX) > 2,
      width,
    },
  };
}
