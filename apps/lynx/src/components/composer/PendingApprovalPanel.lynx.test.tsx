import { describe, expect, it, rs } from "@rstest/core";
import { act, fireEvent, render } from "@lynx-js/react/testing-library";
import { ApprovalRequestId } from "@synara/contracts";
import { PendingApprovalPanel } from "./PendingApprovalPanel.lynx";
const approval = {
  requestId: ApprovalRequestId.makeUnsafe("approval"),
  lifecycleGeneration: "first",
  requestKind: "command" as const,
  createdAt: "2026-10-11T08:00:00.000Z",
  detail: "git status",
};
function approve() {
  const row = elementTree.root?.querySelector(".ComposerChoiceRowLynx");
  if (!row) throw new Error("approval choice missing");
  fireEvent.tap(row);
}
describe("approval response ownership", () => {
  it("deduplicates successful responses and permits a new durable retry attempt", async () => {
    const respond = rs.fn(async () => {});
    const props = { approval, pendingCount: 1, responding: false, onRespond: respond };
    const view = render(<PendingApprovalPanel {...props} />);
    approve();
    approve();
    await act(async () => {});
    expect(respond).toHaveBeenCalledTimes(1);
    expect(respond).toHaveBeenCalledWith("accept", "first");
    view.rerender(
      <PendingApprovalPanel {...props} approval={{ ...approval, responseAttemptKey: "retry" }} />,
    );
    approve();
    expect(respond).toHaveBeenCalledTimes(2);
    view.unmount();
  });
  it("releases the local claim after a rejected submission", async () => {
    const respond = rs.fn(async () => {
      throw new Error("transport failed");
    });
    const view = render(
      <PendingApprovalPanel
        approval={approval}
        pendingCount={1}
        responding={false}
        onRespond={respond}
      />,
    );
    approve();
    await act(async () => {});
    approve();
    await act(async () => {});
    expect(respond).toHaveBeenCalledTimes(2);
    view.unmount();
  });
  it("keeps session-wide approval unavailable for scoped Computer consent", () => {
    const view = render(
      <PendingApprovalPanel
        approval={{ ...approval, approvalScope: "computer-foreground" }}
        pendingCount={1}
        responding={false}
        onRespond={async () => {}}
      />,
    );
    expect(elementTree.root?.textContent).toContain("Show this on your screen?");
    expect(elementTree.root?.textContent).not.toContain("Always allow this session");
    view.unmount();
  });
});
