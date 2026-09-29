import { describe, expect, it } from "vitest";
import { deriveSpaceActivityById } from "./spaceActivity";

describe("Space activity projection", () => {
  it("keeps the highest-priority tone per Space and ignores orphan threads", () => {
    expect([
      ...deriveSpaceActivityById({
        projects: [
          { id: "a", spaceId: "space-a" },
          { id: "void", spaceId: null },
        ],
        threads: [
          { projectId: "a", tone: "completed" as const },
          { projectId: "a", tone: "attention" as const },
          { projectId: "void", tone: "running" as const },
          { projectId: "missing", tone: "attention" as const },
        ],
        resolveTone: (thread) => thread.tone,
      }),
    ]).toEqual([
      ["space-a", "attention"],
      [null, "running"],
    ]);
  });
});
