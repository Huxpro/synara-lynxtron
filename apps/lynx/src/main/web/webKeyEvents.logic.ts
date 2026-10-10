// Lynx-for-Web host: element key handlers, and the browser default they replace.
//
// Two things differ from the desktop host, and both are handled here, on the UI thread:
//
// 1. Delivery. @lynx-js/web-core 0.26.2 listens for `keydown`/`keyup` on `document` and
//    builds the handler path by walking `event.target.parentElement`. An event that starts
//    inside the <lynx-view> shadow tree is retargeted at `document` to the <lynx-view>
//    host, so that path is empty and no element `bindkeydown`/`catchkeydown` runs (only
//    `global-bindkeydown` does). The host shows web-core the element the key was really
//    pressed in (`lynxKeyEventTarget`) for exactly the duration of web-core's listener;
//    web-core then dispatches as it does for every other event, once.
//
// 2. The default action. Handlers run on the background thread (a worker) with a copy of
//    the event, after the browser has already acted: their `preventDefault()` cannot
//    reach it. So what a control consumes is declared here (`WEB_KEY_DEFAULT_RULES`) and
//    cancelled synchronously, before the event is delivered. A handler that consumes a
//    key the browser also acts on (a line break, caret movement, scrolling, focus
//    traversal) needs a rule; one that only observes a key does not.
//
// The handlers themselves are the shared ones. In this host's bundle they receive the
// event through `hostKeyHandler` (components/ui/keyEvent.lynx.ts), which makes
// `preventDefault`/`stopPropagation` callable; the Native bundle is not touched.
//
// Remove (1) when web-core dispatches from `composedPath()`, and (2) when it offers
// handlers a synchronous way to cancel the default.

export interface WebKeyFacts {
  readonly key: string;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly isComposing: boolean;
}

/** Where the key was pressed, read from the event path and the Lynx tree. */
export interface WebKeyContext {
  /** `confirm-type` of the text control the key was pressed in, if it was in one. */
  readonly confirmType: string | null;
  readonly inTextControl: boolean;
  /** Inside an open menu, command list or dialog. */
  readonly inOverlay: boolean;
  /** The composer's slash-command or mention menu is showing at least one item. */
  readonly composerMenuOpen: boolean;
  /** Inside the model picker's panel, which cycles its tabs with Tab. */
  readonly inModelPicker: boolean;
}

export interface WebKeyDefaultRule {
  readonly name: string;
  /** Which shared handler consumes these keys, so the rule can be checked against it. */
  readonly handler: string;
  readonly applies: (key: WebKeyFacts, context: WebKeyContext) => boolean;
}

/** Classes that mark an open overlay with its own key navigation (components/ui/*.lynx.tsx). */
export const WEB_KEY_OVERLAY_CLASSES = ["LxMenuPopup", "LxCommand", "LxDialogPopup"] as const;
/** The composer's command menu and its empty state (ComposerCommandMenuCompositionElements). */
export const WEB_KEY_COMPOSER_MENU_SELECTOR = ".ComposerCommandMenuLynx";
export const WEB_KEY_COMPOSER_MENU_EMPTY_SELECTOR = ".ComposerCommandMenuEmptyLynx";
/** web-core's elements for Lynx `<textarea>` and `<input>`. */
export const WEB_KEY_TEXT_CONTROL_TAGS = ["X-TEXTAREA", "X-INPUT"] as const;
/** The model picker's panel (ComposerModelPicker.lynx.tsx). */
export const WEB_KEY_MODEL_PICKER_CLASS = "ComposerModelPickerPanelLynx";

const hasCommandModifier = (key: WebKeyFacts) => key.altKey || key.ctrlKey || key.metaKey;

export const WEB_KEY_DEFAULT_RULES: readonly WebKeyDefaultRule[] = [
  {
    name: "composer-menu-navigation",
    handler: "Composer.lynx.tsx handleComposerMenuKey (menu open)",
    // Arrows would move the caret, Enter break the line, Tab leave the editor.
    applies: (key, context) =>
      context.inTextControl &&
      context.composerMenuOpen &&
      !key.isComposing &&
      !hasCommandModifier(key) &&
      (key.key === "ArrowDown" ||
        key.key === "ArrowUp" ||
        key.key === "Enter" ||
        key.key === "Tab"),
  },
  {
    name: "send-textarea-enter",
    handler: "Composer.lynx.tsx handleComposerMenuKey (send)",
    // Enter sends; Shift+Enter keeps its line break; an Enter that commits an IME
    // composition belongs to the composition.
    applies: (key, context) =>
      context.confirmType === "send" && key.key === "Enter" && !key.shiftKey && !key.isComposing,
  },
  {
    name: "model-picker-tab",
    handler: "ComposerModelPicker.lynx.tsx handleKeyDown",
    // Tab and Shift+Tab cycle the picker's tabs; the browser would move focus out of the
    // search field instead.
    applies: (key, context) =>
      context.inModelPicker && key.key === "Tab" && !key.isComposing && !hasCommandModifier(key),
  },
  {
    name: "keybinding-thread-tab",
    handler: "keybindingDispatcher.lynx.tsx (threadTab.next / threadTab.previous, shipped chord)",
    // Cmd+Ctrl+Left/Right steps through the open-thread tabs; in a text field the browser
    // would also move the caret to the start or end of the line. A rebound chord has no
    // rule: the table is static and the bindings live on the background thread.
    applies: (key) =>
      key.metaKey &&
      key.ctrlKey &&
      !key.altKey &&
      !key.shiftKey &&
      !key.isComposing &&
      (key.key === "ArrowLeft" || key.key === "ArrowRight"),
  },
  {
    name: "overlay-list-navigation",
    handler: "menu.lynx.tsx / command.lynx.tsx resolveCommandNavigation",
    // Arrows move the highlight; in the list's search field they would move the caret,
    // and outside a field they (with Home/End/Space) would scroll the page.
    applies: (key, context) =>
      context.inOverlay &&
      !key.isComposing &&
      !hasCommandModifier(key) &&
      (key.key === "ArrowDown" ||
        key.key === "ArrowUp" ||
        (!context.inTextControl && (key.key === "Home" || key.key === "End" || key.key === " "))),
  },
];

/** The rule that cancels this key's default, or null to leave the browser to it. */
export function webKeyDefaultRule(
  key: WebKeyFacts,
  context: WebKeyContext,
  rules: readonly WebKeyDefaultRule[] = WEB_KEY_DEFAULT_RULES,
): WebKeyDefaultRule | null {
  return rules.find((rule) => rule.applies(key, context)) ?? null;
}

/** The parts of a DOM node these functions read; real nodes and test stubs both fit. */
export interface KeyPathNode {
  readonly tagName?: string;
  getRootNode?(): unknown;
  getAttribute?(name: string): string | null;
  readonly classList?: { contains(token: string): boolean };
}

/**
 * The element web-core should dispatch from: the first node of the composed path that
 * lives directly in the Lynx tree. Nodes before it are web-core's own implementation of
 * that element (the `<textarea>` inside `<x-textarea>`'s shadow root); nodes after it are
 * its Lynx ancestors, which web-core walks itself.
 */
export function lynxKeyEventTarget<Node extends KeyPathNode>(
  path: readonly Node[],
  lynxRoot: unknown,
): Node | null {
  if (!lynxRoot) return null;
  return (
    path.find((node) => typeof node?.tagName === "string" && node.getRootNode?.() === lynxRoot) ??
    null
  );
}

/** Reads the context of a key from its path; `composerMenuOpen` comes from the tree. */
export function webKeyContext(
  path: readonly KeyPathNode[],
  lynxRoot: unknown,
  composerMenuOpen: boolean,
): WebKeyContext {
  const lynxNodes = path.filter(
    (node) => typeof node?.tagName === "string" && node.getRootNode?.() === lynxRoot,
  );
  const textControl = lynxNodes.find((node) =>
    (WEB_KEY_TEXT_CONTROL_TAGS as readonly string[]).includes(String(node.tagName).toUpperCase()),
  );
  return {
    confirmType: textControl?.getAttribute?.("confirm-type") ?? null,
    inTextControl: textControl !== undefined,
    inOverlay: lynxNodes.some((node) =>
      WEB_KEY_OVERLAY_CLASSES.some((token) => node.classList?.contains(token) === true),
    ),
    composerMenuOpen,
    inModelPicker: lynxNodes.some(
      (node) => node.classList?.contains(WEB_KEY_MODEL_PICKER_CLASS) === true,
    ),
  };
}
