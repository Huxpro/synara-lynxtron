import { describe, expect, it } from "@rstest/core";
import {
  STATIC_KEYBINDING_COMMANDS,
  type KeybindingShortcut,
  type ResolvedKeybindingsConfig,
} from "@synara/contracts";
import { DEFAULT_SHORTCUT_FALLBACKS } from "@synara-web/keybindings";

import {
  createKeybindingCommandRegistry,
  menuAcceleratorForShortcut,
  resolveCommandAccelerators,
  resolveRegisteredKeyCommand,
  shortcutEventFromLynxKey,
} from "./keybindingCommands.logic";

const MAC = "MacIntel";
const LINUX = "Linux x86_64";
const NONE: ResolvedKeybindingsConfig = [];
const TAB_COMMANDS = ["threadTab.next", "threadTab.previous"];

const shortcut = (
  key: string,
  overrides: Partial<KeybindingShortcut> = {},
): KeybindingShortcut => ({
  key,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  modKey: false,
  ...overrides,
});

describe("shortcutEventFromLynxKey", () => {
  it("reads absent modifiers as not pressed", () => {
    expect(shortcutEventFromLynxKey({ key: "ArrowRight", metaKey: true })).toEqual({
      type: "keydown",
      key: "ArrowRight",
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      repeat: false,
    });
  });
});

describe("resolveRegisteredKeyCommand", () => {
  const press = (event: Parameters<typeof shortcutEventFromLynxKey>[0], platform = MAC) =>
    resolveRegisteredKeyCommand({ event, keybindings: NONE, registered: TAB_COMMANDS, platform });

  it("resolves upstream's shipped tab chords on macOS", () => {
    expect(press({ key: "ArrowRight", metaKey: true, ctrlKey: true })).toBe("threadTab.next");
    expect(press({ key: "ArrowLeft", metaKey: true, ctrlKey: true })).toBe("threadTab.previous");
    expect(press({ key: "ArrowRight", metaKey: true })).toBeNull();
    expect(press({ key: "ArrowRight", ctrlKey: true })).toBeNull();
  });

  it("resolves the other platforms' chords, and yields them to a focused terminal", () => {
    expect(press({ key: "PageDown", ctrlKey: true }, LINUX)).toBe("threadTab.next");
    expect(press({ key: "PageUp", ctrlKey: true }, LINUX)).toBe("threadTab.previous");
    expect(
      resolveRegisteredKeyCommand({
        event: { key: "PageDown", ctrlKey: true },
        keybindings: NONE,
        registered: TAB_COMMANDS,
        platform: LINUX,
        context: { terminalFocus: true },
      }),
    ).toBeNull();
  });

  it("prefers a configured rule over the fallback table", () => {
    const keybindings: ResolvedKeybindingsConfig = [
      { command: "threadTab.next", shortcut: shortcut("j", { modKey: true, altKey: true }) },
    ];
    const resolve = (event: Parameters<typeof shortcutEventFromLynxKey>[0]) =>
      resolveRegisteredKeyCommand({ event, keybindings, registered: TAB_COMMANDS, platform: MAC });
    expect(resolve({ key: "j", metaKey: true, altKey: true })).toBe("threadTab.next");
    // The configured command no longer takes its fallback chord; the other one keeps its own.
    expect(resolve({ key: "ArrowRight", metaKey: true, ctrlKey: true })).toBeNull();
    expect(resolve({ key: "ArrowLeft", metaKey: true, ctrlKey: true })).toBe("threadTab.previous");
  });

  it("ignores auto-repeat, unregistered commands and commands the host delivers", () => {
    expect(press({ key: "ArrowRight", metaKey: true, ctrlKey: true, repeat: true })).toBeNull();
    // mod+N is chat.new, which has no registered handler here.
    expect(press({ key: "n", metaKey: true })).toBeNull();
    expect(
      resolveRegisteredKeyCommand({
        event: { key: "ArrowRight", metaKey: true, ctrlKey: true },
        keybindings: NONE,
        registered: TAB_COMMANDS,
        skip: new Set(["threadTab.next"]),
        platform: MAC,
      }),
    ).toBeNull();
  });
});

describe("createKeybindingCommandRegistry", () => {
  it("runs the innermost handler and falls through one that declines", () => {
    const registry = createKeybindingCommandRegistry();
    const calls: string[] = [];
    registry.register("threadTab.next", () => void calls.push("outer"));
    const disposeInner = registry.register("threadTab.next", () => {
      calls.push("inner");
      return false;
    });
    expect(registry.run("threadTab.next")).toBe(true);
    expect(calls).toEqual(["inner", "outer"]);
    disposeInner();
    disposeInner();
    expect(registry.run("threadTab.next")).toBe(true);
    expect(calls).toEqual(["inner", "outer", "outer"]);
    expect(registry.run("threadTab.previous")).toBe(false);
  });

  it("announces a change only when the set of handled commands changes", () => {
    const registry = createKeybindingCommandRegistry();
    let changes = 0;
    const unsubscribe = registry.subscribe(() => {
      changes += 1;
    });
    const first = registry.register("threadTab.next", () => {});
    const second = registry.register("threadTab.next", () => {});
    registry.register("threadTab.previous", () => {});
    expect(changes).toBe(2);
    expect(registry.commands()).toEqual(["threadTab.next", "threadTab.previous"]);
    second();
    expect(changes).toBe(2);
    first();
    expect(changes).toBe(3);
    expect(registry.commands()).toEqual(["threadTab.previous"]);
    unsubscribe();
  });
});

describe("menu accelerators for the desktop host", () => {
  it("maps mod per platform and names keys as the menu does", () => {
    const next = shortcut("arrowright", { modKey: true, ctrlKey: true });
    expect(menuAcceleratorForShortcut(next, MAC)).toBe("Cmd+Ctrl+Right");
    expect(menuAcceleratorForShortcut(shortcut("pagedown", { ctrlKey: true }), LINUX)).toBe(
      "Ctrl+PageDown",
    );
    expect(menuAcceleratorForShortcut(shortcut("k", { modKey: true, shiftKey: true }), MAC)).toBe(
      "Cmd+Shift+K",
    );
    expect(menuAcceleratorForShortcut(shortcut("k", { modKey: true }), LINUX)).toBe("Ctrl+K");
  });

  it("leaves bare keys and keys the notation cannot name to the key listener", () => {
    expect(menuAcceleratorForShortcut(shortcut("j"), MAC)).toBeNull();
    expect(menuAcceleratorForShortcut(shortcut("j", { shiftKey: true }), MAC)).toBeNull();
    expect(menuAcceleratorForShortcut(shortcut("unassigned", { modKey: true }), MAC)).toBeNull();
  });

  it("gives each registered command its effective chord", () => {
    expect(
      resolveCommandAccelerators({ commands: TAB_COMMANDS, keybindings: NONE, platform: MAC }),
    ).toEqual([
      { command: "threadTab.next", accelerator: "Cmd+Ctrl+Right" },
      { command: "threadTab.previous", accelerator: "Cmd+Ctrl+Left" },
    ]);
    const keybindings: ResolvedKeybindingsConfig = [
      { command: "threadTab.next", shortcut: shortcut("unassigned") },
    ];
    // A command the user left without a shortcut gets no accelerator.
    expect(
      resolveCommandAccelerators({ commands: TAB_COMMANDS, keybindings, platform: MAC }),
    ).toEqual([{ command: "threadTab.previous", accelerator: "Cmd+Ctrl+Left" }]);
  });
});

describe("upstream's command table", () => {
  it("still has the tab commands this dispatcher is first used for", () => {
    for (const command of TAB_COMMANDS) {
      expect(STATIC_KEYBINDING_COMMANDS).toContain(command);
      expect(DEFAULT_SHORTCUT_FALLBACKS.some((binding) => binding.command === command)).toBe(true);
    }
  });
});
