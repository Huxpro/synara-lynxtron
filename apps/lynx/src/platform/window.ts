import 'background-only';

import { bridgeCall, onGlobalEvent } from './bridge';

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
    void platformWindow.openExternal(url);
  },
  getZoomFactor: () => 1,
  onZoomFactorChange: () => () => undefined,
};
