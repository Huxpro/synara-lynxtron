import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";

import { readLynxToasts, subscribeLynxToasts, toastManager } from "./toast.lynx";

describe("Lynx toast manager sink", () => {
  let info: ReturnType<typeof rs.spyOn>;

  beforeEach(() => {
    info = rs.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    toastManager.close();
    info.mockRestore();
  });

  it("queues a toast as EventRouter adds it and keeps its action callable", () => {
    const onClick = rs.fn();
    const id = toastManager.add({
      type: "warning",
      title: "Invalid keybindings configuration",
      description: "Unexpected token",
      actionProps: { children: "Open keybindings.json", onClick },
    });

    expect(typeof id).toBe("string");
    expect(readLynxToasts()).toEqual([
      expect.objectContaining({
        id,
        type: "warning",
        title: "Invalid keybindings configuration",
        description: "Unexpected token",
      }),
    ]);
    readLynxToasts()[0]!.actionProps!.onClick!();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith(
      "[toast:warning] Invalid keybindings configuration: Unexpected token",
    );
  });

  it("gives every toast its own id and honours a caller id", () => {
    const first = toastManager.add({ type: "error", title: "One" });
    const second = toastManager.add({ type: "error", title: "Two" });
    const named = toastManager.add({ id: "provider-update", title: "Three" });

    expect(first).not.toBe(second);
    expect(named).toBe("provider-update");
    expect(readLynxToasts().map((toast) => toast.title)).toEqual(["One", "Two", "Three"]);
  });

  it("updates and closes by id, ignores unknown ids, and notifies subscribers", () => {
    const listener = rs.fn();
    const unsubscribe = subscribeLynxToasts(listener);
    const id = toastManager.add({ type: "loading", title: "Working" });
    const before = readLynxToasts();

    toastManager.update("missing", { title: "Nope" });
    toastManager.close("missing");
    expect(readLynxToasts()).toBe(before);
    expect(listener).toHaveBeenCalledTimes(1);

    toastManager.update(id, { type: "success", title: "Done" });
    expect(readLynxToasts()).toEqual([
      expect.objectContaining({ id, type: "success", title: "Done" }),
    ]);

    toastManager.close(id);
    expect(readLynxToasts()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    toastManager.add({ title: "Later" });
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("never writes to console.error or console.warn", () => {
    const error = rs.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = rs.spyOn(console, "warn").mockImplementation(() => undefined);
    toastManager.add({ type: "error", title: "Unable to open keybindings file" });
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    error.mockRestore();
    warn.mockRestore();
  });
});
