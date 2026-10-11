import { act, fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import { ToastHost } from "./ToastHost.lynx";
import { toastManager, readLynxToasts } from "../components/ui/toast.lynx";

const host = rs.hoisted(() => ({
  active: true,
  listener: null as ((active: boolean) => void) | null,
}));
rs.mock("../platform/bridge", () => ({
  bridgeCall: async () => ({ active: host.active }),
  onGlobalEvent: (_event: string, listener: (active: boolean) => void) => {
    host.listener = listener;
    return () => {
      host.listener = null;
    };
  },
}));
beforeEach(() => {
  toastManager.close();
  host.active = true;
});
afterEach(() => {
  toastManager.close();
  rs.useRealTimers();
});
const title = () => elementTree.root?.querySelector(".LynxToastTitle")?.textContent;

describe("Native app toast delivery", () => {
  it("renders queued errors across composer remounts, updates them, invokes actions and dismisses", async () => {
    const action = rs.fn();
    const closed = rs.fn();
    const id = toastManager.add({
      type: "error",
      title: "Send failed",
      description: "Draft restored",
      actionProps: { children: "Retry", onClick: action },
      data: { onClose: closed },
    });
    const { rerender } = render(<ToastHost activeThreadId="one" />);
    await waitFor(() => expect(title()).toBe("Send failed"));
    expect(elementTree.root?.querySelector(".LynxToastDescription")?.textContent).toBe(
      "Draft restored",
    );
    rerender(<ToastHost activeThreadId="two" />);
    expect(title()).toBe("Send failed");
    act(() => toastManager.update(id, { title: "Provider failed" }));
    await waitFor(() => expect(title()).toBe("Provider failed"));
    const actionButton = elementTree.root?.querySelector(".LynxToastActions .LxButton");
    fireEvent.tap(actionButton!);
    expect(action).toHaveBeenCalledTimes(1);
    fireEvent.tap(elementTree.root?.querySelector(".LynxToastClose")!);
    expect(closed).toHaveBeenCalledTimes(1);
    expect(readLynxToasts()).toEqual([]);
  });

  it("filters thread-scoped toasts, retains them for navigation, and orders newest first", async () => {
    toastManager.add({ title: "Global", timeout: 0 });
    toastManager.add({ title: "Other thread", timeout: 0, data: { threadId: "two" } });
    const { rerender } = render(<ToastHost activeThreadId="one" />);
    await waitFor(() => expect(title()).toBe("Global"));
    expect(readLynxToasts()).toHaveLength(2);
    rerender(<ToastHost activeThreadId="two" />);
    await waitFor(() => expect(title()).toBe("Other thread"));
  });

  it("dismisses after the timeout, pauses while the background app is unfocused, and keeps loading/timeout zero", async () => {
    rs.useFakeTimers();
    const id = toastManager.add({ title: "Timed", timeout: 1000 });
    toastManager.add({ title: "Loading", type: "loading", timeout: 1000 });
    toastManager.add({ title: "Persistent", timeout: 0 });
    render(<ToastHost activeThreadId={null} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(host.listener).not.toBeNull();
    act(() => host.listener?.(false));
    act(() => {
      rs.advanceTimersByTime(2000);
    });
    expect(readLynxToasts().some((toast) => toast.id === id)).toBe(true);
    act(() => host.listener?.(true));
    act(() => {
      rs.advanceTimersByTime(1001);
    });
    expect(readLynxToasts().map((toast) => toast.title)).toEqual(["Loading", "Persistent"]);
  });
});
