import { describe, expect, it } from "@rstest/core";

import {
  lynxKeyEventTarget,
  webKeyContext,
  webKeyDefaultRule,
  type KeyPathNode,
  type WebKeyContext,
  type WebKeyFacts,
} from "./webKeyEvents.logic";

const key = (name: string, extra: Partial<WebKeyFacts> = {}): WebKeyFacts => ({
  key: name,
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  isComposing: false,
  ...extra,
});

const nowhere: WebKeyContext = {
  confirmType: null,
  inTextControl: false,
  inOverlay: false,
  composerMenuOpen: false,
  inModelPicker: false,
};
const composer: WebKeyContext = { ...nowhere, confirmType: "send", inTextControl: true };

function node(
  tagName: string,
  root: unknown,
  options: { classes?: string[]; attributes?: Record<string, string> } = {},
): KeyPathNode {
  return {
    tagName,
    getRootNode: () => root,
    getAttribute: (name) => options.attributes?.[name] ?? null,
    classList: { contains: (token) => options.classes?.includes(token) === true },
  };
}

describe("Lynx-for-Web key defaults", () => {
  it("cancels Enter in a send textarea, but not Shift+Enter or an IME commit", () => {
    expect(webKeyDefaultRule(key("Enter"), composer)?.name).toBe("send-textarea-enter");
    expect(webKeyDefaultRule(key("Enter", { shiftKey: true }), composer)).toBeNull();
    expect(webKeyDefaultRule(key("Enter", { isComposing: true }), composer)).toBeNull();
    expect(webKeyDefaultRule(key("a"), composer)).toBeNull();
    expect(webKeyDefaultRule(key("Enter"), { ...composer, confirmType: "search" })).toBeNull();
  });

  it("cancels the keys the composer menu consumes only while it has items", () => {
    const open = { ...composer, composerMenuOpen: true };
    for (const name of ["ArrowDown", "ArrowUp", "Enter", "Tab"]) {
      expect(webKeyDefaultRule(key(name), open)?.name).toBe("composer-menu-navigation");
    }
    // Shift+Enter still selects the highlighted item there, as the shared handler does.
    expect(webKeyDefaultRule(key("Enter", { shiftKey: true }), open)?.name).toBe(
      "composer-menu-navigation",
    );
    expect(webKeyDefaultRule(key("ArrowDown"), composer)).toBeNull();
    expect(webKeyDefaultRule(key("Tab"), composer)).toBeNull();
    expect(webKeyDefaultRule(key("ArrowDown", { isComposing: true }), open)).toBeNull();
    expect(webKeyDefaultRule(key("ArrowLeft"), open)).toBeNull();
  });

  it("cancels list navigation in an overlay, and leaves typing in its search field alone", () => {
    const menu = { ...nowhere, inOverlay: true };
    const search = { ...menu, inTextControl: true };
    for (const name of ["ArrowDown", "ArrowUp", "Home", "End", " "]) {
      expect(webKeyDefaultRule(key(name), menu)?.name).toBe("overlay-list-navigation");
    }
    expect(webKeyDefaultRule(key("ArrowDown"), search)?.name).toBe("overlay-list-navigation");
    expect(webKeyDefaultRule(key(" "), search)).toBeNull();
    expect(webKeyDefaultRule(key("Home"), search)).toBeNull();
    // Escape and Enter have no default worth cancelling in a menu; Tab keeps traversal.
    expect(webKeyDefaultRule(key("Escape"), menu)).toBeNull();
    expect(webKeyDefaultRule(key("Tab"), menu)).toBeNull();
  });

  it("keeps Tab in the model picker, where it cycles the tabs", () => {
    const picker = { ...nowhere, inOverlay: true, inTextControl: true, inModelPicker: true };
    expect(webKeyDefaultRule(key("Tab"), picker)?.name).toBe("model-picker-tab");
    expect(webKeyDefaultRule(key("Tab", { shiftKey: true }), picker)?.name).toBe(
      "model-picker-tab",
    );
    expect(webKeyDefaultRule(key("Tab", { ctrlKey: true }), picker)).toBeNull();
    expect(webKeyDefaultRule(key("a"), picker)).toBeNull();
  });

  it("never takes a browser or system shortcut", () => {
    const everywhere = { ...composer, inOverlay: true, composerMenuOpen: true };
    for (const modifier of ["altKey", "ctrlKey", "metaKey"] as const) {
      expect(webKeyDefaultRule(key("ArrowDown", { [modifier]: true }), everywhere)).toBeNull();
      expect(webKeyDefaultRule(key("Tab", { [modifier]: true }), everywhere)).toBeNull();
    }
    expect(webKeyDefaultRule(key("ArrowDown"), nowhere)).toBeNull();
    expect(webKeyDefaultRule(key(" "), nowhere)).toBeNull();
  });
});

describe("Lynx-for-Web key target", () => {
  const lynxRoot = { name: "lynx-view shadow root" };
  const textareaShadow = { name: "x-textarea shadow root" };
  const inner = node("TEXTAREA", textareaShadow);
  const form = node("FORM", textareaShadow);
  const textarea = node("X-TEXTAREA", lynxRoot, { attributes: { "confirm-type": "send" } });
  const popup = node("X-VIEW", lynxRoot, { classes: ["LxMenuPopup"] });
  const host = node("LYNX-VIEW", { name: "document" });
  // A composed path also holds shadow roots, the document and the window.
  const shadowRootEntry: KeyPathNode = {};

  it("is the deepest element of the Lynx tree, past an element's own internals", () => {
    const path = [inner, form, shadowRootEntry, textarea, popup, shadowRootEntry, host];
    expect(lynxKeyEventTarget(path, lynxRoot)).toBe(textarea);
    expect(lynxKeyEventTarget([popup, shadowRootEntry, host], lynxRoot)).toBe(popup);
  });

  it("is absent for a key pressed outside the Lynx tree", () => {
    expect(lynxKeyEventTarget([host], lynxRoot)).toBeNull();
    expect(lynxKeyEventTarget([inner, textarea], null)).toBeNull();
  });

  it("reads the text control and the overlay from the path", () => {
    const path = [inner, form, shadowRootEntry, textarea, popup, shadowRootEntry, host];
    expect(webKeyContext(path, lynxRoot, true)).toEqual({
      confirmType: "send",
      inTextControl: true,
      inOverlay: true,
      composerMenuOpen: true,
      inModelPicker: false,
    });
    expect(webKeyContext([host], lynxRoot, false)).toEqual(nowhere);
    // The internals of a text control are not themselves the control.
    expect(webKeyContext([inner, form], lynxRoot, false).inTextControl).toBe(false);
  });
});
