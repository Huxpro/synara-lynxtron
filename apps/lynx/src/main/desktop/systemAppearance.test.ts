import { describe, expect, it } from "@rstest/core";

import {
  createSystemAppearanceWatcher,
  parseSystemAppearanceProbeSequence,
  readSystemDark,
} from "./systemAppearance";
import { readFileSync } from "node:fs";

describe("desktop system appearance", () => {
  it("publishes only real system appearance transitions", () => {
    let nextDark = false;
    const scheduled: { current: (() => void) | null } = { current: null };
    const changes: boolean[] = [];
    let cleared = false;
    const watcher = createSystemAppearanceWatcher({
      initialDark: false,
      readDark: () => nextDark,
      onChange: (dark) => changes.push(dark),
      schedule: (callback) => {
        scheduled.current = callback;
        return { unref() {} } as ReturnType<typeof setInterval>;
      },
      clear: () => {
        cleared = true;
      },
    });

    watcher.refresh();
    expect(changes).toEqual([]);
    nextDark = true;
    scheduled.current?.();
    scheduled.current?.();
    expect(changes).toEqual([true]);
    nextDark = false;
    watcher.refresh();
    expect(changes).toEqual([true, false]);
    watcher.dispose();
    expect(cleared).toBe(true);
  });

  it("reads the freedesktop color scheme on Linux", () => {
    const gsettings =
      (values: Record<string, string>) =>
      (_command: string, args: readonly string[]): string => {
        const value = values[args[2] ?? ""];
        if (value === undefined) throw new Error("No such key");
        return `${value}\n`;
      };
    const read = (values: Record<string, string>) =>
      readSystemDark("linux", gsettings(values) as unknown as Parameters<typeof readSystemDark>[1]);
    expect(read({ "color-scheme": "'prefer-dark'" })).toBe(true);
    expect(read({ "color-scheme": "'prefer-light'", "gtk-theme": "'Adwaita-dark'" })).toBe(false);
    expect(read({ "color-scheme": "'default'", "gtk-theme": "'Adwaita-dark'" })).toBe(true);
    expect(read({ "gtk-theme": "'Yaru'" })).toBe(false);
    expect(read({})).toBe(false);
    expect(readSystemDark("win32", gsettings({ "color-scheme": "'prefer-dark'" }) as never)).toBe(
      false,
    );
  });

  it("parses only explicit light and dark appearance probe steps", () => {
    expect(parseSystemAppearanceProbeSequence(undefined)).toEqual([]);
    expect(parseSystemAppearanceProbeSequence(" light, dark,invalid,DARK ")).toEqual([
      false,
      true,
      true,
    ]);
  });

  it("desktop bridge exposes the current system appearance on demand", () => {
    const source = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    expect(source).toMatch(/name === ["']runtimeGetSystemAppearance["']/);
    expect(source).toMatch(/dark: readCurrentSystemDark()/);
    expect(source).toMatch(/readDark: readCurrentSystemDark/);
    expect(source).toContain("startSystemAppearanceProbe(w, shellPaths.logFile)");
  });
});
