import { execFileSync } from "node:child_process";

export type ReadSystemDark = () => boolean;

export function parseSystemAppearanceProbeSequence(value: string | undefined): readonly boolean[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry): entry is "dark" | "light" => entry === "dark" || entry === "light")
    .map((entry) => entry === "dark");
}

export function readMacSystemDark(execFile: typeof execFileSync = execFileSync): boolean {
  if (process.platform !== "darwin") return false;
  try {
    return (
      String(
        execFile("/usr/bin/defaults", ["read", "-g", "AppleInterfaceStyle"], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }),
      )
        .trim()
        .toLowerCase() === "dark"
    );
  } catch {
    // `defaults` exits non-zero when AppleInterfaceStyle is absent, which is
    // the canonical macOS representation of light appearance.
    return false;
  }
}

// freedesktop desktops expose the preference as GNOME's `color-scheme`
// ("prefer-dark"); older GTK desktops only encode it in the theme name.
export function readLinuxSystemDark(execFile: typeof execFileSync = execFileSync): boolean {
  const readSetting = (key: string): string | null => {
    try {
      return String(
        execFile("gsettings", ["get", "org.gnome.desktop.interface", key], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }),
      )
        .trim()
        .replace(/^'|'$/g, "")
        .toLowerCase();
    } catch {
      return null;
    }
  };
  const colorScheme = readSetting("color-scheme");
  if (colorScheme === "prefer-dark") return true;
  if (colorScheme === "prefer-light") return false;
  return readSetting("gtk-theme")?.endsWith("-dark") ?? false;
}

export function readSystemDark(
  platform: NodeJS.Platform = process.platform,
  execFile: typeof execFileSync = execFileSync,
): boolean {
  if (platform === "darwin") return readMacSystemDark(execFile);
  if (platform === "linux") return readLinuxSystemDark(execFile);
  return false;
}

export function createSystemAppearanceWatcher(input: {
  readonly initialDark: boolean;
  readonly onChange: (dark: boolean) => void;
  readonly readDark?: ReadSystemDark;
  readonly schedule?: (callback: () => void, intervalMs: number) => ReturnType<typeof setInterval>;
  readonly clear?: (timer: ReturnType<typeof setInterval>) => void;
  readonly intervalMs?: number;
}) {
  const readDark = input.readDark ?? readSystemDark;
  const schedule = input.schedule ?? setInterval;
  const clear = input.clear ?? clearInterval;
  let currentDark = input.initialDark;
  const refresh = () => {
    const nextDark = readDark();
    if (nextDark === currentDark) return;
    currentDark = nextDark;
    input.onChange(nextDark);
  };
  const timer = schedule(refresh, input.intervalMs ?? 1_000);
  timer.unref?.();
  return {
    refresh,
    dispose: () => clear(timer),
  };
}
