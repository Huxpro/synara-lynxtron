// FILE: keybindingCommands.logic.ts
// Purpose: The pure half of the Lynx keybinding command dispatcher: which command a key
//   press is, who handles a command, and which chord the desktop host should own for it.
// Layer: Lynx logic over upstream's keybindings.ts. Rules, the `mod` mapping, `when`
//   clauses, the fallback table and the command ids are upstream's; nothing is restated.
// Why: upstream has no central dispatcher. Each surface adds a `window` keydown listener,
//   resolves the event with `resolveShortcutCommand` and acts on the commands it owns.
//   Lynx has one root key listener (and, on the desktop host, menu accelerators), so the
//   surfaces register their commands here instead.

import type {
  KeybindingCommand,
  KeybindingShortcut,
  ResolvedKeybindingsConfig,
} from "@synara/contracts";
import {
  resolveKeybindingForCommand,
  resolveShortcutCommand,
  type ShortcutEventLike,
  type ShortcutMatchContext,
} from "@synara-web/keybindings";
import { isMacPlatform } from "@synara-web/lib/utils";

/** What a Lynx `keydown` carries (`BaseKeyEvent`); a host may leave a modifier out. */
export interface LynxShortcutKeyEvent {
  readonly key?: unknown;
  readonly code?: string;
  readonly repeat?: boolean;
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
}

/** The event upstream's matcher reads, with absent modifiers as not pressed. */
export function shortcutEventFromLynxKey(event: LynxShortcutKeyEvent): ShortcutEventLike {
  return {
    type: "keydown",
    key: event.key,
    ...(typeof event.code === "string" ? { code: event.code } : {}),
    metaKey: event.metaKey === true,
    ctrlKey: event.ctrlKey === true,
    shiftKey: event.shiftKey === true,
    altKey: event.altKey === true,
    repeat: event.repeat === true,
  };
}

/** Returns false to say the command did not apply here, so an outer handler may run. */
export type KeybindingCommandHandler = () => boolean | void;

export interface KeybindingCommandRegistry {
  /** The most recently registered handler of a command runs first, as the innermost surface. */
  register(command: string, handler: KeybindingCommandHandler): () => void;
  /** True when a handler took the command. */
  run(command: string): boolean;
  /** The commands that have a handler, sorted. */
  commands(): readonly string[];
  /** Called when the set of handled commands changes. */
  subscribe(listener: () => void): () => void;
}

export function createKeybindingCommandRegistry(): KeybindingCommandRegistry {
  const handlersByCommand = new Map<string, KeybindingCommandHandler[]>();
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  return {
    register(command, handler) {
      const handlers = handlersByCommand.get(command) ?? [];
      const first = handlers.length === 0;
      handlers.push(handler);
      handlersByCommand.set(command, handlers);
      if (first) notify();
      let registered = true;
      return () => {
        if (!registered) return;
        registered = false;
        const current = handlersByCommand.get(command);
        if (!current) return;
        const index = current.lastIndexOf(handler);
        if (index >= 0) current.splice(index, 1);
        if (current.length === 0) {
          handlersByCommand.delete(command);
          notify();
        }
      };
    },
    run(command) {
      const handlers = handlersByCommand.get(command);
      if (!handlers) return false;
      for (let index = handlers.length - 1; index >= 0; index -= 1) {
        if (handlers[index]?.() !== false) return true;
      }
      return false;
    },
    commands: () => [...handlersByCommand.keys()].sort(),
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * The registered command a key press stands for, or null. A press that resolves to a
 * command nobody registered is left alone, as upstream's listeners ignore commands that
 * are not theirs. `skip` holds the commands another source already delivers (the desktop
 * host's menu accelerators), so one press cannot run a command twice.
 */
export function resolveRegisteredKeyCommand(input: {
  readonly event: LynxShortcutKeyEvent;
  readonly keybindings: ResolvedKeybindingsConfig;
  readonly registered: readonly string[];
  readonly skip?: ReadonlySet<string>;
  readonly context?: Partial<ShortcutMatchContext>;
  readonly platform?: string;
}): string | null {
  // Upstream's tab listener ignores auto-repeat; a held chord must not run through the strip.
  if (input.event.repeat === true) return null;
  const command = resolveShortcutCommand(shortcutEventFromLynxKey(input.event), input.keybindings, {
    ...(input.platform !== undefined ? { platform: input.platform } : {}),
    ...(input.context ? { context: input.context } : {}),
  });
  if (command === null || !input.registered.includes(command)) return null;
  return input.skip?.has(command) ? null : command;
}

const ACCELERATOR_KEY_NAMES: Readonly<Record<string, string>> = {
  arrowup: "Up",
  arrowdown: "Down",
  arrowleft: "Left",
  arrowright: "Right",
  pageup: "PageUp",
  pagedown: "PageDown",
  home: "Home",
  end: "End",
  enter: "Enter",
  tab: "Tab",
  escape: "Esc",
  backspace: "Backspace",
  delete: "Delete",
  " ": "Space",
  "+": "Plus",
};

function acceleratorKeyName(key: string): string | null {
  const named = ACCELERATOR_KEY_NAMES[key];
  if (named) return named;
  if (/^f([1-9]|1[0-9]|2[0-4])$/.test(key)) return key.toUpperCase();
  // One printable character: letters, digits and punctuation name themselves.
  return key.length === 1 ? key.toUpperCase() : null;
}

/**
 * The menu accelerator for a shortcut, in the host's `Cmd+Ctrl+Right` notation, with
 * upstream's `mod` mapping (Cmd on macOS, Ctrl elsewhere). Null for a key the notation
 * cannot name, which then stays with the key listener.
 */
export function menuAcceleratorForShortcut(
  shortcut: KeybindingShortcut,
  platform: string,
): string | null {
  const key = acceleratorKeyName(shortcut.key);
  if (key === null) return null;
  const mac = isMacPlatform(platform);
  const parts: string[] = [];
  if (shortcut.metaKey || (shortcut.modKey && mac)) parts.push(mac ? "Cmd" : "Super");
  if (shortcut.ctrlKey || (shortcut.modKey && !mac)) parts.push("Ctrl");
  if (shortcut.altKey) parts.push("Alt");
  if (shortcut.shiftKey) parts.push("Shift");
  // A bare key belongs to whatever is being typed in; the host must not take it.
  if (parts.length === 0 || (parts.length === 1 && parts[0] === "Shift")) return null;
  return [...parts, key].join("+");
}

export interface CommandAccelerator {
  readonly command: string;
  readonly accelerator: string;
}

/**
 * The chord each registered command is bound to right now (configured rules first, then
 * upstream's fallback table), for the desktop host to own as a menu accelerator: a key
 * pressed in a native text field never reaches the Lynx key listener.
 */
export function resolveCommandAccelerators(input: {
  readonly commands: readonly string[];
  readonly keybindings: ResolvedKeybindingsConfig;
  readonly platform: string;
  readonly context?: Partial<ShortcutMatchContext>;
}): CommandAccelerator[] {
  const accelerators: CommandAccelerator[] = [];
  const taken = new Set<string>();
  for (const command of input.commands) {
    const binding = resolveKeybindingForCommand(input.keybindings, command as KeybindingCommand, {
      platform: input.platform,
      ...(input.context ? { context: input.context } : {}),
    });
    if (!binding) continue;
    const accelerator = menuAcceleratorForShortcut(binding.shortcut, input.platform);
    if (accelerator === null || taken.has(accelerator)) continue;
    taken.add(accelerator);
    accelerators.push({ command, accelerator });
  }
  return accelerators;
}
