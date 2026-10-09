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
});
