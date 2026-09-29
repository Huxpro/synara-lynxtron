import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Native embedded Side-chat pane", () => {
  it("uses the canonical thread-detail cache shape without changing the primary route", () => {
    const source = readFileSync(
      new URL("./EmbeddedSidechatPane.lynx.tsx", import.meta.url),
      "utf8",
    );
    const router = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    expect(source).toContain('queryKey: ["thread-detail", props.threadId]');
    expect(source).toContain("return { data: rows, summary };");
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
    const queries = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
    expect(queries).toContain("filterSidechatTranscriptMessages(");
    expect(queries).toContain("Boolean(thread.sidechatSourceThreadId)");
    expect(queries).toContain("visibleMessages as Parameters<typeof deriveTimelineEntries>[0]");
  });
});
