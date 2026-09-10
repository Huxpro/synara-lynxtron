import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("sidebar evidence identity", () => {
  it("exposes stable project and thread ids on real sidebar rows", () => {
    const source = readFileSync(new URL("./Sidebar.tsx", import.meta.url), "utf8");
    expect(source).toContain("data-project-id={project.id}");
    expect(source.match(/data-thread-id=\{thread.id\}/g)).toHaveLength(2);
    expect(source.match(/data-project-id=\{thread.projectId\}/g)).toHaveLength(2);
  });
});
