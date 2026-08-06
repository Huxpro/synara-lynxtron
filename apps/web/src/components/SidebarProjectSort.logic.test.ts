import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  SIDEBAR_PROJECT_SORT_OPTIONS,
  SIDEBAR_THREAD_SORT_OPTIONS,
} from "./SidebarProjectSort.logic";

describe("sidebar sort option catalog", () => {
  it("matches the current sidebar copy for projects and threads", () => {
    expect(SIDEBAR_PROJECT_SORT_OPTIONS).toEqual([
      { value: "updated_at", label: "Last user message" },
      { value: "created_at", label: "Created at" },
      { value: "manual", label: "Manual" },
    ]);
    expect(SIDEBAR_THREAD_SORT_OPTIONS).toEqual([
      { value: "updated_at", label: "Last user message" },
      { value: "created_at", label: "Created at" },
    ]);
  });

  it("keeps the Web sidebar on the shared catalog", () => {
    const sidebarSource = fs.readFileSync(
      path.resolve(__dirname, "Sidebar.tsx"),
      "utf8",
    );
    expect(sidebarSource).toContain("SIDEBAR_PROJECT_SORT_OPTIONS.map");
    expect(sidebarSource).toContain("SIDEBAR_THREAD_SORT_OPTIONS.map");
    expect(sidebarSource).not.toContain("SIDEBAR_SORT_LABELS");
    expect(sidebarSource).not.toContain("SIDEBAR_THREAD_SORT_LABELS");
  });
});
