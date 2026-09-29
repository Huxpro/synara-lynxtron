import path from "node:path";
import { createRequire } from "node:module";

export interface SearchKeyEvent {
  readonly key: string;
  readonly shiftKey: boolean;
}

const TERMINAL_INPUT_DATA_BY_KEY: Readonly<Record<SearchKeyEvent["key"], string>> = {
  ArrowDown: "\u001b[B",
  ArrowLeft: "\u001b[D",
  ArrowRight: "\u001b[C",
  ArrowUp: "\u001b[A",
  ControlC: "\u0003",
  ControlL: "\u000c",
  Enter: "\r",
  Escape: "\u001b",
  Tab: "\t",
};

export function terminalInputDataForSearchKeyEvent(event: SearchKeyEvent): string {
  return TERMINAL_INPUT_DATA_BY_KEY[event.key] ?? event.key;
}

interface NativeSearchKeyMonitor {
  start(
    nativeViewHandle: Buffer,
    listener: (event: SearchKeyEvent) => void,
    terminalMode: boolean,
  ): void;
  stop(): void;
  setComposerBounds(x: number, y: number, width: number, height: number): void;
}

export interface SearchKeyMonitor {
  setMode(mode: "disabled" | "search" | "terminal"): void;
  setComposerBounds(bounds: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }): void;
  dispose(): void;
}

export function createSearchKeyMonitor(input: {
  readonly nativeViewHandle: Buffer;
  readonly onKey: (event: SearchKeyEvent) => void;
  readonly platform?: NodeJS.Platform;
  readonly requireNative?: (path: string) => NativeSearchKeyMonitor;
}): SearchKeyMonitor {
  if ((input.platform ?? process.platform) !== "darwin") {
    return { setMode() {}, setComposerBounds() {}, dispose() {} };
  }
  const requireNative: (path: string) => NativeSearchKeyMonitor =
    input.requireNative ?? createRequire(import.meta.url);
  let native: NativeSearchKeyMonitor | null = null;
  let mode: "disabled" | "search" | "terminal" = "disabled";
  const load = () => {
    native ??= requireNative(path.join(__dirname, "native", "search-key-monitor.node"));
    return native;
  };
  return {
    setComposerBounds(bounds) {
      load().setComposerBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    },
    setMode(next) {
      if (next === mode) return;
      if (next !== "disabled") {
        if (mode !== "disabled") native?.stop();
        load().start(input.nativeViewHandle, input.onKey, next === "terminal");
        mode = next;
      } else {
        native?.stop();
        mode = "disabled";
      }
    },
    dispose() {
      native?.stop();
      mode = "disabled";
    },
  };
}
