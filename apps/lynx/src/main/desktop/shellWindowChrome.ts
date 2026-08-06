import { getMacTrafficLightPosition } from '@synara/shared/desktopChrome';

export interface ShellWindowChromeOptions {
  readonly frame?: boolean;
  readonly titleBarStyle?: 'hiddenInset';
  readonly trafficLightPosition?: {
    readonly x: number;
    readonly y: number;
  };
}

export function resolveShellWindowChrome(
  platform: NodeJS.Platform
): ShellWindowChromeOptions {
  if (platform === 'win32') {
    return { frame: false };
  }
  if (platform !== 'darwin') {
    return {};
  }
  return {
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: getMacTrafficLightPosition(),
  };
}
