import { describe, expect, it } from "@rstest/core";

import {
  readArchiveDeletesOrphanedWorktree,
  writeArchiveDeletesOrphanedWorktree,
} from "./archiveWorktreeSetting.logic";

describe("Delete worktree on archive setting", () => {
  it("defaults to off, as upstream's schema does", () => {
    expect(readArchiveDeletesOrphanedWorktree(null)).toBe(false);
    expect(readArchiveDeletesOrphanedWorktree("{}")).toBe(false);
    expect(readArchiveDeletesOrphanedWorktree("not json")).toBe(false);
    expect(readArchiveDeletesOrphanedWorktree('{"archiveDeletesOrphanedWorktree":"yes"}')).toBe(
      false,
    );
  });

  it("writes only its key and keeps every key it does not know", () => {
    const raw = JSON.stringify({
      anchorSentMessagesToTop: false,
      someFutureSetting: { nested: [1, 2] },
      archiveDeletesOrphanedWorktree: false,
    });
    const next = writeArchiveDeletesOrphanedWorktree(raw, true);
    expect(JSON.parse(next)).toEqual({
      anchorSentMessagesToTop: false,
      someFutureSetting: { nested: [1, 2] },
      archiveDeletesOrphanedWorktree: true,
    });
    expect(readArchiveDeletesOrphanedWorktree(next)).toBe(true);
    expect(JSON.parse(writeArchiveDeletesOrphanedWorktree(null, true))).toEqual({
      archiveDeletesOrphanedWorktree: true,
    });
  });
});
