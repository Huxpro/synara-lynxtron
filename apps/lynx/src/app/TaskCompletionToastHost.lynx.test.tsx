import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import { describe, expect, it, rs } from "@rstest/core";
import { readFileSync } from "node:fs";

import type { ThreadSummary } from "./queries";
import { makeThreadSummary } from "./queriesTestFixtures";
import { TaskCompletionToastHost } from "./TaskCompletionToastHost.lynx";

function summary(overrides: Partial<ThreadSummary> = {}): ThreadSummary {
  return makeThreadSummary({
    id: "thread-1",
    projectId: "project-1",
    project: "Synara",
    title: "Background task",
    messageCount: 0,
    updatedAt: new Date(Date.now() + 1_000).toISOString(),
    live: false,
    hasPendingApprovals: false,
    hasPendingUserInput: false,
    ...overrides,
  });
}

describe("Lynx task completion toast host", () => {
  it("matches the Web max-sm notification width without expanding at compact viewports", () => {
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.AppNotificationStack\s*\{[^}]*width:\s*384px;[^}]*max-width:\s*calc\(100vw - 24px\);/s,
    );
    expect(styles).toMatch(
      /\.TaskCompletionToast\s*\{[^}]*position:\s*relative;[^}]*width:\s*100%;/s,
    );
    expect(styles).toMatch(
      /\.ProviderUpdatePrompt\s*\{[^}]*position:\s*relative;[^}]*width:\s*100%;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.AppNotificationStack\s*\{[^}]*top:\s*8px;[^}]*\}/s,
    );
  });

  it("keeps slow completion detail delivery alive across later shell polls", () => {
    const source = readFileSync(
      new URL("./TaskCompletionToastHost.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("const mountedRef = useRef(true);");
    expect(source).toContain("const completionRunRef = useRef(0);");
    expect(source).toContain("completionRun === completionRunRef.current");
    expect(source).toContain("currentSettings.enableSystemTaskCompletionNotifications");
    expect(source).toContain('notification.kind !== "thread-completion"');
    expect(source).toContain('notification.kind === "thread-completion"');
    expect(source).not.toContain("let active = true;");
  });

  it("suppresses hydration and renders an off-screen completion transition", async () => {
    const onOpenThread = rs.fn();
    const { rerender } = render(
      <TaskCompletionToastHost
        activeThreadId={null}
        threads={[summary({ live: true })]}
        onOpenThread={onOpenThread}
      />,
    );
    expect(elementTree.root?.querySelector(".TaskCompletionToast")).toBeNull();

    rerender(
      <TaskCompletionToastHost
        activeThreadId={null}
        threads={[
          summary({
            latestTurnCompletedAt: new Date(Date.now() + 1_000).toISOString(),
            latestTurnState: "completed",
          }),
        ]}
        onOpenThread={onOpenThread}
      />,
    );

    await waitFor(() => {
      expect(elementTree.root?.querySelector(".TaskCompletionToastTitle")?.textContent).toBe(
        "Background task",
      );
    });
    expect(elementTree.root?.querySelector(".TaskCompletionToastBody")?.textContent).toBe(
      "Finished working.",
    );
    const buttons = elementTree.root?.querySelectorAll(".LxButton") ?? [];
    fireEvent.tap(buttons[0]!);
    expect(onOpenThread).toHaveBeenCalledWith("thread-1");
  });

  it("allows the notification to be dismissed", async () => {
    const { rerender } = render(
      <TaskCompletionToastHost
        activeThreadId={null}
        threads={[summary()]}
        onOpenThread={() => {}}
      />,
    );
    rerender(
      <TaskCompletionToastHost
        activeThreadId={null}
        threads={[summary({ hasPendingUserInput: true })]}
        onOpenThread={() => {}}
      />,
    );
    await waitFor(() => {
      expect(elementTree.root?.querySelector(".TaskCompletionToast--warning")).not.toBeNull();
    });
    const dismiss = elementTree.root?.querySelector(
      '[accessibility-label="Dismiss activity notification"]',
    );
    if (!dismiss) throw new Error("expected dismiss action");
    fireEvent.tap(dismiss);
    await waitFor(() => {
      expect(elementTree.root?.querySelector(".TaskCompletionToast")).toBeNull();
    });
  });
});
