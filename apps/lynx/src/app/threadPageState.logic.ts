import type { ThreadTranscriptRow } from "./queries";
import { isRpcTransportError } from "../data/rpcTransport.logic";

export type ThreadPageBodyState =
  | { readonly kind: "loading" }
  | { readonly kind: "offline" }
  | { readonly kind: "error" }
  | { readonly kind: "empty" }
  | {
      readonly kind: "transcript";
      readonly rows: readonly ThreadTranscriptRow[];
      readonly refreshIssue: "offline" | "error" | null;
    };

export function resolveThreadPageBodyState(input: {
  readonly isPending: boolean;
  readonly error: unknown;
  readonly rows: readonly ThreadTranscriptRow[] | undefined;
}): ThreadPageBodyState {
  if (input.isPending) return { kind: "loading" };
  if (input.rows && input.rows.length > 0) {
    return {
      kind: "transcript",
      rows: input.rows,
      refreshIssue: input.error ? (isRpcTransportError(input.error) ? "offline" : "error") : null,
    };
  }
  if (input.error) {
    return { kind: isRpcTransportError(input.error) ? "offline" : "error" };
  }
  if (!input.rows || input.rows.length === 0) return { kind: "empty" };
  return { kind: "transcript", rows: input.rows, refreshIssue: null };
}
