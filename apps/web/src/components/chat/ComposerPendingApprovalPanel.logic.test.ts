import { describe, expect, it } from "vitest";

import {
  APPROVAL_ACTIONS,
  APPROVAL_KIND_PROMPT,
  parseApprovalDetail,
  shortenApprovalPath,
} from "./ComposerPendingApprovalPanel.logic";

describe("pending approval presentation", () => {
  it("keeps the shared decision order and copy", () => {
    expect(APPROVAL_ACTIONS.map((action) => [action.label, action.decision])).toEqual([
      ["Approve once", "accept"],
      ["Always allow this session", "acceptForSession"],
      ["Decline", "decline"],
      ["Cancel turn", "cancel"],
    ]);
    expect(APPROVAL_KIND_PROMPT.command).toBe("Approve this command?");
  });

  it("parses command and file request details", () => {
    expect(parseApprovalDetail('Bash: {"command":"printf ok"}')).toMatchObject({
      tool: "Bash",
      command: "printf ok",
    });
    expect(parseApprovalDetail('Write: {"file_path":"/Users/me/project/file.ts"}')).toMatchObject({
      tool: "Write",
      fileName: "file.ts",
      fileDir: "/Users/me/project",
    });
    expect(shortenApprovalPath("/Users/me/project/src")).toBe("~/project/src");
  });
});
