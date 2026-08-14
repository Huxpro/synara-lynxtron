import 'background-only';

import { bridgeCall, onGlobalEvent } from './bridge';
import type { ViewportSize } from '@synara-web/responsiveLayout.logic';

export interface DesktopWindowState {
  readonly isMaximized: boolean;
  readonly isFullscreen: boolean;
}

export interface WindowPort {
  readonly hasWindowControls: () => boolean;
  readonly minimize: () => Promise<void>;
  readonly toggleMaximize: () => Promise<DesktopWindowState | undefined>;
  readonly close: () => Promise<void>;
  readonly getWindowState: () => Promise<DesktopWindowState | undefined>;
  readonly getViewportSize: () => Promise<ViewportSize | undefined>;
  readonly onViewportResize: (listener: (size: ViewportSize) => void) => () => void;
  readonly onWindowState: (listener: (state: DesktopWindowState) => void) => () => void;
  readonly openExternal: (url: string) => Promise<boolean>;
  readonly openWindow: (url: string) => void;
  readonly getZoomFactor: () => number;
  readonly onZoomFactorChange: (listener: (zoomFactor: number) => void) => () => void;
}

export const platformWindow: WindowPort = {
  hasWindowControls: () => true,
  minimize: async () => {
    await bridgeCall('windowMinimize');
  },
  toggleMaximize: () => bridgeCall('windowToggleMaximize'),
  close: async () => {
    await bridgeCall('windowClose');
  },
  getWindowState: () => bridgeCall('windowGetState'),
  getViewportSize: () => bridgeCall('windowGetViewport'),
  onViewportResize: (listener) =>
    onGlobalEvent('viewport:resize', (width: unknown, height: unknown) => {
      if (
        typeof width === 'number' &&
        Number.isFinite(width) &&
        typeof height === 'number' &&
        Number.isFinite(height)
      ) {
        listener({ width, height });
      }
    }),
  onWindowState: (listener) =>
    onGlobalEvent('window:state', (state: unknown) => {
      if (
        state &&
        typeof state === 'object' &&
        'isMaximized' in state &&
        'isFullscreen' in state
      ) {
        listener(state as DesktopWindowState);
      }
    }),
  openExternal: async (url) => {
    const result = await bridgeCall<{ readonly opened: boolean }>('shellOpenExternal', {
      url,
    });
    return result.opened;
  },
  openWindow: (url) => {
    openExternalBestEffort(url);
  },
  getZoomFactor: () => 1,
  onZoomFactorChange: () => () => undefined,
};

export function openExternalBestEffort(url: string): void {
  void platformWindow.openExternal(url).catch(() => undefined);
}
