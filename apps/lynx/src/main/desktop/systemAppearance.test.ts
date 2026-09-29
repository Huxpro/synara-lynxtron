import { describe, expect, it } from "@rstest/core";

import {
  createSystemAppearanceWatcher,
  parseSystemAppearanceProbeSequence,
} from "./systemAppearance";
import { readFileSync } from "node:fs";

describe("desktop system appearance", () => {
  it("publishes only real system appearance transitions", () => {
    let nextDark = false;
    let scheduled: (() => void) | null = null;
    const changes: boolean[] = [];
    let cleared = false;
    const watcher = createSystemAppearanceWatcher({
      initialDark: false,
      readDark: () => nextDark,
      onChange: (dark) => changes.push(dark),
      schedule: (callback) => {
        scheduled = callback;
        return { unref() {} } as ReturnType<typeof setInterval>;
      },
      clear: () => {
        cleared = true;
      },
    });

    watcher.refresh();
    expect(changes).toEqual([]);
    nextDark = true;
    scheduled?.();
    scheduled?.();
    expect(changes).toEqual([true]);
    nextDark = false;
    watcher.refresh();
    expect(changes).toEqual([true, false]);
    watcher.dispose();
    expect(cleared).toBe(true);
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
    expect(source).toMatch(/name === 'runtimeGetSystemAppearance'/);
    expect(source).toMatch(/dark: readCurrentSystemDark()/);
    expect(source).toMatch(/readDark: readCurrentSystemDark/);
    expect(source).toContain("startSystemAppearanceProbe(w, shellPaths.logFile)");
  });
});
