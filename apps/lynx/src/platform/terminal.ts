import "background-only";

import type {
  TerminalAckOutputInput,
  TerminalCloseInput,
  TerminalOpenInput,
  TerminalResizeInput,
  TerminalSessionSnapshot,
  TerminalWriteInput,
} from "@synara/contracts";

import { bridgeCall } from "./bridge";

interface NativeRpcResult<T> {
  readonly _tag: "NativeRpcResult";
  readonly value: T;
}

function isNativeRpcResult<T>(result: T | NativeRpcResult<T>): result is NativeRpcResult<T> {
  return (
    typeof result === "object" &&
    result !== null &&
    "_tag" in result &&
    result._tag === "NativeRpcResult" &&
    "value" in result
  );
}

export function unwrapTerminalBridgeResult<T>(result: T | NativeRpcResult<T>): T {
  return isNativeRpcResult(result) ? result.value : result;
}

async function callTerminalBridge<T>(name: string, input: Record<string, unknown>): Promise<T> {
  return unwrapTerminalBridgeResult(await bridgeCall<T | NativeRpcResult<T>>(name, input));
}

async function withTerminalRuntimeEndpoint<T extends Record<string, unknown>>(
  input: T,
): Promise<T & { readonly baseUrl?: string }> {
  const runtime = await bridgeCall<{ readonly wsUrl?: unknown }>("runtimeGetSynaraWsUrl").catch(
    () => null,
  );
  const baseUrl = typeof runtime?.wsUrl === "string" ? runtime.wsUrl.trim() : "";
  return baseUrl ? { ...input, baseUrl } : input;
}

export const platformTerminal = {
  ackOutput: async (input: TerminalAckOutputInput): Promise<void> => {
    await callTerminalBridge("terminalAckOutput", await withTerminalRuntimeEndpoint(input));
  },
  open: async (input: TerminalOpenInput): Promise<TerminalSessionSnapshot> =>
    callTerminalBridge("terminalOpen", await withTerminalRuntimeEndpoint(input)),
  write: async (input: TerminalWriteInput): Promise<void> => {
    await callTerminalBridge("terminalWrite", await withTerminalRuntimeEndpoint(input));
  },
  resize: async (input: TerminalResizeInput): Promise<void> => {
    await callTerminalBridge("terminalResize", await withTerminalRuntimeEndpoint(input));
  },
  close: async (input: TerminalCloseInput): Promise<void> => {
    await callTerminalBridge("terminalClose", await withTerminalRuntimeEndpoint(input));
  },
};
