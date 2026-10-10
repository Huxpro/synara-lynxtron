import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import {
  resolveProposedPlanCardPresentation,
  resolveTurnChangedFiles,
  resolveUserMessageAttachments,
} from "./transcriptRowCards.logic";
import { transcriptRowVersion } from "./transcriptRows.logic";

const planRow = (planMarkdown: string, updatedAt: string) =>
  ({
    kind: "proposed-plan",
    id: "plan-1",
    createdAt: updatedAt,
    proposedPlan: { id: "plan-1", planMarkdown, updatedAt },
  }) as never;

describe("proposed plan card", () => {
  it("shows the plan's heading as the title and the rest as the body", () => {
    const plan = resolveProposedPlanCardPresentation(
      "# Add a multiply function\n\n## Summary\n\nAdd `multiply`.\n",
    );
    expect(plan.title).toBe("Add a multiply function");
    expect(plan.displayedMarkdown.startsWith("# Add a multiply function")).toBe(false);
    expect(plan.displayedMarkdown).toContain("Add `multiply`.");
    expect(plan.collapsedPreviewMarkdown).toBeNull();
  });

  it("falls back to a generic title", () => {
    expect(resolveProposedPlanCardPresentation("Just do it.").title).toBe("Proposed plan");
  });

  it("collapses a plan longer than 20 lines or 900 characters to a preview", () => {
    const manyLines = ["# Long plan", ...Array.from({ length: 30 }, (_, i) => `- step ${i}`)].join(
      "\n",
    );
    const preview = resolveProposedPlanCardPresentation(manyLines).collapsedPreviewMarkdown;
    expect(preview).not.toBeNull();
    expect(preview!.split("\n").length).toBeLessThan(manyLines.split("\n").length);
    expect(
      resolveProposedPlanCardPresentation(`# Wide\n\n${"x".repeat(1000)}`).collapsedPreviewMarkdown,
    ).not.toBeNull();
  });

  it("re-renders the row when the plan text is replaced", () => {
    expect(transcriptRowVersion(planRow("# A", "2026-10-09T12:00:00.000Z"))).not.toBe(
      transcriptRowVersion(planRow("# A\n\nmore", "2026-10-09T12:00:01.000Z")),
    );
  });
});

describe("sent-message attachments", () => {
  const attachments = [
    { type: "image", id: "thread-1-aaaa", name: "diagram.png", sizeBytes: 2048 },
    { type: "file", id: "thread-1-bbbb", name: "notes.txt", sizeBytes: 26 },
    { type: "assistant-selection", id: "thread-1-cccc" },
  ];

  it("splits files and images and addresses images on the runtime endpoint", () => {
    const result = resolveUserMessageAttachments({
      attachments,
      runtimeSocketUrl: "ws://127.0.0.1:4004/ws?token=secret",
    });
    expect(result.files).toEqual([{ id: "thread-1-bbbb", name: "notes.txt", sizeLabel: "26 B" }]);
    expect(result.images).toEqual([
      {
        id: "thread-1-aaaa",
        name: "diagram.png",
        previewUrl: "http://127.0.0.1:4004/attachments/thread-1-aaaa?token=secret",
      },
    ]);
  });

  it("leaves the preview out until the endpoint is known", () => {
    expect(
      resolveUserMessageAttachments({ attachments, runtimeSocketUrl: null }).images[0]?.previewUrl,
    ).toBeNull();
    expect(
      resolveUserMessageAttachments({ attachments: undefined, runtimeSocketUrl: null }),
    ).toEqual({ files: [], images: [] });
  });
});

describe("end-of-turn changed files", () => {
  it("totals the stats and keeps one row per file in summary order", () => {
    expect(
      resolveTurnChangedFiles([
        { path: "README.md", additions: 1, deletions: 0 },
        { path: "src/math.ts", additions: 4 },
        { path: "src/old.ts", deletions: 3 },
      ]),
    ).toEqual({
      label: "Edited 3 files",
      additions: 5,
      deletions: 3,
      files: [
        { path: "README.md", additions: 1, deletions: 0 },
        { path: "src/math.ts", additions: 4, deletions: 0 },
        { path: "src/old.ts", additions: 0, deletions: 3 },
      ],
    });
    expect(resolveTurnChangedFiles([{ path: "a.ts" }]).label).toBe("Edited 1 file");
  });

  it("colours the stats with the decoration tokens, as upstream's DiffStatLabel", () => {
    const styles = readFileSync(new URL("./transcript-row-cards.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.TranscriptTurnChangesAdditions\s*\{[^}]*color:\s*var\(--color-decoration-added\);/s,
    );
    expect(styles).toMatch(
      /\.TranscriptTurnChangesDeletions\s*\{[^}]*color:\s*var\(--color-decoration-deleted\);/s,
    );
  });
});

describe("transcript row kinds", () => {
  it("renders every upstream row kind instead of falling through to a worktree label", () => {
    const source = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");
    for (const kind of ["proposed-plan", "user-input", "message-segment"]) {
      expect(source).toContain(`row.kind === "${kind}"`);
    }
    expect(source).toContain("<TranscriptUserAttachments");
    expect(source).toContain(
      '<ThreadErrorBanner error={entry.turnFailure.message} inline title="Task interrupted" />',
    );
  });

  it("matches the Web sent-message bubble and row metrics", () => {
    const rowStyles = readFileSync(
      new URL("../adapters/message-row-composition-elements.css", import.meta.url),
      "utf8",
    );
    const appStyles = readFileSync(new URL("./App.css", import.meta.url), "utf8");
    expect(rowStyles).toMatch(
      /\.SharedMessageUserBubble\s*\{[^}]*padding:\s*10px 14px;[^}]*border-width:\s*1px;/s,
    );
    expect(appStyles).toMatch(/\.TranscriptMessageRowUser\s*\{[^}]*padding-bottom:\s*16px;/s);
    expect(rowStyles).toMatch(/\.SharedMessageUserColumn\s*\{[^}]*gap:\s*1px;/s);
    expect(appStyles).toMatch(/\.TranscriptMessageFooter--user\s*\{[^}]*margin-top:\s*0;/s);
  });
});
