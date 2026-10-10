import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Native embedded Side-chat pane", () => {
  it("reads the Side thread from the shared store without changing the primary route", () => {
    const source = readFileSync(
      new URL("./EmbeddedSidechatPane.lynx.tsx", import.meta.url),
      "utf8",
    );
    const router = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    // Session sync leases the dock's active Side thread (the dock is mirrored into
    // upstream's dock store); the pane has no request, query key or invalidation.
    expect(source).toContain("useThreadPageData(props.threadId, { retain: false })");
    expect(source).not.toMatch(/useQuery|queryKey|invalidateQueries|ensureNativeApi/);
    const dockState = readFileSync(new URL("./rightDockState.lynx.ts", import.meta.url), "utf8");
    expect(dockState).toContain("useRightDockStore.setState({ dockStateByThreadId: readAll() })");
    expect(source).toContain("<Transcript");
    expect(source).toContain("<Composer");
    expect(source).toContain("<ChatSurfaceHeaderFrame");
    expect(source).toContain("<ChatSurfaceHeaderIdentity");
    expect(source).toContain('accessibleLabel: "Close selected Side"');
    expect(source).toContain("threadId={props.threadId}");
    expect(source).toContain("props.onTitleChange?.(summary.title)");
    expect(source).not.toContain("history.push");
    expect(router).toContain('activePane?.kind === "sidechat"');
    expect(router).toContain("threadId={activePane.threadId}");
  });

  it("filters fork-import history in the shared transcript projection", () => {
    const queries = readFileSync(
      new URL("./threadPageProjection.logic.ts", import.meta.url),
      "utf8",
    );
    expect(queries).toContain("filterSidechatTranscriptMessages(");
    expect(queries).toContain("Boolean(thread.sidechatSourceThreadId)");
    expect(queries).toContain("visibleMessages as Parameters<typeof deriveTimelineEntries>[0]");
  });
});
