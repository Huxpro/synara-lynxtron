import { describe, expect, it } from "@rstest/core";

import {
  isWebTextareaConfirmKey,
  webTextareaConfirmEventInit,
  WEB_TEXTAREA_CONFIRM_EVENT,
} from "./webTextareaConfirm.logic";

const enter = { key: "Enter", shiftKey: false, isComposing: false };

describe("Lynx-for-Web textarea confirm", () => {
  it("confirms on Enter in a send textarea", () => {
    expect(isWebTextareaConfirmKey(enter, "send")).toBe(true);
  });

  it("leaves Shift+Enter and an IME commit to the editor", () => {
    expect(isWebTextareaConfirmKey({ ...enter, shiftKey: true }, "send")).toBe(false);
    expect(isWebTextareaConfirmKey({ ...enter, isComposing: true }, "send")).toBe(false);
  });

  it("ignores other keys and textareas that do not send", () => {
    expect(isWebTextareaConfirmKey({ ...enter, key: "a" }, "send")).toBe(false);
    expect(isWebTextareaConfirmKey(enter, "search")).toBe(false);
    expect(isWebTextareaConfirmKey(enter, null)).toBe(false);
  });

  it("raises the element's own confirm event with the current value", () => {
    expect(WEB_TEXTAREA_CONFIRM_EVENT).toBe("confirm");
    expect(webTextareaConfirmEventInit("hello")).toEqual({
      bubbles: false,
      composed: false,
      cancelable: true,
      detail: { value: "hello" },
    });
  });
});
