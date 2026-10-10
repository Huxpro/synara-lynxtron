import { readFileSync } from "node:fs";

import { describe, expect, it } from "@rstest/core";

import {
  sidebarPendingApprovalColorClass,
  sidebarStatusGlyphLabel,
  sidebarTrailingClusterStatus,
} from "./sidebarStatusGlyph.logic";

const pill = { colorClass: "text-sky-600", dotClass: "bg-sky-500", pulse: false };

describe("sidebar status glyph", () => {
  it("names the glyph as upstream's SidebarStatusTrailingGlyph does", () => {
    expect(sidebarStatusGlyphLabel({ label: "Reminder" })).toBe("Snooze reminder");
    expect(sidebarStatusGlyphLabel({ label: "In Background", backgroundTaskCount: 1 })).toBe(
      "In background · 1 task",
    );
    expect(sidebarStatusGlyphLabel({ label: "In Background", backgroundTaskCount: 3 })).toBe(
      "In background · 3 tasks",
    );
    expect(sidebarStatusGlyphLabel({ label: "In Background" })).toBe("In background");
    for (const label of ["Pending Approval", "Awaiting Input", "Preparing worktree"] as const) {
      expect(sidebarStatusGlyphLabel({ label })).toBe(label);
    }
    // The strings are upstream's own.
    const upstream = readFileSync(
      new URL("../../../../web/src/components/SidebarStatusTrailingGlyph.tsx", import.meta.url),
      "utf8",
    );
    expect(upstream).toContain('aria-label="Snooze reminder"');
    expect(upstream).toContain(
      'count > 0 ? `In background · ${count} ${count === 1 ? "task" : "tasks"}` : "In background"',
    );
  });

  it("hands the trailing cluster the glyph's name and the pill's tone", () => {
    expect(sidebarTrailingClusterStatus(null)).toBeNull();
    expect(
      sidebarTrailingClusterStatus({ ...pill, label: "In Background", backgroundTaskCount: 2 }),
    ).toEqual({ ...pill, label: "In background · 2 tasks" });
    expect(
      sidebarTrailingClusterStatus({ ...pill, label: "Preparing worktree", pulse: true }),
    ).toEqual({ ...pill, label: "Preparing worktree", pulse: true });
  });

  it("marks a thread waiting on an approval with upstream's Pending word", () => {
    expect(
      sidebarPendingApprovalColorClass({ label: "Pending Approval", colorClass: "text-amber-600" }),
    ).toBe("text-amber-600");
    expect(
      sidebarPendingApprovalColorClass({ label: "Awaiting Input", colorClass: "text-indigo-600" }),
    ).toBeNull();
    expect(sidebarPendingApprovalColorClass(null)).toBeNull();
    const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
    // Every thread row passes it, and the word carries upstream's accessible name.
    const sidebar = read("./Sidebar.lynx.tsx");
    expect(sidebar.match(/<SidebarThreadRowComposition/g)?.length).toBe(
      sidebar.match(
        /pendingStatusColorClass=\{sidebarPendingApprovalColorClass\(\s*thread\.status,?\s*\)\}/g,
      )?.length,
    );
    expect(read("../../adapters/SidebarThreadIdentityElements.lynx.tsx")).toContain(
      'accessibility-label="Pending approval"',
    );
    // The state dot is upstream's 6px StatusDot centred in the 15px trailing slot.
    expect(read("../../adapters/sidebar-thread-status-indicator-elements.css")).toMatch(
      /\.LynxSidebarThreadStatus--idle\s*\{[^}]*width:\s*6px;[^}]*height:\s*6px;[^}]*margin-right:\s*4\.5px;[^}]*margin-left:\s*4\.5px;/s,
    );
  });
});
