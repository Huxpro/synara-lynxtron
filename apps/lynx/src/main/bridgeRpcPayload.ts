/**
 * Renderer RPCs send their payload as `payloadJson` because the Lynx bridge drops
 * null-valued keys while marshalling objects. Restores `payload` for the RPC relay.
 */
export function decodeBridgeRpcData<T extends { readonly payloadJson?: unknown }>(
  data: T,
): T & { readonly payload?: unknown } {
  if (typeof data?.payloadJson !== "string") return data;
  const { payloadJson, ...rest } = data;
  return { ...rest, payload: JSON.parse(payloadJson) as unknown } as T & {
    readonly payload?: unknown;
  };
}
