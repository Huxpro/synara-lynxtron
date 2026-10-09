import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import {
  resolveLatestProjectTargetIdWithFallback,
  resolveNewThreadTarget,
} from "@synara-web/lib/projectShortcutTargets";

describe("Native sidebar New thread target", () => {
  it("opens the focused project, else the latest, like the web sidebar", () => {
    const source = readFileSync(new URL("./Sidebar.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain("onActivate: openPrimaryNewThread,");
    expect(source).toContain("resolveNewThreadTarget({");
    expect(source).toContain("setLatestProjectId(ProjectId.makeUnsafe(activeProject.id))");
    expect(source).toContain("`/new-thread/${encodeURIComponent(target.projectId)}`");

    const projects = [
      { id: "home" as never, kind: "home" as never, updatedAt: "2026-09-29T10:00:00Z" },
      { id: "app" as never, kind: "project" as never, updatedAt: "2026-09-29T09:00:00Z" },
    ];
    expect(
      resolveNewThreadTarget({
        currentProjectId: null,
        latestUsableProjectId: resolveLatestProjectTargetIdWithFallback(projects, null),
      })?.projectId,
    ).toBe("app");
  });
});
