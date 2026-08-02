import { describe, expect, it } from "vitest";

import { resolveCommandNavigation } from "./commandNavigation";

const values = ["action:new-thread", "thread:one", "project:one"] as const;

describe("resolveCommandNavigation", () => {
  it("moves with arrows and Tab in stable visual order", () => {
    expect(
      resolveCommandNavigation({ activeValue: null, enabledValues: values, key: "ArrowDown" }),
    ).toEqual({ type: "move", value: "action:new-thread" });
    expect(
      resolveCommandNavigation({
        activeValue: "action:new-thread",
        enabledValues: values,
        key: "Tab",
      }),
    ).toEqual({ type: "move", value: "thread:one" });
    expect(
      resolveCommandNavigation({
        activeValue: "thread:one",
        enabledValues: values,
        key: "Tab",
        shiftKey: true,
      }),
    ).toEqual({ type: "move", value: "action:new-thread" });
  });

  it("wraps, supports Home/End, and never invents a disabled entry", () => {
    expect(
      resolveCommandNavigation({
        activeValue: "project:one",
        enabledValues: values,
        key: "ArrowDown",
      }),
    ).toEqual({ type: "move", value: "action:new-thread" });
    expect(
      resolveCommandNavigation({ activeValue: null, enabledValues: values, key: "ArrowUp" }),
    ).toEqual({ type: "move", value: "project:one" });
    expect(
      resolveCommandNavigation({ activeValue: "thread:one", enabledValues: values, key: "Home" }),
    ).toEqual({ type: "move", value: "action:new-thread" });
    expect(
      resolveCommandNavigation({ activeValue: "thread:one", enabledValues: values, key: "End" }),
    ).toEqual({ type: "move", value: "project:one" });
  });

  it("activates only a registered value and dismisses from Escape aliases", () => {
    expect(
      resolveCommandNavigation({ activeValue: "thread:one", enabledValues: values, key: "Enter" }),
    ).toEqual({ type: "activate", value: "thread:one" });
    expect(
      resolveCommandNavigation({ activeValue: "missing", enabledValues: values, key: "Enter" }),
    ).toEqual({ type: "none" });
    expect(
      resolveCommandNavigation({ activeValue: null, enabledValues: values, key: "Esc" }),
    ).toEqual({ type: "dismiss" });
  });
});
