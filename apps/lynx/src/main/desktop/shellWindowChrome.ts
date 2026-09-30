import { getMacTrafficLightPosition } from "@synara/shared/desktopChrome";

export interface ShellWindowChromeOptions {
  readonly frame?: boolean;
  /** Lynxtron on Linux only supports headless (windowless) LynxWindows. */
  readonly windowless?: boolean;
  /** Windowless renderers default to 2x; X11 presents at the display's 1x. */
  readonly deviceScaleFactor?: number;
  readonly titleBarStyle?: "hiddenInset";
  readonly trafficLightPosition?: {
    readonly x: number;
    readonly y: number;
  };
}

export function resolveShellWindowChrome(platform: NodeJS.Platform): ShellWindowChromeOptions {
  if (platform === "win32") {
    return { frame: false };
  }
  if (platform === "linux") {
    return { windowless: true, deviceScaleFactor: 1 };
  }
  if (platform !== "darwin") {
    return {};
  }
  return {
    titleBarStyle: "hiddenInset",
    trafficLightPosition: getMacTrafficLightPosition(),
  };
}
