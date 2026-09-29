import { describe, expect, it } from "@rstest/core";

import { threadRecapRevision } from "./environmentRecap.logic";

describe("Environment recap revision", () => {
  it("changes for real message content and turn settlement", () => {
    const rows = [
      {
        id: "message-1",
        kind: "message",
        message: { text: "hello", streaming: true },
      },
    ];
    expect(threadRecapRevision(rows, "running")).toBe("1:message-1:5:streaming:running");
    expect(
      threadRecapRevision(
        [
          {
            id: "message-1",
            kind: "message",
            message: { text: "hello world", streaming: false },
          },
        ],
        "completed",
      ),
    ).toBe("1:message-1:11:settled:completed");
  });

  it("ignores tool and work row churn", () => {
    const message = {
      id: "message-1",
      kind: "message",
      message: { text: "stable", streaming: false },
    };
    const initial = threadRecapRevision([message], "completed");
    expect(
      threadRecapRevision(
        [{ id: "work-1", kind: "work" }, message, { id: "working-1", kind: "working" }],
        "completed",
      ),
    ).toBe(initial);
  });
});
