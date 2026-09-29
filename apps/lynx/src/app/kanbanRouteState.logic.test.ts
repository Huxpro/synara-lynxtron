import { describe, expect, it } from "@rstest/core";

import {
  resolveKanbanOverviewRouteState,
  resolveKanbanProjectRouteState,
} from "./kanbanRouteState.logic";
import { RpcTransportError } from "../data/rpcTransport.logic";

describe("Kanban route state", () => {
  it("separates transport failures from ordinary load errors", () => {
    expect(
      resolveKanbanOverviewRouteState({
        hasSnapshot: false,
        isPending: false,
        error: new RpcTransportError("WebSocket closed"),
      }),
    ).toEqual({ kind: "offline" });
    expect(
      resolveKanbanOverviewRouteState({
        hasSnapshot: false,
        isPending: false,
        error: new Error("Malformed snapshot"),
      }),
    ).toEqual({ kind: "error" });
  });

  it("preserves last-known-good content across refresh failures", () => {
    expect(
      resolveKanbanOverviewRouteState({
        hasSnapshot: true,
        isPending: false,
        error: new RpcTransportError("network unavailable"),
      }),
    ).toEqual({ kind: "ready", refreshIssue: "offline" });
    expect(
      resolveKanbanProjectRouteState({
        hasSnapshot: true,
        projectFound: true,
        isPending: false,
        error: new Error("Malformed snapshot"),
      }),
    ).toEqual({ kind: "ready", refreshIssue: "error" });
  });

  it("distinguishes a successful missing project from empty columns", () => {
    expect(
      resolveKanbanProjectRouteState({
        hasSnapshot: true,
        projectFound: false,
        isPending: false,
        error: null,
      }),
    ).toEqual({ kind: "not-found" });
  });
});
