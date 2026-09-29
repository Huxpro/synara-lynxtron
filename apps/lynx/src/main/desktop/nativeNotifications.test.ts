import { EventEmitter } from "node:events";
import { describe, expect, it, rs } from "@rstest/core";

import { createNativeNotificationService } from "./nativeNotifications";

class FakeNotification extends EventEmitter {
  static instances: FakeNotification[] = [];

  readonly options: {
    readonly body?: string;
    readonly silent?: boolean;
    readonly title?: string;
  };
  shown = false;

  constructor(options: FakeNotification["options"]) {
    super();
    this.options = options;
    FakeNotification.instances.push(this);
  }

  show() {
    this.shown = true;
    queueMicrotask(() => this.emit("show"));
  }
}

describe("native notification service", () => {
  it("shows supported notifications and opens their thread on click", async () => {
    FakeNotification.instances = [];
    const openThread = rs.fn();
    const service = createNativeNotificationService({
      Notification: FakeNotification as never,
      openThread,
    });

    await expect(
      service.show({
        title: "Input needed",
        body: "Background task needs your attention.",
        threadId: "thread-1",
      }),
    ).resolves.toBe(true);
    expect(FakeNotification.instances[0]).toMatchObject({
      options: {
        title: "Input needed",
        body: "Background task needs your attention.",
        silent: false,
      },
      shown: true,
    });

    FakeNotification.instances[0]!.emit("click");
    expect(openThread).toHaveBeenCalledWith("thread-1");
  });

  it("reports missing runtimes and rejects empty notification copy", async () => {
    const unsupportedService = createNativeNotificationService({
      Notification: undefined,
      openThread: () => {},
    });

    expect(unsupportedService.isSupported()).toBe(false);
    await expect(unsupportedService.show({ title: "Title", body: "Body" })).resolves.toBe(false);
    const service = createNativeNotificationService({
      Notification: FakeNotification as never,
      openThread: () => {},
    });
    expect(service.isSupported()).toBe(true);
    await expect(service.show({ title: " ", body: "Body" })).resolves.toBe(false);
  });

  it("reports a native failed event instead of claiming delivery", async () => {
    class FailingNotification extends FakeNotification {
      override show() {
        this.shown = true;
        queueMicrotask(() => this.emit("failed", new Event("failed"), "no permission"));
      }
    }
    const service = createNativeNotificationService({
      Notification: FailingNotification as never,
      openThread: () => {},
    });

    await expect(service.show({ title: "Title", body: "Body" })).resolves.toBe(false);
  });
});
