import { describe, expect, it } from "@rstest/core";

import { resolveThreadPageBodyState } from "./threadPageState.logic";
import { RpcTransportError } from "../data/rpcTransport.logic";

describe("resolveThreadPageBodyState", () => {
  it("keeps the initial query in a loading state", () => {
    expect(resolveThreadPageBodyState({ isPending: true, error: null, rows: undefined })).toEqual({
      kind: "loading",
    });
  });

  it("separates transport failures from ordinary query errors", () => {
    expect(
      resolveThreadPageBodyState({
        isPending: false,
        error: new RpcTransportError("Synara RPC socket closed"),
        rows: undefined,
      }),
    ).toEqual({ kind: "offline" });
    expect(
      resolveThreadPageBodyState({
        isPending: false,
        error: new Error("Malformed snapshot"),
        rows: undefined,
      }),
    ).toEqual({ kind: "error" });
    expect(
      resolveThreadPageBodyState({
        isPending: false,
        error: new Error("Thread session closed"),
        rows: undefined,
      }),
    ).toEqual({ kind: "error" });
  });

  it("uses the shared empty hero only after a successful empty result", () => {
    expect(resolveThreadPageBodyState({ isPending: false, error: null, rows: [] })).toEqual({
      kind: "empty",
    });
  });

  it("passes successful rows through to the production transcript", () => {
    const rows = [{ kind: "working", id: "working", createdAt: null }] as const;
    expect(resolveThreadPageBodyState({ isPending: false, error: null, rows })).toEqual({
      kind: "transcript",
      rows,
      refreshIssue: null,
    });
  });

  it("keeps last-known-good transcript rows during a transport failure", () => {
    const rows = [{ kind: "working", id: "working", createdAt: null }] as const;
    expect(
      resolveThreadPageBodyState({
        isPending: false,
        error: new RpcTransportError("socket closed"),
        rows,
      }),
    ).toEqual({ kind: "transcript", rows, refreshIssue: "offline" });
  });
});
