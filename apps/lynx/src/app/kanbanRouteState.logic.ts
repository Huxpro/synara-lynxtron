export type KanbanRecoverableErrorKind = "offline" | "error";

export type KanbanRouteState =
  | { readonly kind: "loading" }
  | { readonly kind: "offline" }
  | { readonly kind: "error" }
  | { readonly kind: "not-found" }
  | {
      readonly kind: "ready";
      readonly refreshIssue: KanbanRecoverableErrorKind | null;
    };

function classifyKanbanError(error: unknown): KanbanRecoverableErrorKind {
  return isRpcTransportError(error) ? "offline" : "error";
}

export function resolveKanbanOverviewRouteState(input: {
  readonly hasSnapshot: boolean;
  readonly isPending: boolean;
  readonly error: unknown;
}): Exclude<KanbanRouteState, { readonly kind: "not-found" }> {
  if (input.hasSnapshot) {
    return {
      kind: "ready",
      refreshIssue: input.error ? classifyKanbanError(input.error) : null,
    };
  }
  if (input.isPending) return { kind: "loading" };
  if (input.error) return { kind: classifyKanbanError(input.error) };
  return { kind: "loading" };
}

export function resolveKanbanProjectRouteState(input: {
  readonly hasSnapshot: boolean;
  readonly projectFound: boolean;
  readonly isPending: boolean;
  readonly error: unknown;
}): KanbanRouteState {
  if (input.projectFound) {
    return {
      kind: "ready",
      refreshIssue: input.error ? classifyKanbanError(input.error) : null,
    };
  }
  if (input.isPending) return { kind: "loading" };
  if (input.error) return { kind: classifyKanbanError(input.error) };
  if (input.hasSnapshot) return { kind: "not-found" };
  return { kind: "loading" };
}
import { isRpcTransportError } from "../data/rpcTransport.logic";
