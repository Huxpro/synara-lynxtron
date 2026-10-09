// Typed RPC failure details across the Lynxtron host relay.
//
// The server answers a failed RPC with an Effect `Exit` whose cause carries the
// typed error (`code`, `retryAfterMs`, `retryable`). The host used to flatten
// that into a message string; the shared `WsTransport` compat needs the code to
// apply the upstream stream-admission policy (capacity, duplicate lease,
// snapshot bootstrap, resnapshot), so both hosts extract these fields here and
// send them next to `error`/`errorKind` in the bridge reply.

export interface RpcFailureDetails {
  readonly code: string | null;
  readonly retryAfterMs: number | null;
  readonly retryable: boolean | null;
}

function detailsOfTypedError(error: unknown): RpcFailureDetails | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as {
    readonly code?: unknown;
    readonly retryAfterMs?: unknown;
    readonly retryable?: unknown;
  };
  if (typeof candidate.code !== "string") return null;
  return {
    code: candidate.code,
    retryAfterMs:
      typeof candidate.retryAfterMs === "number" && Number.isFinite(candidate.retryAfterMs)
        ? candidate.retryAfterMs
        : null,
    retryable: typeof candidate.retryable === "boolean" ? candidate.retryable : null,
  };
}

/**
 * The first typed failure in an encoded Effect cause. Accepts the reason list
 * (`[{ _tag: "Fail", error }, …]`) and the nested `Sequential`/`Parallel` tree
 * older encodings used; anything else (defects, interrupts) yields `null`.
 */
export function describeRpcFailureCause(cause: unknown, depth = 0): RpcFailureDetails | null {
  if (!cause || typeof cause !== "object" || depth > 8) return null;
  if (Array.isArray(cause)) {
    for (const reason of cause) {
      const details = describeRpcFailureCause(reason, depth + 1);
      if (details) return details;
    }
    return null;
  }
  const node = cause as {
    readonly _tag?: unknown;
    readonly error?: unknown;
    readonly left?: unknown;
    readonly right?: unknown;
  };
  if (node._tag === "Fail") return detailsOfTypedError(node.error);
  if (node._tag === "Sequential" || node._tag === "Parallel") {
    return (
      describeRpcFailureCause(node.left, depth + 1) ??
      describeRpcFailureCause(node.right, depth + 1)
    );
  }
  return null;
}

/** Bridge reply field carrying the details; absent when the failure is untyped. */
export const RPC_FAILURE_REPLY_FIELD = "errorDetails";

export function readRpcFailureDetails(error: unknown): RpcFailureDetails | null {
  if (!error || typeof error !== "object" || !("rpcFailure" in error)) return null;
  return detailsOfTypedError((error as { readonly rpcFailure?: unknown }).rpcFailure);
}

/** Spread into a bridge error reply. */
export function rpcFailureReplyFields(error: unknown): {
  readonly errorDetails?: RpcFailureDetails;
} {
  const details = readRpcFailureDetails(error);
  return details ? { [RPC_FAILURE_REPLY_FIELD]: details } : {};
}

/** Renderer side: the details of a bridge error reply, or `null`. */
export function parseRpcFailureReply(reply: unknown): RpcFailureDetails | null {
  if (!reply || typeof reply !== "object" || !(RPC_FAILURE_REPLY_FIELD in reply)) return null;
  return detailsOfTypedError((reply as Record<string, unknown>)[RPC_FAILURE_REPLY_FIELD]);
}
