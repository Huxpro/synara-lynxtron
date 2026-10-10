// FILE: keybindingDispatcher.lynx.tsx
// Purpose: Runs keybinding commands on Lynx. Surfaces register the commands they own with
//   `useKeybindingCommand`; `<KeybindingDispatcher>` (mounted once at the root) turns key
//   presses into those commands with upstream's rules.
// Layer: Lynx platform shell. Resolution is upstream's (`keybindingCommands.logic.ts`).
// Two sources deliver a command, and each command comes from exactly one of them:
//   - the root key listener (`global-bindkeydown`), the only source on Lynx for Web;
//   - the desktop host's menu accelerators, as the `shell:command` event. A key pressed in
//     a native text field does not reach the Lynx listener, so the dispatcher gives the
//     host the chord of every registered command and leaves those commands to it.
// Commands with a `shell:command` listener of their own (router, sidebar, composer) keep
// it; they move here by registering a handler.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useSyncExternalStore } from "@lynx-js/react";
import type { ResolvedKeybindingsConfig } from "@synara/contracts";
import { serverConfigQueryOptions } from "@synara-web/lib/serverReactQuery";

import { getNavigatorPlatform } from "../platform/env.lynx";
import { subscribeTerminalInputFocusOwner } from "../platform/inputFocusOwnership.lynx";
import {
  createKeybindingCommandRegistry,
  resolveCommandAccelerators,
  resolveRegisteredKeyCommand,
  type KeybindingCommandHandler,
  type LynxShortcutKeyEvent,
} from "./keybindingCommands.logic";

const EMPTY_KEYBINDINGS: ResolvedKeybindingsConfig = [];
const NO_COMMANDS: ReadonlySet<string> = new Set();

/** The one registry of the renderer. */
export const keybindingCommands = createKeybindingCommandRegistry();

let registeredCommandsSnapshot = "";
const readRegisteredCommands = () => {
  const next = keybindingCommands.commands().join("\n");
  if (next !== registeredCommandsSnapshot) registeredCommandsSnapshot = next;
  return registeredCommandsSnapshot;
};

/** Handles `command` while the calling component is mounted. */
export function useKeybindingCommand(command: string, handler: KeybindingCommandHandler): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    "background only";
    return keybindingCommands.register(command, () => handlerRef.current());
  }, [command]);
}

export function KeybindingDispatcher() {
  const config = useQuery(serverConfigQueryOptions());
  const keybindings = config.data?.keybindings ?? EMPTY_KEYBINDINGS;
  const registered = useSyncExternalStore(
    keybindingCommands.subscribe,
    readRegisteredCommands,
    readRegisteredCommands,
  );
  // Commands whose chord the desktop host owns; the key listener leaves them alone.
  const hostCommandsRef = useRef<ReadonlySet<string>>(NO_COMMANDS);
  const terminalFocusRef = useRef(false);
  useEffect(() => {
    "background only";
    return subscribeTerminalInputFocusOwner((owner) => {
      terminalFocusRef.current = owner !== null;
    });
  }, []);
  useEffect(() => {
    "background only";
    let active = true;
    let dispose: (() => void) | null = null;
    void import(/* webpackMode: "eager" */ "../platform/bridge")
      .then(({ onGlobalEvent }) => {
        if (!active) return;
        dispose = onGlobalEvent("shell:command", (command: unknown) => {
          if (typeof command === "string") keybindingCommands.run(command);
        });
      })
      .catch(() => {
        // No host events: the key listener is the only source.
      });
    return () => {
      active = false;
      dispose?.();
    };
  }, []);
  useEffect(() => {
    "background only";
    let active = true;
    const accelerators = resolveCommandAccelerators({
      commands: registered ? registered.split("\n") : [],
      keybindings,
      platform: getNavigatorPlatform(),
    });
    void import(/* webpackMode: "eager" */ "../platform/bridge")
      .then(({ bridgeCall }) =>
        bridgeCall<{ readonly accepted?: unknown }>("shellSetCommandAccelerators", {
          accelerators,
        }),
      )
      .then((reply) => {
        if (!active) return;
        hostCommandsRef.current = new Set(
          Array.isArray(reply?.accepted)
            ? reply.accepted.filter((command): command is string => typeof command === "string")
            : [],
        );
      })
      .catch(() => {
        // The Web host has no application menu; every command stays with the key listener.
        if (active) hostCommandsRef.current = NO_COMMANDS;
      });
    return () => {
      active = false;
    };
  }, [keybindings, registered]);
  const handleKeyDown = (event: LynxShortcutKeyEvent) => {
    "background only";
    const command = resolveRegisteredKeyCommand({
      event,
      keybindings,
      registered: keybindingCommands.commands(),
      skip: hostCommandsRef.current,
      context: { terminalFocus: terminalFocusRef.current },
    });
    if (command !== null) keybindingCommands.run(command);
  };
  return (
    <view
      style={{ position: "absolute", width: "0px", height: "0px" }}
      global-bindkeydown={handleKeyDown}
    />
  );
}
